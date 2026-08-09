const StudentFee = require('../models/StudentFee');
const FeeStructure = require('../models/FeeStructure');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

// Assign Fee to Student - Admin Only
const createStudentFee = async (req, res, next) => {
  try {
    const { student, feeStructure, discount, scholarship, lateFee } = req.body;
    const userInstituteId = req.user.instituteId;

    // 1. Verify Student exists, is active, has student role, and belongs to same institute
    const studentObj = await User.findById(student);
    if (!studentObj || studentObj.role !== 'student' || !studentObj.isActive || studentObj.institute.toString() !== userInstituteId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student or student does not belong to your institute'
      });
    }

    // 2. Verify FeeStructure exists and belongs to same institute
    const feeStructureObj = await FeeStructure.findById(feeStructure);
    if (!feeStructureObj || feeStructureObj.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Fee structure not found'
      });
    }

    // 3. Verify Student is actively enrolled in the batch of the FeeStructure
    const enrollmentObj = await Enrollment.findOne({
      student,
      batch: feeStructureObj.batch,
      institute: userInstituteId,
      status: 'Active'
    });
    if (!enrollmentObj) {
      return res.status(400).json({
        success: false,
        message: 'Student is not actively enrolled in the batch associated with this fee structure'
      });
    }

    // 4. Prevent duplicate assignments
    const existingFee = await StudentFee.findOne({ student, feeStructure });
    if (existingFee) {
      return res.status(400).json({
        success: false,
        message: 'Fee structure is already assigned to this student'
      });
    }

    const newStudentFee = await StudentFee.create({
      student,
      enrollment: enrollmentObj._id,
      batch: feeStructureObj.batch,
      feeStructure,
      institute: userInstituteId,
      totalFee: feeStructureObj.totalFee, // Copy total fee sum from blueprint
      discount,
      scholarship,
      lateFee
    });

    const populatedNewFee = await StudentFee.findById(newStudentFee._id)
      .populate('student', 'fullName email')
      .populate({
        path: 'batch',
        select: 'batchName batchCode course',
        populate: {
          path: 'course',
          select: 'courseName courseCode totalFees'
        }
      })
      .populate({
        path: 'feeStructure',
        select: 'feeName totalFee installmentPlan course',
        populate: {
          path: 'course',
          select: 'courseName courseCode totalFees'
        }
      });

    return res.status(201).json({
      success: true,
      message: 'Fee structure assigned to student successfully',
      data: populatedNewFee
    });
  } catch (error) {
    next(error);
  }
};

// Get All Student Fees (Scoped by role/enrollment)
const getAllStudentFees = async (req, res, next) => {
  try {
    const userInstituteId = req.user.instituteId;
    const userRole = req.user.role;
    const query = { institute: userInstituteId };

    if (userRole === 'student') {
      // Students can only view their own ledgers
      query.student = req.user.userId;
    }

    const studentFees = await StudentFee.find(query)
      .populate('student', 'fullName email')
      .populate({
        path: 'batch',
        select: 'batchName batchCode course',
        populate: {
          path: 'course',
          select: 'courseName courseCode totalFees'
        }
      })
      .populate({
        path: 'feeStructure',
        select: 'feeName totalFee installmentPlan course',
        populate: {
          path: 'course',
          select: 'courseName courseCode totalFees'
        }
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Student fee ledgers fetched successfully',
      data: studentFees
    });
  } catch (error) {
    next(error);
  }
};

// Get Single Student Fee details
const getSingleStudentFee = async (req, res, next) => {
  try {
    const studentFeeId = req.params.id;
    const userInstituteId = req.user.instituteId;
    const userRole = req.user.role;

    const studentFee = await StudentFee.findById(studentFeeId)
      .populate('student', 'fullName email')
      .populate({
        path: 'batch',
        select: 'batchName batchCode course',
        populate: {
          path: 'course',
          select: 'courseName courseCode totalFees'
        }
      })
      .populate({
        path: 'feeStructure',
        select: 'feeName totalFee installmentPlan course',
        populate: {
          path: 'course',
          select: 'courseName courseCode totalFees'
        }
      });

    if (!studentFee || studentFee.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Student fee ledger not found'
      });
    }

    // Role-specific check
    if (userRole === 'student' && studentFee.student._id.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot view other student fee ledgers.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Student fee ledger details fetched successfully',
      data: studentFee
    });
  } catch (error) {
    next(error);
  }
};

// Update Student Fee details (Discounts, Scholarships, Late Fees) - Admin Only
const updateStudentFee = async (req, res, next) => {
  try {
    const studentFeeId = req.params.id;
    const userInstituteId = req.user.instituteId;

    const studentFee = await StudentFee.findById(studentFeeId);
    if (!studentFee || studentFee.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Student fee ledger not found'
      });
    }

    // Assign only editable fields
    if (req.body.discount !== undefined) studentFee.discount = req.body.discount;
    if (req.body.scholarship !== undefined) studentFee.scholarship = req.body.scholarship;
    if (req.body.lateFee !== undefined) studentFee.lateFee = req.body.lateFee;

    // Save triggers the pre-validate hook which recalculates pendingAmount and status
    const updatedStudentFee = await studentFee.save();

    const populatedFee = await StudentFee.findById(updatedStudentFee._id)
      .populate('student', 'fullName email')
      .populate({
        path: 'batch',
        select: 'batchName batchCode course',
        populate: {
          path: 'course',
          select: 'courseName courseCode totalFees'
        }
      })
      .populate({
        path: 'feeStructure',
        select: 'feeName totalFee installmentPlan course',
        populate: {
          path: 'course',
          select: 'courseName courseCode totalFees'
        }
      });

    return res.status(200).json({
      success: true,
      message: 'Student fee ledger updated successfully',
      data: populatedFee
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStudentFee,
  getAllStudentFees,
  getSingleStudentFee,
  updateStudentFee
};
