import { describe, it, expect, beforeEach } from 'vitest'
import { generateTestUser } from '../helpers/testUtils'
import { testDataTracker } from '../setup'

const BASE_URL = 'http://localhost:3200'

describe('Friends Management API', () => {
  let testUser: any
  let friendUser: any
  let authCookie: string
  let friendCookie: string
  let userId: number
  let friendId: number

  beforeEach(async () => {
    // Create and authenticate first test user
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

    // Create and authenticate second test user (friend)
    friendUser = generateTestUser()
    testDataTracker.users.push(friendUser.email)

    const friendRegisterResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(friendUser)
    })
    
    const friendRegisterResult = await friendRegisterResponse.json()
    friendId = friendRegisterResult.user.id

    const friendLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usernameOrEmail: friendUser.email,
        password: friendUser.password
      })
    })

    friendCookie = friendLoginResponse.headers.get('set-cookie') || ''
  })

  describe('GET /api/friends', () => {
    it('should return empty friends list initially', async () => {
      const response = await fetch(`${BASE_URL}/api/friends`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.friends).toBeInstanceOf(Array)
      expect(result.friends).toHaveLength(0)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/friends`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/friends/request', () => {
    it('should send friend request successfully', async () => {
      const response = await fetch(`${BASE_URL}/api/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          username: friendUser.username
        })
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toContain('Friend request sent')
    })

    it('should reject request to self', async () => {
      const response = await fetch(`${BASE_URL}/api/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          username: testUser.username
        })
      })

      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.message).toContain('cannot send friend request to yourself')
    })

    it('should reject request to non-existent user', async () => {
      const response = await fetch(`${BASE_URL}/api/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          username: 'nonexistentuser123'
        })
      })

      expect(response.status).toBe(404)
    })

    it('should prevent duplicate friend requests', async () => {
      // Send first request
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

      // Try to send duplicate request
      const response = await fetch(`${BASE_URL}/api/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          username: friendUser.username
        })
      })

      expect(response.status).toBe(400)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: friendUser.username
        })
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/friends/requests', () => {
    beforeEach(async () => {
      // Send a friend request
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
    })

    it('should return pending friend requests', async () => {
      const response = await fetch(`${BASE_URL}/api/friends/requests`, {
        method: 'GET',
        headers: { 'Cookie': friendCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.requests).toBeInstanceOf(Array)
      expect(result.requests.length).toBeGreaterThan(0)
      expect(result.requests[0]).toMatchObject({
        status: 'pending',
        fromUser: expect.objectContaining({
          username: testUser.username
        })
      })
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/friends/requests`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('PUT /api/friends/requests/:id/accept', () => {
    let requestId: number

    beforeEach(async () => {
      // Send a friend request
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

      // Get the request ID
      const requestsResponse = await fetch(`${BASE_URL}/api/friends/requests`, {
        method: 'GET',
        headers: { 'Cookie': friendCookie }
      })
      
      const requestsResult = await requestsResponse.json()
      requestId = requestsResult.requests[0].id
    })

    it('should accept friend request successfully', async () => {
      const response = await fetch(`${BASE_URL}/api/friends/requests/${requestId}/accept`, {
        method: 'PUT',
        headers: { 'Cookie': friendCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toContain('Friend request accepted')
    })

    it('should require request ownership', async () => {
      const response = await fetch(`${BASE_URL}/api/friends/requests/${requestId}/accept`, {
        method: 'PUT',
        headers: { 'Cookie': authCookie } // Wrong user
      })

      expect(response.status).toBe(404)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/friends/requests/${requestId}/accept`, {
        method: 'PUT'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('PUT /api/friends/requests/:id/decline', () => {
    let requestId: number

    beforeEach(async () => {
      // Send a friend request
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

      // Get the request ID
      const requestsResponse = await fetch(`${BASE_URL}/api/friends/requests`, {
        method: 'GET',
        headers: { 'Cookie': friendCookie }
      })
      
      const requestsResult = await requestsResponse.json()
      requestId = requestsResult.requests[0].id
    })

    it('should decline friend request successfully', async () => {
      const response = await fetch(`${BASE_URL}/api/friends/requests/${requestId}/decline`, {
        method: 'PUT',
        headers: { 'Cookie': friendCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toContain('Friend request declined')
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/friends/requests/${requestId}/decline`, {
        method: 'PUT'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/friends/search', () => {
    it('should search for users by username', async () => {
      const response = await fetch(`${BASE_URL}/api/friends/search?q=${friendUser.username}`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.users).toBeInstanceOf(Array)
      expect(result.users.length).toBeGreaterThan(0)
      expect(result.users[0]).toMatchObject({
        username: friendUser.username
      })
    })

    it('should return empty results for non-existent users', async () => {
      const response = await fetch(`${BASE_URL}/api/friends/search?q=nonexistentuser999`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.users).toHaveLength(0)
    })

    it('should require query parameter', async () => {
      const response = await fetch(`${BASE_URL}/api/friends/search`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      expect(response.status).toBe(400)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/friends/search?q=test`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/friends/leaderboard', () => {
    beforeEach(async () => {
      // Accept friend request to establish friendship
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
      const requestId = requestsResult.requests[0].id

      await fetch(`${BASE_URL}/api/friends/requests/${requestId}/accept`, {
        method: 'PUT',
        headers: { 'Cookie': friendCookie }
      })

      // Add some savings to both users for leaderboard
      await fetch(`${BASE_URL}/api/savings/quick-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          chf: 10.00,
          description: 'Test savings'
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
          description: 'Friend savings'
        })
      })
    })

    it('should return friends leaderboard', async () => {
      const response = await fetch(`${BASE_URL}/api/friends/leaderboard`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.leaderboard).toBeInstanceOf(Array)
      expect(result.leaderboard.length).toBeGreaterThan(0)
      
      // Should include both users
      const usernames = result.leaderboard.map((user: any) => user.username)
      expect(usernames).toContain(testUser.username)
      expect(usernames).toContain(friendUser.username)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/friends/leaderboard`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('DELETE /api/friends/:id', () => {
    let friendshipId: number

    beforeEach(async () => {
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
      const requestId = requestsResult.requests[0].id

      await fetch(`${BASE_URL}/api/friends/requests/${requestId}/accept`, {
        method: 'PUT',
        headers: { 'Cookie': friendCookie }
      })

      // Get friendship ID
      const friendsResponse = await fetch(`${BASE_URL}/api/friends`, {
        method: 'GET',
        headers: { 'Cookie': authCookie }
      })

      const friendsResult = await friendsResponse.json()
      friendshipId = friendsResult.friends[0].id
    })

    it('should remove friend successfully', async () => {
      const response = await fetch(`${BASE_URL}/api/friends/${friendshipId}`, {
        method: 'DELETE',
        headers: { 'Cookie': authCookie }
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toContain('removed')
    })

    it('should require friendship ownership', async () => {
      // Create third user
      const thirdUser = generateTestUser()
      await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(thirdUser)
      })

      const thirdLogin = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: thirdUser.email,
          password: thirdUser.password
        })
      })

      const thirdCookie = thirdLogin.headers.get('set-cookie') || ''

      const response = await fetch(`${BASE_URL}/api/friends/${friendshipId}`, {
        method: 'DELETE',
        headers: { 'Cookie': thirdCookie }
      })

      expect(response.status).toBe(404)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/friends/${friendshipId}`, {
        method: 'DELETE'
      })

      expect(response.status).toBe(401)
    })
  })
})