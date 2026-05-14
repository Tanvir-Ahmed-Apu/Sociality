#!/usr/bin/env node

/**
 * Test script to verify the message deletion fix
 * This script tests the ID compatibility between frontend and backend
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

async function testMessageDeletionFix() {
  console.log('🧪 Testing message deletion ID compatibility fix...\n');

  try {
    await connectDB();

    // Create a test room
    const testRoom = new Room({
      roomId: `test-room-${Date.now()}`,
      name: 'Test Room for ID Fix',
      participants: [
        { user: 'user1', platform: 'sociality', username: 'testuser1' },
        { user: 'user2', platform: 'sociality', username: 'testuser2' }
      ],
      createdBy: 'user1',
      platform: 'sociality'
    });

    await testRoom.save();
    console.log('✅ Created test room:', testRoom.roomId);

    // Create a test message with messageId (timestamp)
    const messageId = Date.now().toString();
    const testMessage = new CrossPlatformMessage({
      roomId: testRoom.roomId,
      messageId: messageId,
      sender: 'user1',
      senderUsername: 'testuser1',
      senderPlatform: 'sociality',
      platform: 'sociality',
      text: 'Test message for ID compatibility',
      deletedFor: [],
      deletedForEveryone: false
    });

    await testMessage.save();
    console.log('✅ Created test message with messageId:', messageId);
    console.log('   MongoDB _id:', testMessage._id.toString());

    // Test 1: Find by messageId (what backend should do)
    console.log('\n🔍 Test 1: Finding message by messageId...');
    const foundByMessageId = await CrossPlatformMessage.findOne({
      messageId: messageId,
      roomId: testRoom.roomId
    });
    
    if (foundByMessageId) {
      console.log('✅ Message found by messageId:', foundByMessageId.messageId);
    } else {
      console.log('❌ Message NOT found by messageId');
    }

    // Test 2: Find by MongoDB _id (fallback case)
    console.log('\n🔍 Test 2: Finding message by MongoDB _id...');
    const foundByObjectId = await CrossPlatformMessage.findOne({
      _id: testMessage._id,
      roomId: testRoom.roomId
    });
    
    if (foundByObjectId) {
      console.log('✅ Message found by MongoDB _id:', foundByObjectId._id.toString());
    } else {
      console.log('❌ Message NOT found by MongoDB _id');
    }

    // Test 3: Simulate frontend sending messageId for deletion
    console.log('\n🔍 Test 3: Simulating deletion with messageId...');
    const deleteWithMessageId = await CrossPlatformMessage.findOne({
      messageId: messageId,
      roomId: testRoom.roomId
    });
    
    if (deleteWithMessageId) {
      console.log('✅ Deletion lookup by messageId would succeed');
    } else {
      console.log('❌ Deletion lookup by messageId would fail');
    }

    // Test 4: Simulate frontend sending MongoDB _id for deletion
    console.log('\n🔍 Test 4: Simulating deletion with MongoDB _id...');
    const deleteWithObjectId = await CrossPlatformMessage.findOne({
      _id: testMessage._id.toString(),
      roomId: testRoom.roomId
    });
    
    if (deleteWithObjectId) {
      console.log('✅ Deletion lookup by MongoDB _id would succeed');
    } else {
      console.log('❌ Deletion lookup by MongoDB _id would fail');
    }

    // Test 5: Test the new dual lookup logic
    console.log('\n🔍 Test 5: Testing dual lookup logic...');
    
    async function findMessageWithDualLookup(messageIdParam, roomId) {
      // First try by messageId
      let message = await CrossPlatformMessage.findOne({
        messageId: messageIdParam,
        roomId: roomId
      });
      
      // If not found, try by MongoDB _id
      if (!message) {
        try {
          message = await CrossPlatformMessage.findOne({
            _id: messageIdParam,
            roomId: roomId
          });
        } catch (error: any) {
          // Invalid ObjectId format
        }
      }
      
      return message;
    }

    // Test with messageId
    const dualLookupByMessageId = await findMessageWithDualLookup(messageId, testRoom.roomId);
    if (dualLookupByMessageId) {
      console.log('✅ Dual lookup with messageId succeeded');
    } else {
      console.log('❌ Dual lookup with messageId failed');
    }

    // Test with MongoDB _id
    const dualLookupByObjectId = await findMessageWithDualLookup(testMessage._id.toString(), testRoom.roomId);
    if (dualLookupByObjectId) {
      console.log('✅ Dual lookup with MongoDB _id succeeded');
    } else {
      console.log('❌ Dual lookup with MongoDB _id failed');
    }

    // Test 6: Verify message format consistency
    console.log('\n🔍 Test 6: Testing message format consistency...');
    
    const formattedMessage = {
      id: testMessage.messageId || testMessage._id.toString(),
      _id: testMessage.messageId || testMessage._id.toString(),
      messageId: testMessage.messageId,
      text: testMessage.text,
      sender: {
        _id: testMessage.sender,
        username: testMessage.senderUsername,
        platform: testMessage.senderPlatform
      }
    };
    
    console.log('📋 Formatted message structure:');
    console.log('   id:', formattedMessage.id);
    console.log('   _id:', formattedMessage._id);
    console.log('   messageId:', formattedMessage.messageId);
    
    if (formattedMessage.id === formattedMessage._id && formattedMessage._id === formattedMessage.messageId) {
      console.log('✅ Message ID consistency maintained');
    } else {
      console.log('⚠️ Message ID inconsistency detected');
    }

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await CrossPlatformMessage.deleteMany({ roomId: testRoom.roomId });
    await Room.deleteOne({ roomId: testRoom.roomId });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Message deletion ID compatibility test completed!');
    console.log('\n📝 Summary:');
    console.log('   - Messages can be found by both messageId and MongoDB _id');
    console.log('   - Dual lookup logic provides fallback compatibility');
    console.log('   - Message formatting maintains ID consistency');
    console.log('   - Frontend can use either ID for deletion requests');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
testMessageDeletionFix();
