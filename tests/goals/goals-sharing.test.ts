import { describe, it, expect, beforeEach } from 'vitest'
import { generateTestUser } from '../helpers/testUtils'
import { testDataTracker } from '../setup'

const BASE_URL = 'http://localhost:3200'

describe('Goals Sharing API', () => {
  let testUser1: any
  let testUser2: any
  let authCookie1: string
  let authCookie2: string
  let userId1: number
  let userId2: number
  let testGoal: any
  let goalId: number

  beforeEach(async () => {
    // Create two test users for sharing tests
    testUser1 = generateTestUser()
    testUser2 = generateTestUser()
    testDataTracker.users.push(testUser1.email, testUser2.email)

    // Register and login first user
    const register1 = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser1)
    })
    const result1 = await register1.json()
    userId1 = result1.user.id

    const login1 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usernameOrEmail: testUser1.email,
        password: testUser1.password
      })
    })
    authCookie1 = login1.headers.get('set-cookie') || ''

    // Register and login second user
    const register2 = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser2)
    })
    const result2 = await register2.json()
    userId2 = result2.user.id

    const login2 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usernameOrEmail: testUser2.email,
        password: testUser2.password
      })
    })
    authCookie2 = login2.headers.get('set-cookie') || ''

    // Create friendship between users
    await fetch(`${BASE_URL}/api/friends/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie1
      },
      body: JSON.stringify({ friendId: userId2 })
    })

    // Accept friendship (need to get the request ID - simplified for testing)
    // For now, assume friendship is established

    // Create a goal with user1
    testGoal = {
      title: 'Shared Goal Test',
      targetChf: 500.00,
      imageUrl: 'https://example.com/shared-goal.jpg'
    }

    const createGoalResponse = await fetch(`${BASE_URL}/api/goals/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie1
      },
      body: JSON.stringify(testGoal)
    })

    const goalResult = await createGoalResponse.json()
    goalId = goalResult.goal.id
  })

  describe('POST /api/goals/shared/create', () => {
    it('should create a shared goal successfully', async () => {
      const sharedGoalData = {
        title: 'New Shared Goal',
        targetChf: 300.00,
        friendIds: [userId2]
      }

      const response = await fetch(`${BASE_URL}/api/goals/shared/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie1
        },
        body: JSON.stringify(sharedGoalData)
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.goal).toMatchObject({
        title: sharedGoalData.title,
        targetChf: sharedGoalData.targetChf,
        isShared: true
      })
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/goals/shared/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Unauthorized Shared Goal',
          targetChf: 100,
          friendIds: [userId2]
        })
      })

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/goals/:id/share', () => {
    it('should share existing goal with friends', async () => {
      const shareData = { friendIds: [userId2] }

      const response = await fetch(`${BASE_URL}/api/goals/${goalId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie1
        },
        body: JSON.stringify(shareData)
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.sharedWithCount).toBe(1)
    })

    it('should reject sharing with invalid friend IDs', async () => {
      const shareData = { friendIds: [99999] } // Non-existent friend

      const response = await fetch(`${BASE_URL}/api/goals/${goalId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie1
        },
        body: JSON.stringify(shareData)
      })

      expect(response.status).toBe(400)
    })

    it('should require goal ownership', async () => {
      const shareData = { friendIds: [userId1] }

      const response = await fetch(`${BASE_URL}/api/goals/${goalId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie2 // User2 trying to share User1's goal
        },
        body: JSON.stringify(shareData)
      })

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/goals/shared', () => {
    beforeEach(async () => {
      // Share the goal first
      await fetch(`${BASE_URL}/api/goals/${goalId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie1
        },
        body: JSON.stringify({ friendIds: [userId2] })
      })
    })

    it('should return shared goals for user', async () => {
      const response = await fetch(`${BASE_URL}/api/goals/shared`, {
        method: 'GET',
        headers: { 'Cookie': authCookie2 }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.sharedGoals).toBeInstanceOf(Array)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/goals/shared`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('DELETE /api/goals/:id/share', () => {
    beforeEach(async () => {
      // Share the goal first
      await fetch(`${BASE_URL}/api/goals/${goalId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie1
        },
        body: JSON.stringify({ friendIds: [userId2] })
      })
    })

    it('should remove goal sharing', async () => {
      const response = await fetch(`${BASE_URL}/api/goals/${goalId}/share`, {
        method: 'DELETE',
        headers: { 'Cookie': authCookie1 }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
    })

    it('should require goal ownership', async () => {
      const response = await fetch(`${BASE_URL}/api/goals/${goalId}/share`, {
        method: 'DELETE',
        headers: { 'Cookie': authCookie2 }
      })

      expect(response.status).toBe(404)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/goals/${goalId}/share`, {
        method: 'DELETE'
      })

      expect(response.status).toBe(401)
    })
  })
})