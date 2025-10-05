import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      maxPoolSize: 1,
      minPoolSize: 0,
      maxIdleTimeMS: 5000,
      waitQueueTimeoutMS: 5000,
    });
  } catch (error) {
    console.error('Failed to set up test database', error);
    throw error;
  }
}, 60000);

afterEach(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const collections = mongoose.connection.collections;
      for (const key of Object.keys(collections)) {
        await collections[key].deleteMany({});
      }
    }
  } catch (error) {
    console.warn('Failed to clean test collections', error);
  }
});

afterAll(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      try {
        await mongoose.connection.dropDatabase();
      } catch (error) {
        console.warn('Failed to drop test database', error);
      }

      await mongoose.connection.close();
    }

    if (mongod) {
      await mongod.stop();
    }
  } catch (error) {
    console.warn('Failed to clean MongoDB instance', error);
  }
}, 30000);

jest.setTimeout(60000);

process.on('unhandledRejection', (reason) => {
  console.warn('Unhandled Promise rejection:', reason);
});

if (process.env.NODE_ENV === 'test' && typeof jest !== 'undefined') {
  const noop = () => undefined;
  jest.spyOn(console, 'log').mockImplementation(noop);
  jest.spyOn(console, 'debug').mockImplementation(noop);
  jest.spyOn(console, 'info').mockImplementation(noop);
  // keep warn/error for troubleshooting
}
