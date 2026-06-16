const mongoose = require("mongoose");
const Class = require("../models/Class");
const Student = require("../models/Student");
const User = require("../models/User");
const { asyncHandler } = require("../middleware/errorHandler");
const { exportUserSummary, exportClassSummary, exportAllUsersSummary } = require("../services/excelService");

const ADMIN_PASSWORD = "sece#2739";

const sendSuccess = (res, statusCode, message, data) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const sendError = (res, statusCode, message) => {
  res.status(statusCode).json({
    success: false,
    message
  });
};

// Verify Admin Password
const verifyAdminPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return sendError(res, 400, "Password is required");
  }

  if (password !== ADMIN_PASSWORD) {
    return sendError(res, 401, "Invalid admin password");
  }

  sendSuccess(res, 200, "Admin verified", { verified: true });
});

// Get all users with their classes and overall attendance summary
const getAllUsersWithSummary = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return sendError(res, 401, "Invalid admin password");
  }

  const users = await User.find({});
  const usersData = [];

  for (const user of users) {
    const classes = await Class.find({ createdBy: user._id });
    let overallSummary = { present: 0, absent: 0, od: 0, total: 0 };
    const classBreakdown = [];

    for (const classItem of classes) {
      const students = await Student.find({ classId: classItem._id });
      const classSummary = {
        classId: classItem._id,
        className: classItem.name,
        present: students.filter(s => s.status === "present").length,
        absent: students.filter(s => s.status === "absent").length,
        od: students.filter(s => s.status === "od").length,
        total: students.length
      };

      classBreakdown.push(classSummary);
      overallSummary.present += classSummary.present;
      overallSummary.absent += classSummary.absent;
      overallSummary.od += classSummary.od;
      overallSummary.total += classSummary.total;
    }

    usersData.push({
      userId: user._id,
      name: user.name,
      email: user.email,
      overallSummary,
      classBreakdown
    });
  }

  sendSuccess(res, 200, "Users data retrieved successfully", usersData);
});

// Get user detailed breakdown
const getUserDetailedBreakdown = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return sendError(res, 401, "Invalid admin password");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return sendError(res, 400, "Invalid user ID");
  }

  const user = await User.findById(userId);
  if (!user) {
    return sendError(res, 404, "User not found");
  }

  const classes = await Class.find({ createdBy: userId });
  const classDetails = [];

  for (const classItem of classes) {
    const students = await Student.find({ classId: classItem._id });
    classDetails.push({
      classId: classItem._id,
      className: classItem.name,
      summary: {
        present: students.filter(s => s.status === "present").length,
        absent: students.filter(s => s.status === "absent").length,
        od: students.filter(s => s.status === "od").length,
        total: students.length
      },
      students: students.map(s => ({
        studentId: s._id,
        name: s.name,
        rollNo: s.rollNo,
        phone: s.phone,
        status: s.status,
        frozen: s.frozen,
        attendanceHistory: s.attendanceHistory || []
      }))
    });
  }

  sendSuccess(res, 200, "User breakdown retrieved", {
    userId: user._id,
    name: user.name,
    email: user.email,
    classDetails
  });
});

// Get class detailed breakdown
const getClassDetailedBreakdown = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return sendError(res, 401, "Invalid admin password");
  }

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    return sendError(res, 400, "Invalid class ID");
  }

  const classItem = await Class.findById(classId).populate("createdBy", "name email");
  if (!classItem) {
    return sendError(res, 404, "Class not found");
  }

  const students = await Student.find({ classId });
  const summary = {
    present: students.filter(s => s.status === "present").length,
    absent: students.filter(s => s.status === "absent").length,
    od: students.filter(s => s.status === "od").length,
    total: students.length
  };

  sendSuccess(res, 200, "Class breakdown retrieved", {
    classId: classItem._id,
    className: classItem.name,
    createdBy: classItem.createdBy,
    summary,
    students: students.map(s => ({
      studentId: s._id,
      name: s.name,
      rollNo: s.rollNo,
      phone: s.phone,
      status: s.status,
      frozen: s.frozen
    }))
  });
});

// Freeze user attendance
const freezeUserAttendance = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return sendError(res, 401, "Invalid admin password");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return sendError(res, 400, "Invalid user ID");
  }

  const user = await User.findById(userId);
  if (!user) {
    return sendError(res, 404, "User not found");
  }

  const classes = await Class.find({ createdBy: userId });
  const classIds = classes.map(c => c._id);

  await Student.updateMany(
    { classId: { $in: classIds } },
    { frozen: true }
  );

  sendSuccess(res, 200, "User attendance frozen successfully", { userId, frozen: true });
});

// Unfreeze user attendance
const unfreezeUserAttendance = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return sendError(res, 401, "Invalid admin password");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return sendError(res, 400, "Invalid user ID");
  }

  const user = await User.findById(userId);
  if (!user) {
    return sendError(res, 404, "User not found");
  }

  const classes = await Class.find({ createdBy: userId });
  const classIds = classes.map(c => c._id);

  await Student.updateMany(
    { classId: { $in: classIds } },
    { frozen: false }
  );

  sendSuccess(res, 200, "User attendance unfrozen successfully", { userId, frozen: false });
});

