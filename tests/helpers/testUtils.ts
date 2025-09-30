import { createApp, toNodeListener, App } from 'h3'
import supertest from 'supertest'
import { createServer } from 'http'
import { db } from '../../server/utils/database/connection'
import { users, goals, savings, actions, friendships, userAchievements, pushSubscriptions } from '../../server/utils/database/schema'
import { eq } from 'drizzle-orm'
import { createJWT } from '../../server/utils/auth'

// Create test app instance
export function createTestApp(): { app: App, request: any } {
  const app = createApp()
  
  // Load all API routes dynamically
  // In a real setup, you'd import your actual Nuxt/Nitro app
  
  const server = createServer(toNodeListener(app))
  const request = supertest(server)
  
  return { app, request }
}



// Test user data generator
export function generateTestUser(suffix = Date.now().toString()) {
  return {
    firstName: `Test${suffix}`,
    lastName: `User${suffix}`,
    username: `testuser${suffix}`,
    email: `test${suffix}@example.com`,
    password: 'TestPassword123!'
  }
}

// Test goal data generator
export function generateTestGoal(userId: number, suffix = Date.now().toString()) {
  return {
    userId,
    title: `Test Goal ${suffix}`,
    description: `Test goal description ${suffix}`,
    targetAmountChf: '100.00',
    currentAmountChf: '0.00',
    targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isShared: false,
    isCompleted: false
  }
}

// Test saving data generator
export function generateTestSaving(userId: number, goalId?: number, suffix = Date.now().toString()) {
  return {
    userId,
    goalId: goalId || null,
    amountChf: '10.50',
    description: `Test saving ${suffix}`,
    savedAt: new Date()
  }
}

// Authentication helper
export async function authenticateUser(request: any, user: any) {
  const response = await request
    .post('/api/auth/login')
    .send({
      usernameOrEmail: user.username || user.email,
      password: user.password
    })
    .expect(200)
  
  // Extract cookies for subsequent requests
  const cookies = response.headers['set-cookie']
  return cookies
}

// Register and authenticate helper
export async function createAndAuthenticateUser(request: any, userData?: any) {
  const user = userData || generateTestUser()
  
  // Register user
  await request
    .post('/api/auth/register')
    .send(user)
    .expect(200)
  
  // Login user
  const cookies = await authenticateUser(request, user)
  
  return { user, cookies }
}

// Clean up test data helper
export async function cleanupTestUser(email: string) {
  try {
    // Find user by email
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1)
    
    if (user.length === 0) return
    
    const userId = user[0].id
    
    await db.transaction(async (tx) => {
      // Delete user achievements
      await tx.delete(userAchievements).where(eq(userAchievements.userId, userId))
      
      // Delete push subscriptions
      await tx.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId))
      
      // Delete friendships
      await tx.execute(`DELETE FROM friendships WHERE requester_id = ${userId} OR addressee_id = ${userId}`)
      
      // Delete savings
      await tx.delete(savings).where(eq(savings.userId, userId))
      
      // Delete goals
      await tx.delete(goals).where(eq(goals.ownerId, userId))
      
      // Delete custom actions
      await tx.delete(actions).where(eq(actions.creatorId, userId))
      
      // Delete user
      await tx.delete(users).where(eq(users.id, userId))
    })
    
    console.log(`✅ Cleaned up test user: ${email}`)
  } catch (error) {
    console.warn('⚠️  Cleanup failed:', error)
  }
}

// Enhanced test data generators
export function generateTestAction(userId: number, suffix = Date.now().toString()) {
  return {
    title: `Test Action ${suffix}`,
    description: `Test action description ${suffix}`,
    defaultChf: 5.00
  }
}

export function generateTestAchievement(suffix = Date.now().toString()) {
  return {
    slug: `test-achievement-${suffix}`,
    name: `Test Achievement ${suffix}`,
    description: `Test achievement description ${suffix}`,
    criteriaType: 'total_saved',
    thresholdValue: 100,
    isActive: 1
  }
}

// Authentication helper with proper JWT payload
export function createAuthToken(userId: number, username: string, email: string): string {
  return createJWT({ userId, username, email })
}

// Test request with auth cookie
export function withAuth(request: any, token: string) {
  return request.set('Cookie', `auth-token=${token}`)
}