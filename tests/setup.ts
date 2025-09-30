import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { db } from '../server/utils/database/connection'

// Track test data for cleanup
export const testDataTracker = {
  users: [] as string[], // Store email addresses
  cleanup: async function() {
    // Import here to avoid circular dependencies
    const { cleanupTestUser } = await import('./helpers/testUtils')
    
    for (const email of this.users) {
      await cleanupTestUser(email)
    }
    this.users = []
  }
}

// Test setup - runs before all tests
beforeAll(async () => {
  console.log('🧪 Setting up test environment...')
  // Test database connection
  try {
    await db.execute('SELECT 1')
    console.log('✅ Database connection established')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
})

// Clean up after all tests
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...')
  await testDataTracker.cleanup()
})

// Clean up after each test
afterEach(async () => {
  // Clean up test data created in this test
  await testDataTracker.cleanup()
})

// Reset before each test
beforeEach(async () => {
  // Optional: Additional setup before each test
})