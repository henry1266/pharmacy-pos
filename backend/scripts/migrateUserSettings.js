/**
 * Migration script to ensure all users have a properly initialized settings field with a shortcuts array.
 * 
 * Usage: node migrateUserSettings.js
 */

const mongoose = require('mongoose');
const config = require('config');
const User = require('../models/User');

// Default shortcuts to use if none exist
const defaultShortcuts = [{ id: 'default', name: '常用藥品', productIds: [] }];

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(config.get('mongoURI'));
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err.message);
    process.exit(1);
  }
};

// Migrate user settings
const migrateUserSettings = async () => {
  try {
    console.log('Starting user settings migration...');
    
    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to process`);
    
    let updatedCount = 0;
    
    // Process each user
    for (const user of users) {
      console.log(`Processing user: ${user.username} (${user._id})`);
      
      // Check if settings exists and is an object
      if (!user.settings || typeof user.settings !== 'object') {
        console.log(`  User has no settings or invalid settings, initializing...`);
        user.settings = {};
        updatedCount++;
      }
      
      // Check if shortcuts exists and is an array
      if (!user.settings.shortcuts || !Array.isArray(user.settings.shortcuts)) {
        console.log(`  User has no shortcuts array, initializing with defaults...`);
        user.settings.shortcuts = defaultShortcuts;
        updatedCount++;
      }
      
      // Save the user if changes were made
      if (updatedCount > 0) {
        await user.save();
        console.log(`  User settings updated successfully`);
      } else {
        console.log(`  No changes needed for this user`);
      }
    }
    
    console.log(`Migration completed. Updated ${updatedCount} users.`);
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    // Disconnect from MongoDB
    mongoose.disconnect();
    console.log('MongoDB Disconnected');
  }
};

// Run the migration
connectDB()
  .then(() => migrateUserSettings())
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });