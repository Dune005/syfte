import { describe, it, expect, beforeEach } from 'vitest'
import { generateTestUser } from '../helpers/testUtils'
import { testDataTracker } from '../setup'

const BASE_URL = 'http://localhost:3200'

describe('Actions Management API', () => {
  let testUser: any
  let authCookie: string
  let userId: number
  let goalId: number

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

    // Create a test goal for action assignment
    const goalResponse = await fetch(`${BASE_URL}/api/goals/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie
      },
      body: JSON.stringify({
        title: 'Test Goal for Actions',
        targetChf: 100.00
      })
    })

    const goalResult = await goalResponse.json()
    goalId = goalResult.goal.id
  })

  describe('GET /api/actions', () => {
    it('should return all available actions', async () => {
      const response = await fetch(`${BASE_URL}/api/actions`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.actions).toBeInstanceOf(Array)
      expect(result.actions.length).toBeGreaterThanOrEqual(0)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/actions`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/actions/create', () => {
    it('should create a new custom action', async () => {
      const actionData = {
        title: 'Custom Coffee Saving',
        description: 'Money saved by not buying coffee',
        defaultChf: 4.50
      }

      const response = await fetch(`${BASE_URL}/api/actions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify(actionData)
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.action).toMatchObject({
        title: actionData.title,
        description: actionData.description,
        defaultChf: actionData.defaultChf,
        creatorId: userId,
        isActive: true
      })
    })

    it('should reject invalid action data', async () => {
      const invalidAction = {
        title: '', // Empty title
        defaultChf: -5 // Negative amount
      }

      const response = await fetch(`${BASE_URL}/api/actions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify(invalidAction)
      })

      expect(response.status).toBe(422)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/actions/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Unauthorized Action',
          defaultChf: 10
        })
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/actions/my', () => {
    beforeEach(async () => {
      // Create a custom action
      await fetch(`${BASE_URL}/api/actions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          title: 'My Custom Action',
          description: 'Personal saving action',
          defaultChf: 7.50
        })
      })
    })

    it('should return user\'s custom actions', async () => {
      const response = await fetch(`${BASE_URL}/api/actions/my`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.actions).toBeInstanceOf(Array)
      expect(result.actions.length).toBeGreaterThan(0)
      expect(result.actions[0]).toMatchObject({
        title: 'My Custom Action',
        creatorId: userId
      })
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/actions/my`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('PUT /api/actions/:id', () => {
    let actionId: number

    beforeEach(async () => {
      // Create an action to update
      const createResponse = await fetch(`${BASE_URL}/api/actions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          title: 'Original Action',
          description: 'Original description',
          defaultChf: 5.00
        })
      })

      const createResult = await createResponse.json()
      actionId = createResult.action.id
    })

    it('should update action successfully', async () => {
      const updateData = {
        title: 'Updated Action Title',
        description: 'Updated description',
        defaultChf: 8.00
      }

      const response = await fetch(`${BASE_URL}/api/actions/${actionId}`, {
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
      expect(result.action).toMatchObject({
        title: updateData.title,
        description: updateData.description,
        defaultChf: updateData.defaultChf
      })
    })

    it('should reject unauthorized update', async () => {
      // Create another user
      const otherUser = generateTestUser()
      await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(otherUser)
      })

      const otherLogin = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: otherUser.email,
          password: otherUser.password
        })
      })

      const otherCookie = otherLogin.headers.get('set-cookie') || ''

      const response = await fetch(`${BASE_URL}/api/actions/${actionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': otherCookie
        },
        body: JSON.stringify({
          title: 'Unauthorized Update'
        })
      })

      expect(response.status).toBe(404)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/actions/${actionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'No Auth Update'
        })
      })

      expect(response.status).toBe(401)
    })
  })

  describe('DELETE /api/actions/:id', () => {
    let actionId: number

    beforeEach(async () => {
      // Create an action to deactivate
      const createResponse = await fetch(`${BASE_URL}/api/actions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          title: 'Action to Deactivate',
          description: 'This action will be deactivated',
          defaultChf: 3.00
        })
      })

      const createResult = await createResponse.json()
      actionId = createResult.action.id
    })

    it('should deactivate action successfully', async () => {
      const response = await fetch(`${BASE_URL}/api/actions/${actionId}`, {
        method: 'DELETE',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.actionId).toBe(actionId)
    })

    it('should require action ownership', async () => {
      // Create another user
      const otherUser = generateTestUser()
      await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(otherUser)
      })

      const otherLogin = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: otherUser.email,
          password: otherUser.password
        })
      })

      const otherCookie = otherLogin.headers.get('set-cookie') || ''

      const response = await fetch(`${BASE_URL}/api/actions/${actionId}`, {
        method: 'DELETE',
        headers: { 'Cookie': otherCookie }
      })

      expect(response.status).toBe(404)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/actions/${actionId}`, {
        method: 'DELETE'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/goals/:id/actions', () => {
    it('should return available actions for goal', async () => {
      const response = await fetch(`${BASE_URL}/api/goals/${goalId}/actions`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.actions).toBeInstanceOf(Array)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/goals/${goalId}/actions`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/goals/:id/actions', () => {
    let actionId: number

    beforeEach(async () => {
      // Create an action to assign
      const createResponse = await fetch(`${BASE_URL}/api/actions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          title: 'Action for Assignment',
          defaultChf: 5.00
        })
      })

      const createResult = await createResponse.json()
      actionId = createResult.action.id
    })

    it('should assign actions to goal', async () => {
      const response = await fetch(`${BASE_URL}/api/goals/${goalId}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          actionIds: [actionId]
        })
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.assignedCount).toBe(1)
    })

    it('should require goal ownership', async () => {
      // Test with non-existent goal
      const response = await fetch(`${BASE_URL}/api/goals/99999/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          actionIds: [actionId]
        })
      })

      expect(response.status).toBe(404)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/goals/${goalId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionIds: [actionId]
        })
      })

      expect(response.status).toBe(401)
    })
  })
})