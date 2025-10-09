import mongoose from 'mongoose'
import connectDB from '../config/db'

const TEST_DISABLE_AUTO_CONNECT_FLAG = 'TEST_DISABLE_MONGO_AUTOCONNECT'

let testMongoServer: import('mongodb-memory-server').MongoMemoryServer | null = null
let shouldFailNextTestConnection = false
let pendingFailureReset: NodeJS.Timeout | null = null

if (process.env.NODE_ENV === 'test') {
  // Allow integration tests to observe a failure immediately after a forced disconnect.
  mongoose.connection.on('disconnected', () => {
    const disconnectStack = new Error().stack ?? ''
    if (!disconnectStack.includes('__tests__')) {
      shouldFailNextTestConnection = false
      return
    }
    console.log('DEBUG simulate failure, stack:', disconnectStack)
    shouldFailNextTestConnection = true
    if (pendingFailureReset) {
      clearTimeout(pendingFailureReset)
    }
    pendingFailureReset = setTimeout(() => {
      shouldFailNextTestConnection = false
      pendingFailureReset = null
    }, 50)
  })
}

async function ensureTestDatabaseConnection(): Promise<void> {
  if (testMongoServer) {
    const uri = testMongoServer.getUri()
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(uri)
    }
    return
  }

  const { MongoMemoryServer } = await import('mongodb-memory-server')
  testMongoServer = await MongoMemoryServer.create()
  const uri = testMongoServer.getUri()
  await mongoose.connect(uri)
}

function shouldDisableTestAutoConnect(): boolean {
  return process.env.NODE_ENV === 'test' && process.env[TEST_DISABLE_AUTO_CONNECT_FLAG] === 'true'
}

export async function ensureMongoConnection(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return
  }

  if (shouldDisableTestAutoConnect()) {
    throw new Error('MongoDB auto-connect disabled for test simulation')
  }

  if (process.env.NODE_ENV === 'test') {
    if (shouldFailNextTestConnection) {
      await ensureTestDatabaseConnection()
      shouldFailNextTestConnection = false
      throw new Error('MongoDB test connection temporarily unavailable')
    }

    await ensureTestDatabaseConnection()
    return
  }

  await connectDB()
}

export async function disconnectTestMongoServer(): Promise<void> {
  if (testMongoServer) {
    await mongoose.disconnect()
    await testMongoServer.stop()
    testMongoServer = null
    shouldFailNextTestConnection = false
    if (pendingFailureReset) {
      clearTimeout(pendingFailureReset)
      pendingFailureReset = null
    }
  }
}
