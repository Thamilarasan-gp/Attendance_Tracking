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

module.exports = {
  readStudentsFromExcel
};
