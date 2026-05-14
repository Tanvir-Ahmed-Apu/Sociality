#!/usr/bin/env node

/**
 * Test script to verify file sharing functionality
 * This script tests file upload and accessibility verification
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { uploadFile, verifyFileAccessibility } from '../utils/cloudinary.js';
import fs from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testFileSharing() {
  console.log('🧪 Starting file sharing test...\n');

  try {
    // Create a test file
    const testFilePath = path.join(__dirname, 'test-file.txt');
    const testContent = `Test file created at ${new Date().toISOString()}\nThis file is used to test cross-platform file sharing.`;
    
    fs.writeFileSync(testFilePath, testContent);
    console.log('✅ Created test file:', testFilePath);

    // Test file upload
    console.log('\n📤 Testing file upload...');
    const uploadResult = await uploadFile(testFilePath, {
      folder: 'test_files',
      resource_type: 'auto'
    });

    console.log('✅ File uploaded successfully:');
    console.log('   URL:', uploadResult.secure_url);
    console.log('   Public ID:', uploadResult.public_id);
    console.log('   Format:', uploadResult.format);

    // Test file accessibility
    console.log('\n🔍 Testing file accessibility...');
    const verification = await verifyFileAccessibility(uploadResult.secure_url);
    
    if (verification.accessible) {
      console.log('✅ File is accessible:');
      console.log('   Status:', verification.status);
      console.log('   Content-Type:', verification.contentType);
      console.log('   Content-Length:', verification.contentLength);
    } else {
      console.log('❌ File is not accessible:');
      console.log('   Error:', verification.error);
    }

    // Clean up test file
    fs.unlinkSync(testFilePath);
    console.log('\n🧹 Cleaned up test file');

    // Clean up uploaded file
    try {
      await cloudinary.uploader.destroy(uploadResult.public_id, {
        resource_type: uploadResult.resource_type || 'auto'
      });
      console.log('🧹 Cleaned up uploaded file from Cloudinary');
    } catch (cleanupError: any) {
      console.warn('⚠️ Failed to clean up uploaded file:', cleanupError.message);
    }

    console.log('\n🎉 File sharing test completed successfully!');

  } catch (error: any) {
    console.error('\n❌ File sharing test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testFileSharing();
