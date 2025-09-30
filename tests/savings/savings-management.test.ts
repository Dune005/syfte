import { describe, it, expect, beforeEach } from 'vitest'
import { generateTestUser } from '../helpers/testUtils'
import { testDataTracker } from '../setup'

const BASE_URL = 'http://localhost:3200'

describe('Savings Management API', () => {
  let testUser: any
  let authCookie: string
  let userId: number
  let goalId: number
  let actionId: number

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

    authCookie = loginResponse.headers.get('set-cookie') || ''

    // Create a test goal
    const goalResponse = await fetch(`${BASE_URL}/api/goals/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie
      },
      body: JSON.stringify({
        title: 'Test Savings Goal',
        targetChf: 200.00
      })
    })

    const goalResult = await goalResponse.json()
    goalId = goalResult.goal.id

    // Create a test action
    const actionResponse = await fetch(`${BASE_URL}/api/actions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie
      },
      body: JSON.stringify({
        title: 'Test Action',
        description: 'Test action for savings',
        defaultChf: 10.00
      })
    })

    const actionResult = await actionResponse.json()
    actionId = actionResult.action.id
  })

  describe('GET /api/savings', () => {
    beforeEach(async () => {
      // Create some test savings
      await fetch(`${BASE_URL}/api/savings/quick-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          amountChf: 25.00,
          note: 'Test saving 1'
        })
      })
    })

    it('should return user savings with pagination', async () => {
      const response = await fetch(`${BASE_URL}/api/savings?page=1&limit=10`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.savings).toBeInstanceOf(Array)
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: expect.any(Number)
      })
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/savings`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/savings/quick-add', () => {
    it('should add quick saving to favorite goal', async () => {
      const savingData = {
        amountChf: 15.50,
        note: 'Quick test saving'
      }

      const response = await fetch(`${BASE_URL}/api/savings/quick-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify(savingData)
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.saving).toMatchObject({
        amountChf: savingData.amountChf,
        note: savingData.note,
        userId: userId
      })
    })

    it('should reject invalid amount', async () => {
      const response = await fetch(`${BASE_URL}/api/savings/quick-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          amountChf: -10,
          note: 'Invalid amount'
        })
      })

      expect(response.status).toBe(422)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/savings/quick-add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountChf: 10,
          note: 'Unauthorized saving'
        })
      })

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/savings/add-with-action', () => {
    it('should add saving with action to specific goal', async () => {
      const savingData = {
        goalId: goalId,
        actionId: actionId,
        amountChf: 12.00,
        note: 'Saving with action'
      }

      const response = await fetch(`${BASE_URL}/api/savings/add-with-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify(savingData)
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.saving).toMatchObject({
        goalId: goalId,
        actionId: actionId,
        amountChf: savingData.amountChf,
        userId: userId
      })
    })

    it('should require valid goal ID', async () => {
      const response = await fetch(`${BASE_URL}/api/savings/add-with-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          goalId: 99999,
          actionId: actionId,
          amountChf: 10
        })
      })

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/savings/:id', () => {
    let savingId: number

    beforeEach(async () => {
      // Create a saving to test
      const createResponse = await fetch(`${BASE_URL}/api/savings/quick-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          amountChf: 20.00,
          note: 'Test saving for details'
        })
      })

      const createResult = await createResponse.json()
      savingId = createResult.saving.id
    })

    it('should return saving details', async () => {
      const response = await fetch(`${BASE_URL}/api/savings/${savingId}`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.saving).toMatchObject({
        id: savingId,
        userId: userId,
        amountChf: 20.00,
        note: 'Test saving for details'
      })
    })

    it('should reject unauthorized access', async () => {
      const response = await fetch(`${BASE_URL}/api/savings/${savingId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('DELETE /api/savings/:id', () => {
    let savingId: number

    beforeEach(async () => {
      // Create a saving to delete
      const createResponse = await fetch(`${BASE_URL}/api/savings/quick-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          amountChf: 30.00,
          note: 'Test saving for deletion'
        })
      })

      const createResult = await createResponse.json()
      savingId = createResult.saving.id
    })

    it('should delete saving successfully', async () => {
      const response = await fetch(`${BASE_URL}/api/savings/${savingId}`, {
        method: 'DELETE',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.deletedAmount).toBe(30.00)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/savings/${savingId}`, {
        method: 'DELETE'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/savings/stats', () => {
    beforeEach(async () => {
      // Create some test savings for stats
      await fetch(`${BASE_URL}/api/savings/quick-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          amountChf: 25.00,
          note: 'Stats test saving 1'
        })
      })

      await fetch(`${BASE_URL}/api/savings/quick-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          amountChf: 35.00,
          note: 'Stats test saving 2'
        })
      })
    })

    it('should return savings statistics', async () => {
      const response = await fetch(`${BASE_URL}/api/savings/stats`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.stats).toMatchObject({
        today: expect.any(Object),
        thisWeek: expect.any(Object),
        thisMonth: expect.any(Object),
        allTime: expect.any(Object)
      })
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/savings/stats`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/savings/by-goal/:goalId', () => {
    beforeEach(async () => {
      // Add savings to the test goal
      await fetch(`${BASE_URL}/api/savings/add-with-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          goalId: goalId,
          actionId: actionId,
          amountChf: 15.00,
          note: 'Goal-specific saving'
        })
      })
    })

    it('should return savings for specific goal', async () => {
      const response = await fetch(`${BASE_URL}/api/savings/by-goal/${goalId}`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.savings).toBeInstanceOf(Array)
      expect(result.goal).toMatchObject({
        id: goalId,
        title: 'Test Savings Goal'
      })
    })

    it('should require goal access', async () => {
      const response = await fetch(`${BASE_URL}/api/savings/by-goal/99999`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      expect(response.status).toBe(404)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/savings/by-goal/${goalId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })
})