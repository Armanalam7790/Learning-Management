const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Batch = require('../models/Batch');
const Enrollment = require('../models/Enrollment');

// Helper to normalize dates to midnight UTC
const normalizeToMidnight = (dateString) => {
  const d = new Date(dateString);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// Mark Attendance
const createAttendance = async (req, res, next) => {
  try {
    const { student, batch, attendanceDate, status, remarks } = req.body;
    const userInstituteId = req.user.instituteId;

    // 1. Validate Student exists, role is student, active, and belongs to user's institute
    const studentObj = await User.findById(student);
    if (!studentObj || studentObj.role !== 'student' || !studentObj.isActive || studentObj.institute.toString() !== userInstituteId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student or student does not belong to your institute'
      });
    }

    // 2. Validate Batch exists, is active, and belongs to user's institute
    const batchObj = await Batch.findById(batch);
    if (!batchObj || !batchObj.isActive || batchObj.institute.toString() !== userInstituteId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid batch or batch does not belong to your institute'
      });
    }

    // 3. Validate Student is enrolled in the Batch
    const enrollmentObj = await Enrollment.findOne({
      student,
      batch,
      institute: userInstituteId,
      status: 'Active'
    });
    if (!enrollmentObj) {
      return res.status(400).json({
        success: false,
        message: 'Student is not actively enrolled in this batch'
      });
    }

    // 4. Normalize attendanceDate to midnight
    const dateNormalized = normalizeToMidnight(attendanceDate);

    // 5. Prevent duplicate attendance for Student + Batch + Date
    const existingRecord = await Attendance.findOne({
      student,
      batch,
      attendanceDate: dateNormalized
    });
    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: 'Attendance record already exists for this student in this batch on this date'
      });
    }

    // 6. Create the record
    const newRecord = await Attendance.create({
      student,
      batch,
      enrollment: enrollmentObj._id,
      teacher: batchObj.teacher,
      institute: userInstituteId,
      attendanceDate: dateNormalized,
      status,
      remarks,
      markedBy: req.user.userId
    });

    return res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: newRecord
    });
  } catch (error) {
    next(error);
  }
};

// Get all Attendance records (Scoped to user's institute)
const getAllAttendance = async (req, res, next) => {
  try {
    const userInstituteId = req.user.instituteId;

    const records = await Attendance.find({ institute: userInstituteId })
      .populate('student', 'fullName email')
      .populate({
        path: 'batch',
        select: 'batchName batchCode course',
        populate: {
          path: 'course',
          select: 'courseName courseCode totalFees'
        }
      })
      .populate('teacher', 'fullName email')
      .populate('markedBy', 'fullName role');

    return res.status(200).json({
      success: true,
      message: 'Attendance records fetched successfully',
      data: records
    });
  } catch (error) {
    next(error);
  }
};

// Get single Attendance record by ID
const getSingleAttendance = async (req, res, next) => {
  try {
    const attendanceId = req.params.id;
    const userInstituteId = req.user.instituteId;

    const record = await Attendance.findById(attendanceId)
      .populate('student', 'fullName email')
      .populate({
        path: 'batch',
        select: 'batchName batchCode course',
        populate: {
          path: 'course',
          select: 'courseName courseCode totalFees'
        }
      })
      .populate('teacher', 'fullName email')
      .populate('markedBy', 'fullName role');

    if (!record || record.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Attendance record details fetched successfully',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

// Update Attendance record
const updateAttendance = async (req, res, next) => {
  try {
    const attendanceId = req.params.id;
    const userInstituteId = req.user.instituteId;
    const { status, remarks, attendanceDate } = req.body;

    const record = await Attendance.findById(attendanceId);
    if (!record || record.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // If updating date, verify uniqueness
    if (attendanceDate) {
      const dateNormalized = normalizeToMidnight(attendanceDate);
      const duplicateRecord = await Attendance.findOne({
        student: record.student,
        batch: record.batch,
        attendanceDate: dateNormalized
      });
      if (duplicateRecord && duplicateRecord._id.toString() !== attendanceId) {
        return res.status(400).json({
          success: false,
          message: 'Attendance record already exists for this student on the specified date'
        });
      }
      req.body.attendanceDate = dateNormalized;
    }

    const updatedRecord = await Attendance.findByIdAndUpdate(
      attendanceId,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('student', 'fullName email')
    .populate({
      path: 'batch',
      select: 'batchName batchCode course',
      populate: {
        path: 'course',
        select: 'courseName courseCode totalFees'
      }
    })
    .populate('teacher', 'fullName email')
    .populate('markedBy', 'fullName role');

    return res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully',
      data: updatedRecord
    });
  } catch (error) {
    next(error);
  }
};

// Delete Attendance record
const deleteAttendance = async (req, res, next) => {
  try {
    const attendanceId = req.params.id;
    const userInstituteId = req.user.instituteId;

    const record = await Attendance.findById(attendanceId);
    if (!record || record.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    await Attendance.findByIdAndDelete(attendanceId);

    return res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

// Get Attendance by Student (Bonus API)
const getAttendanceByStudent = async (req, res, next) => {
  try {
    const studentId = req.params.studentId;
    const userInstituteId = req.user.instituteId;

    // Validate student
    const studentObj = await User.findById(studentId);
    if (!studentObj || studentObj.role !== 'student' || studentObj.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const records = await Attendance.find({
      student: studentId,
      institute: userInstituteId
    })
    .populate({
      path: 'batch',
      select: 'batchName batchCode course',
      populate: {
        path: 'course',
        select: 'courseName courseCode totalFees'
      }
    })
    .populate('teacher', 'fullName email')
    .populate('markedBy', 'fullName role');

    return res.status(200).json({
      success: true,
      message: 'Student attendance records fetched successfully',
      data: records
    });
  } catch (error) {
    next(error);
  }
};

// Get Attendance by Batch (Bonus API)
const getAttendanceByBatch = async (req, res, next) => {
  try {
    const batchId = req.params.batchId;
    const userInstituteId = req.user.instituteId;

    // Validate batch
    const batchObj = await Batch.findById(batchId);
    if (!batchObj || batchObj.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    const records = await Attendance.find({
      batch: batchId,
      institute: userInstituteId
    })
    .populate('student', 'fullName email')
    .populate('teacher', 'fullName email')
    .populate('markedBy', 'fullName role');

    return res.status(200).json({
      success: true,
      message: 'Batch attendance records fetched successfully',
      data: records
    });
  } catch (error) {
    next(error);
  }
};

// Get Attendance by Date (Bonus API)
const getAttendanceByDate = async (req, res, next) => {
  try {
    const dateString = req.params.date;
    const userInstituteId = req.user.instituteId;

    const dateNormalized = normalizeToMidnight(dateString);

    const records = await Attendance.find({
      attendanceDate: dateNormalized,
      institute: userInstituteId
    })
    .populate('student', 'fullName email')
    .populate({
      path: 'batch',
      select: 'batchName batchCode course',
      populate: {
        path: 'course',
        select: 'courseName courseCode totalFees'
      }
    })
    .populate('teacher', 'fullName email')
    .populate('markedBy', 'fullName role');

    return res.status(200).json({
      success: true,
      message: 'Attendance records for specified date fetched successfully',
      data: records
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAttendance,
  getAllAttendance,
  getSingleAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceByStudent,
  getAttendanceByBatch,
  getAttendanceByDate
};
