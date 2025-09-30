import { describe, it, expect, beforeEach } from 'vitest'
import { generateTestUser, generateTestGoal } from '../helpers/testUtils'
import { testDataTracker } from '../setup'

const BASE_URL = 'http://localhost:3200'

describe('Goals Management API', () => {
  let testUser: any
  let authCookie: string
  let userId: number
  let testGoal: any

  beforeEach(async () => {
    // Create and authenticate test user
    testUser = generateTestUser()
    testDataTracker.users.push(testUser.email)

    // Register user
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    })
    
    const registerResult = await registerResponse.json()
    userId = registerResult.user.id

    // Login user
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usernameOrEmail: testUser.email,
        password: testUser.password
      })
    })

    // Extract auth cookie
    const cookies = loginResponse.headers.get('set-cookie')
    authCookie = cookies || ''

    // Create test goal
    testGoal = {
      title: 'Test Goal',
      targetChf: 100.00,
      imageUrl: 'https://example.com/image.jpg'
    }
  })

  describe('POST /api/goals/create', () => {
    it('should create a new goal successfully', async () => {
      const response = await fetch(`${BASE_URL}/api/goals/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify(testGoal)
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.goal).toMatchObject({
        title: testGoal.title,
        targetChf: testGoal.targetChf,
        savedChf: 0,
        ownerId: userId
      })
    })

    it('should reject goal creation without auth', async () => {
      const response = await fetch(`${BASE_URL}/api/goals/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testGoal)
      })

      expect(response.status).toBe(401)
    })

    it('should reject invalid goal data', async () => {
      const invalidGoal = { title: '', targetChf: -10 }

      const response = await fetch(`${BASE_URL}/api/goals/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify(invalidGoal)
      })

      expect(response.status).toBe(422)
    })
  })

  describe('GET /api/goals', () => {
    it('should return user goals', async () => {
      // Create a goal first
      await fetch(`${BASE_URL}/api/goals/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify(testGoal)
      })

      const response = await fetch(`${BASE_URL}/api/goals`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.goals).toBeInstanceOf(Array)
      expect(result.goals.length).toBeGreaterThan(0)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/goals`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('PUT /api/goals/:id', () => {
    let goalId: number

    beforeEach(async () => {
      // Create a goal to update
      const createResponse = await fetch(`${BASE_URL}/api/goals/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify(testGoal)
      })

      const createResult = await createResponse.json()
      goalId = createResult.goal.id
    })

    it('should update goal successfully', async () => {
      const updateData = {
        title: 'Updated Goal Title',
        targetChf: 200.00
      }

      const response = await fetch(`${BASE_URL}/api/goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.goal.title).toBe(updateData.title)
      expect(result.goal.targetChf).toBe(updateData.targetChf)
    })

    it('should reject unauthorized update', async () => {
      const response = await fetch(`${BASE_URL}/api/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Unauthorized Update' })
      })

      expect(response.status).toBe(401)
    })
  })

  describe('DELETE /api/goals/:id', () => {
    let goalId: number

    beforeEach(async () => {
      // Create a goal to delete
      const createResponse = await fetch(`${BASE_URL}/api/goals/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify(testGoal)
      })

      const createResult = await createResponse.json()
      goalId = createResult.goal.id
    })

    it('should delete goal successfully', async () => {
      const response = await fetch(`${BASE_URL}/api/goals/${goalId}`, {
        method: 'DELETE',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
    })

    it('should reject unauthorized deletion', async () => {
      const response = await fetch(`${BASE_URL}/api/goals/${goalId}`, {
        method: 'DELETE'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/goals/:id/complete', () => {
    let goalId: number

    beforeEach(async () => {
      // Create a goal to complete
      const createResponse = await fetch(`${BASE_URL}/api/goals/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify(testGoal)
      })

      const createResult = await createResponse.json()
      goalId = createResult.goal.id
    })

    it('should mark goal as completed', async () => {
      const response = await fetch(`${BASE_URL}/api/goals/${goalId}/complete`, {
        method: 'POST',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.goal.savedChf).toBe(result.goal.targetChf)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/goals/${goalId}/complete`, {
        method: 'POST'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('PUT /api/goals/:id/favorite', () => {
    let goalId: number

    beforeEach(async () => {
      // Create a goal to favorite
      const createResponse = await fetch(`${BASE_URL}/api/goals/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify(testGoal)
      })

      const createResult = await createResponse.json()
      goalId = createResult.goal.id
    })

    it('should toggle goal as favorite', async () => {
      const response = await fetch(`${BASE_URL}/api/goals/${goalId}/favorite`, {
        method: 'PUT',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/goals/${goalId}/favorite`, {
        method: 'PUT'
      })

      expect(response.status).toBe(401)
    })
  })
})