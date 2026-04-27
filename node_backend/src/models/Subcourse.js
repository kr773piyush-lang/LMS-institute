const mongoose = require("mongoose");

const subcourseSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
      index: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true
    },
    subcourseName: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

subcourseSchema.index({ courseId: 1, subcourseName: 1 }, { unique: true });

module.exports = mongoose.model("Subcourse", subcourseSchema);
