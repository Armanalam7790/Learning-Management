const AssignmentSubmission = require('../models/AssignmentSubmission');
const Assignment = require('../models/Assignment');
const Enrollment = require('../models/Enrollment');

// Create solution submission (POST /api/v1/assignments/:assignmentId/submit)
const createSubmission = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { submissionFile, submissionText } = req.body;
    const studentId = req.user.userId;
    const userInstituteId = req.user.instituteId;

    // Only students can submit assignments
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students are authorized to submit solutions'
      });
    }

    // 1. Verify Assignment exists and belongs to same institute
    const assignmentObj = await Assignment.findById(assignmentId);
    if (!assignmentObj || assignmentObj.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // 2. Verify Assignment is published
    if (assignmentObj.status !== 'Published') {
      return res.status(400).json({
        success: false,
        message: 'This assignment is not open for submissions'
      });
    }

    // 3. Verify student is actively enrolled in the batch associated with the assignment
    const enrollmentObj = await Enrollment.findOne({
      student: studentId,
      batch: assignmentObj.batch,
      institute: userInstituteId,
      status: 'Active'
    });
    if (!enrollmentObj) {
      return res.status(400).json({
        success: false,
        message: 'You are not actively enrolled in the batch associated with this assignment'
      });
    }

    // 4. Verify student hasn't already submitted
    const existingSubmission = await AssignmentSubmission.findOne({
      student: studentId,
      assignment: assignmentId
    });
    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a solution for this assignment'
      });
    }

    // 5. Check if due date has passed
    const now = new Date();
    let submissionStatus = 'Submitted';
    if (now > new Date(assignmentObj.dueDate)) {
      // business rule: prevent submission after due date
      return res.status(400).json({
        success: false,
        message: 'Due date has passed. Submissions are closed.'
      });
    }

    const newSubmission = await AssignmentSubmission.create({
      assignment: assignmentId,
      student: studentId,
      enrollment: enrollmentObj._id,
      institute: userInstituteId,
      submissionFile,
      submissionText,
      submittedAt: now,
      status: submissionStatus
    });

    return res.status(201).json({
      success: true,
      message: 'Assignment solution submitted successfully',
      data: newSubmission
    });
  } catch (error) {
    next(error);
  }
};

// Get all submissions for an Assignment (GET /api/v1/assignments/:assignmentId/submissions)
const getAssignmentSubmissions = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const userInstituteId = req.user.instituteId;

    const assignmentObj = await Assignment.findById(assignmentId);
    if (!assignmentObj || assignmentObj.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Verify creator or Admin permissions
    if (req.user.role === 'teacher' && assignmentObj.teacher.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view submissions for your own assignments.'
      });
    }

    const submissions = await AssignmentSubmission.find({ assignment: assignmentId })
      .populate('student', 'fullName email')
      .populate('enrollment', 'enrollmentDate')
      .sort({ submittedAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Assignment submissions fetched successfully',
      data: submissions
    });
  } catch (error) {
    next(error);
  }
};

// Get single submission by ID (GET /api/v1/submissions/:id)
const getSingleSubmission = async (req, res, next) => {
  try {
    const submissionId = req.params.id;
    const userInstituteId = req.user.instituteId;
    const userRole = req.user.role;

    const submission = await AssignmentSubmission.findById(submissionId)
      .populate('student', 'fullName email')
      .populate({
        path: 'assignment',
        select: 'title maximumMarks teacher dueDate batch',
        populate: {
          path: 'batch',
          select: 'batchName batchCode course',
          populate: {
            path: 'course',
            select: 'courseName courseCode totalFees'
          }
        }
      });

    if (!submission || submission.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Verify access rights: Admin, Assignment Creator Teacher, or Submitter Student
    if (userRole === 'student' && submission.student._id.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot view other students submissions.'
      });
    }
    if (userRole === 'teacher' && submission.assignment.teacher.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view submissions for your own assignments.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Submission details fetched successfully',
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

// Update submission details (PATCH /api/v1/submissions/:id)
const updateSubmission = async (req, res, next) => {
  try {
    const submissionId = req.params.id;
    const userInstituteId = req.user.instituteId;

    const submission = await AssignmentSubmission.findById(submissionId).populate('assignment');
    if (!submission || submission.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Verify student ownership
    if (req.user.role !== 'student' || submission.student.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the student who submitted can update it'
      });
    }

    // Verify status is not Graded/Reviewed
    if (submission.status === 'Reviewed') {
      return res.status(400).json({
        success: false,
        message: 'Graded submissions cannot be updated'
      });
    }

    // Verify due date has not passed
    const now = new Date();
    if (now > new Date(submission.assignment.dueDate)) {
      return res.status(400).json({
        success: false,
        message: 'Due date has passed. Submissions are closed.'
      });
    }

    const updatedSubmission = await AssignmentSubmission.findByIdAndUpdate(
      submissionId,
      {
        submissionFile: req.body.submissionFile,
        submissionText: req.body.submissionText,
        submittedAt: now
      },
      { new: true, runValidators: true }
    )
    .populate('student', 'fullName email')
    .populate('assignment', 'title maximumMarks dueDate');

    return res.status(200).json({
      success: true,
      message: 'Submission updated successfully',
      data: updatedSubmission
    });
  } catch (error) {
    next(error);
  }
};

// Delete submission (DELETE /api/v1/submissions/:id)
const deleteSubmission = async (req, res, next) => {
  try {
    const submissionId = req.params.id;
    const userInstituteId = req.user.instituteId;

    const submission = await AssignmentSubmission.findById(submissionId).populate('assignment');
    if (!submission || submission.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Verify student ownership
    if (req.user.role !== 'student' || submission.student.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the student who submitted can delete it'
      });
    }

    // Verify status is not Graded/Reviewed
    if (submission.status === 'Reviewed') {
      return res.status(400).json({
        success: false,
        message: 'Graded submissions cannot be deleted'
      });
    }

    // Verify due date has not passed
    const now = new Date();
    if (now > new Date(submission.assignment.dueDate)) {
      return res.status(400).json({
        success: false,
        message: 'Due date has passed. Deletion is closed.'
      });
    }

    await AssignmentSubmission.findByIdAndDelete(submissionId);

    return res.status(200).json({
      success: true,
      message: 'Submission deleted successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

// Review and grade submission (PATCH /api/v1/submissions/:id/grade)
const gradeSubmission = async (req, res, next) => {
  try {
    const submissionId = req.params.id;
    const { marksObtained, feedback } = req.body;
    const userInstituteId = req.user.instituteId;

    // Only Admin and Teacher can grade submissions
    if (req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Students cannot grade submissions.'
      });
    }

    const submission = await AssignmentSubmission.findById(submissionId).populate('assignment');
    if (!submission || submission.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Verify teacher creator or Admin
    if (req.user.role === 'teacher' && submission.assignment.teacher.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the assignment creator or Admin can grade this submission'
      });
    }

    // Validate marks obtained
    if (marksObtained < 0 || marksObtained > submission.assignment.maximumMarks) {
      return res.status(400).json({
        success: false,
        message: `Marks obtained must be between 0 and maximum marks (${submission.assignment.maximumMarks})`
      });
    }

    submission.marksObtained = marksObtained;
    submission.feedback = feedback;
    submission.status = 'Reviewed';
    await submission.save();

    return res.status(200).json({
      success: true,
      message: 'Submission graded successfully',
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSubmission,
  getAssignmentSubmissions,
  getSingleSubmission,
  updateSubmission,
  deleteSubmission,
  gradeSubmission
};
