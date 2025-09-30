import { describe, it, expect, beforeEach, vi } from 'vitest'
import { generateTestUser } from '../helpers/testUtils'
import { testDataTracker } from '../setup'

const BASE_URL = 'http://localhost:3200'

// Mock push notification service to avoid actual VAPID operations in tests
vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({ statusCode: 200 }),
    generateVAPIDKeys: vi.fn().mockReturnValue({
      publicKey: 'mock-public-key',
      privateKey: 'mock-private-key'
    })
  }
}))

describe('Push Notifications API', () => {
  let testUser: any
  let authCookie: string
  let userId: number

  const mockSubscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
    keys: {
      p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM',
      auth: 'tBHItJI5svbpez7KI4CCXg'
    }
  }

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

  describe('POST /api/push/subscribe', () => {
    it('should subscribe to push notifications successfully', async () => {
      const response = await fetch(`${BASE_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          subscription: mockSubscription,
          notificationTypes: ['daily_reminder', 'goal_progress']
        })
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toContain('subscribed')
      expect(result.subscriptionId).toBeDefined()
    })

    it('should update existing subscription', async () => {
      // First subscription
      await fetch(`${BASE_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          subscription: mockSubscription,
          notificationTypes: ['daily_reminder']
        })
      })

      // Update subscription with different notification types
      const response = await fetch(`${BASE_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          subscription: mockSubscription,
          notificationTypes: ['daily_reminder', 'goal_progress', 'achievement_unlocked']
        })
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toContain('updated')
    })

    it('should validate subscription format', async () => {
      const invalidSubscription = {
        endpoint: 'invalid-endpoint',
        keys: {
          p256dh: 'invalid-key'
          // Missing auth key
        }
      }

      const response = await fetch(`${BASE_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          subscription: invalidSubscription,
          notificationTypes: ['daily_reminder']
        })
      })

      expect(response.status).toBe(422)
    })

    it('should validate notification types', async () => {
      const response = await fetch(`${BASE_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          subscription: mockSubscription,
          notificationTypes: ['invalid_type', 'another_invalid_type']
        })
      })

      expect(response.status).toBe(422)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: mockSubscription,
          notificationTypes: ['daily_reminder']
        })
      })

      expect(response.status).toBe(401)
    })
  })

  describe('DELETE /api/push/unsubscribe', () => {
    beforeEach(async () => {
      // Subscribe first so we can unsubscribe
      await fetch(`${BASE_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          subscription: mockSubscription,
          notificationTypes: ['daily_reminder']
        })
      })
    })

    it('should unsubscribe from push notifications', async () => {
      const response = await fetch(`${BASE_URL}/api/push/unsubscribe`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          endpoint: mockSubscription.endpoint
        })
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toContain('unsubscribed')
    })

    it('should unsubscribe all user subscriptions when no endpoint provided', async () => {
      const response = await fetch(`${BASE_URL}/api/push/unsubscribe`, {
        method: 'DELETE',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toContain('All subscriptions removed')
    })

    it('should handle unsubscribe from non-existent subscription', async () => {
      const response = await fetch(`${BASE_URL}/api/push/unsubscribe`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          endpoint: 'https://non-existent-endpoint.com'
        })
      })

      expect(response.status).toBe(404)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/push/unsubscribe`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: mockSubscription.endpoint
        })
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/push/subscriptions', () => {
    beforeEach(async () => {
      // Create multiple subscriptions
      const subscriptions = [
        {
          ...mockSubscription,
          endpoint: 'https://test-endpoint-1.com',
          notificationTypes: ['daily_reminder']
        },
        {
          ...mockSubscription,
          endpoint: 'https://test-endpoint-2.com',
          notificationTypes: ['goal_progress', 'achievement_unlocked']
        }
      ]

      for (const sub of subscriptions) {
        await fetch(`${BASE_URL}/api/push/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': authCookie
          },
          body: JSON.stringify({
            subscription: {
              endpoint: sub.endpoint,
              keys: sub.keys
            },
            notificationTypes: sub.notificationTypes
          })
        })
      }
    })

    it('should return user subscriptions', async () => {
      const response = await fetch(`${BASE_URL}/api/push/subscriptions`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.subscriptions).toBeInstanceOf(Array)
      expect(result.subscriptions.length).toBeGreaterThan(0)
      
      expect(result.subscriptions[0]).toMatchObject({
        id: expect.any(Number),
        endpoint: expect.any(String),
        notificationTypes: expect.any(Array),
        isActive: expect.any(Boolean),
        createdAt: expect.any(String)
      })
    })

    it('should not expose sensitive subscription data', async () => {
      const response = await fetch(`${BASE_URL}/api/push/subscriptions`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      
      // Should not include raw subscription keys in response
      result.subscriptions.forEach((sub: any) => {
        expect(sub.p256dhKey).toBeUndefined()
        expect(sub.authKey).toBeUndefined()
      })
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/push/subscriptions`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/push/test', () => {
    beforeEach(async () => {
      // Subscribe to receive test notifications
      await fetch(`${BASE_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          subscription: mockSubscription,
          notificationTypes: ['daily_reminder']
        })
      })
    })

    it('should send test notification', async () => {
      const response = await fetch(`${BASE_URL}/api/push/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          message: 'Test notification from Syfte app'
        })
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toContain('Test notification sent')
      expect(result.sentCount).toBeGreaterThan(0)
    })

    it('should handle test notification when no subscriptions', async () => {
      // Unsubscribe first
      await fetch(`${BASE_URL}/api/push/unsubscribe`, {
        method: 'DELETE',
        headers: { 'Cookie': authCookie }
      })

      const response = await fetch(`${BASE_URL}/api/push/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          message: 'Test notification'
        })
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.sentCount).toBe(0)
      expect(result.message).toContain('No active subscriptions')
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/push/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Test notification'
        })
      })

      expect(response.status).toBe(401)
    })
  })

  describe('PUT /api/push/settings', () => {
    beforeEach(async () => {
      // Subscribe first
      await fetch(`${BASE_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          subscription: mockSubscription,
          notificationTypes: ['daily_reminder']
        })
      })
    })

    it('should update notification settings', async () => {
      const response = await fetch(`${BASE_URL}/api/push/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          notificationTypes: ['daily_reminder', 'goal_progress', 'achievement_unlocked'],
          dailyReminderTime: '09:00',
          enableWeekendReminders: false
        })
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toContain('settings updated')
    })

    it('should validate notification settings', async () => {
      const response = await fetch(`${BASE_URL}/api/push/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          notificationTypes: ['invalid_type'],
          dailyReminderTime: '25:00' // Invalid time
        })
      })

      expect(response.status).toBe(422)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/push/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationTypes: ['daily_reminder']
        })
      })

      expect(response.status).toBe(401)
    })
  })

  describe('Notification Types Validation', () => {
    const validNotificationTypes = [
      'daily_reminder',
      'goal_progress',
      'goal_completed',
      'achievement_unlocked',
      'friend_request',
      'streak_reminder'
    ]

    it('should accept all valid notification types', async () => {
      const response = await fetch(`${BASE_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          subscription: mockSubscription,
          notificationTypes: validNotificationTypes
        })
      })

      expect(response.status).toBe(200)
    })

    it('should reject invalid notification types', async () => {
      const invalidTypes = ['spam_notification', 'marketing_email', 'random_alert']

      const response = await fetch(`${BASE_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          subscription: mockSubscription,
          notificationTypes: invalidTypes
        })
      })

      expect(response.status).toBe(422)
    })
  })
})