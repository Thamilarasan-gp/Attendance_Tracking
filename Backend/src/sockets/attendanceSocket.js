const registerAttendanceSocket = (io) => {
  io.on("connection", (socket) => {
    socket.on("joinClass", ({ classId }) => {
      if (!classId) {
        return;
      }

      socket.join(`class_${classId}`);
    });

    socket.on("attendanceUpdated", ({ studentId, classId, status }) => {
      if (!studentId || !classId || !status) {
        return;
      }

      socket.to(`class_${classId}`).emit("attendanceUpdated", {
        studentId,
        classId,
        status
      });
    });

    socket.on("attendanceReset", ({ classId }) => {
      if (!classId) {
        return;
      }

      socket.to(`class_${classId}`).emit("attendanceReset", { classId });
    });

    socket.on("summaryUpdated", ({ classId, total, present, od, absent }) => {
      if (!classId) {
        return;
      }

      socket.to(`class_${classId}`).emit("summaryUpdated", {
        total,
        present,
        od,
        absent
      });
    });
  });
};

module.exports = registerAttendanceSocket;
