import { describe, it, expect, beforeEach } from 'vitest'
import { generateTestUser } from '../helpers/testUtils'
import { testDataTracker } from '../setup'

const BASE_URL = 'http://localhost:3200'

describe('Analytics & Export API', () => {
  let testUser: any
  let authCookie: string
  let userId: number
  let goalId: number

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

    // Create a test goal
    const goalResponse = await fetch(`${BASE_URL}/api/goals/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie
      },
      body: JSON.stringify({
        title: 'Test Analytics Goal',
        targetChf: 200.00
      })
    })

    const goalResult = await goalResponse.json()
    goalId = goalResult.goal.id

    // Add some test savings data for analytics
    const savingsData = [
      { chf: 25.50, description: 'Coffee savings' },
      { chf: 15.00, description: 'Lunch savings' },
      { chf: 8.75, description: 'Transport savings' }
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

  describe('GET /api/analytics/savings', () => {
    it('should return savings analytics with default period', async () => {
      const response = await fetch(`${BASE_URL}/api/analytics/savings`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.analytics).toMatchObject({
        totalSavings: expect.any(Number),
        averageDaily: expect.any(Number),
        savingsCount: expect.any(Number),
        period: expect.any(String)
      })
      expect(result.analytics.totalSavings).toBeGreaterThan(0)
      expect(result.analytics.savingsCount).toBeGreaterThan(0)
    })

    it('should return analytics for specific period', async () => {
      const response = await fetch(`${BASE_URL}/api/analytics/savings?period=7d`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.analytics.period).toBe('7d')
    })

    it('should support multiple period formats', async () => {
      const periods = ['7d', '30d', '90d', '1y']
      
      for (const period of periods) {
        const response = await fetch(`${BASE_URL}/api/analytics/savings?period=${period}`, {
          method: 'GET',
          headers: { 'Cookie': authCookie }
        })

        const result = await response.json()

        expect(response.status).toBe(200)
        expect(result.success).toBe(true)
        expect(result.analytics.period).toBe(period)
      }
    })

    it('should include daily breakdown', async () => {
      const response = await fetch(`${BASE_URL}/api/analytics/savings?includeDaily=true`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.analytics.dailyBreakdown).toBeInstanceOf(Array)
    })

    it('should include category breakdown', async () => {
      const response = await fetch(`${BASE_URL}/api/analytics/savings?includeCategories=true`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      if (result.analytics.categoryBreakdown) {
        expect(result.analytics.categoryBreakdown).toBeInstanceOf(Array)
      }
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/analytics/savings`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/analytics/goals', () => {
    it('should return goals analytics', async () => {
      const response = await fetch(`${BASE_URL}/api/analytics/goals`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.analytics).toMatchObject({
        totalGoals: expect.any(Number),
        activeGoals: expect.any(Number),
        completedGoals: expect.any(Number),
        totalTargetAmount: expect.any(Number),
        totalSavedAmount: expect.any(Number),
        averageProgress: expect.any(Number)
      })
    })

    it('should include goal progress details', async () => {
      const response = await fetch(`${BASE_URL}/api/analytics/goals?includeProgress=true`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      if (result.analytics.goalProgress) {
        expect(result.analytics.goalProgress).toBeInstanceOf(Array)
      }
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/analytics/goals`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/export/savings', () => {
    it('should export savings as CSV by default', async () => {
      const response = await fetch(`${BASE_URL}/api/export/savings`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('text/csv')
      expect(response.headers.get('content-disposition')).toContain('attachment')
      expect(response.headers.get('content-disposition')).toContain('.csv')

      const csvContent = await response.text()
      expect(csvContent).toContain('Date,Amount,Description')
      expect(csvContent).toContain('Coffee savings')
    })

    it('should export savings as JSON', async () => {
      const response = await fetch(`${BASE_URL}/api/export/savings?format=json`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/json')
      expect(response.headers.get('content-disposition')).toContain('.json')

      const jsonContent = await response.json()
      expect(jsonContent.savings).toBeInstanceOf(Array)
      expect(jsonContent.savings.length).toBeGreaterThan(0)
      expect(jsonContent.exportInfo).toMatchObject({
        exportDate: expect.any(String),
        totalRecords: expect.any(Number),
        format: 'json'
      })
    })

    it('should support date range filtering', async () => {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)
      const endDate = new Date()

      const response = await fetch(
        `${BASE_URL}/api/export/savings?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&format=json`,
        {
          method: 'GET',
          headers: { 'Cookie': authCookie }
        }
      )

      expect(response.status).toBe(200)
      const jsonContent = await response.json()
      expect(jsonContent.savings).toBeInstanceOf(Array)
      expect(jsonContent.exportInfo.dateRange).toMatchObject({
        startDate: expect.any(String),
        endDate: expect.any(String)
      })
    })

    it('should support goal filtering', async () => {
      const response = await fetch(`${BASE_URL}/api/export/savings?goalId=${goalId}&format=json`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      expect(response.status).toBe(200)
      const jsonContent = await response.json()
      expect(jsonContent.exportInfo.goalId).toBe(goalId)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/export/savings`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/export/goals', () => {
    it('should export goals as CSV by default', async () => {
      const response = await fetch(`${BASE_URL}/api/export/goals`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('text/csv')
      expect(response.headers.get('content-disposition')).toContain('attachment')

      const csvContent = await response.text()
      expect(csvContent).toContain('Title,Target Amount,Current Amount,Progress,Status,Created Date')
      expect(csvContent).toContain('Test Analytics Goal')
    })

    it('should export goals as JSON', async () => {
      const response = await fetch(`${BASE_URL}/api/export/goals?format=json`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/json')

      const jsonContent = await response.json()
      expect(jsonContent.goals).toBeInstanceOf(Array)
      expect(jsonContent.goals.length).toBeGreaterThan(0)
      expect(jsonContent.exportInfo).toMatchObject({
        exportDate: expect.any(String),
        totalRecords: expect.any(Number),
        format: 'json'
      })
    })

    it('should include goal details in export', async () => {
      const response = await fetch(`${BASE_URL}/api/export/goals?includeDetails=true&format=json`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      expect(response.status).toBe(200)
      const jsonContent = await response.json()
      
      expect(jsonContent.goals[0]).toMatchObject({
        title: expect.any(String),
        targetChf: expect.any(Number),
        currentChf: expect.any(Number),
        progress: expect.any(Number),
        createdAt: expect.any(String)
      })
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/export/goals`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/export/profile', () => {
    it('should export complete profile data as JSON', async () => {
      const response = await fetch(`${BASE_URL}/api/export/profile`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/json')
      expect(response.headers.get('content-disposition')).toContain('profile-export')

      const profileData = await response.json()
      
      expect(profileData).toMatchObject({
        profile: expect.objectContaining({
          username: testUser.username,
          email: testUser.email,
          totalSavingsChf: expect.any(Number)
        }),
        goals: expect.any(Array),
        savings: expect.any(Array),
        exportInfo: expect.objectContaining({
          exportDate: expect.any(String),
          exportType: 'complete_profile'
        })
      })
    })

    it('should include statistics in profile export', async () => {
      const response = await fetch(`${BASE_URL}/api/export/profile?includeStats=true`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      expect(response.status).toBe(200)
      const profileData = await response.json()
      
      if (profileData.statistics) {
        expect(profileData.statistics).toMatchObject({
          totalSavings: expect.any(Number),
          totalGoals: expect.any(Number),
          averageSavingsPerDay: expect.any(Number)
        })
      }
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/export/profile`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('Export File Headers', () => {
    it('should set proper CSV headers', async () => {
      const response = await fetch(`${BASE_URL}/api/export/savings?format=csv`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toBe('text/csv; charset=utf-8')
      expect(response.headers.get('cache-control')).toBe('no-cache, no-store, must-revalidate')
      expect(response.headers.get('content-disposition')).toMatch(/attachment; filename="savings-export-\d{4}-\d{2}-\d{2}\.csv"/)
    })

    it('should set proper JSON headers', async () => {
      const response = await fetch(`${BASE_URL}/api/export/goals?format=json`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8')
      expect(response.headers.get('cache-control')).toBe('no-cache, no-store, must-revalidate')
      expect(response.headers.get('content-disposition')).toMatch(/attachment; filename="goals-export-\d{4}-\d{2}-\d{2}\.json"/)
    })
  })
})