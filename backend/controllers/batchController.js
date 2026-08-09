const Batch = require('../models/Batch');
const User = require('../models/User');
const Course = require('../models/Course');

// Create a new Batch
const createBatch = async (req, res, next) => {
  try {
    const {
      batchName,
      batchCode,
      teacher,
      course,
      schedule,
      maximumStudents,
      description,
      status,
      startDate,
      endDate
    } = req.body;
    const adminInstituteId = req.user.instituteId;

    // Check unique batchCode
    const existingBatch = await Batch.findOne({ batchCode: batchCode.toUpperCase() });
    if (existingBatch) {
      return res.status(400).json({
        success: false,
        message: 'Batch code must be unique'
      });
    }

    // Validate that startDate is before endDate
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    // Validate Teacher exists, role is "teacher", is active, and belongs to the admin's institute
    const teacherObj = await User.findById(teacher);
    if (!teacherObj || teacherObj.role !== 'teacher' || !teacherObj.isActive || teacherObj.institute.toString() !== adminInstituteId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid teacher or teacher does not belong to your institute'
      });
    }

    // Validate Course exists, is active, and belongs to the admin's institute
    const courseObj = await Course.findById(course);
    if (!courseObj || courseObj.institute.toString() !== adminInstituteId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course or course does not belong to your institute'
      });
    }

    const newBatch = await Batch.create({
      batchName,
      batchCode,
      teacher,
      course,
      institute: adminInstituteId,
      schedule,
      maximumStudents,
      description,
      status,
      startDate,
      endDate
    });

    const populatedBatch = await Batch.findById(newBatch._id)
      .populate('teacher', 'fullName email')
      .populate('course', 'courseName courseCode totalFees')
      .populate('institute', 'instituteName');

    return res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      data: populatedBatch
    });
  } catch (error) {
    next(error);
  }
};

// Get all active Batches belonging to logged-in admin's institute
const getAllBatches = async (req, res, next) => {
  try {
    const adminInstituteId = req.user.instituteId;

    const batches = await Batch.find({
      institute: adminInstituteId,
      isActive: true
    })
      .populate('teacher', 'fullName email')
      .populate('course', 'courseName courseCode totalFees')
      .populate('institute', 'instituteName');

    return res.status(200).json({
      success: true,
      message: 'Batches fetched successfully',
      data: batches
    });
  } catch (error) {
    next(error);
  }
};

// Get a single Batch details
const getSingleBatch = async (req, res, next) => {
  try {
    const batchId = req.params.id;
    const adminInstituteId = req.user.instituteId;

    const batch = await Batch.findById(batchId)
      .populate('teacher', 'fullName email')
      .populate('course', 'courseName courseCode totalFees')
      .populate('institute', 'instituteName');

    if (!batch || batch.institute.toString() !== adminInstituteId || !batch.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Batch details fetched successfully',
      data: batch
    });

  } catch (error) {
    next(error);
  }
};

// Update Batch details
const updateBatch = async (req, res, next) => {
  try {
    const batchId = req.params.id;
    const adminInstituteId = req.user.instituteId;
    const { batchCode, teacher, course, startDate, endDate } = req.body;

    const batch = await Batch.findById(batchId);
    if (!batch || batch.institute.toString() !== adminInstituteId || !batch.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Check unique batchCode if updating
    if (batchCode) {
      const existingBatch = await Batch.findOne({ batchCode: batchCode.toUpperCase()});
      if (existingBatch && existingBatch._id.toString() !== batchId) {
        return res.status(400).json({
          success: false,
          message: 'Batch code must be unique'
        });
      }
    }

    // Validate dates if updated
    if (startDate && endDate) {
      if (new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({
          success: false,
          message: 'Start date must be before end date'
        });
      }
    } else if (startDate) {
      if (new Date(startDate) >= new Date(batch.endDate)) {
        return res.status(400).json({
          success: false,
          message: 'Start date must be before end date'
        });
      }
    } else if (endDate) {
      if (new Date(batch.startDate) >= new Date(endDate)) {
        return res.status(400).json({
          success: false,
          message: 'Start date must be before end date'
        });
      }
    }

    // Validate new Teacher if changing
    if (teacher) {
      const teacherObj = await User.findById(teacher);
      if (!teacherObj || teacherObj.role !== 'teacher' || !teacherObj.isActive || teacherObj.institute.toString() !== adminInstituteId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid teacher or teacher does not belong to your institute'
        });
      }
    }

    // Validate new Course if changing
    if (course) {
      const courseObj = await Course.findById(course);
      if (!courseObj || courseObj.institute.toString() !== adminInstituteId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid course or course does not belong to your institute'
        });
      }
    }

    const updatedBatch = await Batch.findByIdAndUpdate(
      batchId,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('teacher', 'fullName email')
      .populate('course', 'courseName courseCode totalFees')
      .populate('institute', 'instituteName');

    return res.status(200).json({
      success: true,
      message: 'Batch updated successfully',
      data: updatedBatch
    });
  } catch (error) {
    next(error);
  }
};

// Soft Delete (Deactivate) a Batch
const deleteBatch = async (req, res, next) => {
  try {
    const batchId = req.params.id;
    const adminInstituteId = req.user.instituteId;

    const batch = await Batch.findById(batchId);
    if (!batch || batch.institute.toString() !== adminInstituteId || !batch.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    await Batch.findByIdAndUpdate(
      batchId,
      { isActive: false },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Batch deactivated successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBatch,
  getAllBatches,
  getSingleBatch,
  updateBatch,
  deleteBatch
};
