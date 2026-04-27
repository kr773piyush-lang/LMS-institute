const UserProgress = require("../models/Progress");
const { UserModule } = require("../models/Enrollment");
const AppError = require("../utils/AppError");
const { serializeProgress } = require("../utils/serializers");

const markComplete = async (payload, user, tenant) => {
  const userModule = await UserModule.findOne({
    userId: user._id,
    instituteId: tenant.instituteId,
    moduleId: payload.module_id,
    active: true
  });
  if (!userModule) {
    throw new AppError("Module not found for the current user.", 404);
  }

  const progress = await UserProgress.findOneAndUpdate(
    { userId: user._id, moduleId: payload.module_id, instituteId: tenant.instituteId },
    {
      completed: payload.completed,
      progressPercent: payload.progress_percent,
      lastAccessed: new Date()
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return serializeProgress(progress);
};

const listMyProgress = async (user, tenant) => {
  const progress = await UserProgress.find({
    userId: user._id,
    instituteId: tenant.instituteId
  }).sort({ lastAccessed: -1 });
  return progress.map(serializeProgress);
};

module.exports = { markComplete, listMyProgress };