// Get date-wise attendance tracking
const getDateWiseTracking = asyncHandler(async (req, res) => {
  const { userId, classId } = req.params;
  const { password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return sendError(res, 401, "Invalid admin password");
  }

  let students;

  if (classId) {
    // Get students from specific class
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return sendError(res, 400, "Invalid class ID");
    }
    students = await Student.find({ classId });
  } else if (userId) {
    // Get all students of a user
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return sendError(res, 400, "Invalid user ID");
    }
    const classes = await Class.find({ createdBy: userId });
    const classIds = classes.map(c => c._id);
    students = await Student.find({ classId: { $in: classIds } });
  } else {
    return sendError(res, 400, "userId or classId is required");
  }

  const trackingData = students.map(student => ({
    studentId: student._id,
    name: student.name,
    rollNo: student.rollNo,
    phone: student.phone,
    currentStatus: student.status,
    frozen: student.frozen,
    dateWiseHistory: (student.attendanceHistory || []).map(record => ({
      date: record.date,
      status: record.status,
      changedBy: record.changedBy
    }))
  }));

  sendSuccess(res, 200, "Date-wise tracking retrieved", trackingData);
});

// Export user summary as Excel
const exportUserExcel = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return sendError(res, 401, "Invalid admin password");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return sendError(res, 400, "Invalid user ID");
  }

  const user = await User.findById(userId);
  if (!user) {
    return sendError(res, 404, "User not found");
  }

  const classes = await Class.find({ createdBy: userId });
  const classDetails = [];

  for (const classItem of classes) {
    const students = await Student.find({ classId: classItem._id });
    classDetails.push({
      classId: classItem._id,
      className: classItem.name,
      summary: {
        present: students.filter(s => s.status === "present").length,
        absent: students.filter(s => s.status === "absent").length,
        od: students.filter(s => s.status === "od").length,
        total: students.length
      },
      students: students.map(s => ({
        studentId: s._id,
        name: s.name,
        rollNo: s.rollNo,
        phone: s.phone,
        status: s.status,
        department: s.department || "N/A"
      }))
    });
  }

  const workbook = exportUserSummary(user.name, classDetails);
  const buffer = require("xlsx").write(workbook, { type: "buffer" });

  res.setHeader("Content-Disposition", `attachment; filename="User_${user.name}_Attendance.xlsx"`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buffer);
});

// Export class summary as Excel
const exportClassExcel = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return sendError(res, 401, "Invalid admin password");
  }

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    return sendError(res, 400, "Invalid class ID");
  }

  const classItem = await Class.findById(classId);
  if (!classItem) {
    return sendError(res, 404, "Class not found");
  }

  const students = await Student.find({ classId });
  const summary = {
    present: students.filter(s => s.status === "present").length,
    absent: students.filter(s => s.status === "absent").length,
    od: students.filter(s => s.status === "od").length,
    total: students.length
  };

  const workbook = exportClassSummary(classItem.name, students, summary);
  const buffer = require("xlsx").write(workbook, { type: "buffer" });

  res.setHeader("Content-Disposition", `attachment; filename="Class_${classItem.name}_Attendance.xlsx"`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buffer);
});

// Export all users summary as Excel
const exportAllUsersExcel = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return sendError(res, 401, "Invalid admin password");
  }

  const users = await User.find({});
  const usersData = [];

  for (const user of users) {
    const classes = await Class.find({ createdBy: user._id });
    let overallSummary = { present: 0, absent: 0, od: 0, total: 0 };

    for (const classItem of classes) {
      const students = await Student.find({ classId: classItem._id });
      overallSummary.present += students.filter(s => s.status === "present").length;
      overallSummary.absent += students.filter(s => s.status === "absent").length;
      overallSummary.od += students.filter(s => s.status === "od").length;
      overallSummary.total += students.length;
    }

    usersData.push({
      name: user.name,
      email: user.email,
      overallSummary
    });
  }

  const workbook = exportAllUsersSummary(usersData);
  const buffer = require("xlsx").write(workbook, { type: "buffer" });

  res.setHeader("Content-Disposition", "attachment; filename=\"All_Users_Attendance_Summary.xlsx\"");
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buffer);
});

module.exports = {
  verifyAdminPassword,
  getAllUsersWithSummary,
  getUserDetailedBreakdown,
  getClassDetailedBreakdown,
  freezeUserAttendance,
  unfreezeUserAttendance,
  getDateWiseTracking,
  exportUserExcel,
  exportClassExcel,
  exportAllUsersExcel
};

// Delete a user and their related classes and students
const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return sendError(res, 401, "Invalid admin password");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return sendError(res, 400, "Invalid user ID");
  }

  const user = await User.findById(userId);
  if (!user) {
    return sendError(res, 404, "User not found");
  }

  // Find classes created by the user
  const classes = await Class.find({ createdBy: userId });
  const classIds = classes.map(c => c._id);

  // Delete students belonging to those classes
  await Student.deleteMany({ classId: { $in: classIds } });

  // Delete the classes
  await Class.deleteMany({ createdBy: userId });

  // Delete the user
  await User.findByIdAndDelete(userId);

  sendSuccess(res, 200, "User and related data deleted successfully", { userId });
});

module.exports = {
  verifyAdminPassword,
  getAllUsersWithSummary,
  getUserDetailedBreakdown,
  getClassDetailedBreakdown,
  freezeUserAttendance,
  unfreezeUserAttendance,
  getDateWiseTracking,
  exportUserExcel,
  exportClassExcel,
  exportAllUsersExcel,
  deleteUser
};
