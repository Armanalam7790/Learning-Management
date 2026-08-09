const User = require('../models/User');

// Create a new Teacher
const createTeacher = async (req, res, next) => {
  try {
    const { fullName, email, password, phone, profileImage } = req.body;
    const adminInstituteId = req.user.instituteId;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered'
      });
    }

    // Create the new teacher under the admin's institute
    const newTeacher = await User.create({
      fullName,
      email,
      password, // hashed automatically in model pre-save hook
      phone,
      profileImage,
      institute: adminInstituteId,
      role: 'teacher',
      isActive: true
    });

    return res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: {
        id: newTeacher._id,
        fullName: newTeacher.fullName,
        email: newTeacher.email,
        phone: newTeacher.phone,
        role: newTeacher.role,
        institute: newTeacher.institute,
        isActive: newTeacher.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all Teachers belonging to logged-in admin's institute
const getAllTeachers = async (req, res, next) => {
  try {
    const adminInstituteId = req.user.instituteId;

    // Retrieve active teachers under this institute
    const allTeachers = await User.find({
      institute: adminInstituteId,
      role: 'teacher',
      isActive: true
    });

    return res.status(200).json({
      success: true,
      message: 'Teachers fetched successfully',
      data: allTeachers
    });
  } catch (error) {
    next(error);
  }
};

// Get a single Teacher by ID (within the admin's institute)
const getSingleTeacher = async (req, res, next) => {
  try {
    const teacherId = req.params.id;
    const adminInstituteId = req.user.instituteId;

    const teacher = await User.findById(teacherId);

    // Verify teacher exists, has the teacher role, and belongs to the admin's institute
    if (!teacher || teacher.role !== 'teacher' || teacher.institute.toString() !== adminInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Teacher details fetched successfully',
      data: teacher
    });
  } catch (error) {
    next(error);
  }
};

// Update a Teacher's details
const updateTeacher = async (req, res, next) => {
  try {
    const teacherId = req.params.id;
    const adminInstituteId = req.user.instituteId;
    const { email } = req.body;

    const teacher = await User.findById(teacherId);

    // Verify teacher exists, has the teacher role, and belongs to the admin's institute
    if (!teacher || teacher.role !== 'teacher' || teacher.institute.toString() !== adminInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== teacherId) {
        return res.status(400).json({
          success: false,
          message: 'Email is already registered'
        });
      }
    }

    // Update teacher details
    const updatedTeacher = await User.findByIdAndUpdate(
      teacherId,
      req.body,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Teacher updated successfully',
      data: updatedTeacher
    });
  } catch (error) {
    next(error);
  }
};

// Soft Delete (Deactivate) a Teacher
const deleteTeacher = async (req, res, next) => {
  try {
    const teacherId = req.params.id;
    const adminInstituteId = req.user.instituteId;

    const teacher = await User.findById(teacherId);

    // Verify teacher exists, has the teacher role, and belongs to the admin's institute
    if (!teacher || teacher.role !== 'teacher' || teacher.institute.toString() !== adminInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Update isActive to false
    await User.findByIdAndUpdate(
      teacherId,
      { isActive: false },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Teacher deactivated successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTeacher,
  getAllTeachers,
  getSingleTeacher,
  updateTeacher,
  deleteTeacher
};
