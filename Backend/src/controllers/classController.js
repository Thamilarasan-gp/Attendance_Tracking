const mongoose = require("mongoose");
const Class = require("../models/Class");
const Student = require("../models/Student");
const User = require("../models/User");
const { asyncHandler } = require("../middleware/errorHandler");

const sendSuccess = (res, statusCode, message, data) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const ensureValidObjectId = (id, label) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(`Invalid ${label}`);
    error.statusCode = 400;
    throw error;
  }
};

const createClass = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const userId = String(req.body.userId || "").trim();

  if (!name || !userId) {
    const error = new Error("Class name and userId are required");
    error.statusCode = 400;
    throw error;
  }

  ensureValidObjectId(userId, "userId");

  const user = await User.findById(userId);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const newClass = await Class.create({
    name,
    createdBy: userId
  });

  sendSuccess(res, 201, "Class created successfully", newClass);
});

const getClasses = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  ensureValidObjectId(userId, "userId");

  const classes = await Class.find({ createdBy: userId }).sort({ createdAt: -1 });
  sendSuccess(res, 200, "Classes fetched successfully", classes);
});

const getClassDetails = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  ensureValidObjectId(classId, "classId");

  const classDetails = await Class.findById(classId);

  if (!classDetails) {
    const error = new Error("Class not found");
    error.statusCode = 404;
    throw error;
  }

  sendSuccess(res, 200, "Class fetched successfully", classDetails);
});

const updateClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const name = String(req.body.name || "").trim();

  ensureValidObjectId(classId, "classId");

  if (!name) {
    const error = new Error("Class name is required");
    error.statusCode = 400;
    throw error;
  }

  const updatedClass = await Class.findByIdAndUpdate(
    classId,
    { name },
    { new: true, runValidators: true }
  );

  if (!updatedClass) {
    const error = new Error("Class not found");
    error.statusCode = 404;
    throw error;
  }

  sendSuccess(res, 200, "Class updated successfully", updatedClass);
});

const deleteClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  ensureValidObjectId(classId, "classId");

  const classDetails = await Class.findById(classId);

  if (!classDetails) {
    const error = new Error("Class not found");
    error.statusCode = 404;
    throw error;
  }

  const deleteResult = await Student.deleteMany({ classId });
  await Class.findByIdAndDelete(classId);

  sendSuccess(res, 200, "Class deleted successfully", {
    deletedClassId: classId,
    deletedStudents: deleteResult.deletedCount
  });
});

module.exports = {
  createClass,
  getClasses,
  getClassDetails,
  updateClass,
  deleteClass
};
