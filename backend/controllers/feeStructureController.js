const FeeStructure = require('../models/FeeStructure');
const Batch = require('../models/Batch');
const Course = require('../models/Course');

// Create Fee Structure - Admin Only
const createFeeStructure = async (req, res, next) => {
  try {
    const {
      batch,
      course,
      academicYear,
      feeName,
      tuitionFee,
      admissionFee,
      examFee,
      libraryFee,
      transportFee,
      otherCharges,
      installmentPlan,
      status
    } = req.body;
    const userInstituteId = req.user.instituteId;

    // Verify batch exists and belongs to same institute
    const batchObj = await Batch.findById(batch);
    if (!batchObj || batchObj.institute.toString() !== userInstituteId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid batch or batch does not belong to your institute'
      });
    }

    // Optional Course validation if provided
    if (course) {
      const courseObj = await Course.findById(course);
      if (!courseObj || courseObj.institute.toString() !== userInstituteId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid course or course does not belong to your institute'
        });
      }
    }

    const newFeeStructure = await FeeStructure.create({
      institute: userInstituteId,
      batch,
      course: course || null,
      academicYear,
      feeName,
      tuitionFee,
      admissionFee,
      examFee,
      libraryFee,
      transportFee,
      otherCharges,
      installmentPlan,
      status
    });

    const populatedStructure = await FeeStructure.findById(newFeeStructure._id)
      .populate('batch', 'batchName batchCode course')
      .populate('course', 'courseName courseCode totalFees');

    return res.status(201).json({
      success: true,
      message: 'Fee structure created successfully',
      data: populatedStructure
    });
  } catch (error) {
    next(error);
  }
};

// Get All Fee Structures (Scoped to user's institute)
const getAllFeeStructures = async (req, res, next) => {
  try {
    const userInstituteId = req.user.instituteId;

    const feeStructures = await FeeStructure.find({ institute: userInstituteId })
      .populate('batch', 'batchName batchCode course')
      .populate('course', 'courseName courseCode totalFees')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Fee structures fetched successfully',
      data: feeStructures
    });
  } catch (error) {
    next(error);
  }
};

// Get Single Fee Structure
const getSingleFeeStructure = async (req, res, next) => {
  try {
    const feeStructureId = req.params.id;
    const userInstituteId = req.user.instituteId;

    const feeStructure = await FeeStructure.findById(feeStructureId)
      .populate('batch', 'batchName batchCode course')
      .populate('course', 'courseName courseCode totalFees');

    if (!feeStructure || feeStructure.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Fee structure not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Fee structure details fetched successfully',
      data: feeStructure
    });
  } catch (error) {
    next(error);
  }
};

// Update Fee Structure
const updateFeeStructure = async (req, res, next) => {
  try {
    const feeStructureId = req.params.id;
    const userInstituteId = req.user.instituteId;
    const { course } = req.body;

    const feeStructure = await FeeStructure.findById(feeStructureId);
    if (!feeStructure || feeStructure.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Fee structure not found'
      });
    }

    // Optional Course validation if provided
    if (course) {
      const courseObj = await Course.findById(course);
      if (!courseObj || courseObj.institute.toString() !== userInstituteId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid course or course does not belong to your institute'
        });
      }
    }

    const updatedFeeStructure = await FeeStructure.findByIdAndUpdate(
      feeStructureId,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('batch', 'batchName batchCode course')
      .populate('course', 'courseName courseCode totalFees');

    return res.status(200).json({
      success: true,
      message: 'Fee structure updated successfully',
      data: updatedFeeStructure
    });
  } catch (error) {
    next(error);
  }
};

// Delete Fee Structure
const deleteFeeStructure = async (req, res, next) => {
  try {
    const feeStructureId = req.params.id;
    const userInstituteId = req.user.instituteId;

    const feeStructure = await FeeStructure.findById(feeStructureId);
    if (!feeStructure || feeStructure.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Fee structure not found'
      });
    }

    await FeeStructure.findByIdAndDelete(feeStructureId);

    return res.status(200).json({
      success: true,
      message: 'Fee structure deleted successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFeeStructure,
  getAllFeeStructures,
  getSingleFeeStructure,
  updateFeeStructure,
  deleteFeeStructure
};
