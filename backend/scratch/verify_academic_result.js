const runTests = async () => {
  const baseAuthUrl = 'http://127.0.0.1:5000/api/v1/auth';
  const baseInstUrl = 'http://127.0.0.1:5000/api/v1/institutes';
  const baseTeacherUrl = 'http://127.0.0.1:5000/api/v1/teachers';
  const baseStudentUrl = 'http://127.0.0.1:5000/api/v1/students';
  const baseBatchUrl = 'http://127.0.0.1:5000/api/v1/batches';
  const baseEnrollmentUrl = 'http://127.0.0.1:5000/api/v1/enrollments';
  const baseAttendanceUrl = 'http://127.0.0.1:5000/api/v1/attendance';
  const baseAssignmentUrl = 'http://127.0.0.1:5000/api/v1/assignments';
  const baseSubmissionUrl = 'http://127.0.0.1:5000/api/v1/submissions';
  const baseExamUrl = 'http://127.0.0.1:5000/api/v1/exams';
  const baseResultUrl = 'http://127.0.0.1:5000/api/v1/results';

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
      instituteName: 'Day 9 Academic Performance Academy',
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

  // 4. Create Teacher (Snape)
  const teacherEmail = `teacher@${instCode.toLowerCase()}.edu`;
  const teacherRes = await printRes('4. Creating Teacher (Snape)', fetch(baseTeacherUrl, {
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

  // 5. Login as Teacher
  const tLoginRes = await printRes('5. Logging in as Teacher', fetch(`${baseAuthUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: teacherEmail,
      password: 'potionspassword'
    })
  }));

  const teacherToken = tLoginRes.data.data.token;

  // 6. Create Batch (assigned to Teacher 1 / Snape)
  const batchCode = `BATCH-${Date.now()}`;
  const batchRes = await printRes('6. Creating Batch', fetch(baseBatchUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      batchName: 'Performance AI Batch',
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

  // 7. Create Student (Harry)
  const studentEmail = `student@${instCode.toLowerCase()}.edu`;
  const studentRes = await printRes('7. Creating Student', fetch(baseStudentUrl, {
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

  // 8. Enroll Student in Batch
  await printRes('8. Enrolling Student', fetch(baseEnrollmentUrl, {
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

  // 9. Login as Student
  const studentLoginRes = await printRes('9. Logging in as Student', fetch(`${baseAuthUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: studentEmail,
      password: 'quidditchpassword'
    })
  }));

  const studentToken = studentLoginRes.data.data.token;

  // 10. Mark Attendance Present
  await printRes('10. Marking Attendance Present', fetch(baseAttendanceUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      student: studentId,
      batch: batchId,
      attendanceDate: '2026-07-17',
      status: 'Present',
      remarks: 'Present on time'
    })
  }));

  // 11. Create Assignment
  const assignRes = await printRes('11. Snape Creating Assignment', fetch(baseAssignmentUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      batch: batchId,
      title: 'Potions Essay',
      description: 'Polyjuice recipes description',
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      maximumMarks: 100,
      status: 'Published'
    })
  }));

  const assignmentId = assignRes.data.data._id;

  // 12. Student Submits Solution
  const submitRes = await printRes('12. Student Submitting Solution', fetch(`${baseAssignmentUrl}/${assignmentId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      submissionText: 'Potions solution detailed text...',
      submissionFile: 'https://hogwarts.edu/potions/polyjuice.pdf'
    })
  }));

  const submissionId = submitRes.data.data._id;

  // 13. Teacher Grades Solution (marksObtained = 80)
  await printRes('13. Snape Grading Solution', fetch(`${baseSubmissionUrl}/${submissionId}/grade`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      marksObtained: 80,
      feedback: 'Good work'
    })
  }));

  // 14. Create Exam (max = 100, passing = 40)
  const examRes = await printRes('14. Snape Creating Exam', fetch(baseExamUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      batch: batchId,
      title: 'Potions Midterm',
      subject: 'Potions Theory',
      examType: 'Midterm',
      examDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      startTime: '10:00 AM',
      endTime: '12:00 PM',
      duration: 120,
      maximumMarks: 100,
      passingMarks: 40,
      status: 'Scheduled'
    })
  }));

  const examId = examRes.data.data._id;

  // 15. Submit Exam Result (obtainedMarks = 90)
  await printRes('15. Snape Grading Exam Performance', fetch(`${baseExamUrl}/${examId}/results`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      student: studentId,
      obtainedMarks: 90,
      grade: 'A',
      remarks: 'Outstanding'
    })
  }));

  // 16. Teacher generates academic result for Batch (Success)
  const genRes = await printRes('16. Snape Generating Batch Results', fetch(`${baseResultUrl}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`
    },
    body: JSON.stringify({ examId })
  }));

  const academicResultId = genRes.data.data[0]._id;

  // 17. Student checks results list (Should return empty because isPublished = false)
  await printRes('17. Student checking results list before publication', fetch(baseResultUrl, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  }));

  // 18. Teacher attempts to publish result (Should Fail 403 - Admin only)
  await printRes('18. Teacher publishing result details (Should Fail 403)', fetch(`${baseResultUrl}/${academicResultId}/publish`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${teacherToken}` }
  }));

  // 19. Admin publishes result (Success)
  await printRes('19. Admin publishing result details', fetch(`${baseResultUrl}/${academicResultId}/publish`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }));

  // 20. Student checks results list again (Should see A grade, 85%, Pass)
  await printRes('20. Student checking results list after publication', fetch(baseResultUrl, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  }));

  // 21. Admin locks result (Success)
  await printRes('21. Admin locking result details', fetch(`${baseResultUrl}/${academicResultId}/lock`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }));

  // 22. Teacher attempts to delete locked result (Should Fail 400)
  await printRes('22. Teacher deleting locked result (Should Fail 400)', fetch(`${baseResultUrl}/${academicResultId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${teacherToken}` }
  }));

  // 23. Admin unlocks result (Success)
  await printRes('23. Admin unlocking result details', fetch(`${baseResultUrl}/${academicResultId}/unlock`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }));

  // 24. Teacher deletes unlocked result (Success)
  await printRes('24. Teacher deleting result', fetch(`${baseResultUrl}/${academicResultId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${teacherToken}` }
  }));
};

runTests();
