const AcademicResult = require('../models/AcademicResult');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Exam = require('../models/Exam');
const ExamResult = require('../models/ExamResult');
const User = require('../models/User');

// Helper: Calculate Letter Grade
const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

// Helper: Calculate and update ranks for all results of an Exam
const updateRanks = async (examId) => {
  const results = await AcademicResult.find({ exam: examId }).sort({ totalMarks: -1 });
  for (let i = 0; i < results.length; i++) {
    results[i].rank = i + 1;
    await results[i].save();
  }
};

// Helper: Compute single student metrics
const computeStudentMetrics = async (studentId, examObj, enrollmentId, instituteId) => {
  const batchId = examObj.batch;

  // 1. Calculate Attendance Percentage
  const totalAttendanceDays = await Attendance.countDocuments({ student: studentId, batch: batchId });
  const presentDays = await Attendance.countDocuments({
    student: studentId,
    batch: batchId,
    status: { $in: ['Present', 'Late'] }
  });
  const attendancePercentage = totalAttendanceDays > 0
    ? parseFloat(((presentDays / totalAttendanceDays) * 100).toFixed(2))
    : 100.0; // Default to 100% if no attendance records yet

  // 2. Calculate Assignment Score
  const assignments = await Assignment.find({ batch: batchId, status: 'Published' });
  const assignmentIds = assignments.map(a => a._id);
  const submissions = await AssignmentSubmission.find({
    student: studentId,
    assignment: { $in: assignmentIds }
  });

  let totalMaxAssignmentMarks = 0;
  let totalObtainedAssignmentMarks = 0;

  assignments.forEach(a => {
    totalMaxAssignmentMarks += a.maximumMarks;
    const sub = submissions.find(s => s.assignment.toString() === a._id.toString());
    if (sub && sub.marksObtained !== null) {
      totalObtainedAssignmentMarks += sub.marksObtained;
    }
  });

  // 3. Calculate Exam Score
  const examResultObj = await ExamResult.findOne({ student: studentId, exam: examObj._id });
  const examScore = examResultObj ? examResultObj.obtainedMarks : 0;

  // Map internal/external scores
  const internalMarks = totalObtainedAssignmentMarks;
  const externalMarks = examScore;
  const totalMarks = internalMarks + externalMarks;
  const maximumMarks = totalMaxAssignmentMarks + examObj.maximumMarks;

  const percentage = maximumMarks > 0
    ? parseFloat(((totalMarks / maximumMarks) * 100).toFixed(2))
    : 0.0;

  const grade = calculateGrade(percentage);

  // Result Status (Pass/Fail)
  const isExamPassed = examScore >= examObj.passingMarks;
  const resultStatus = (isExamPassed && percentage >= 40) ? 'Pass' : 'Fail';

  return {
    assignmentScore: totalObtainedAssignmentMarks,
    examScore,
    attendancePercentage,
    internalMarks,
    externalMarks,
    totalMarks,
    maximumMarks,
    percentage,
    grade,
    resultStatus
  };
};

// Generate Results for all students in a Batch (POST /api/v1/results/generate)
const generateBatchResults = async (req, res, next) => {
  try {
    const { examId } = req.body;
    const userInstituteId = req.user.instituteId;

    const examObj = await Exam.findById(examId);
    if (!examObj || examObj.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Permission Check: Admin or authorized Teacher
    if (req.user.role === 'teacher' && examObj.teacher.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only generate results for exams of batches you instruct'
      });
    }

    // Find all active enrollments for this batch
    const enrollments = await Enrollment.find({
      batch: examObj.batch,
      institute: userInstituteId,
      status: 'Active'
    });

    if (enrollments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active student enrollments found in this batch'
      });
    }

    const generatedResults = [];

    for (const enrollment of enrollments) {
      const studentId = enrollment.student;

      // Skip if result exists and is locked
      const existingResult = await AcademicResult.findOne({ student: studentId, exam: examId });
      if (existingResult && existingResult.isLocked) {
        generatedResults.push(existingResult);
        continue;
      }

      const metrics = await computeStudentMetrics(studentId, examObj, enrollment._id, userInstituteId);

      const resultPayload = {
        student: studentId,
        enrollment: enrollment._id,
        batch: examObj.batch,
        institute: userInstituteId,
        exam: examId,
        ...metrics,
        generatedBy: req.user.userId
      };

      let resultObj;
      if (existingResult) {
        resultObj = await AcademicResult.findByIdAndUpdate(existingResult._id, resultPayload, { new: true });
      } else {
        resultObj = await AcademicResult.create(resultPayload);
      }
      generatedResults.push(resultObj);
    }

    // Recalculate and update ranks
    await updateRanks(examId);

    // Fetch updated list with ranks populated
    const finalResultsList = await AcademicResult.find({ exam: examId })
      .populate('student', 'fullName email')
      .populate({
        path: 'batch',
        select: 'batchName batchCode course',
        populate: {
          path: 'course',
          select: 'courseName courseCode totalFees'
        }
      })
      .populate('exam', 'title subject');

    return res.status(200).json({
      success: true,
      message: 'Batch academic results generated/updated successfully',
      data: finalResultsList
    });
  } catch (error) {
    next(error);
  }
};

