const User = require('../models/User');
const Institute = require('../models/Institute');
const generateToken = require('../utils/generateToken');

// Setup Admin
const setupAdmin = async (req, res, next) => {
  try {
    const { fullName, email, password, phone, institute } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered'
      });
    }

    // Verify if institute exists
    const existingInstitute = await Institute.findById(institute);
    if (!existingInstitute) {
      return res.status(404).json({
        success: false,
        message: 'Institute not found'
      });
    }

    // Create the new administrator
    const newAdmin = await User.create({
      fullName,
      email,
      password, // hashed automatically in model pre-save hook
      phone,
      institute,
      role: 'admin'
    });

    return res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        id: newAdmin._id,
        fullName: newAdmin.fullName,
        email: newAdmin.email,
        role: newAdmin.role,
        institute: newAdmin.institute
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin Login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const jwtToken = generateToken(user._id, user.role, user.institute);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          institute: user.institute
        },
        token: jwtToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get Currently Logged In User
const getCurrentUser = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user.userId).select('-password');
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Current user fetched successfully',
      data: currentUser
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  setupAdmin,
  login,
  getCurrentUser
};
