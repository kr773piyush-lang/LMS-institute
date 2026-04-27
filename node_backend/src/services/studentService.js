const Content = require("../models/Content");
const Module = require("../models/Module");
const StudentSubmission = require("../models/StudentSubmission");
const { UserBatch, UserCourse, UserModule } = require("../models/Enrollment");
const AppError = require("../utils/AppError");
const { serializeContent, serializeStudentSubmission } = require("../utils/serializers");

const getEnrolledCourses = async (user, tenant) => {
  const enrolled = await UserCourse.find({
    userId: user._id,
    instituteId: tenant.instituteId
  }).populate("courseId subcourseId");

  return enrolled
    .filter((item) => item.courseId?.active && item.subcourseId?.active)
    .map((item) => ({
      course_id: String(item.courseId._id),
      course_name: item.courseId.courseName,
      subcourse_id: String(item.subcourseId._id),
      subcourse_name: item.subcourseId.subcourseName
    }));
};

const getModulesContent = async (user, tenant) => {
  const userModules = await UserModule.find({
    userId: user._id,
    instituteId: tenant.instituteId,
    active: true
  }).lean();

  const output = [];
  for (const userModule of userModules) {
    const moduleItem = await Module.findOne({
      _id: userModule.moduleId,
      instituteId: tenant.instituteId,
      active: true
    });
    if (!moduleItem) continue;

    const contents = await Content.find({
      moduleId: moduleItem._id,
      instituteId: tenant.instituteId
    }).sort({ orderIndex: 1, createdAt: 1, _id: 1 });

    output.push({
      module_id: String(moduleItem._id),
      module_name: moduleItem.moduleName,
      content: contents.map(serializeContent)
    });
  }

  return output;
};

const getStudentBatches = async (user, tenant) => {
  const assignments = await UserBatch.find({
    userId: user._id,
    instituteId: tenant.instituteId,
    active: true
  }).populate({
    path: "batchId",
    populate: [{ path: "courseId" }, { path: "subcourseId" }]
  });

  return assignments
    .filter((row) => row.batchId?.active)
    .map((row) => ({
      batch_id: String(row.batchId._id),
      batch_name: row.batchId.batchName,
      course_id: String(row.batchId.courseId?._id || row.batchId.courseId),
      course_name: row.batchId.courseId?.courseName || String(row.batchId.courseId),
      subcourse_id: String(row.batchId.subcourseId?._id || row.batchId.subcourseId),
      subcourse_name: row.batchId.subcourseId?.subcourseName || String(row.batchId.subcourseId),
      description: row.batchId.detail?.description ?? null,
      room_name: row.batchId.detail?.roomName ?? null,
      schedule_notes: row.batchId.detail?.scheduleNotes ?? null,
      start_date: row.batchId.detail?.startDate ?? null,
      end_date: row.batchId.detail?.endDate ?? null
    }));
};

const getCourseWorkspace = async (courseId, category, user, tenant) => {
  const batches = (await getStudentBatches(user, tenant)).filter((batch) => batch.course_id === courseId);
  if (!batches.length) {
    return {
      course_id: courseId,
      batches: [],
      modules: [],
      content_categories: []
    };
  }

  const allowedSubcourseIds = [...new Set(batches.map((batch) => batch.subcourse_id))];
  const modules = await Module.find({
    instituteId: tenant.instituteId,
    courseId,
    subcourseId: { $in: allowedSubcourseIds },
    active: true
  }).sort({ createdAt: 1 });

  const contents = modules.length
    ? await Content.find({
        instituteId: tenant.instituteId,
        moduleId: { $in: modules.map((moduleItem) => moduleItem._id) }
      }).sort({ orderIndex: 1, createdAt: 1, _id: 1 })
    : [];

  const submissions = contents.length
    ? await StudentSubmission.find({
        userId: user._id,
        instituteId: tenant.instituteId,
        contentId: { $in: contents.map((content) => content._id) }
      })
    : [];
  const submissionsByContent = new Map(
    submissions.map((submission) => [String(submission.contentId), serializeStudentSubmission(submission)])
  );

  const availableCategories = [...new Set(contents.map((content) => content.profile?.category).filter(Boolean))].sort();
  const filteredContents = category
    ? contents.filter((content) => content.profile?.category === category)
    : contents;

  const contentByModule = new Map();
  for (const content of filteredContents) {
    const serialized = {
      ...serializeContent(content),
      submission: submissionsByContent.get(String(content._id)) || null
    };
    if (!contentByModule.has(String(content.moduleId))) {
      contentByModule.set(String(content.moduleId), []);
    }
    contentByModule.get(String(content.moduleId)).push(serialized);
  }

  return {
    course_id: courseId,
    course_name: batches[0].course_name,
    batches,
    content_categories: availableCategories,
    selected_category: category || null,
    modules: modules
      .filter((moduleItem) => (contentByModule.get(String(moduleItem._id)) || []).length)
      .map((moduleItem) => ({
        module_id: String(moduleItem._id),
        module_name: moduleItem.moduleName,
        subcourse_id: String(moduleItem.subcourseId),
        subcourse_name:
          batches.find((batch) => batch.subcourse_id === String(moduleItem.subcourseId))?.subcourse_name ||
          String(moduleItem.subcourseId),
        content: contentByModule.get(String(moduleItem._id)) || []
      }))
  };
};

const submitContent = async (payload, user, tenant) => {
  const content = await Content.findById(payload.content_id);
  if (!content) throw new AppError("Content not found.", 400);

  const moduleItem = await Module.findById(content.moduleId);
  if (!moduleItem) throw new AppError("Content not found.", 400);

  const workspace = await getCourseWorkspace(String(moduleItem.courseId), null, user, tenant);
  const allowedContentIds = new Set(
    workspace.modules.flatMap((moduleEntry) => moduleEntry.content.map((item) => item.content_id))
  );
  if (!allowedContentIds.has(payload.content_id)) {
    throw new AppError("Content access denied.", 400);
  }

  const submission = await StudentSubmission.findOneAndUpdate(
    {
      userId: user._id,
      instituteId: tenant.instituteId,
      contentId: payload.content_id
    },
    {
      responseType: payload.response_type,
      responseText: payload.response_text,
      responseUrl: payload.response_url,
      submittedAt: new Date()
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return serializeStudentSubmission(submission);
};

module.exports = {
  getEnrolledCourses,
  getModulesContent,
  getStudentBatches,
  getCourseWorkspace,
  submitContent
};
