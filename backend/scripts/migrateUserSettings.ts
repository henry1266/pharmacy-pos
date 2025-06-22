/**
 * Migration script to ensure all users have a properly initialized settings field with a shortcuts array.
 * 
 * Usage: node migrateUserSettings.ts
 */

import mongoose from 'mongoose';
import config from 'config';
import User from '../models/User';
import { IUserDocument } from '../src/types/models';

// Default shortcuts to use if none exist
interface DefaultShortcut {
  id: string;
  name: string;
  productIds: string[];
}

const defaultShortcuts: DefaultShortcut[] = [
  { id: 'default', name: '常用藥品', productIds: [] }
];

// Connect to MongoDB
const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.get('mongoURI'));
    console.log('MongoDB Connected...');
  } catch (err) {
    const error = err as Error;
    console.error('Failed to connect to MongoDB', error.message);
    process.exit(1);
  }
};

// Migrate user settings
const migrateUserSettings = async (): Promise<void> => {
  try {
    console.log('Starting user settings migration...');
    
    // Get all users
    const users: IUserDocument[] = await User.find({});
    console.log(`Found ${users.length} users to process`);
    
    let updatedCount = 0;
    
    // Process each user
    for (const user of users) {
      console.log(`Processing user: ${user.username} (${user._id})`);
      
      let needsUpdate = false;
      
      // Check if settings exists and is an object
      if (!user.settings || typeof user.settings !== 'object') {
        console.log(`  User has no settings or invalid settings, initializing...`);
        user.settings = {
          theme: 'light',
          language: 'zh-TW',
          notifications: true
        };
        needsUpdate = true;
      }
      
      // Check if shortcuts exists and is an array (extending settings type)
      const userSettingsAny = user.settings as any;
      if (!userSettingsAny.shortcuts || !Array.isArray(userSettingsAny.shortcuts)) {
        console.log(`  User has no shortcuts array, initializing with defaults...`);
        userSettingsAny.shortcuts = defaultShortcuts;
        needsUpdate = true;
      }
      
      // Save the user if changes were made
      if (needsUpdate) {
        await user.save();
        updatedCount++;
        console.log(`  User settings updated successfully`);
      } else {
        console.log(`  No changes needed for this user`);
      }
    }
    
    console.log(`Migration completed. Updated ${updatedCount} users.`);
  } catch (err) {
    const error = err as Error;
    console.error('Error during migration:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  }
};

// Run the migration
connectDB()
  .then(() => migrateUserSettings())
  .catch(err => {
    const error = err as Error;
    console.error('Migration failed:', error);
    process.exit(1);
  });