const ExamResult = require('../models/ExamResult');
const Exam = require('../models/Exam');
const Enrollment = require('../models/Enrollment');

// Evaluate Student / Submit Result (POST /api/v1/exams/:examId/results)
const createExamResult = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { student, obtainedMarks, grade, remarks } = req.body;
    const userInstituteId = req.user.instituteId;

    // 1. Verify Exam exists and matches institute boundaries
    const examObj = await Exam.findById(examId);
    if (!examObj || examObj.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // 2. Verify creator or Admin permissions
    if (req.user.role === 'teacher' && examObj.teacher.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the exam creator or Admin can submit evaluations'
      });
    }

    // 3. Verify student is actively enrolled in the batch associated with the exam
    const enrollmentObj = await Enrollment.findOne({
      student,
      batch: examObj.batch,
      institute: userInstituteId,
      status: 'Active'
    });
    if (!enrollmentObj) {
      return res.status(400).json({
        success: false,
        message: 'Student is not actively enrolled in the batch associated with this exam'
      });
    }

    // 4. Validate obtained marks <= maximum marks
    if (obtainedMarks < 0 || obtainedMarks > examObj.maximumMarks) {
      return res.status(400).json({
        success: false,
        message: `Obtained marks must be between 0 and maximum marks (${examObj.maximumMarks})`
      });
    }

    // 5. Prevent duplicate result entries
    const existingResult = await ExamResult.findOne({ student, exam: examId });
    if (existingResult) {
      return res.status(400).json({
        success: false,
        message: 'Result already exists for this student in this exam'
      });
    }

    const newResult = await ExamResult.create({
      exam: examId,
      student,
      enrollment: enrollmentObj._id,
      institute: userInstituteId,
      obtainedMarks,
      grade,
      remarks,
      evaluatedBy: req.user.userId,
      evaluatedAt: new Date(),
      status: 'Evaluated'
    });

    return res.status(201).json({
      success: true,
      message: 'Exam result submitted successfully',
      data: newResult
    });
  } catch (error) {
    next(error);
  }
};

// Get all results for an Exam (GET /api/v1/exams/:examId/results)
const getExamResults = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const userInstituteId = req.user.instituteId;
    const userRole = req.user.role;

    const examObj = await Exam.findById(examId);
    if (!examObj || examObj.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    const query = { exam: examId, institute: userInstituteId };

    if (userRole === 'student') {
      // Students can only view their own published results
      query.student = req.user.userId;
      query.status = 'Published';
    } else if (userRole === 'teacher' && examObj.teacher.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view results for your own exams.'
      });
    }

    const results = await ExamResult.find(query)
      .populate('student', 'fullName email')
      .populate('enrollment', 'enrollmentDate')
      .populate('evaluatedBy', 'fullName role')
      .sort({ obtainedMarks: -1 });

    return res.status(200).json({
      success: true,
      message: 'Exam results fetched successfully',
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// Get single result by ID (GET /api/v1/results/:id)
const getSingleResult = async (req, res, next) => {
  try {
    const resultId = req.params.id;
    const userInstituteId = req.user.instituteId;
    const userRole = req.user.role;

    const result = await ExamResult.findById(resultId)
      .populate('student', 'fullName email')
      .populate('evaluatedBy', 'fullName role')
      .populate({
        path: 'exam',
        select: 'title subject maximumMarks passingMarks teacher',
        populate: { path: 'batch', select: 'batchName batchCode' }
      });

    if (!result || result.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Result record not found'
      });
    }

    // Role visibility boundaries
    if (userRole === 'student') {
      if (result.student._id.toString() !== req.user.userId || result.status !== 'Published') {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this result details'
        });
      }
    } else if (userRole === 'teacher' && result.exam.teacher.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view results for your own exams.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Result details fetched successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Update result (PATCH /api/v1/results/:id)
const updateExamResult = async (req, res, next) => {
  try {
    const resultId = req.params.id;
    const { obtainedMarks, grade, remarks, status } = req.body;
    const userInstituteId = req.user.instituteId;

    const result = await ExamResult.findById(resultId).populate('exam');
    if (!result || result.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Result record not found'
      });
    }

    // Verify creator or Admin permissions
    if (req.user.role === 'teacher' && result.exam.teacher.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update results for your own exams'
      });
    }

    // Validate obtained marks
    if (obtainedMarks !== undefined) {
      if (obtainedMarks < 0 || obtainedMarks > result.exam.maximumMarks) {
        return res.status(400).json({
          success: false,
          message: `Obtained marks must be between 0 and maximum marks (${result.exam.maximumMarks})`
        });
      }
    }

    const updatedResult = await ExamResult.findByIdAndUpdate(
      resultId,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('student', 'fullName email')
    .populate('evaluatedBy', 'fullName role')
    .populate({
      path: 'exam',
      select: 'title subject maximumMarks passingMarks'
    });

    return res.status(200).json({
      success: true,
      message: 'Result updated successfully',
      data: updatedResult
    });
  } catch (error) {
    next(error);
  }
};

// Delete result (DELETE /api/v1/results/:id)
const deleteExamResult = async (req, res, next) => {
  try {
    const resultId = req.params.id;
    const userInstituteId = req.user.instituteId;

    const result = await ExamResult.findById(resultId).populate('exam');
    if (!result || result.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Result record not found'
      });
    }

    // Verify creator or Admin permissions
    if (req.user.role === 'teacher' && result.exam.teacher.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete results for your own exams'
      });
    }

    await ExamResult.findByIdAndDelete(resultId);

    return res.status(200).json({
      success: true,
      message: 'Result deleted successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

// Publish exam result (PATCH /api/v1/results/:id/publish)
const publishExamResult = async (req, res, next) => {
  try {
    const resultId = req.params.id;
    const userInstituteId = req.user.instituteId;

    const result = await ExamResult.findById(resultId).populate('exam');
    if (!result || result.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Result record not found'
      });
    }

    // Verify creator or Admin permissions
    if (req.user.role === 'teacher' && result.exam.teacher.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the exam creator or Admin can publish results'
      });
    }

    result.status = 'Published';
    await result.save();

    return res.status(200).json({
      success: true,
      message: 'Exam result published successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExamResult,
  getExamResults,
  getSingleResult,
  updateExamResult,
  deleteExamResult,
  publishExamResult
};
