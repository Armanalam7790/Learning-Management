const Exam = require('../models/Exam');
const Batch = require('../models/Batch');
const Enrollment = require('../models/Enrollment');

// Create Exam
const createExam = async (req, res, next) => {
  try {
    const {
      batch,
      title,
      description,
      subject,
      examType,
      examDate,
      startTime,
      endTime,
      duration,
      maximumMarks,
      passingMarks,
      instructions,
      status
    } = req.body;
    const userInstituteId = req.user.instituteId;

    // 1. Verify Batch exists, is active, and matches user's institute
    const batchObj = await Batch.findById(batch);
    if (!batchObj || !batchObj.isActive || batchObj.institute.toString() !== userInstituteId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid batch or batch does not belong to your institute'
      });
    }

    // 2. If teacher, verify they instruct this batch
    if (req.user.role === 'teacher' && batchObj.teacher.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only create exams for your assigned batches'
      });
    }

    // 3. Validate passing marks <= maximum marks
    if (passingMarks > maximumMarks) {
      return res.status(400).json({
        success: false,
        message: 'Passing marks cannot exceed maximum marks'
      });
    }

    const newExam = await Exam.create({
      teacher: batchObj.teacher,
      batch,
      institute: userInstituteId,
      title,
      description,
      subject,
      examType,
      examDate,
      startTime,
      endTime,
      duration,
      maximumMarks,
      passingMarks,
      instructions,
      status
    });

    const populatedExam = await Exam.findById(newExam._id)
      .populate('teacher', 'fullName email')
      .populate({
        path: 'batch',
        select: 'batchName batchCode course',
        populate: {
          path: 'course',
          select: 'courseName courseCode totalFees'
        }
      });

    return res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: populatedExam
    });
  } catch (error) {
    next(error);
  }
};

// Get All Exams
const getAllExams = async (req, res, next) => {
  try {
    const userInstituteId = req.user.instituteId;
    const userRole = req.user.role;
    const query = { institute: userInstituteId };

    if (userRole === 'teacher') {
      // Teachers view exams they author
      query.teacher = req.user.userId;
    } else if (userRole === 'student') {
      // Students view non-draft/cancelled exams for batches they are actively enrolled in
      const enrollments = await Enrollment.find({ student: req.user.userId, status: 'Active' });
      const batchIds = enrollments.map(e => e.batch);
      query.batch = { $in: batchIds };
      query.status = { $in: ['Scheduled', 'Completed', 'Published'] };
    }

    const exams = await Exam.find(query)
      .populate('teacher', 'fullName email')
      .populate({
        path: 'batch',
        select: 'batchName batchCode course',
        populate: {
          path: 'course',
          select: 'courseName courseCode totalFees'
        }
      })
      .sort({ examDate: 1 });

    return res.status(200).json({
      success: true,
      message: 'Exams fetched successfully',
      data: exams
    });
  } catch (error) {
    next(error);
  }
};

// Get Single Exam Details
const getSingleExam = async (req, res, next) => {
  try {
    const examId = req.params.id;
    const userInstituteId = req.user.instituteId;
    const userRole = req.user.role;

    const exam = await Exam.findById(examId)
      .populate('teacher', 'fullName email')
      .populate({
        path: 'batch',
        select: 'batchName batchCode course',
        populate: {
          path: 'course',
          select: 'courseName courseCode totalFees'
        }
      });

    if (!exam || exam.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Role boundary checks
    if (userRole === 'teacher' && exam.teacher._id.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view details for your own exams.'
      });
    } else if (userRole === 'student') {
      const enrolled = await Enrollment.findOne({
        student: req.user.userId,
        batch: exam.batch._id,
        status: 'Active'
      });
      if (!enrolled || ['Draft', 'Cancelled'].includes(exam.status)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not enrolled or the exam is unavailable.'
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Exam details fetched successfully',
      data: exam
    });
  } catch (error) {
    next(error);
  }
};

// Update Exam Details
const updateExam = async (req, res, next) => {
  try {
    const examId = req.params.id;
    const userInstituteId = req.user.instituteId;
    const { passingMarks, maximumMarks } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam || exam.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Verify teacher author ownership
    if (req.user.role === 'teacher' && exam.teacher.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own exams'
      });
    }

    // Validate marks relations if either is changing
    const finalMax = maximumMarks !== undefined ? maximumMarks : exam.maximumMarks;
    const finalPassing = passingMarks !== undefined ? passingMarks : exam.passingMarks;
    if (finalPassing > finalMax) {
      return res.status(400).json({
        success: false,
        message: 'Passing marks cannot exceed maximum marks'
      });
    }

    const updatedExam = await Exam.findByIdAndUpdate(
      examId,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('teacher', 'fullName email')
    .populate({
      path: 'batch',
      select: 'batchName batchCode course',
      populate: {
        path: 'course',
        select: 'courseName courseCode totalFees'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Exam updated successfully',
      data: updatedExam
    });
  } catch (error) {
    next(error);
  }
};

// Delete Exam
const deleteExam = async (req, res, next) => {
  try {
    const examId = req.params.id;
    const userInstituteId = req.user.instituteId;

    const exam = await Exam.findById(examId);
    if (!exam || exam.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Verify teacher author ownership
    if (req.user.role === 'teacher' && exam.teacher.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own exams'
      });
    }

    await Exam.findByIdAndDelete(examId);

    return res.status(200).json({
      success: true,
      message: 'Exam deleted successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExam,
  getAllExams,
  getSingleExam,
  updateExam,
  deleteExam
};
