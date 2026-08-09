const runTests = async () => {
  const baseAuthUrl = 'http://127.0.0.1:5000/api/v1/auth';
  const baseInstUrl = 'http://127.0.0.1:5000/api/v1/institutes';
  const baseTeacherUrl = 'http://127.0.0.1:5000/api/v1/teachers';
  const baseStudentUrl = 'http://127.0.0.1:5000/api/v1/students';
  const baseBatchUrl = 'http://127.0.0.1:5000/api/v1/batches';
  const baseEnrollmentUrl = 'http://127.0.0.1:5000/api/v1/enrollments';
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
      instituteName: 'Day 8 Examination Academy',
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

  // 4. Create Teacher 1 (Snape - assigned to Snape's batch)
  const teacherEmail = `teacher1@${instCode.toLowerCase()}.edu`;
  const teacherRes = await printRes('4. Creating Teacher 1 (Snape)', fetch(baseTeacherUrl, {
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

  // 5. Create Teacher 2 (Lockhart - not assigned to the batch)
  const teacher2Email = `teacher2@${instCode.toLowerCase()}.edu`;
  const teacher2Res = await printRes('5. Creating Teacher 2 (Lockhart)', fetch(baseTeacherUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      fullName: 'Gilderoy Lockhart',
      email: teacher2Email,
      password: 'defensepassword',
      phone: '5551239999'
    })
  }));

  const teacher2Id = teacher2Res.data.data.id;

  // 6. Login as Teacher 1 (Snape)
  const t1LoginRes = await printRes('6. Logging in as Teacher 1 (Snape)', fetch(`${baseAuthUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: teacherEmail,
      password: 'potionspassword'
    })
  }));

  const teacherToken = t1LoginRes.data.data.token;

  // 7. Login as Teacher 2 (Lockhart)
  const t2LoginRes = await printRes('7. Logging in as Teacher 2 (Lockhart)', fetch(`${baseAuthUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: teacher2Email,
      password: 'defensepassword'
    })
  }));

  const teacher2Token = t2LoginRes.data.data.token;

  // 8. Create Batch (assigned to Teacher 1 / Snape)
  const batchCode = `BATCH-${Date.now()}`;
  const batchRes = await printRes('8. Creating Batch', fetch(baseBatchUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      batchName: 'Examination AI Batch',
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

  // 9. Create Student
  const studentEmail = `student@${instCode.toLowerCase()}.edu`;
  const studentRes = await printRes('9. Creating Student', fetch(baseStudentUrl, {
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

  // 10. Enroll Student in Batch
  await printRes('10. Enrolling Student', fetch(baseEnrollmentUrl, {
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

  // 11. Login as Student
  const studentLoginRes = await printRes('11. Logging in as Student', fetch(`${baseAuthUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: studentEmail,
      password: 'quidditchpassword'
    })
  }));

  const studentToken = studentLoginRes.data.data.token;

  // 12. Teacher 2 (Lockhart) attempts to create exam for Snape's batch (Should Fail 403)
  await printRes('12. Lockhart Creating Exam for Snape Batch (Should Fail 403)', fetch(baseExamUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacher2Token}`
    },
    body: JSON.stringify({
      batch: batchId,
      title: 'Defense Examination',
      subject: 'Defense Against the Dark Arts',
      examType: 'Midterm',
      examDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      startTime: '10:00 AM',
      endTime: '12:00 PM',
      duration: 120,
      maximumMarks: 100,
      passingMarks: 50,
      status: 'Scheduled'
    })
  }));

  // 13. Teacher 1 (Snape) creates exam with passingMarks > maximumMarks (Should Fail 400)
  await printRes('13. Snape Creating Exam with passingMarks > maximumMarks (Should Fail 400)', fetch(baseExamUrl, {
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
      passingMarks: 150,
      status: 'Scheduled'
    })
  }));

  // 14. Teacher 1 (Snape) creates exam (Success)
  const examRes = await printRes('14. Snape Creating Exam (Success)', fetch(baseExamUrl, {
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

  // 15. Snape submits ExamResult / evaluates student with obtainedMarks > maxMarks (Should Fail 400)
  await printRes('15. Snape Grading Student Exceeding Max Marks (Should Fail 400)', fetch(`${baseExamUrl}/${examId}/results`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      student: studentId,
      obtainedMarks: 120,
      grade: 'O',
      remarks: 'Outstanding'
    })
  }));

  // 16. Snape submits ExamResult / evaluates student (Success)
  const evalRes = await printRes('16. Snape Grading Student (Success)', fetch(`${baseExamUrl}/${examId}/results`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      student: studentId,
      obtainedMarks: 85,
      grade: 'E',
      remarks: 'Exceeds Expectations'
    })
  }));

  const resultId = evalRes.data.data._id;

  // 17. Snape submits duplicate ExamResult for same student (Should Fail 400)
  await printRes('17. Snape Re-grading Student (Should Fail 400)', fetch(`${baseExamUrl}/${examId}/results`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      student: studentId,
      obtainedMarks: 90,
      grade: 'O'
    })
  }));

  // 18. Student checks their results list -> verify list is empty because status is 'Evaluated' (Success)
  await printRes('18. Student checking results list before publication', fetch(`${baseExamUrl}/${examId}/results`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  }));

  // 19. Snape publishes result (Success)
  await printRes('19. Snape Publishing Result details', fetch(`${baseResultUrl}/${resultId}/publish`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${teacherToken}` }
  }));

  // 20. Student checks results list again -> verify they can see published result (Success)
  await printRes('20. Student checking results list after publication', fetch(`${baseExamUrl}/${examId}/results`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  }));
};

runTests();
