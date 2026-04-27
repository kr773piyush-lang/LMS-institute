const asyncHandler = require("../utils/asyncHandler");
const enrollmentService = require("../services/enrollmentService");
const batchService = require("../services/batchService");

exports.enroll = asyncHandler(async (req, res) =>
  res.status(201).json(await enrollmentService.enrollUser(req.body, req.tenant, req.user))
);
exports.assignBatch = asyncHandler(async (req, res) =>
  res.status(201).json(await batchService.assignUserToBatch(req.body, req.tenant, req.user))
);
