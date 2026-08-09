const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const Batch = require('../models/Batch');

// Enroll a Student
const createEnrollment = async (req, res, next) => {
  try {
    const { student, batch, enrollmentDate, status, remarks } = req.body;
    const adminInstituteId = req.user.instituteId;

    // 1. Validate Student exists, role is student, active, and belongs to admin's institute
    const studentObj = await User.findById(student);
    if (!studentObj || studentObj.role !== 'student' || !studentObj.isActive || studentObj.institute.toString() !== adminInstituteId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student or student does not belong to your institute'
      });
    }

    // 2. Validate Batch exists, is active, and belongs to admin's institute
    const batchObj = await Batch.findById(batch);
    if (!batchObj || !batchObj.isActive || batchObj.institute.toString() !== adminInstituteId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid batch or batch does not belong to your institute'
      });
    }

    // 3. Validate student is not already enrolled in this batch
    const existingEnrollment = await Enrollment.findOne({ student, batch });
    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in this batch'
      });
    }

    // 4. Validate Batch capacity
    if (batchObj.currentStudents >= batchObj.maximumStudents) {
      return res.status(400).json({
        success: false,
        message: 'Batch is full. Cannot enroll more students.'
      });
    }

    // 5. Create the enrollment
    const newEnrollment = await Enrollment.create({
      student,
      batch,
      institute: adminInstituteId,
      enrollmentDate,
      status,
      remarks,
      createdBy: req.user.userId
    });

    // 6. Automatically increase currentStudents in the Batch
    batchObj.currentStudents += 1;
    await batchObj.save();

    return res.status(201).json({
      success: true,
      message: 'Student enrolled successfully',
      data: newEnrollment
    });
  } catch (error) {
    next(error);
  }
};

// Get all Enrollments (Scoped to admin's institute)
const getAllEnrollments = async (req, res, next) => {
  try {
    const adminInstituteId = req.user.instituteId;

    const enrollments = await Enrollment.find({ institute: adminInstituteId })
      .populate('student', 'fullName email phone')
      .populate('batch', 'batchName batchCode timing');

    return res.status(200).json({
      success: true,
      message: 'Enrollments fetched successfully',
      data: enrollments
    });
  } catch (error) {
    next(error);
  }
};

// Get single Enrollment by ID
const getSingleEnrollment = async (req, res, next) => {
  try {
    const enrollmentId = req.params.id;
    const adminInstituteId = req.user.instituteId;

    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('student', 'fullName email phone')
      .populate('batch', 'batchName batchCode timing');

    if (!enrollment || enrollment.institute.toString() !== adminInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment record not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Enrollment details fetched successfully',
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
};

// Update Enrollment details
const updateEnrollment = async (req, res, next) => {
  try {
    const enrollmentId = req.params.id;
    const adminInstituteId = req.user.instituteId;

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment || enrollment.institute.toString() !== adminInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment record not found'
      });
    }

    const updatedEnrollment = await Enrollment.findByIdAndUpdate(
      enrollmentId,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('student', 'fullName email phone')
    .populate('batch', 'batchName batchCode timing');

    return res.status(200).json({
      success: true,
      message: 'Enrollment updated successfully',
      data: updatedEnrollment
    });
  } catch (error) {
    next(error);
  }
};

// Remove (Delete) Enrollment
const deleteEnrollment = async (req, res, next) => {
  try {
    const enrollmentId = req.params.id;
    const adminInstituteId = req.user.instituteId;

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment || enrollment.institute.toString() !== adminInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment record not found'
      });
    }

    const batchObj = await Batch.findById(enrollment.batch);

    // Remove the enrollment document
    await Enrollment.findByIdAndDelete(enrollmentId);

    // Automatically decrease currentStudents in the Batch and prevent it from becoming negative
    if (batchObj) {
      if (batchObj.currentStudents > 0) {
        batchObj.currentStudents -= 1;
        await batchObj.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Enrollment removed successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

// Get all students of a Batch (Bonus API)
const getStudentsByBatch = async (req, res, next) => {
  try {
    const batchId = req.params.batchId;
    const adminInstituteId = req.user.instituteId;

    // Check if batch belongs to admin's institute
    const batchObj = await Batch.findById(batchId);
    if (!batchObj || batchObj.institute.toString() !== adminInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    const enrollments = await Enrollment.find({
      batch: batchId,
      institute: adminInstituteId
    })
    .populate('student', 'fullName email phone studentDetails');

    return res.status(200).json({
      success: true,
      message: 'Batch students fetched successfully',
      data: enrollments
    });
  } catch (error) {
    next(error);
  }
};

// Get all batches of a Student (Bonus API)
const getBatchesByStudent = async (req, res, next) => {
  try {
    const studentId = req.params.studentId;
    const adminInstituteId = req.user.instituteId;

    // Check if student belongs to admin's institute
    const studentObj = await User.findById(studentId);
    if (!studentObj || studentObj.role !== 'student' || studentObj.institute.toString() !== adminInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const enrollments = await Enrollment.find({
      student: studentId,
      institute: adminInstituteId
    })
    .populate('batch', 'batchName batchCode timing startDate endDate');

    return res.status(200).json({
      success: true,
      message: 'Student batches fetched successfully',
      data: enrollments
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEnrollment,
  getAllEnrollments,
  getSingleEnrollment,
  updateEnrollment,
  deleteEnrollment,
  getStudentsByBatch,
  getBatchesByStudent
};
