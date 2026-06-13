const mongoose = require("mongoose");
const Class = require("../models/Class");
const Student = require("../models/Student");
const { readStudentsFromExcel } = require("../services/excelService");
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

const ensureClassExists = async (classId) => {
  const classDetails = await Class.findById(classId);

  if (!classDetails) {
    const error = new Error("Class not found");
    error.statusCode = 404;
    throw error;
  }

  return classDetails;
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const addStudent = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const rollNo = String(req.body.rollNo || "").trim();
  const name = String(req.body.name || "").trim();
  const phone = String(req.body.phone || "").trim();

  ensureValidObjectId(classId, "classId");

  if (!rollNo || !name || !phone) {
    const error = new Error("Roll number, name, and phone are required");
    error.statusCode = 400;
    throw error;
  }

  await ensureClassExists(classId);

  const duplicateStudent = await Student.findOne({ classId, rollNo });

  if (duplicateStudent) {
    const error = new Error("Student roll number already exists in this class");
    error.statusCode = 409;
    throw error;
  }

  const student = await Student.create({
    classId,
    rollNo,
    name,
    phone
  });

  sendSuccess(res, 201, "Student added successfully", student);
});

const getStudents = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  ensureValidObjectId(classId, "classId");
  await ensureClassExists(classId);

  const students = await Student.find({ classId }).sort({ rollNo: 1 });
  sendSuccess(res, 200, "Students fetched successfully", students);
});

const searchStudents = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const q = String(req.query.q || "").trim();

  ensureValidObjectId(classId, "classId");
  await ensureClassExists(classId);

  if (!q) {
    sendSuccess(res, 200, "Students fetched successfully", []);
    return;
  }

  const pattern = new RegExp(escapeRegExp(q), "i");
  const students = await Student.find({
    classId,
    $or: [{ rollNo: pattern }, { name: pattern }]
  }).sort({ rollNo: 1 });

  sendSuccess(res, 200, "Students fetched successfully", students);
});

const updateStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  ensureValidObjectId(studentId, "studentId");

  const updates = {};
  const allowedFields = ["rollNo", "name", "phone", "status"];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = String(req.body[field]).trim();
    }
  });

  if (Object.keys(updates).length === 0) {
    const error = new Error("At least one field is required to update");
    error.statusCode = 400;
    throw error;
  }

  if (updates.status && !["present", "absent", "od"].includes(updates.status)) {
    const error = new Error("Status must be present, absent, or od");
    error.statusCode = 400;
    throw error;
  }

  const existingStudent = await Student.findById(studentId);

  if (!existingStudent) {
    const error = new Error("Student not found");
    error.statusCode = 404;
    throw error;
  }

  if (updates.rollNo && updates.rollNo !== existingStudent.rollNo) {
    const duplicateStudent = await Student.findOne({
      classId: existingStudent.classId,
      rollNo: updates.rollNo,
      _id: { $ne: studentId }
    });

    if (duplicateStudent) {
      const error = new Error("Student roll number already exists in this class");
      error.statusCode = 409;
      throw error;
    }
  }

  Object.assign(existingStudent, updates);
  const updatedStudent = await existingStudent.save();

  sendSuccess(res, 200, "Student updated successfully", updatedStudent);
});

const deleteStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  ensureValidObjectId(studentId, "studentId");

  const deletedStudent = await Student.findByIdAndDelete(studentId);

  if (!deletedStudent) {
    const error = new Error("Student not found");
    error.statusCode = 404;
    throw error;
  }

  sendSuccess(res, 200, "Student deleted successfully", deletedStudent);
});

const importStudents = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  ensureValidObjectId(classId, "classId");
  await ensureClassExists(classId);

  if (!req.file) {
    const error = new Error("Excel file is required");
    error.statusCode = 400;
    throw error;
  }

  const studentsFromExcel = readStudentsFromExcel(req.file.buffer);

  if (studentsFromExcel.length === 0) {
    const error = new Error("Excel file does not contain valid student rows");
    error.statusCode = 400;
    throw error;
  }

  const rollNos = studentsFromExcel.map((student) => student.rollNo);
  const existingStudents = await Student.find({
    classId,
    rollNo: { $in: rollNos }
  }).select("rollNo");
  const existingRollNos = new Set(existingStudents.map((student) => student.rollNo));
  const seenRollNos = new Set();
  const studentsToInsert = [];
  let skippedCount = 0;

  studentsFromExcel.forEach((student) => {
    if (existingRollNos.has(student.rollNo) || seenRollNos.has(student.rollNo)) {
      skippedCount += 1;
      return;
    }

    seenRollNos.add(student.rollNo);
    studentsToInsert.push({
      classId,
      rollNo: student.rollNo,
      name: student.name,
      phone: student.phone
    });
  });

  if (studentsToInsert.length > 0) {
    await Student.insertMany(studentsToInsert, { ordered: false });
  }

  sendSuccess(res, 201, "Students imported successfully", {
    insertedCount: studentsToInsert.length,
    skippedCount
  });
});

module.exports = {
  addStudent,
  getStudents,
  searchStudents,
  updateStudent,
  deleteStudent,
  importStudents
};