// Generate Result for a Single Student (POST /api/v1/results/generate/:studentId)
const generateStudentResult = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { examId } = req.body;
    const userInstituteId = req.user.instituteId;

    const examObj = await Exam.findById(examId);
    if (!examObj || examObj.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Permission Check: Admin or authorized Teacher
    if (req.user.role === 'teacher' && examObj.teacher.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only generate results for exams of batches you instruct'
      });
    }

    // Find active enrollment
    const enrollment = await Enrollment.findOne({
      student: studentId,
      batch: examObj.batch,
      institute: userInstituteId,
      status: 'Active'
    });
    if (!enrollment) {
      return res.status(400).json({
        success: false,
        message: 'Student is not actively enrolled in the batch associated with this exam'
      });
    }

    // Check if locked
    const existingResult = await AcademicResult.findOne({ student: studentId, exam: examId });
    if (existingResult && existingResult.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update/regenerate this result because it is locked by Admin'
      });
    }

    const metrics = await computeStudentMetrics(studentId, examObj, enrollment._id, userInstituteId);

    const resultPayload = {
      student: studentId,
      enrollment: enrollment._id,
      batch: examObj.batch,
      institute: userInstituteId,
      exam: examId,
      ...metrics,
      generatedBy: req.user.userId
    };

    let resultObj;
    if (existingResult) {
      resultObj = await AcademicResult.findByIdAndUpdate(existingResult._id, resultPayload, { new: true });
    } else {
      resultObj = await AcademicResult.create(resultPayload);
    }

    // Recalculate ranks
    await updateRanks(examId);

    const finalResult = await AcademicResult.findById(resultObj._id)
      .populate('student', 'fullName email')
      .populate({
        path: 'batch',
        select: 'batchName batchCode course',
        populate: {
          path: 'course',
          select: 'courseName courseCode totalFees'
        }
      })
      .populate('exam', 'title subject');

    return res.status(200).json({
      success: true,
      message: 'Student academic result generated successfully',
      data: finalResult
    });
  } catch (error) {
    next(error);
  }
};

