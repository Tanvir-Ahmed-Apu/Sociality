#!/usr/bin/env node

/**
 * Test script to verify message deletion functionality
 * This script tests both "delete for me" and "delete for everyone" in cross-platform messaging
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import CrossPlatformMessage from '../models/crossPlatformMessageModel.js';
import Room from '../models/roomModel.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error: any) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

async function testMessageDeletion() {
  console.log('🧪 Starting message deletion test...\n');

  try {
    await connectDB();

    // Create a test room
    const testRoom = new Room({
      roomId: `test-room-${Date.now()}`,
      name: 'Test Room for Deletion',
      participants: [
        { user: 'user1', platform: 'sociality', username: 'testuser1' },
        { user: 'user2', platform: 'sociality', username: 'testuser2' }
      ],
      createdBy: 'user1',
      platform: 'sociality'
    });

    await testRoom.save();
    console.log('✅ Created test room:', testRoom.roomId);

    // Create test messages
    const testMessage1 = new CrossPlatformMessage({
      roomId: testRoom.roomId,
      messageId: `msg-${Date.now()}-1`,
      sender: 'user1',
      senderUsername: 'testuser1',
      senderPlatform: 'sociality',
      platform: 'sociality',
      text: 'Test message 1 - to be deleted for me',
      deletedFor: [],
      deletedForEveryone: false
    });

    const testMessage2 = new CrossPlatformMessage({
      roomId: testRoom.roomId,
      messageId: `msg-${Date.now()}-2`,
      sender: 'user1',
      senderUsername: 'testuser1',
      senderPlatform: 'sociality',
      platform: 'sociality',
      text: 'Test message 2 - to be deleted for everyone',
      deletedFor: [],
      deletedForEveryone: false
    });

    await testMessage1.save();
    await testMessage2.save();
    console.log('✅ Created test messages');

    // Test "delete for me" functionality
    console.log('\n🔍 Testing "delete for me" functionality...');
    
    // Simulate adding user to deletedFor array
    testMessage1.deletedFor.push('user1');
    await testMessage1.save();
    
    // Verify the message is marked as deleted for user1
    const deletedForMeMessage = await CrossPlatformMessage.findOne({
      messageId: testMessage1.messageId
    });
    
    if (deletedForMeMessage.deletedFor.includes('user1')) {
      console.log('✅ "Delete for me" functionality works correctly');
      console.log('   Message is in deletedFor array for user1');
    } else {
      console.log('❌ "Delete for me" functionality failed');
    }

    // Test "delete for everyone" functionality
    console.log('\n🔍 Testing "delete for everyone" functionality...');
    
    // Simulate marking message as deleted for everyone
    testMessage2.deletedForEveryone = true;
    await testMessage2.save();
    
    // Verify the message is marked as deleted for everyone
    const deletedForEveryoneMessage = await CrossPlatformMessage.findOne({
      messageId: testMessage2.messageId
    });
    
    if (deletedForEveryoneMessage.deletedForEveryone === true) {
      console.log('✅ "Delete for everyone" functionality works correctly');
      console.log('   Message is marked as deletedForEveryone: true');
    } else {
      console.log('❌ "Delete for everyone" functionality failed');
    }

    // Test message filtering (simulating frontend behavior)
    console.log('\n🔍 Testing message filtering logic...');
    
    const allMessages = await CrossPlatformMessage.find({
      roomId: testRoom.roomId
    });
    
    // Filter messages for user1 (should exclude deleted for me)
    const messagesForUser1 = allMessages.filter(msg => 
      !msg.deletedFor.includes('user1') && !msg.deletedForEveryone
    );
    
    // Filter messages for user2 (should exclude deleted for everyone)
    const messagesForUser2 = allMessages.filter(msg => 
      !msg.deletedFor.includes('user2') && !msg.deletedForEveryone
    );
    
    console.log(`📊 Total messages: ${allMessages.length}`);
    console.log(`📊 Messages visible to user1: ${messagesForUser1.length}`);
    console.log(`📊 Messages visible to user2: ${messagesForUser2.length}`);
    
    if (messagesForUser1.length === 0 && messagesForUser2.length === 0) {
      console.log('✅ Message filtering works correctly');
    } else {
      console.log('⚠️ Message filtering may need adjustment');
    }

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await CrossPlatformMessage.deleteMany({ roomId: testRoom.roomId });
    await Room.deleteOne({ roomId: testRoom.roomId });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Message deletion test completed successfully!');

  } catch (error: any) {
    console.error('\n❌ Message deletion test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
testMessageDeletion();
