const express = require('express');
const cors = require('cors');
const instituteRoutes = require('./routes/instituteRoutes');
const authRoutes = require('./routes/authRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');
const batchRoutes = require('./routes/batchRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const assignmentSubmissionRoutes = require('./routes/assignmentSubmissionRoutes');
const examRoutes = require('./routes/examRoutes');
const examResultRoutes = require('./routes/examResultRoutes');
const academicResultRoutes = require('./routes/academicResultRoutes');
const feeStructureRoutes = require('./routes/feeStructureRoutes');
const studentFeeRoutes = require('./routes/studentFeeRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const courseRoutes = require('./routes/courseRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Welcome route
app.get('/', (req, res) => {
  res.json({ message: 'Learning Management System API - Day 10 (Fee Management Module)' });
});

// Register routes
app.use('/api/v1/institutes', instituteRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/teachers', teacherRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/batches', batchRoutes);
app.use('/api/v1/enrollments', enrollmentRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/submissions', assignmentSubmissionRoutes);
app.use('/api/v1/exams', examRoutes);
app.use('/api/v1/exam-results', examResultRoutes);
app.use('/api/v1/results', academicResultRoutes);
app.use('/api/v1/fee-structures', feeStructureRoutes);
app.use('/api/v1/student-fees', studentFeeRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// Central error handling middleware
app.use(errorHandler);

module.exports = app;
