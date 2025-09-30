import { describe, it, expect } from 'vitest'
import { generateTestUser } from '../helpers/testUtils'

describe('Authentication Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = generateTestUser()
      
      // Use actual HTTP request to running server
      const response = await fetch('http://localhost:3200/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      })
      
      const result = await response.json()
      
      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.user).toMatchObject({
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        email: userData.email
      })
      expect(result.user).not.toHaveProperty('password')
      expect(result.user.id).toBeTypeOf('number')
    })

    it('should reject registration with invalid email', async () => {
      const userData = { ...generateTestUser(), email: 'invalid-email' }
      
      const response = await fetch('http://localhost:3200/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      })
      
      expect(response.status).toBe(422)
    })

    it('should reject registration with weak password', async () => {
      const userData = { ...generateTestUser(), password: '123' }
      
      const response = await fetch('http://localhost:3200/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      })
      
      expect(response.status).toBe(422)
    })

    it('should reject duplicate username', async () => {
      const userData = generateTestUser()
      
      // Register first user
      await fetch('http://localhost:3200/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      
      // Try to register same username
      const duplicateUser = { ...generateTestUser(), username: userData.username }
      const response = await fetch('http://localhost:3200/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateUser)
      })
      
      expect(response.status).toBe(409)
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login with username successfully', async () => {
      const userData = generateTestUser()
      
      // Register user first
      await fetch('http://localhost:3200/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      
      // Login with username
      const response = await fetch('http://localhost:3200/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: userData.username,
          password: userData.password
        })
      })
      
      const result = await response.json()
      
      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.user.username).toBe(userData.username)
      expect(response.headers.get('set-cookie')).toContain('auth-token')
    })

    it('should login with email successfully', async () => {
      const userData = generateTestUser()
      
      // Register user first
      await fetch('http://localhost:3200/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      
      // Login with email
      const response = await fetch('http://localhost:3200/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: userData.email,
          password: userData.password
        })
      })
      
      const result = await response.json()
      
      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.user.email).toBe(userData.email)
    })

    it('should reject invalid credentials', async () => {
      const response = await fetch('http://localhost:3200/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
      })
      
      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      const userData = generateTestUser()
      
      // Register and login
      await fetch('http://localhost:3200/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      
      const loginResponse = await fetch('http://localhost:3200/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: userData.username,
          password: userData.password
        })
      })
      
      const cookies = loginResponse.headers.get('set-cookie')
      
      // Get current user
      const response = await fetch('http://localhost:3200/api/auth/me', {
        headers: {
          'Cookie': cookies || ''
        }
      })
      
      const result = await response.json()
      
      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.user.username).toBe(userData.username)
      expect(result.user.totalSavedChf).toBe('0.00')
    })

    it('should reject unauthenticated request', async () => {
      const response = await fetch('http://localhost:3200/api/auth/me')
      
      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const userData = generateTestUser()
      
      // Register and login
      await fetch('http://localhost:3200/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      
      const loginResponse = await fetch('http://localhost:3200/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: userData.username,
          password: userData.password
        })
      })
      
      const cookies = loginResponse.headers.get('set-cookie')
      
      // Logout
      const response = await fetch('http://localhost:3200/api/auth/logout', {
        method: 'POST',
        headers: {
          'Cookie': cookies || ''
        }
      })
      
      const result = await response.json()
      
      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toBe('Erfolgreich abgemeldet.')
    })
  })
})