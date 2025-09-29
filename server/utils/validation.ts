/**
 * Validation Schemas für API Input Validation
 * Beispiel-Schemas für Syfte App
 */

// User Registration Schema
export const userRegistrationSchema = {
  firstName: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-ZäöüÄÖÜß\s-]+$/
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
    pattern: /^[a-zA-Z0-9_-]+$/
  },
  email: {
    required: true,
    type: 'string',
    maxLength: 255,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    required: true,
    type: 'string',
    minLength: 8,
    maxLength: 128,
    // Mindestens 1 Großbuchstabe, 1 Kleinbuchstabe, 1 Zahl
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  }
}

// Goal Creation Schema
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
}

// Savings Entry Schema
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
    }

    // Number validations
    if (rule.type === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`${field} must be at least ${rule.min}`)
      }
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