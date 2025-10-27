import { z } from 'zod';

// User Registration Schema
export const RegisterSchema = z.object({
  firstName: z.string()
    .min(1, 'Vorname ist erforderlich')
    .max(100, 'Vorname zu lang')
    .regex(/^[a-zA-ZäöüÄÖÜß\s-]+$/, 'Vorname enthält ungültige Zeichen'),
  
  lastName: z.string()
    .min(1, 'Nachname ist erforderlich')
    .max(100, 'Nachname zu lang')
    .regex(/^[a-zA-ZäöüÄÖÜß\s-]+$/, 'Nachname enthält ungültige Zeichen'),
    
  username: z.string()
    .min(3, 'Username muss mindestens 3 Zeichen haben')
    .max(60, 'Username zu lang')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username darf nur Buchstaben, Zahlen, _ und - enthalten'),
    
  email: z.string()
    .email('Ungültige Email-Adresse')
    .max(255, 'Email zu lang'),
    
  password: z.string()
    .min(8, 'Passwort muss mindestens 8 Zeichen haben')
    .max(128, 'Passwort zu lang')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Passwort muss Groß-, Kleinbuchstaben und Zahl enthalten')
});

// User Login Schema  
export const LoginSchema = z.object({
  usernameOrEmail: z.string()
    .min(1, 'Username oder Email ist erforderlich')
    .max(255, 'Input zu lang'),
    
  password: z.string()
    .min(1, 'Passwort ist erforderlich')
    .max(128, 'Passwort zu lang')
});

// Forgot Password Schema
export const ForgotPasswordSchema = z.object({
  email: z.string()
    .email('Ungültige Email-Adresse')
    .max(255, 'Email zu lang')
});

// Reset Password Schema
export const ResetPasswordSchema = z.object({
  token: z.string()
    .min(1, 'Token ist erforderlich'),
  newPassword: z.string()
    .min(8, 'Passwort muss mindestens 8 Zeichen haben')
    .max(128, 'Passwort zu lang')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Passwort muss Groß-, Kleinbuchstaben und Zahl enthalten'),
  confirmPassword: z.string()
    .min(8, 'Passwort muss mindestens 8 Zeichen haben')
    .max(128, 'Passwort zu lang')
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    path: ['confirmPassword'],
    message: 'Passwörter stimmen nicht überein'
  }
);

// Password Change Schema
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Aktuelles Passwort erforderlich'),
  newPassword: z.string()
    .min(8, 'Neues Passwort muss mindestens 8 Zeichen haben')
    .max(128, 'Passwort zu lang')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Passwort muss Groß-, Kleinbuchstaben und Zahl enthalten')
});

// Profile Update Schema
export const UpdateProfileSchema = z.object({
  firstName: z.string()
    .min(1, 'Vorname ist erforderlich')
    .max(100, 'Vorname zu lang')
    .regex(/^[a-zA-ZäöüÄÖÜß\s-]+$/, 'Vorname enthält ungültige Zeichen')
    .optional(),
    
  lastName: z.string()
    .min(1, 'Nachname ist erforderlich')
    .max(100, 'Nachname zu lang')
    .regex(/^[a-zA-ZäöüÄÖÜß\s-]+$/, 'Nachname enthält ungültige Zeichen')
    .optional(),
    
  profileImageUrl: z.string().url('Ungültige URL').optional()
});

// Goal Update Schema
export const UpdateGoalSchema = z.object({
  title: z.string()
    .min(1, 'Titel ist erforderlich')
    .max(200, 'Titel zu lang')
    .optional(),
    
  targetChf: z.number()
    .positive('Zielbetrag muss positiv sein')
    .max(999999.99, 'Zielbetrag zu hoch')
    .optional(),
    
  imageUrl: z.string().url('Ungültige URL').optional()
});

// Goal Create Schema
export const CreateGoalSchema = z.object({
  title: z.string()
    .min(1, 'Titel ist erforderlich')
    .max(200, 'Titel zu lang'),
    
  targetChf: z.number()
    .positive('Zielbetrag muss positiv sein')
    .max(999999.99, 'Zielbetrag zu hoch'),
    
  imageUrl: z.string().url('Ungültige URL').optional()
});

// Action Create/Update Schema
export const CreateActionSchema = z.object({
  title: z.string()
    .min(1, 'Titel ist erforderlich')
    .max(200, 'Titel zu lang'),
    
  description: z.string()
    .max(500, 'Beschreibung zu lang')
    .optional(),
    
  defaultChf: z.number()
    .positive('Betrag muss positiv sein')
    .max(9999.99, 'Betrag zu hoch'),
    
  imageUrl: z.string().url('Ungültige URL').optional()
});

// Types from schemas
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type UpdateGoalInput = z.infer<typeof UpdateGoalSchema>;
export type CreateGoalInput = z.infer<typeof CreateGoalSchema>;
export type CreateActionInput = z.infer<typeof CreateActionSchema>;
