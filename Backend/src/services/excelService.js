const xlsx = require("xlsx");

const normalizeHeader = (header) =>
  String(header || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

const cellToString = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
};

const readStudentsFromExcel = (fileBuffer) => {
  const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    const error = new Error("Excel file does not contain any sheets");
    error.statusCode = 400;
    throw error;
  }

  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: "",
    raw: false
  });

  return rows
    .map((row) => {
      const normalizedRow = {};

      Object.keys(row).forEach((key) => {
        normalizedRow[normalizeHeader(key)] = row[key];
      });

      return {
        rollNo: cellToString(
          normalizedRow.rollno || normalizedRow.rollnumber || normalizedRow.roll
        ),
        name: cellToString(normalizedRow.name || normalizedRow.studentname),
        phone: cellToString(
          normalizedRow.phone || normalizedRow.mobileno || normalizedRow.mobile
        )
      };
    })
    .filter((student) => student.rollNo && student.name && student.phone);
};

// Export user attendance summary with all classes
const exportUserSummary = (userName, classDetails) => {
  const worksheetData = [];

  // Header
  worksheetData.push(["User Attendance Summary Report"]);
  worksheetData.push([]);
  worksheetData.push([`User: ${userName}`]);
  worksheetData.push([]);

  // Overall Summary
  let totalPresent = 0,
    totalAbsent = 0,
    totalOD = 0,
    totalCount = 0;

  classDetails.forEach((classDetail) => {
    totalPresent += classDetail.summary.present;
    totalAbsent += classDetail.summary.absent;
    totalOD += classDetail.summary.od;
    totalCount += classDetail.summary.total;
  });

  worksheetData.push(["OVERALL SUMMARY"]);
  worksheetData.push(["Present", "Absent", "OD", "Total"]);
  worksheetData.push([totalPresent, totalAbsent, totalOD, totalCount]);
  worksheetData.push([]);

  // Class-wise breakdown
  classDetails.forEach((classDetail) => {
    worksheetData.push([`Class: ${classDetail.className}`]);
    worksheetData.push(["S.No", "Name", "Roll No", "Phone", "Status"]);

    classDetail.students.forEach((student, index) => {
      worksheetData.push([index + 1, student.name, student.rollNo, student.phone, student.status]);
    });

    worksheetData.push([]);
    worksheetData.push([`Summary - Present: ${classDetail.summary.present}, Absent: ${classDetail.summary.absent}, OD: ${classDetail.summary.od}`]);
    worksheetData.push([]);
  });

  const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "User Summary");

  return workbook;
};

// Export class attendance summary with all students
const exportClassSummary = (className, students, summary) => {
  const worksheetData = [];

  // Header
  worksheetData.push(["Class Attendance Report"]);
  worksheetData.push([]);
  worksheetData.push([`Class: ${className}`]);
  worksheetData.push([]);

  // Summary
  worksheetData.push(["SUMMARY"]);
  worksheetData.push(["Present", "Absent", "OD", "Total"]);
  worksheetData.push([summary.present, summary.absent, summary.od, summary.total]);
  worksheetData.push([]);

  // Students
  worksheetData.push(["S.No", "Name", "Roll No", "Department", "Phone", "Status"]);

  students.forEach((student, index) => {
    worksheetData.push([
      index + 1,
      student.name,
      student.rollNo,
      student.department || "N/A",
      student.phone,
      student.status
    ]);
  });

  const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Class Summary");

  return workbook;
};

// Export all users attendance summary
const exportAllUsersSummary = (usersData) => {
  const worksheetData = [];

  // Header
  worksheetData.push(["ALL USERS ATTENDANCE SUMMARY REPORT"]);
  worksheetData.push([]);
  worksheetData.push(["S.No", "Name", "Email", "Total Present", "Total Absent", "Total OD", "Total Students"]);

  usersData.forEach((user, index) => {
    worksheetData.push([
      index + 1,
      user.name,
      user.email,
      user.overallSummary.present,
      user.overallSummary.absent,
      user.overallSummary.od,
      user.overallSummary.total
    ]);
  });

  const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "All Users");

  return workbook;
};

module.exports = {
  readStudentsFromExcel,
  exportUserSummary,
  exportClassSummary,
  exportAllUsersSummary
};
