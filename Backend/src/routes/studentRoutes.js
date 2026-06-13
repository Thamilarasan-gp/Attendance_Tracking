const express = require("express");
const {
  updateStudent,
  deleteStudent
} = require("../controllers/studentController");
const { updateAttendance } = require("../controllers/attendanceController");

const router = express.Router();

router.put("/:studentId", updateStudent);
router.delete("/:studentId", deleteStudent);
router.patch("/:studentId/status", updateAttendance);

module.exports = router;
