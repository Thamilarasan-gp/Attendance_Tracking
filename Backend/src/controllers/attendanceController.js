const mongoose = require("mongoose");
const Class = require("../models/Class");
const Student = require("../models/Student");
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

const getSummaryData = async (classId) => {
  const [total, present, od, absent] = await Promise.all([
    Student.countDocuments({ classId }),
    Student.countDocuments({ classId, status: "present" }),
    Student.countDocuments({ classId, status: "od" }),
    Student.countDocuments({ classId, status: "absent" })
  ]);

  return {
    total,
    present,
    od,
    absent
  };
};

const emitSummary = async (req, classId) => {
  const summary = await getSummaryData(classId);
  const io = req.app.get("io");

  if (io) {
    io.to(`class_${classId}`).emit("summaryUpdated", summary);
  }

  return summary;
};

const updateAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const status = String(req.body.status || "").trim().toLowerCase();

  ensureValidObjectId(studentId, "studentId");

  if (!["present", "absent", "od"].includes(status)) {
    const error = new Error("Status must be present, absent, or od");
    error.statusCode = 400;
    throw error;
  }

  const student = await Student.findByIdAndUpdate(
    studentId,
    { status },
    { new: true, runValidators: true }
  );

  if (!student) {
    const error = new Error("Student not found");
    error.statusCode = 404;
    throw error;
  }

  const classId = String(student.classId);
  const io = req.app.get("io");

  if (io) {
    io.to(`class_${classId}`).emit("attendanceUpdated", {
      studentId: String(student._id),
      classId,
      status: student.status
    });
  }

  await emitSummary(req, classId);
  sendSuccess(res, 200, "Attendance updated successfully", student);
});

const resetAttendance = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  ensureValidObjectId(classId, "classId");
  await ensureClassExists(classId);

  const result = await Student.updateMany({ classId }, { status: "absent" });
  const io = req.app.get("io");

  if (io) {
    io.to(`class_${classId}`).emit("attendanceReset", { classId });
  }

  const summary = await emitSummary(req, classId);

  sendSuccess(res, 200, "Attendance reset successfully", {
    modifiedCount: result.modifiedCount,
    summary
  });
});

const getAttendanceSummary = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  ensureValidObjectId(classId, "classId");
  await ensureClassExists(classId);

  const summary = await getSummaryData(classId);
  sendSuccess(res, 200, "Attendance summary fetched successfully", summary);
});

const getStudentsByStatus = (status, message) =>
  asyncHandler(async (req, res) => {
    const { classId } = req.params;
    ensureValidObjectId(classId, "classId");
    await ensureClassExists(classId);

    const students = await Student.find({ classId, status }).sort({ rollNo: 1 });
    sendSuccess(res, 200, message, students);
  });

const getWhatsAppReport = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  ensureValidObjectId(classId, "classId");

  const classDetails = await ensureClassExists(classId);
  const [summary, presentStudents, odStudents, absentStudents] = await Promise.all([
    getSummaryData(classId),
    Student.find({ classId, status: "present" }).sort({ rollNo: 1 }),
    Student.find({ classId, status: "od" }).sort({ rollNo: 1 }),
    Student.find({ classId, status: "absent" }).sort({ rollNo: 1 })
  ]);

  const formatRollNumbers = (students) =>
    students.length > 0
      ? students.map((student) => student.rollNo).join("\n")
      : "Nil";

  const reportText = [
    `${classDetails.name} Attendance`,
    "",
    `Total Students : ${summary.total}`,
    "",
    `Present : ${summary.present}`,
    "",
    `OD : ${summary.od}`,
    "",
    `Absent : ${summary.absent}`,
    "",
    "Present Roll Numbers:",
    formatRollNumbers(presentStudents),
    "",
    "OD Roll Numbers:",
    formatRollNumbers(odStudents),
    "",
    "Absent Roll Numbers:",
    formatRollNumbers(absentStudents)
  ].join("\n");

  sendSuccess(res, 200, "WhatsApp report generated successfully", {
    reportText
  });
});

module.exports = {
  updateAttendance,
  resetAttendance,
  getAttendanceSummary,
  getPresentStudents: getStudentsByStatus("present", "Present students fetched successfully"),
  getOdStudents: getStudentsByStatus("od", "OD students fetched successfully"),
  getAbsentStudents: getStudentsByStatus("absent", "Absent students fetched successfully"),
  getWhatsAppReport
};
