const runTests = async () => {
  const baseAuthUrl = 'http://127.0.0.1:5000/api/v1/auth';
  const baseInstUrl = 'http://127.0.0.1:5000/api/v1/institutes';
  const baseTeacherUrl = 'http://127.0.0.1:5000/api/v1/teachers';
  const baseBatchUrl = 'http://127.0.0.1:5000/api/v1/batches';

  // Helper to print responses
  const printRes = async (label, promise) => {
    try {
      const res = await promise;
      const data = await res.json();
      console.log(`\n--- ${label} ---`);
      console.log('Status:', res.status);
      console.log('Body:', JSON.stringify(data, null, 2));
      return { status: res.status, data };
    } catch (err) {
      console.error(`\n--- ${label} FAILED ---`, err.message);
      return { status: 500, err };
    }
  };

  // Setup helper for creating Course (simulating Course creation via Mongoose directly since routes aren't requested)
  // But wait! Since Course routes do not exist, we can create a temporary course directly in the database.
  // Wait! To keep the test fully HTTP-based, let's create a quick course setup endpoint, or simply run it in the script by requiring Course model.
  // Running Mongoose code in this script is perfect since we run the script locally while the database is connected!
  // Wait, let's connect Mongoose inside this verify script to create a Course and a Teacher, or we can use the endpoints.
  // For Teacher, we can use POST /api/v1/teachers (admin-only).
  // For Course, we can insert it directly into MongoDB since there is no Course routes!
  // Let's connect mongoose in the script first to create the course.
  
  const mongoose = require('mongoose');
  require('dotenv').config();
  
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lms-saas');
  console.log('Test script connected to MongoDB successfully.');

  const Course = require('../models/Course');
  require('../models/Institute');
  require('../models/User');

  // 1. Create a unique Institute
  const instCode = `INST${Date.now()}`;
  const instRes = await printRes('1. Creating Institute', fetch(baseInstUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instituteName: 'Day 5 Testing Academy',
      instituteCode: instCode,
      email: `contact@${instCode.toLowerCase()}.edu`,
      phone: '1234567890',
      ownerName: 'Owner Name',
      address: {
        country: 'India',
        state: 'Delhi',
        city: 'New Delhi',
        pincode: '110001',
        fullAddress: '123 Testing Lane'
      }
    })
  }));

  const instituteId = instRes.data.data._id;

  // 2. Setup Admin
  const adminEmail = `admin@${instCode.toLowerCase()}.edu`;
  await printRes('2. Setting up Admin', fetch(`${baseAuthUrl}/setup-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Academy Admin',
      email: adminEmail,
      password: 'password123',
      phone: '9876543210',
      institute: instituteId
    })
  }));

  // 3. Login as Admin
  const loginRes = await printRes('3. Logging in as Admin', fetch(`${baseAuthUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: adminEmail,
      password: 'password123'
    })
  }));

  const adminToken = loginRes.data.data.token;

  // 4. Create Course directly using Mongoose model
  const courseDoc = await Course.create({
    courseName: 'Full Stack AI Development',
    courseCode: `CS-${Date.now()}`,
    institute: instituteId,
    isActive: true
  });
  console.log('\n--- 4. Course Created in DB ---');
  console.log('Course ID:', courseDoc._id);
  console.log('Course Name:', courseDoc.courseName);

  // 5. Create Teacher using API
  const teacherEmail = `teacher@${instCode.toLowerCase()}.edu`;
  const teacherRes = await printRes('5. Creating Teacher', fetch(baseTeacherUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      fullName: 'Professor Snape',
      email: teacherEmail,
      password: 'potionspassword',
      phone: '5551234567'
    })
  }));

  const teacherId = teacherRes.data.data.id;

  // 6. Create Batch
  const batchCode = `BATCH-${Date.now()}`;
  const createBatchRes = await printRes('6. Creating Batch', fetch(baseBatchUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      batchName: 'Morning AI Batch',
      batchCode,
      course: courseDoc._id,
      teacher: teacherId,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
      timing: {
        startTime: '09:00 AM',
        endTime: '11:00 AM'
      },
      maximumStudents: 25,
      mode: 'offline',
      status: 'upcoming',
      description: 'Morning lectures on Full Stack AI'
    })
  }));

  const batchId = createBatchRes.data.data._id;

  // 7. Try creating duplicate batch code (Should fail 400)
  await printRes('7. Creating Duplicate Batch Code (Should Fail 400)', fetch(baseBatchUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      batchName: 'Evening AI Batch',
      batchCode,
      course: courseDoc._id,
      teacher: teacherId,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      timing: {
        startTime: '06:00 PM',
        endTime: '08:00 PM'
      },
      maximumStudents: 25
    })
  }));

  // 8. Try creating batch with teacher from other institute (Should fail 400)
  // Let's create a teacher under another institute
  const otherInstCode = `OTHER${Date.now()}`;
  const otherInstDoc = await mongoose.model('Institute').create({
    instituteName: 'Other Academy',
    instituteCode: otherInstCode,
    email: `contact@${otherInstCode.toLowerCase()}.edu`,
    phone: '0000000000',
    ownerName: 'Other Owner',
    address: { country: 'India', state: 'Delhi', city: 'Delhi', pincode: '110001', fullAddress: 'Addr' }
  });
  const otherTeacherDoc = await mongoose.model('User').create({
    fullName: 'Other Teacher',
    email: `other_teacher@${otherInstCode.toLowerCase()}.edu`,
    password: 'password',
    phone: '1111111111',
    role: 'teacher',
    institute: otherInstDoc._id,
    isActive: true
  });

  await printRes('8. Creating Batch with Teacher from other Institute (Should Fail 400)', fetch(baseBatchUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      batchName: 'Invalid Teacher Batch',
      batchCode: `FAIL-T-${Date.now()}`,
      course: courseDoc._id,
      teacher: otherTeacherDoc._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      timing: { startTime: '09:00 AM', endTime: '11:00 AM' },
      maximumStudents: 25
    })
  }));

  // 9. Try creating batch with course from other institute (Should fail 400)
  const otherCourseDoc = await Course.create({
    courseName: 'Other Course',
    courseCode: `OC-${Date.now()}`,
    institute: otherInstDoc._id,
    isActive: true
  });

  await printRes('9. Creating Batch with Course from other Institute (Should Fail 400)', fetch(baseBatchUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      batchName: 'Invalid Course Batch',
      batchCode: `FAIL-C-${Date.now()}`,
      course: otherCourseDoc._id,
      teacher: teacherId,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      timing: { startTime: '09:00 AM', endTime: '11:00 AM' },
      maximumStudents: 25
    })
  }));

  // 10. Get All Batches
  await printRes('10. Get All Batches', fetch(baseBatchUrl, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }));

  // 11. Get Single Batch
  await printRes('11. Get Single Batch', fetch(`${baseBatchUrl}/${batchId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }));

  // 12. Update Batch
  await printRes('12. Update Batch (Capacity & Name)', fetch(`${baseBatchUrl}/${batchId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      batchName: 'Morning AI Batch (Updated)',
      maximumStudents: 30
    })
  }));

  // 13. Soft Delete Batch
  await printRes('13. Soft Deleting Batch', fetch(`${baseBatchUrl}/${batchId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }));

  // 14. Get All Batches again (Should be empty)
  await printRes('14. Get All Batches after deletion (Should be empty)', fetch(baseBatchUrl, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }));

  await mongoose.disconnect();
  console.log('\nAll tests executed successfully.');
};

runTests();
