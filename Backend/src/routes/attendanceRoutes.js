const express = require("express");
const {
  updateAttendance,
  resetAttendance,
  getAttendanceSummary,
  getPresentStudents,
  getOdStudents,
  getAbsentStudents,
  getWhatsAppReport
} = require("../controllers/attendanceController");

const router = express.Router();

router.patch("/students/:studentId/status", updateAttendance);
router.post("/classes/:classId/reset", resetAttendance);
router.get("/classes/:classId/summary", getAttendanceSummary);
router.get("/classes/:classId/present", getPresentStudents);
router.get("/classes/:classId/od", getOdStudents);
router.get("/classes/:classId/absent", getAbsentStudents);
router.get("/classes/:classId/report", getWhatsAppReport);

module.exports = router;
