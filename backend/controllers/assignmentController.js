const Assignment = require('../models/Assignment');
const Batch = require('../models/Batch');
const Enrollment = require('../models/Enrollment');

// Create Assignment
const createAssignment = async (req, res, next) => {
  try {
    const { batch, title, description, instructions, attachment, dueDate, maximumMarks, status } = req.body;
    const userInstituteId = req.user.instituteId;

    // 1. Verify Batch exists, is active, and belongs to user's institute
    const batchObj = await Batch.findById(batch);
    if (!batchObj || !batchObj.isActive || batchObj.institute.toString() !== userInstituteId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid batch or batch does not belong to your institute'
      });
    }

    // 2. If user is teacher, verify they are assigned to this batch
    if (req.user.role === 'teacher' && batchObj.teacher.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only create assignments for your assigned batches'
      });
    }

    const newAssignment = await Assignment.create({
      teacher: batchObj.teacher,
      batch,
      institute: userInstituteId,
      title,
      description,
      instructions,
      attachment,
      dueDate,
      maximumMarks,
      status
    });

    const populatedAssignment = await Assignment.findById(newAssignment._id)
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
      message: 'Assignment created successfully',
      data: populatedAssignment
    });
  } catch (error) {
    next(error);
  }
};

// Get All Assignments (Filtered by role and enrollment)
const getAllAssignments = async (req, res, next) => {
  try {
    const userInstituteId = req.user.instituteId;
    const userRole = req.user.role;
    const query = { institute: userInstituteId };

    if (userRole === 'teacher') {
      // Teachers can only view assignments they authored
      query.teacher = req.user.userId;
    } else if (userRole === 'student') {
      // Students can only view published assignments for batches they are actively enrolled in
      const enrollments = await Enrollment.find({ student: req.user.userId, status: 'Active' });
      const batchIds = enrollments.map(e => e.batch);
      query.batch = { $in: batchIds };
      query.status = 'Published';
    }

    const assignments = await Assignment.find(query)
      .populate('teacher', 'fullName email')
      .populate({
        path: 'batch',
        select: 'batchName batchCode course',
        populate: {
          path: 'course',
          select: 'courseName courseCode totalFees'
        }
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Assignments fetched successfully',
      data: assignments
    });
  } catch (error) {
    next(error);
  }
};

// Get Single Assignment Details
const getSingleAssignment = async (req, res, next) => {
  try {
    const assignmentId = req.params.id;
    const userInstituteId = req.user.instituteId;
    const userRole = req.user.role;

    const assignment = await Assignment.findById(assignmentId)
      .populate('teacher', 'fullName email')
      .populate({
        path: 'batch',
        select: 'batchName batchCode course',
        populate: {
          path: 'course',
          select: 'courseName courseCode totalFees'
        }
      });

    if (!assignment || assignment.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Role-specific access check
    if (userRole === 'teacher' && assignment.teacher._id.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this assignment details'
      });
    } else if (userRole === 'student') {
      // Verify active enrollment
      const enrolled = await Enrollment.findOne({
        student: req.user.userId,
        batch: assignment.batch._id,
        status: 'Active'
      });
      if (!enrolled || assignment.status !== 'Published') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not enrolled in this batch or assignment is not published.'
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Assignment details fetched successfully',
      data: assignment
    });
  } catch (error) {
    next(error);
  }
};

// Update Assignment Details
const updateAssignment = async (req, res, next) => {
  try {
    const assignmentId = req.params.id;
    const userInstituteId = req.user.instituteId;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment || assignment.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Verification check for teacher ownership
    if (req.user.role === 'teacher' && assignment.teacher.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own assignments'
      });
    }

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      assignmentId,
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
      message: 'Assignment updated successfully',
      data: updatedAssignment
    });
  } catch (error) {
    next(error);
  }
};

// Delete Assignment
const deleteAssignment = async (req, res, next) => {
  try {
    const assignmentId = req.params.id;
    const userInstituteId = req.user.instituteId;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment || assignment.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Verification check for teacher ownership
    if (req.user.role === 'teacher' && assignment.teacher.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own assignments'
      });
    }

    await Assignment.findByIdAndDelete(assignmentId);

    return res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAssignment,
  getAllAssignments,
  getSingleAssignment,
  updateAssignment,
  deleteAssignment
};
