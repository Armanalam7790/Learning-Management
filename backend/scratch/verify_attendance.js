const runTests = async () => {
  const baseAuthUrl = 'http://127.0.0.1:5000/api/v1/auth';
  const baseInstUrl = 'http://127.0.0.1:5000/api/v1/institutes';
  const baseTeacherUrl = 'http://127.0.0.1:5000/api/v1/teachers';
  const baseStudentUrl = 'http://127.0.0.1:5000/api/v1/students';
  const baseBatchUrl = 'http://127.0.0.1:5000/api/v1/batches';
  const baseEnrollmentUrl = 'http://127.0.0.1:5000/api/v1/enrollments';
  const baseAttendanceUrl = 'http://127.0.0.1:5000/api/v1/attendance';

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
      instituteName: 'Day 6 Attendance Academy',
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

  // 5. Create Batch
  const batchCode = `BATCH-${Date.now()}`;
  const batchRes = await printRes('5. Creating Batch', fetch(baseBatchUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      batchName: 'Attendance AI Batch',
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
      maximumStudents: 25
    })
  }));

  const batchId = batchRes.data.data._id;

  // 6. Create Student
  const studentEmail = `student@${instCode.toLowerCase()}.edu`;
  const studentRes = await printRes('6. Creating Student', fetch(baseStudentUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      fullName: 'Harry Potter',
      email: studentEmail,
      password: 'quidditchpassword',
      phone: '5557778888'
    })
  }));

  const studentId = studentRes.data.data.id;

  // 7. Enroll Student in Batch
  await printRes('7. Enrolling Student', fetch(baseEnrollmentUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      student: studentId,
      batch: batchId,
      status: 'Active'
    })
  }));

  const testDate = '2026-07-17';

  // 8. Mark Attendance
  const markRes = await printRes('8. Marking Attendance', fetch(baseAttendanceUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      student: studentId,
      batch: batchId,
      attendanceDate: testDate,
      status: 'Present',
      remarks: 'Present on time'
    })
  }));

  const attendanceId = markRes.data.data._id;

  // 9. Mark Attendance for same date (Should fail 400)
  await printRes('9. Marking Duplicate Attendance (Should Fail 400)', fetch(baseAttendanceUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      student: studentId,
      batch: batchId,
      attendanceDate: testDate,
      status: 'Present'
    })
  }));

  // 10. Get All Attendance records
  await printRes('10. Get All Attendance', fetch(baseAttendanceUrl, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }));

  // 11. Get Single Attendance details
  await printRes('11. Get Single Attendance details', fetch(`${baseAttendanceUrl}/${attendanceId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }));

  // 12. Get Attendance by Student (Bonus API)
  await printRes('12. Get Attendance by Student (Bonus API)', fetch(`${baseAttendanceUrl}/student/${studentId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }));

  // 13. Get Attendance by Batch (Bonus API)
  await printRes('13. Get Attendance by Batch (Bonus API)', fetch(`${baseAttendanceUrl}/batch/${batchId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }));

  // 14. Get Attendance by Date (Bonus API)
  await printRes('14. Get Attendance by Date (Bonus API)', fetch(`${baseAttendanceUrl}/date/${testDate}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }));

  // 15. Update Attendance status
  await printRes('15. Updating Attendance Status', fetch(`${baseAttendanceUrl}/${attendanceId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      status: 'Late',
      remarks: 'Arrived 15 minutes late'
    })
  }));

  // 16. Delete Attendance record
  await printRes('16. Deleting Attendance Record', fetch(`${baseAttendanceUrl}/${attendanceId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }));

  // 17. Get Deleted Attendance record (Should fail 404)
  await printRes('17. Getting Deleted Attendance (Should Fail 404)', fetch(`${baseAttendanceUrl}/${attendanceId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }));
};

runTests();
