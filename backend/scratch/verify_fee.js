const runTests = async () => {
  const baseAuthUrl = 'http://127.0.0.1:5000/api/v1/auth';
  const baseInstUrl = 'http://127.0.0.1:5000/api/v1/institutes';
  const baseTeacherUrl = 'http://127.0.0.1:5000/api/v1/teachers';
  const baseStudentUrl = 'http://127.0.0.1:5000/api/v1/students';
  const baseBatchUrl = 'http://127.0.0.1:5000/api/v1/batches';
  const baseEnrollmentUrl = 'http://127.0.0.1:5000/api/v1/enrollments';
  const baseFeeStructureUrl = 'http://127.0.0.1:5000/api/v1/fee-structures';
  const baseStudentFeeUrl = 'http://127.0.0.1:5000/api/v1/student-fees';
  const basePaymentUrl = 'http://127.0.0.1:5000/api/v1/payments';

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
      instituteName: 'Day 10 Financial Academy',
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
      fullName: 'Financial Admin',
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
      batchName: 'Finance AI Batch',
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

  // 8. Admin creates a FeeStructure (Verify totalFee auto-calculates to 1550)
  const structureRes = await printRes('8. Creating FeeStructure', fetch(baseFeeStructureUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      batch: batchId,
      academicYear: '2026-2027',
      feeName: 'Standard Annual Fee',
      tuitionFee: 1000,
      admissionFee: 200,
      examFee: 100,
      libraryFee: 50,
      transportFee: 150,
      otherCharges: 50,
      installmentPlan: 'One-time'
    })
  }));

  const feeStructureId = structureRes.data.data._id;

  // 9. Admin assigns FeeStructure to student (Verify pendingAmount calculations)
  const ledgerRes = await printRes('9. Assigning Fee to Student Ledger', fetch(baseStudentFeeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      student: studentId,
      feeStructure: feeStructureId,
      discount: 150,
      scholarship: 200,
      lateFee: 50
    })
  }));

  const studentFeeId = ledgerRes.data.data._id;

  // 10. Student logins & attempts to assign fee to themselves (Should fail 403)
  const studentLoginRes = await printRes('10. Logging in as Student', fetch(`${baseAuthUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: studentEmail,
      password: 'quidditchpassword'
    })
  }));

  const studentToken = studentLoginRes.data.data.token;

  await printRes('10b. Student attempting to assign fee (Should Fail 403)', fetch(baseStudentFeeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      student: studentId,
      feeStructure: feeStructureId
    })
  }));

  // 11. Admin collects a Payment (amount = 500)
  await printRes('11. Admin collects payment of 500 (Status should become Partially Paid)', fetch(basePaymentUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      studentFee: studentFeeId,
      amount: 500,
      paymentMode: 'Cash',
      transactionId: 'TXN-99901'
    })
  }));

  // 12. Admin attempts to collect Payment exceeding pending amount (Should Fail 400)
  await printRes('12. Admin collecting payment exceeding pending amount (Should Fail 400)', fetch(basePaymentUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      studentFee: studentFeeId,
      amount: 1000,
      paymentMode: 'Cash'
    })
  }));

  // 13. Admin collects final payment (amount = 750)
  const finalPayRes = await printRes('13. Admin collects final payment of 750 (Status should become Paid)', fetch(basePaymentUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      studentFee: studentFeeId,
      amount: 750,
      paymentMode: 'Bank Transfer',
      transactionId: 'TXN-99902'
    })
  }));

  const finalPaymentId = finalPayRes.data.data._id;

  // 13b. Check student fee details after full payment
  await printRes('13b. Check Student Ledger state after full payment', fetch(`${baseStudentFeeUrl}/${studentFeeId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }));

  // 14. Student checks their payments list
  await printRes('14. Student checking payment logs list', fetch(basePaymentUrl, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  }));

  // 15. Admin deletes the 750 payment (Ledger paidAmount reverts to 500, pendingAmount to 750, status to Partially Paid)
  await printRes('15. Admin deleting payment of 750', fetch(`${basePaymentUrl}/${finalPaymentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }));

  // 15b. Check student fee details after payment deletion
  await printRes('15b. Check Student Ledger state after payment deletion', fetch(`${baseStudentFeeUrl}/${studentFeeId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }));
};

runTests();
