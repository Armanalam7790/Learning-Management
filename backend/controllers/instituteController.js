const Institute = require('../models/Institute');

// Create a new Institute
const createInstitute = async (req, res, next) => {
  try {
    const { instituteCode, email } = req.body;

    // Check if institute code already exists
    const existingInstituteCode = await Institute.findOne({ instituteCode });
    if (existingInstituteCode) {
      return res.status(400).json({
        success: false,
        message: 'Institute code is already registered'
      });
    }

    // Check if email already exists
    const existingInstituteEmail = await Institute.findOne({ email });
    if (existingInstituteEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered'
      });
    }

    // Create the new institute
    const newInstitute = await Institute.create(req.body);

    return res.status(201).json({
      success: true,
      message: 'Institute registered successfully',
      data: newInstitute
    });
  } catch (error) {
    next(error);
  }
};

// Get all Institutes
const getAllInstitutes = async (req, res, next) => {
  try {
    const allInstitutes = await Institute.find();
    
    return res.status(200).json({
      success: true,
      message: 'Institutes fetched successfully',
      data: allInstitutes
    });
  } catch (error) {
    next(error);
  }
};

// Get a single Institute by ID
const getSingleInstitute = async (req, res, next) => {
  try {
    const instituteId = req.params.id;
    const institute = await Institute.findById(instituteId);

    if (!institute) {
      return res.status(404).json({
        success: false,
        message: 'Institute not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Institute details fetched successfully',
      data: institute
    });
  } catch (error) {
    next(error);
  }
};

// Update an Institute
const updateInstitute = async (req, res, next) => {
  try {
    const instituteId = req.params.id;
    const { instituteCode, email } = req.body;

    // If updating institute code, check if it is already taken by another institute
    if (instituteCode) {
      const existingInstituteCode = await Institute.findOne({ instituteCode });
      if (existingInstituteCode && existingInstituteCode._id.toString() !== instituteId) {
        return res.status(400).json({
          success: false,
          message: 'Institute code is already registered'
        });
      }
    }

    // If updating email, check if it is already taken by another institute
    if (email) {
      const existingInstituteEmail = await Institute.findOne({ email });
      if (existingInstituteEmail && existingInstituteEmail._id.toString() !== instituteId) {
        return res.status(400).json({
          success: false,
          message: 'Email is already registered'
        });
      }
    }

    // Perform the update
    const updatedInstitute = await Institute.findByIdAndUpdate(
      instituteId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedInstitute) {
      return res.status(404).json({
        success: false,
        message: 'Institute not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Institute updated successfully',
      data: updatedInstitute
    });
  } catch (error) {
    next(error);
  }
};

// Delete an Institute
const deleteInstitute = async (req, res, next) => {
  try {
    const instituteId = req.params.id;
    const deletedInstitute = await Institute.findByIdAndDelete(instituteId);

    if (!deletedInstitute) {
      return res.status(404).json({
        success: false,
        message: 'Institute not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Institute deleted successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInstitute,
  getAllInstitutes,
  getSingleInstitute,
  updateInstitute,
  deleteInstitute
};
