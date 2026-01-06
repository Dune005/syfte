/**
 * Authentication Utilities
 * 
 * Zentrale Authentifizierungs-Funktionen für die Syfte App.
 * Enthält Password Hashing, JWT Token Management, Cookie Handling und Rate Limiting.
 * 
 * Security:
 * - Argon2id für Password Hashing (empfohlen 2023+)
 * - JWT mit Issuer/Audience Validation
 * - HttpOnly Cookies für Session Management
 * - Memory-based Rate Limiting (TODO: Redis für Production)
 * 
 * Dependencies:
 * - argon2: Password Hashing
 * - jsonwebtoken: JWT Token Management
 * - h3: Cookie Management
 */

import argon2 from 'argon2';
import jwt from 'jsonwebtoken';

// === Constants ===
const JWT_SECRET = process.env.SESSION_SECRET || 'change_me_to_long_random_string';
const JWT_EXPIRES_IN = '7d'; // 7 Tage Session-Dauer

// ============================================
// PASSWORD HASHING (Argon2)
// ============================================

/**
 * Hasht ein Passwort mit Argon2id
 * 
 * Argon2id kombiniert Argon2i (Side-Channel resistent) und Argon2d (GPU resistent).
 * Konfiguration: 64MB Memory, 3 Iterations, 1 Parallelism
 * 
 * @param password - Plaintext Passwort
 * @returns Gehashtes Passwort als String
 * @throws Error wenn Hashing fehlschlägt
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });
  } catch (error) {
    throw new Error('Password hashing failed');
  }
}

/**
 * Verifiziert ein Passwort gegen einen Hash
 * 
 * @param hash - Der gespeicherte Argon2 Hash
 * @param password - Das zu prüfende Plaintext Passwort
 * @returns true wenn Passwort korrekt, false sonst
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    return false;
  }
}

// ============================================
// JWT TOKEN MANAGEMENT
// ============================================

/**
 * JWT Payload Interface
 * Enthält User-Informationen die im Token gespeichert werden
 */
export interface JWTPayload {
  userId: number;
  username: string;
  email: string;
  iat?: number; // Issued At (automatisch von JWT)
  exp?: number; // Expiration (automatisch von JWT)
}

/**
 * Erstellt ein JWT Token
 * 
 * @param payload - User-Daten (ohne iat/exp, werden automatisch gesetzt)
 * @returns JWT Token als String
 */
export function createJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'syfte-app',
    audience: 'syfte-users'
  });
}

/**
 * Verifiziert ein JWT Token
 * 
 * @param token - Das zu prüfende JWT Token
 * @returns JWTPayload wenn valid, null wenn invalid/expired
 */
export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'syfte-app',
      audience: 'syfte-users'
    }) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// ============================================
// SESSION COOKIE MANAGEMENT
// ============================================

/**
 * Setzt ein HttpOnly Auth-Cookie
 * 
 * Security Features:
 * - httpOnly: Verhindert JavaScript-Zugriff (XSS Protection)
 * - secure: Nur über HTTPS in Production
 * - sameSite: CSRF Protection
 * - maxAge: 7 Tage Session-Dauer
 * 
 * @param event - H3 Event Object
 * @param token - JWT Token der gespeichert werden soll
 */
export function setAuthCookie(event: any, token: string) {
  setCookie(event, 'auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  });
}

/**
 * Löscht das Auth-Cookie (Logout)
 * 
 * @param event - H3 Event Object
 */
export function clearAuthCookie(event: any) {
  deleteCookie(event, 'auth-token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
}

/**
 * Liest das Auth-Cookie aus dem Request
 * 
 * @param event - H3 Event Object
 * @returns JWT Token String oder undefined
 */
export function getAuthCookie(event: any): string | undefined {
  return getCookie(event, 'auth-token');
}

// ============================================
// RATE LIMITING
// ============================================

/**
 * In-Memory Rate Limiting Store
 * 
 * WICHTIG: Für Production sollte Redis verwendet werden!
 * In-Memory ist nicht skalierbar bei mehreren Server-Instanzen.
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate Limiting Check
 * 
 * Prüft ob ein Identifier (z.B. IP, User-ID) das Rate Limit überschritten hat.
 * 
 * @param key - Eindeutiger Identifier (IP-Adresse, User-ID, etc.)
 * @param maxAttempts - Maximale Anzahl Versuche (Default: 5)
 * @param windowMs - Zeitfenster in Millisekunden (Default: 15 Minuten)
 * @returns true wenn erlaubt, false wenn Rate Limit überschritten
 */
export function rateLimit(key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxAttempts) {
    return false;
  }
  
  record.count++;
  return true;
}

