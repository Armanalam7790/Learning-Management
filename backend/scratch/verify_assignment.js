const runTests = async () => {
  const baseAuthUrl = 'http://127.0.0.1:5000/api/v1/auth';
  const baseInstUrl = 'http://127.0.0.1:5000/api/v1/institutes';
  const baseTeacherUrl = 'http://127.0.0.1:5000/api/v1/teachers';
  const baseStudentUrl = 'http://127.0.0.1:5000/api/v1/students';
  const baseBatchUrl = 'http://127.0.0.1:5000/api/v1/batches';
  const baseEnrollmentUrl = 'http://127.0.0.1:5000/api/v1/enrollments';
  const baseAssignmentUrl = 'http://127.0.0.1:5000/api/v1/assignments';
  const baseSubmissionUrl = 'http://127.0.0.1:5000/api/v1/submissions';

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
      instituteName: 'Day 7 Assignment Academy',
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
      batchName: 'Assignment AI Batch',
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

  // 12. Teacher 2 (Lockhart) attempts to create assignment for Snape's batch (Should Fail 403)
  await printRes('12. Lockhart Creating Assignment for Snape Batch (Should Fail 403)', fetch(baseAssignmentUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacher2Token}`
    },
    body: JSON.stringify({
      batch: batchId,
      title: 'Lockharts Defense Assignment',
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      maximumMarks: 50,
      status: 'Published'
    })
  }));

  // 13. Teacher 1 (Snape) creates assignment (Success)
  const assignRes = await printRes('13. Snape Creating Assignment (Success)', fetch(baseAssignmentUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      batch: batchId,
      title: 'Potions Essay',
      description: 'Write a detailed essay on Polyjuice potion recipe.',
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      maximumMarks: 100,
      status: 'Published'
    })
  }));

  const assignmentId = assignRes.data.data._id;

  // 14. Student Submits Solution (Success)
  const submitRes = await printRes('14. Student Submitting Solution', fetch(`${baseAssignmentUrl}/${assignmentId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      submissionText: 'I spent hours working on this recipe, Polyjuice ingredients include fluxweed and knotgrass.',
      submissionFile: 'https://hogwarts.edu/potions/polyjuice.pdf'
    })
  }));

  const submissionId = submitRes.data.data._id;

  // 15. Student attempts to submit again (Should Fail 400 - duplicate)
  await printRes('15. Student Resubmitting (Should Fail 400)', fetch(`${baseAssignmentUrl}/${assignmentId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      submissionText: 'Oops, updated details here'
    })
  }));

  // 16. Teacher 1 (Snape) fetches submissions for the assignment (Success)
  await printRes('16. Snape Get Submissions list', fetch(`${baseAssignmentUrl}/${assignmentId}/submissions`, {
    headers: { 'Authorization': `Bearer ${teacherToken}` }
  }));

  // 17. Student attempts to fetch submissions list (Should Fail 403)
  await printRes('17. Student Get Submissions list (Should Fail 403)', fetch(`${baseAssignmentUrl}/${assignmentId}/submissions`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  }));

  // 18. Teacher 1 (Snape) grades submission exceeding max marks (Should Fail 400)
  await printRes('18. Snape Grading Submission Exceeding Max Marks (Should Fail 400)', fetch(`${baseSubmissionUrl}/${submissionId}/grade`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      marksObtained: 150,
      feedback: 'Outstanding effort!'
    })
  }));

  // 19. Teacher 1 (Snape) grades submission (Success)
  await printRes('19. Snape Grading Submission (Success)', fetch(`${baseSubmissionUrl}/${submissionId}/grade`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      marksObtained: 95,
      feedback: 'Excellent recipe description, Snape approves.'
    })
  }));

  // 20. Student reads their graded submission (Success)
  await printRes('20. Student reading graded submission details', fetch(`${baseSubmissionUrl}/${submissionId}`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  }));
};

runTests();
