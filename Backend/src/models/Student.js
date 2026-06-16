const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true
    },
    rollNo: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["absent", "present", "od"],
      default: "absent"
    },
    frozen: {
      type: Boolean,
      default: false
    },
    attendanceHistory: [
      {
        date: {
          type: Date,
          default: Date.now
        },
        status: {
          type: String,
          enum: ["absent", "present", "od"]
        },
        changedBy: String
      }
    ]
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false
    }
  }
);

studentSchema.index({ classId: 1, rollNo: 1 }, { unique: true });
studentSchema.index({ classId: 1, status: 1 });

module.exports = mongoose.model("Student", studentSchema);
