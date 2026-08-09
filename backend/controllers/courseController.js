const Course = require('../models/Course');

// Create Course - Admin Only
const createCourse = async (req, res, next) => {
  try {
    const { courseName, courseCode, description, duration, totalFees, status } = req.body;
    const userInstituteId = req.user.instituteId;

    // Check for duplicate courseCode in this institute
    const existingCourse = await Course.findOne({
      institute: userInstituteId,
      courseCode: courseCode.toUpperCase()
    });

    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'Course code already exists in this institute'
      });
    }

    const newCourse = await Course.create({
      courseName,
      courseCode,
      description,
      duration,
      totalFees,
      status,
      institute: userInstituteId,
      createdBy: req.user.userId
    });

    return res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: newCourse
    });
  } catch (error) {
    next(error);
  }
};

// Get All Courses - Scoped to user's institute
const getAllCourses = async (req, res, next) => {
  try {
    const userInstituteId = req.user.instituteId;
    const filter = { institute: userInstituteId };

    // Optional status filter
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const courses = await Course.find(filter)
      .populate('createdBy', 'fullName role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Courses fetched successfully',
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

// Get Single Course Details
const getCourseById = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const userInstituteId = req.user.instituteId;

    const course = await Course.findById(courseId)
      .populate('createdBy', 'fullName role');

    if (!course || course.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Course details fetched successfully',
      data: course
    });
  } catch (error) {
    next(error);
  }
};

// Update Course Details - Admin Only
const updateCourse = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const userInstituteId = req.user.instituteId;

    const course = await Course.findById(courseId);
    if (!course || course.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check duplicate if courseCode is changing
    if (req.body.courseCode && req.body.courseCode.toUpperCase() !== course.courseCode) {
      const existingCourse = await Course.findOne({
        institute: userInstituteId,
        courseCode: req.body.courseCode.toUpperCase(),
        _id: { $ne: courseId }
      });

      if (existingCourse) {
        return res.status(400).json({
          success: false,
          message: 'Course code already exists in this institute'
        });
      }
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'fullName role');

    return res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: updatedCourse
    });
  } catch (error) {
    next(error);
  }
};

// Delete Course - Admin Only
const deleteCourse = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const userInstituteId = req.user.instituteId;

    const course = await Course.findById(courseId);
    if (!course || course.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    await Course.findByIdAndDelete(courseId);

    return res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse
};
