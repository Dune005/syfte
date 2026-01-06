/**
 * Validation Schemas & Utilities
 * 
 * Zentrale Input-Validierung für API-Endpunkte.
 * Definiert Schemas für verschiedene Entitäten und stellt eine
 * generische Validierungsfunktion bereit.
 * 
 * Features:
 * - Type Checking (string, number)
 * - Length/Range Validation
 * - Pattern Matching (RegEx)
 * - Required/Optional Fields
 * - XSS Sanitization
 * 
 * Verwendung:
 * const { isValid, errors } = validateInput(userData, userRegistrationSchema)
 * if (!isValid) return { statusCode: 400, errors }
 */

// ============================================
// VALIDATION SCHEMAS
// ============================================

/**
 * User Registration Schema
 * Validiert alle Felder für neue Benutzer-Registrierung
 */
export const userRegistrationSchema = {
  firstName: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-ZäöüÄÖÜß\s-]+$/ // Erlaubt Buchstaben, Umlaute, Leerzeichen, Bindestriche
  },
  lastName: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-ZäöüÄÖÜß\s-]+$/
  },
  username: {
    required: true,
    type: 'string',
    minLength: 3,
    maxLength: 60,
    pattern: /^[a-zA-Z0-9_-]+$/ // Alphanumerisch plus Underscore/Bindestrich
  },
  email: {
    required: true,
    type: 'string',
    maxLength: 255,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // Basic E-Mail Format
  },
  password: {
    required: true,
    type: 'string',
    minLength: 8,
    maxLength: 128,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/ // Min. 1 Groß-, 1 Klein-, 1 Zahl
  }
}

/**
 * Goal Creation Schema
 * Validiert Felder für neue Sparziele
 */
export const goalSchema = {
  title: {
    required: true,
    type: 'string',
    minLength: 3,
    maxLength: 200,
    sanitize: true
  },
  targetChf: {
    required: true,
    type: 'number',
    min: 1,
    max: 999999.99
  },
  imageUrl: {
    required: false,
    type: 'string',
    maxLength: 2000,
    pattern: /^https?:\/\/.+/
  }
}**
 * Savings Entry Schema
 * Validiert Felder für neue Sparvorgänge
 */
export const savingsSchema = {
  goalId: {
    required: true,
    type: 'number',
    min: 1
  },
  actionId: {
    required: false,
    type: 'number',
    min: 1
  },
  amountChf: {
    required: true,
    type: 'number',
    min: 0.01,
    max: 9999.99
  },
  note: {
    required: false,
    type: 'string',
    maxLength: 300,
    sanitize: true
  }
}

// ============================================
// VALIDATION FUNCTION
// ============================================

/**
 * Generische Input-Validierung
 * 
 * Validiert ein Objekt gegen ein Schema und gibt Fehler zurück.
 * 
 * @param data - Das zu validierende Objekt
 * @param schema - Das Validierungs-Schema
 * @returns Object mit isValid (boolean) und errors (string[])
 * 
 * @example
 * const result = validateInput(userData, userRegistrationSchema)
 * if (!result.isValid) {
 *   return createError({ statusCode: 400, message: result.errors.join(', ') })
 * }
/**
 * Simple validation function
 */
export function validateInput(data: any, schema: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field]
    const rule = rules as any

    // Required check
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`)
      continue
    }

    // Skip validation for optional empty fields
    if (!rule.required && (value === undefined || value === null || value === '')) {
      continue
    }

    // Type validation
    if (rule.type === 'string' && typeof value !== 'string') {
      errors.push(`${field} must be a string`)
      continue
    }

    if (rule.type === 'number' && typeof value !== 'number') {
      errors.push(`${field} must be a number`)
      continue
    }

    // String validations
    if (rule.type === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${field} must be at least ${rule.minLength} characters long`)
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${field} must be at most ${rule.maxLength} characters long`)
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${field} has invalid format`)
      }
 / ============================================
// SANITIZATION
// ============================================

/**
 * Sanitiert User-Input zur XSS-Prävention
 * 
 * Entfernt gefährliche Zeichen die für XSS genutzt werden könnten.
 * 
 * @param input - Der zu bereinigende String
 * @returns Bereinigter String (ohne < > und getrimmt)
 * 
 * @example
 * const safe = sanitizeInput(userInput) // "<script>alert(1)</script>" → "scriptalert(1)/script"
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Entfernt < und > (verhindert HTML-Tags)
    .trim() // Entfernt leading/trailing Whitespace
      if (rule.max !== undefined && value > rule.max) {
        errors.push(`${field} must be at most ${rule.max}`)
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim()
}