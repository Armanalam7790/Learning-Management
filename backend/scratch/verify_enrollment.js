const runTests = async () => {
  const baseAuthUrl = 'http://127.0.0.1:5000/api/v1/auth';
  const baseInstUrl = 'http://127.0.0.1:5000/api/v1/institutes';
  const baseTeacherUrl = 'http://127.0.0.1:5000/api/v1/teachers';
  const baseStudentUrl = 'http://127.0.0.1:5000/api/v1/students';
  const baseBatchUrl = 'http://127.0.0.1:5000/api/v1/batches';
  const baseEnrollmentUrl = 'http://127.0.0.1:5000/api/v1/enrollments';

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

  // 1. Create a unique Institute
  const instCode = `INST${Date.now()}`;
  const instRes = await printRes('1. Creating Institute', fetch(baseInstUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instituteName: 'Day 5 Enrollment Academy',
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

  // 4. Create Teacher
  const teacherEmail = `teacher@${instCode.toLowerCase()}.edu`;
  const teacherRes = await printRes('4. Creating Teacher', fetch(baseTeacherUrl, {
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

  // 5. Create Batch with maximumStudents = 1 (to test capacity checks)
  const batchCode = `BATCH-${Date.now()}`;
  const batchRes = await printRes('5. Creating Batch (Capacity = 1)', fetch(baseBatchUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      batchName: 'Enrollment AI Batch',
      batchCode,
      teacher: teacherId,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      timing: {
        startTime: '09:00 AM',
        endTime: '11:00 AM'
      },
      schedule: {
        days: ['Monday', 'Wednesday'],
        startTime: '09:00 AM',
        endTime: '11:00 AM'
      },
      maximumStudents: 1
    })
  }));

  const batchId = batchRes.data.data._id;

  // 6. Create Student 1
  const student1Email = `student1@${instCode.toLowerCase()}.edu`;
  const student1Res = await printRes('6. Creating Student 1', fetch(baseStudentUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      fullName: 'Harry Potter',
      email: student1Email,
      password: 'quidditchpassword',
      phone: '5557778888'
    })
  }));

  const student1Id = student1Res.data.data.id;

  // 7. Create Student 2
  const student2Email = `student2@${instCode.toLowerCase()}.edu`;
  const student2Res = await printRes('7. Creating Student 2', fetch(baseStudentUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      fullName: 'Hermione Granger',
      email: student2Email,
      password: 'librarypassword',
      phone: '5559990000'
    })
  }));

  const student2Id = student2Res.data.data.id;

  // 8. Enroll Student 1
  const enroll1Res = await printRes('8. Enrolling Student 1', fetch(baseEnrollmentUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      student: student1Id,
      batch: batchId,
      status: 'Active',
      remarks: 'Top student candidate'
    })
  }));

  const enrollmentId = enroll1Res.data.data._id;

  // 9. Get Batch Details (Verify currentStudents count is 1)
  await printRes('9. Verifying Batch currentStudents is 1', fetch(`${baseBatchUrl}/${batchId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }));

  // 10. Enroll Student 1 again (Should fail 400 - duplicate check)
  await printRes('10. Re-enrolling Student 1 (Should Fail 400)', fetch(baseEnrollmentUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      student: student1Id,
      batch: batchId
    })
  }));

  // 11. Enroll Student 2 (Should fail 400 - capacity limit)
  await printRes('11. Enrolling Student 2 (Should Fail 400 - Batch is Full)', fetch(baseEnrollmentUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      student: student2Id,
      batch: batchId
    })
  }));

  // 12. Get All Enrollments
  await printRes('12. Get All Enrollments', fetch(baseEnrollmentUrl, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }));

  // 13. Get Single Enrollment
  await printRes('13. Get Single Enrollment', fetch(`${baseEnrollmentUrl}/${enrollmentId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }));

  // 14. Get Students by Batch (Bonus API)
  await printRes('14. Get Students of Batch (Bonus API)', fetch(`${baseEnrollmentUrl}/batch/${batchId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }));

  // 15. Get Batches of Student (Bonus API)
  await printRes('15. Get Batches of Student (Bonus API)', fetch(`${baseEnrollmentUrl}/student/${student1Id}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }));

  // 16. Update Enrollment
  await printRes('16. Update Enrollment', fetch(`${baseEnrollmentUrl}/${enrollmentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      status: 'Active',
      remarks: 'Excelling in all classes'
    })
  }));

  // 17. Remove Enrollment
  await printRes('17. Removing Enrollment', fetch(`${baseEnrollmentUrl}/${enrollmentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }));

  // 18. Get Batch Details (Verify currentStudents count is 0)
  await printRes('18. Verifying Batch currentStudents decremented to 0', fetch(`${baseBatchUrl}/${batchId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }));
};

runTests();
