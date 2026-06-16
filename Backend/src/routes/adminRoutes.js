const express = require("express");
const adminController = require("../controllers/adminController");

const router = express.Router();

// Verify admin password
router.post("/verify-password", adminController.verifyAdminPassword);

// Get all users with summary
router.post("/users-summary", adminController.getAllUsersWithSummary);

// Get user detailed breakdown
router.post("/user/:userId/breakdown", adminController.getUserDetailedBreakdown);

// Get class detailed breakdown
router.post("/class/:classId/breakdown", adminController.getClassDetailedBreakdown);

// Freeze user attendance
router.post("/user/:userId/freeze", adminController.freezeUserAttendance);

// Unfreeze user attendance
router.post("/user/:userId/unfreeze", adminController.unfreezeUserAttendance);

// Delete user (and their classes & students)
router.post("/user/:userId/delete", adminController.deleteUser);

// Get date-wise tracking (by userId or classId)
router.post("/date-wise-tracking/:userId", adminController.getDateWiseTracking);
router.post("/class/:classId/date-wise-tracking", adminController.getDateWiseTracking);

// Export endpoints
router.post("/export/user/:userId", adminController.exportUserExcel);
router.post("/export/class/:classId", adminController.exportClassExcel);
router.post("/export/all-users", adminController.exportAllUsersExcel);

module.exports = router;