// Get All Academic Results
const getAllResults = async (req, res, next) => {
  try {
    const userInstituteId = req.user.instituteId;
    const userRole = req.user.role;
    const query = { institute: userInstituteId };

    if (userRole === 'student') {
      // Students can only view their own published results
      query.student = req.user.userId;
      query.isPublished = true;
    }

    const results = await AcademicResult.find(query)
      .populate('student', 'fullName email')
      .populate({
        path: 'batch',
        select: 'batchName batchCode course',
        populate: {
          path: 'course',
          select: 'courseName courseCode totalFees'
        }
      })
      .populate('exam', 'title subject maximumMarks passingMarks')
      .sort({ rank: 1 });

    return res.status(200).json({
      success: true,
      message: 'Academic results fetched successfully',
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// Get Single Result Details
const getSingleResult = async (req, res, next) => {
  try {
    const resultId = req.params.id;
    const userInstituteId = req.user.instituteId;
    const userRole = req.user.role;

    const result = await AcademicResult.findById(resultId)
      .populate('student', 'fullName email')
      .populate({
        path: 'batch',
        select: 'batchName batchCode course',
        populate: {
          path: 'course',
          select: 'courseName courseCode totalFees'
        }
      })
      .populate('exam', 'title subject maximumMarks passingMarks');

    if (!result || result.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Academic result not found'
      });
    }

    // Student access validation
    if (userRole === 'student') {
      if (result.student._id.toString() !== req.user.userId || !result.isPublished) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this academic result details'
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Academic result details fetched successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Get Results by Student (GET /api/v1/results/student/:studentId)
const getResultsByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const userInstituteId = req.user.instituteId;
    const userRole = req.user.role;

    // Student access validation
    if (userRole === 'student' && studentId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own results.'
      });
    }

    const query = { student: studentId, institute: userInstituteId };
    if (userRole === 'student') {
      query.isPublished = true;
    }

    const results = await AcademicResult.find(query)
      .populate({
        path: 'batch',
        select: 'batchName batchCode course',
        populate: {
          path: 'course',
          select: 'courseName courseCode totalFees'
        }
      })
      .populate('exam', 'title subject maximumMarks passingMarks')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Student academic results fetched successfully',
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// Get Results by Batch (GET /api/v1/results/batch/:batchId)
const getResultsByBatch = async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const userInstituteId = req.user.instituteId;
    const userRole = req.user.role;

    const query = { batch: batchId, institute: userInstituteId };
    if (userRole === 'student') {
      query.student = req.user.userId;
      query.isPublished = true;
    }

    const results = await AcademicResult.find(query)
      .populate('student', 'fullName email')
      .populate('exam', 'title subject maximumMarks passingMarks')
      .sort({ rank: 1 });

    return res.status(200).json({
      success: true,
      message: 'Batch academic results fetched successfully',
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// Publish Result (PATCH /api/v1/results/:id/publish) - Admin only
const publishResult = async (req, res, next) => {
  try {
    const resultId = req.params.id;
    const userInstituteId = req.user.instituteId;

    const result = await AcademicResult.findById(resultId);
    if (!result || result.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Academic result not found'
      });
    }

    result.isPublished = true;
    result.publishedAt = new Date();
    await result.save();

    return res.status(200).json({
      success: true,
      message: 'Academic result published successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Lock Result (PATCH /api/v1/results/:id/lock) - Admin only
const lockResult = async (req, res, next) => {
  try {
    const resultId = req.params.id;
    const userInstituteId = req.user.instituteId;

    const result = await AcademicResult.findById(resultId);
    if (!result || result.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Academic result not found'
      });
    }

    result.isLocked = true;
    await result.save();

    return res.status(200).json({
      success: true,
      message: 'Academic result locked successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Unlock Result (PATCH /api/v1/results/:id/unlock) - Admin only
const unlockResult = async (req, res, next) => {
  try {
    const resultId = req.params.id;
    const userInstituteId = req.user.instituteId;

    const result = await AcademicResult.findById(resultId);
    if (!result || result.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Academic result not found'
      });
    }

    result.isLocked = false;
    await result.save();

    return res.status(200).json({
      success: true,
      message: 'Academic result unlocked successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Delete Result - Admin/Teacher creator
const deleteResult = async (req, res, next) => {
  try {
    const resultId = req.params.id;
    const userInstituteId = req.user.instituteId;

    const result = await AcademicResult.findById(resultId).populate('exam');
    if (!result || result.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Academic result not found'
      });
    }

    // Prevent deletion of locked results
    if (result.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete result because it is locked by Admin'
      });
    }

    // Permission Check: Admin or creator Teacher
    if (req.user.role === 'teacher' && result.exam.teacher.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the exam creator or Admin can delete results'
      });
    }

    const examId = result.exam._id;
    await AcademicResult.findByIdAndDelete(resultId);

    // Recalculate ranks for remaining results
    await updateRanks(examId);

    return res.status(200).json({
      success: true,
      message: 'Academic result deleted successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateBatchResults,
  generateStudentResult,
  getAllResults,
  getSingleResult,
  getResultsByStudent,
  getResultsByBatch,
  publishResult,
  lockResult,
  unlockResult,
  deleteResult
};
