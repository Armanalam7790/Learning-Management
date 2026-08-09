const User = require('../models/User');

// Create a new Student
const createStudent = async (req, res, next) => {
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

    // Create the student under the admin's institute
    const newStudent = await User.create({
      fullName,
      email,
      password, // hashed automatically in model pre-save hook
      phone,
      profileImage,
      institute: adminInstituteId,
      role: 'student',
      isActive: true
    });

    return res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: {
        id: newStudent._id,
        fullName: newStudent.fullName,
        email: newStudent.email,
        phone: newStudent.phone,
        role: newStudent.role,
        institute: newStudent.institute,
        isActive: newStudent.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all Students belonging to logged-in admin's institute
const getAllStudents = async (req, res, next) => {
  try {
    const adminInstituteId = req.user.instituteId;

    // Retrieve active students under this institute
    const allStudents = await User.find({
      institute: adminInstituteId,
      role: 'student',
      isActive: true
    });

    return res.status(200).json({
      success: true,
      message: 'Students fetched successfully',
      data: allStudents
    });
  } catch (error) {
    next(error);
  }
};

// Get a single Student by ID (within the admin's institute)
const getSingleStudent = async (req, res, next) => {
  try {
    const studentId = req.params.id;
    const adminInstituteId = req.user.instituteId;

    const student = await User.findById(studentId);

    // Verify student exists, has the student role, and belongs to the admin's institute
    if (!student || student.role !== 'student' || student.institute.toString() !== adminInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Student details fetched successfully',
      data: student
    });
  } catch (error) {
    next(error);
  }
};

// Update a Student's details
const updateStudent = async (req, res, next) => {
  try {
    const studentId = req.params.id;
    const adminInstituteId = req.user.instituteId;
    const { email } = req.body;

    const student = await User.findById(studentId);

    // Verify student exists, has the student role, and belongs to the admin's institute
    if (!student || student.role !== 'student' || student.institute.toString() !== adminInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if the new email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== studentId) {
        return res.status(400).json({
          success: false,
          message: 'Email is already registered'
        });
      }
    }

    // Update student details
    const updatedStudent = await User.findByIdAndUpdate(
      studentId,
      req.body,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent
    });
  } catch (error) {
    next(error);
  }
};


const deleteStudent = async (req, res, next) => {
  try {
    const studentId = req.params.id;
    const adminInstituteId = req.user.instituteId;

    const student = await User.findById(studentId);

    
    if (!student || student.role !== 'student' || student.institute.toString() !== adminInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    
    await User.findByIdAndUpdate(
      studentId,
      { isActive: false },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Student deactivated successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStudent,
  getAllStudents,
  getSingleStudent,
  updateStudent,
  deleteStudent
};
