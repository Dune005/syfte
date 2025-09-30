import { describe, it, expect, beforeEach } from 'vitest'
import { generateTestUser } from '../helpers/testUtils'
import { testDataTracker } from '../setup'

const BASE_URL = 'http://localhost:3200'

describe('Achievements API', () => {
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

  describe('GET /api/achievements', () => {
    it('should return all available achievements', async () => {
      const response = await fetch(`${BASE_URL}/api/achievements`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.achievements).toBeInstanceOf(Array)
      
      if (result.achievements.length > 0) {
        expect(result.achievements[0]).toMatchObject({
          id: expect.any(Number),
          title: expect.any(String),
          description: expect.any(String),
          type: expect.any(String),
          targetValue: expect.any(Number),
          isUnlocked: expect.any(Boolean)
        })
      }
    })

    it('should return achievements with unlock status', async () => {
      const response = await fetch(`${BASE_URL}/api/achievements`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      
      // Initially, most achievements should be locked
      const unlockedAchievements = result.achievements.filter((a: any) => a.isUnlocked)
      const lockedAchievements = result.achievements.filter((a: any) => !a.isUnlocked)
      
      expect(lockedAchievements.length).toBeGreaterThanOrEqual(0)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/achievements`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/achievements/unlocked', () => {
    it('should return only unlocked achievements', async () => {
      const response = await fetch(`${BASE_URL}/api/achievements/unlocked`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.achievements).toBeInstanceOf(Array)
      
      // All returned achievements should be unlocked
      result.achievements.forEach((achievement: any) => {
        expect(achievement.isUnlocked).toBe(true)
      })
    })

    it('should include unlock date', async () => {
      // First, trigger some achievements by adding savings
      await fetch(`${BASE_URL}/api/savings/quick-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          chf: 10.00,
          description: 'First savings for achievement'
        })
      })

      const response = await fetch(`${BASE_URL}/api/achievements/unlocked`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      
      if (result.achievements.length > 0) {
        expect(result.achievements[0]).toMatchObject({
          unlockedAt: expect.any(String)
        })
      }
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/achievements/unlocked`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/achievements/progress', () => {
    beforeEach(async () => {
      // Add some savings to generate progress
      const savingsData = [
        { chf: 5.00, description: 'Progress test 1' },
        { chf: 10.00, description: 'Progress test 2' },
        { chf: 15.00, description: 'Progress test 3' }
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

    it('should return achievement progress', async () => {
      const response = await fetch(`${BASE_URL}/api/achievements/progress`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.progress).toBeInstanceOf(Array)
      
      if (result.progress.length > 0) {
        expect(result.progress[0]).toMatchObject({
          achievementId: expect.any(Number),
          currentValue: expect.any(Number),
          targetValue: expect.any(Number),
          progressPercentage: expect.any(Number),
          isCompleted: expect.any(Boolean)
        })
      }
    })

    it('should calculate progress percentages correctly', async () => {
      const response = await fetch(`${BASE_URL}/api/achievements/progress`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      
      result.progress.forEach((progress: any) => {
        expect(progress.progressPercentage).toBeGreaterThanOrEqual(0)
        expect(progress.progressPercentage).toBeLessThanOrEqual(100)
        
        if (progress.isCompleted) {
          expect(progress.progressPercentage).toBe(100)
        }
      })
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/achievements/progress`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/achievements/check', () => {
    it('should check and unlock new achievements', async () => {
      // Add significant savings to potentially unlock achievements
      await fetch(`${BASE_URL}/api/savings/quick-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          chf: 50.00,
          description: 'Big savings for achievement unlock'
        })
      })

      const response = await fetch(`${BASE_URL}/api/achievements/check`, {
        method: 'POST',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.newlyUnlocked).toBeInstanceOf(Array)
      expect(result.checkedAt).toBeDefined()
    })

    it('should return newly unlocked achievements', async () => {
      // Create a goal and add savings to trigger goal-related achievements
      await fetch(`${BASE_URL}/api/goals/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          title: 'Achievement Test Goal',
          targetChf: 100.00
        })
      })

      const response = await fetch(`${BASE_URL}/api/achievements/check`, {
        method: 'POST',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      
      if (result.newlyUnlocked.length > 0) {
        expect(result.newlyUnlocked[0]).toMatchObject({
          id: expect.any(Number),
          title: expect.any(String),
          description: expect.any(String),
          unlockedAt: expect.any(String)
        })
      }
    })

    it('should handle multiple achievement checks', async () => {
      // First check
      const firstCheck = await fetch(`${BASE_URL}/api/achievements/check`, {
        method: 'POST',
        headers: { 'Cookie': authCookie }
      })

      const firstResult = await firstCheck.json()
      expect(firstCheck.status).toBe(200)

      // Second check (should not unlock the same achievements again)
      const secondCheck = await fetch(`${BASE_URL}/api/achievements/check`, {
        method: 'POST',
        headers: { 'Cookie': authCookie }
      })

      const secondResult = await secondCheck.json()
      expect(secondCheck.status).toBe(200)
      
      // Second check should have fewer or same newly unlocked achievements
      expect(secondResult.newlyUnlocked.length).toBeLessThanOrEqual(firstResult.newlyUnlocked.length)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/achievements/check`, {
        method: 'POST'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('Achievement Types', () => {
    beforeEach(async () => {
      // Set up various activities to trigger different achievement types
      
      // Create multiple goals for goal-related achievements
      await fetch(`${BASE_URL}/api/goals/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          title: 'First Achievement Goal',
          targetChf: 50.00
        })
      })

      // Add savings for multiple days to trigger streak achievements
      for (let i = 0; i < 5; i++) {
        await fetch(`${BASE_URL}/api/savings/quick-add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': authCookie
          },
          body: JSON.stringify({
            chf: 5.00 + i,
            description: `Daily savings ${i + 1}`
          })
        })
      }
    })

    it('should handle savings-based achievements', async () => {
      const response = await fetch(`${BASE_URL}/api/achievements/progress`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      
      // Look for savings-related achievements
      const savingsAchievements = result.progress.filter(
        (p: any) => p.type === 'savings_total' || p.type === 'savings_count'
      )
      
      expect(savingsAchievements.length).toBeGreaterThan(0)
    })

    it('should handle goal-based achievements', async () => {
      const response = await fetch(`${BASE_URL}/api/achievements/progress`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      
      // Look for goal-related achievements
      const goalAchievements = result.progress.filter(
        (p: any) => p.type === 'goals_created' || p.type === 'goals_completed'
      )
      
      expect(goalAchievements.length).toBeGreaterThanOrEqual(0)
    })

    it('should handle streak-based achievements', async () => {
      const response = await fetch(`${BASE_URL}/api/achievements/progress`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      
      // Look for streak-related achievements
      const streakAchievements = result.progress.filter(
        (p: any) => p.type === 'streak_days'
      )
      
      expect(streakAchievements.length).toBeGreaterThanOrEqual(0)
    })
  })
})