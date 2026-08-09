const Course = require('../models/Course');
const Batch = require('../models/Batch');
const Enrollment = require('../models/Enrollment');
const Assignment = require('../models/Assignment');
const Attendance = require('../models/Attendance');
const AcademicResult = require('../models/AcademicResult');
const StudentFee = require('../models/StudentFee');
const Payment = require('../models/Payment');

// Get Course-wise Analytics for Dashboard
const getCourseAnalytics = async (req, res, next) => {
  try {
    const userInstituteId = req.user.instituteId;

    // Fetch all active courses for the institute
    const courses = await Course.find({ institute: userInstituteId });
    const analyticsData = [];

    for (const course of courses) {
      const courseId = course._id;

      // Find all batches belonging to this course
      const batches = await Batch.find({ course: courseId, institute: userInstituteId });
      const batchIds = batches.map(b => b._id);

      // 1. Batches per Course
      const totalBatches = batches.length;

      // 2. Students per Course
      const enrolledStudentsCount = await Enrollment.countDocuments({
        batch: { $in: batchIds },
        institute: userInstituteId,
        status: 'Active'
      });

      // 3. Revenue per Course
      const studentFees = await StudentFee.find({
        batch: { $in: batchIds },
        institute: userInstituteId
      });
      const studentFeeIds = studentFees.map(sf => sf._id);
      
      const payments = await Payment.find({
        studentFee: { $in: studentFeeIds },
        paymentStatus: 'Success'
      });
      const totalRevenueCollected = payments.reduce((sum, pay) => sum + pay.amount, 0);

      // 4. Assignments per Course
      const assignmentsCount = await Assignment.countDocuments({
        batch: { $in: batchIds },
        institute: userInstituteId
      });

      // 5. Attendance per Course (Average attendance percentage)
      const attendanceLogs = await Attendance.find({
        batch: { $in: batchIds },
        institute: userInstituteId
      });
      const totalAttendanceDays = attendanceLogs.length;
      const presentDays = attendanceLogs.filter(log => ['Present', 'Late'].includes(log.status)).length;
      const averageAttendanceRate = totalAttendanceDays > 0
        ? parseFloat(((presentDays / totalAttendanceDays) * 100).toFixed(2))
        : 100.0;

      // 6. Results per Course (Average AcademicResult percentage and pass rate)
      const resultsList = await AcademicResult.find({
        batch: { $in: batchIds },
        institute: userInstituteId
      });
      const totalResults = resultsList.length;
      const totalPercentage = resultsList.reduce((sum, resObj) => sum + resObj.percentage, 0);
      const passedStudents = resultsList.filter(resObj => resObj.resultStatus === 'Pass').length;

      const averagePercentage = totalResults > 0
        ? parseFloat((totalPercentage / totalResults).toFixed(2))
        : 0.0;
      const passPercentageRate = totalResults > 0
        ? parseFloat(((passedStudents / totalResults) * 100).toFixed(2))
        : 100.0;

      analyticsData.push({
        courseId,
        courseName: course.courseName,
        courseCode: course.courseCode,
        metrics: {
          batchesCount: totalBatches,
          studentsCount: enrolledStudentsCount,
          revenueCollected: totalRevenueCollected,
          assignmentsCount,
          averageAttendance: averageAttendanceRate,
          averageResultPercentage: averagePercentage,
          passRate: passPercentageRate
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Course-wise analytics fetched successfully',
      data: analyticsData
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCourseAnalytics
};
