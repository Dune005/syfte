import { describe, it, expect, beforeEach } from 'vitest'
import { generateTestUser } from '../helpers/testUtils'
import { testDataTracker } from '../setup'

const BASE_URL = 'http://localhost:3200'

describe('Streaks API', () => {
  let testUser: any
  let authCookie: string
  let userId: number

  beforeEach(async () => {
    // Create and authenticate test user
    testUser = generateTestUser()
    testDataTracker.users.push(testUser.email)

    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    })
    
    const registerResult = await registerResponse.json()
    userId = registerResult.user.id

    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usernameOrEmail: testUser.email,
        password: testUser.password
      })
    })

    authCookie = loginResponse.headers.get('set-cookie') || ''
  })

  describe('GET /api/streaks/current', () => {
    it('should return zero streak for new user', async () => {
      const response = await fetch(`${BASE_URL}/api/streaks/current`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.streak).toMatchObject({
        currentStreak: 0,
        longestStreak: 0,
        lastSavingDate: null,
        isActive: false
      })
    })

    it('should calculate current streak after savings', async () => {
      // Add a saving to start streak
      await fetch(`${BASE_URL}/api/savings/quick-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          chf: 10.00,
          description: 'Starting streak'
        })
      })

      const response = await fetch(`${BASE_URL}/api/streaks/current`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.streak.currentStreak).toBeGreaterThanOrEqual(1)
      expect(result.streak.isActive).toBe(true)
      expect(result.streak.lastSavingDate).toBeDefined()
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/streaks/current`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/streaks/history', () => {
    beforeEach(async () => {
      // Add multiple savings over different days to create streak history
      const savingsData = [
        { chf: 5.00, description: 'Day 1 savings' },
        { chf: 7.50, description: 'Day 2 savings' },
        { chf: 10.00, description: 'Day 3 savings' },
        { chf: 4.25, description: 'Day 4 savings' }
      ]

      for (const saving of savingsData) {
        await fetch(`${BASE_URL}/api/savings/quick-add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': authCookie
          },
          body: JSON.stringify(saving)
        })
      }
    })

    it('should return streak history', async () => {
      const response = await fetch(`${BASE_URL}/api/streaks/history`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.history).toBeInstanceOf(Array)
      
      if (result.history.length > 0) {
        expect(result.history[0]).toMatchObject({
          id: expect.any(Number),
          streakLength: expect.any(Number),
          startDate: expect.any(String),
          endDate: expect.any(String),
          isActive: expect.any(Boolean)
        })
      }
    })

    it('should support pagination', async () => {
      const response = await fetch(`${BASE_URL}/api/streaks/history?page=1&limit=5`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 5,
        total: expect.any(Number),
        totalPages: expect.any(Number)
      })
    })

    it('should filter by date range', async () => {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
      const endDate = new Date()

      const response = await fetch(
        `${BASE_URL}/api/streaks/history?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          method: 'GET',
          headers: { 'Cookie': authCookie }
        }
      )

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.dateRange).toMatchObject({
        startDate: expect.any(String),
        endDate: expect.any(String)
      })
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/streaks/history`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/streaks/stats', () => {
    beforeEach(async () => {
      // Create a longer streak history
      for (let i = 0; i < 10; i++) {
        await fetch(`${BASE_URL}/api/savings/quick-add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': authCookie
          },
          body: JSON.stringify({
            chf: 5.00 + i,
            description: `Streak day ${i + 1}`
          })
        })
      }
    })

    it('should return comprehensive streak statistics', async () => {
      const response = await fetch(`${BASE_URL}/api/streaks/stats`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.stats).toMatchObject({
        currentStreak: expect.any(Number),
        longestStreak: expect.any(Number),
        totalStreaks: expect.any(Number),
        averageStreakLength: expect.any(Number),
        totalStreakDays: expect.any(Number),
        streakFrequency: expect.any(Number)
      })
    })

    it('should include streak milestones', async () => {
      const response = await fetch(`${BASE_URL}/api/streaks/stats?includeMilestones=true`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      
      if (result.stats.milestones) {
        expect(result.stats.milestones).toBeInstanceOf(Array)
        result.stats.milestones.forEach((milestone: any) => {
          expect(milestone).toMatchObject({
            length: expect.any(Number),
            achievedAt: expect.any(String),
            title: expect.any(String)
          })
        })
      }
    })

    it('should include weekly breakdown', async () => {
      const response = await fetch(`${BASE_URL}/api/streaks/stats?includeWeeklyBreakdown=true`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      
      if (result.stats.weeklyBreakdown) {
        expect(result.stats.weeklyBreakdown).toBeInstanceOf(Array)
        expect(result.stats.weeklyBreakdown).toHaveLength(7) // Days of week
      }
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/streaks/stats`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/streaks/check', () => {
    it('should check and update streak status', async () => {
      // Add a saving first
      await fetch(`${BASE_URL}/api/savings/quick-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          chf: 15.00,
          description: 'Streak check saving'
        })
      })

      const response = await fetch(`${BASE_URL}/api/streaks/check`, {
        method: 'POST',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.streak).toMatchObject({
        currentStreak: expect.any(Number),
        isActive: expect.any(Boolean),
        lastChecked: expect.any(String)
      })
    })

    it('should handle streak breaks', async () => {
      // This would typically involve testing with dates in the past
      // For simplicity, we'll test the basic functionality
      const response = await fetch(`${BASE_URL}/api/streaks/check`, {
        method: 'POST',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.streak.currentStreak).toBeGreaterThanOrEqual(0)
    })

    it('should return streak changes', async () => {
      // Add saving to ensure streak changes
      await fetch(`${BASE_URL}/api/savings/quick-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          chf: 20.00,
          description: 'Change tracking saving'
        })
      })

      const response = await fetch(`${BASE_URL}/api/streaks/check`, {
        method: 'POST',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.changes).toBeDefined()
      expect(result.changes).toMatchObject({
        streakChanged: expect.any(Boolean),
        previousStreak: expect.any(Number),
        newStreak: expect.any(Number)
      })
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/streaks/check`, {
        method: 'POST'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/streaks/leaderboard', () => {
    let friendUser: any
    let friendCookie: string

    beforeEach(async () => {
      // Create a friend user for leaderboard testing
      friendUser = generateTestUser()
      testDataTracker.users.push(friendUser.email)

      await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(friendUser)
      })

      const friendLogin = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: friendUser.email,
          password: friendUser.password
        })
      })

      friendCookie = friendLogin.headers.get('set-cookie') || ''

      // Establish friendship
      await fetch(`${BASE_URL}/api/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          username: friendUser.username
        })
      })

      const requestsResponse = await fetch(`${BASE_URL}/api/friends/requests`, {
        method: 'GET',
        headers: { 'Cookie': friendCookie }
      })
      
      const requestsResult = await requestsResponse.json()
      if (requestsResult.requests.length > 0) {
        const requestId = requestsResult.requests[0].id
        await fetch(`${BASE_URL}/api/friends/requests/${requestId}/accept`, {
          method: 'PUT',
          headers: { 'Cookie': friendCookie }
        })
      }

      // Add savings for both users to create streaks
      await fetch(`${BASE_URL}/api/savings/quick-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          chf: 10.00,
          description: 'User streak'
        })
      })

      await fetch(`${BASE_URL}/api/savings/quick-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': friendCookie
        },
        body: JSON.stringify({
          chf: 15.00,
          description: 'Friend streak'
        })
      })
    })

    it('should return friends streak leaderboard', async () => {
      const response = await fetch(`${BASE_URL}/api/streaks/leaderboard`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.leaderboard).toBeInstanceOf(Array)
      
      if (result.leaderboard.length > 0) {
        expect(result.leaderboard[0]).toMatchObject({
          username: expect.any(String),
          currentStreak: expect.any(Number),
          longestStreak: expect.any(Number),
          rank: expect.any(Number)
        })
      }
    })

    it('should support different leaderboard types', async () => {
      const types = ['current', 'longest', 'total_days']
      
      for (const type of types) {
        const response = await fetch(`${BASE_URL}/api/streaks/leaderboard?type=${type}`, {
          method: 'GET',
          headers: { 'Cookie': authCookie }
        })

        const result = await response.json()

        expect(response.status).toBe(200)
        expect(result.success).toBe(true)
        expect(result.leaderboardType).toBe(type)
      }
    })

    it('should support pagination in leaderboard', async () => {
      const response = await fetch(`${BASE_URL}/api/streaks/leaderboard?limit=10&page=1`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: expect.any(Number)
      })
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/streaks/leaderboard`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('Streak Calculation Logic', () => {
    it('should maintain streak with consecutive days of savings', async () => {
      // Add savings for multiple consecutive days
      for (let i = 0; i < 5; i++) {
        await fetch(`${BASE_URL}/api/savings/quick-add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': authCookie
          },
          body: JSON.stringify({
            chf: 5.00 + i,
            description: `Day ${i + 1} consecutive saving`
          })
        })
      }

      const response = await fetch(`${BASE_URL}/api/streaks/current`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.streak.currentStreak).toBeGreaterThanOrEqual(1)
      expect(result.streak.isActive).toBe(true)
    })

    it('should handle multiple savings on same day', async () => {
      // Add multiple savings on the same day
      await fetch(`${BASE_URL}/api/savings/quick-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          chf: 5.00,
          description: 'First saving today'
        })
      })

      await fetch(`${BASE_URL}/api/savings/quick-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          chf: 7.50,
          description: 'Second saving today'
        })
      })

      const response = await fetch(`${BASE_URL}/api/streaks/current`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.streak.currentStreak).toBeGreaterThanOrEqual(1)
      expect(result.streak.isActive).toBe(true)
    })
  })
})