const Payment = require('../models/Payment');
const StudentFee = require('../models/StudentFee');

// Collect Payment - Admin Only (POST /api/v1/payments)
const createPayment = async (req, res, next) => {
  try {
    const { studentFee, amount, paymentMode, transactionId, remarks } = req.body;
    const userInstituteId = req.user.instituteId;

    // 1. Verify StudentFee ledger exists and belongs to same institute
    const studentFeeObj = await StudentFee.findById(studentFee);
    if (!studentFeeObj || studentFeeObj.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Student fee ledger not found'
      });
    }

    // 2. Prevent overpayment
    if (amount > studentFeeObj.pendingAmount) {
      return res.status(400).json({
        success: false,
        message: `Overpayment prohibited. Maximum pending balance is ${studentFeeObj.pendingAmount}`
      });
    }

    // 3. Generate a unique receipt number
    const receiptNumber = `REC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // 4. Create the Payment log
    const newPayment = await Payment.create({
      studentFee,
      amount,
      paymentMode,
      paymentStatus: 'Success',
      transactionId,
      receiptNumber,
      paymentDate: new Date(),
      collectedBy: req.user.userId,
      remarks
    });

    // 5. Update StudentFee paidAmount (which triggers the pre-validate hook to adjust status and pendingAmount)
    studentFeeObj.paidAmount += amount;
    await studentFeeObj.save();

    return res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      data: newPayment
    });
  } catch (error) {
    next(error);
  }
};

// Get All Payments (Scoped by role/enrollment)
const getAllPayments = async (req, res, next) => {
  try {
    const userInstituteId = req.user.instituteId;
    const userRole = req.user.role;
    const query = {};

    if (userRole === 'student') {
      // Students can only view their own payment logs
      const studentLedgers = await StudentFee.find({ student: req.user.userId });
      const ledgerIds = studentLedgers.map(l => l._id);
      query.studentFee = { $in: ledgerIds };
    } else {
      // Admins/Teachers get logs for their institute
      const ledgers = await StudentFee.find({ institute: userInstituteId });
      const ledgerIds = ledgers.map(l => l._id);
      query.studentFee = { $in: ledgerIds };
    }

    const payments = await Payment.find(query)
      .populate({
        path: 'studentFee',
        populate: [
          { path: 'student', select: 'fullName email' },
          { path: 'batch', select: 'batchName batchCode' },
          { path: 'feeStructure', select: 'feeName' }
        ]
      })
      .populate('collectedBy', 'fullName role')
      .sort({ paymentDate: -1 });

    return res.status(200).json({
      success: true,
      message: 'Payment records fetched successfully',
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

// Get Single Payment details
const getSinglePayment = async (req, res, next) => {
  try {
    const paymentId = req.params.id;
    const userInstituteId = req.user.instituteId;
    const userRole = req.user.role;

    const payment = await Payment.findById(paymentId)
      .populate({
        path: 'studentFee',
        populate: [
          { path: 'student', select: 'fullName email' },
          { path: 'batch', select: 'batchName batchCode' },
          { path: 'feeStructure', select: 'feeName' }
        ]
      })
      .populate('collectedBy', 'fullName role');

    if (!payment || payment.studentFee.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Student access validation
    if (userRole === 'student' && payment.studentFee.student._id.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this payment details record'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment record details fetched successfully',
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// Get Payments by Student (GET /api/v1/payments/student/:studentId)
const getPaymentsByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const userInstituteId = req.user.instituteId;
    const userRole = req.user.role;

    // Student access validation
    if (userRole === 'student' && studentId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own payment logs.'
      });
    }

    const studentLedgers = await StudentFee.find({ student: studentId, institute: userInstituteId });
    const ledgerIds = studentLedgers.map(l => l._id);

    const payments = await Payment.find({ studentFee: { $in: ledgerIds } })
      .populate({
        path: 'studentFee',
        populate: [
          { path: 'batch', select: 'batchName batchCode' },
          { path: 'feeStructure', select: 'feeName' }
        ]
      })
      .populate('collectedBy', 'fullName role')
      .sort({ paymentDate: -1 });

    return res.status(200).json({
      success: true,
      message: 'Student payment records fetched successfully',
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

// Delete Payment - Admin Only (Updates ledger balances upon removal)
const deletePayment = async (req, res, next) => {
  try {
    const paymentId = req.params.id;
    const userInstituteId = req.user.instituteId;

    const payment = await Payment.findById(paymentId).populate('studentFee');
    if (!payment || payment.studentFee.institute.toString() !== userInstituteId) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    const studentFeeObj = payment.studentFee;

    // Decrement ledger paid amount
    studentFeeObj.paidAmount -= payment.amount;
    if (studentFeeObj.paidAmount < 0) {
      studentFeeObj.paidAmount = 0;
    }
    await studentFeeObj.save();

    await Payment.findByIdAndDelete(paymentId);

    return res.status(200).json({
      success: true,
      message: 'Payment record deleted and ledger balance adjusted successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  getAllPayments,
  getSinglePayment,
  getPaymentsByStudent,
  deletePayment
};
