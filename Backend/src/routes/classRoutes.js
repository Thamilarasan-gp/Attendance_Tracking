const express = require("express");
const multer = require("multer");
const {
  createClass,
  getClasses,
  getClassDetails,
  updateClass,
  deleteClass
} = require("../controllers/classController");
const {
  addStudent,
  getStudents,
  searchStudents,
  importStudents
} = require("../controllers/studentController");
const {
  resetAttendance,
  getAttendanceSummary,
  getPresentStudents,
  getOdStudents,
  getAbsentStudents,
  getWhatsAppReport
} = require("../controllers/attendanceController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, callback) => {
    const allowedMimeTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv"
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      const error = new Error("Only Excel or CSV files are allowed");
      error.statusCode = 400;
      callback(error);
      return;
    }

    callback(null, true);
  }
});

router.post("/", createClass);
router.get("/:userId", getClasses);
router.get("/details/:classId", getClassDetails);
router.put("/:classId", updateClass);
router.delete("/:classId", deleteClass);

router.post("/:classId/students", addStudent);
router.get("/:classId/students", getStudents);
router.get("/:classId/students/search", searchStudents);
router.post("/:classId/import", upload.single("file"), importStudents);

router.post("/:classId/reset", resetAttendance);
router.get("/:classId/summary", getAttendanceSummary);
router.get("/:classId/present", getPresentStudents);
router.get("/:classId/od", getOdStudents);
router.get("/:classId/absent", getAbsentStudents);
router.get("/:classId/report", getWhatsAppReport);

module.exports = router;
