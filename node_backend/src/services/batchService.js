const Batch = require("../models/Batch");
const Course = require("../models/Course");
const Subcourse = require("../models/Subcourse");
const User = require("../models/User");
const { BatchTeacher, UserBatch } = require("../models/Enrollment");
const AppError = require("../utils/AppError");
const {
  hasRole,
  resolveInstituteScope,
  getTeacherScope,
  getStudentBatchScope,
  sameId
} = require("./accessService");
const {
  serializeBatch,
  serializeBatchTeacher,
  serializeUser,
  serializeUserBatch
} = require("../utils/serializers");

const findCourse = (courseId, instituteId) => Course.findOne({ _id: courseId, instituteId });
const findSubcourse = (subcourseId, instituteId) => Subcourse.findOne({ _id: subcourseId, instituteId });

const createBatch = async (payload, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });
  const course = await findCourse(payload.course_id, instituteId);
  const subcourse = await findSubcourse(payload.subcourse_id, instituteId);
  if (!course || !subcourse || !sameId(subcourse.courseId, payload.course_id)) {
    throw new AppError("Course or subcourse not found for this institute.", 404);
  }

  const batch = await Batch.create({
    instituteId,
    courseId: payload.course_id,
    subcourseId: payload.subcourse_id,
    batchName: payload.batch_name,
    active: payload.active,
    detail: {
      description: payload.description,
      roomName: payload.room_name,
      scheduleNotes: payload.schedule_notes,
      startDate: payload.start_date,
      endDate: payload.end_date
    }
  });
  return serializeBatch(batch);
};

const updateBatch = async (id, payload, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });
  const batch = await Batch.findOne({ _id: id, instituteId });
  if (!batch) throw new AppError("Batch not found.", 404);

  const course = await findCourse(payload.course_id, instituteId);
  const subcourse = await findSubcourse(payload.subcourse_id, instituteId);
  if (!course || !subcourse || !sameId(subcourse.courseId, payload.course_id)) {
    throw new AppError("Course or subcourse not found for this institute.", 404);
  }

  batch.courseId = payload.course_id;
  batch.subcourseId = payload.subcourse_id;
  batch.batchName = payload.batch_name;
  batch.active = payload.active;
  batch.detail = {
    description: payload.description,
    roomName: payload.room_name,
    scheduleNotes: payload.schedule_notes,
    startDate: payload.start_date,
    endDate: payload.end_date
  };
  await batch.save();
  return serializeBatch(batch);
};

const listBatches = async ({ tenant, currentUser, instituteId }) => {
  const scopedInstituteId = await resolveInstituteScope({
    requestedInstituteId: instituteId,
    tenant,
    currentUser
  });

  const query = {
    instituteId: scopedInstituteId,
    ...(hasRole(currentUser, "super_admin") ? {} : { active: true })
  };
  const batches = await Batch.find(query).sort({ createdAt: 1 });

  if (hasRole(currentUser, "teacher") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    const teacherScope = await getTeacherScope(currentUser._id, scopedInstituteId);
    return batches
      .filter((batch) => teacherScope.batchIds.has(String(batch._id)))
      .map(serializeBatch);
  }

  if (hasRole(currentUser, "student") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    const studentScope = await getStudentBatchScope(currentUser._id, scopedInstituteId);
    return batches
      .filter((batch) => studentScope.batchIds.has(String(batch._id)))
      .map(serializeBatch);
  }

  return batches.map(serializeBatch);
};

const getBatchDetail = async (batchId, tenant, currentUser, instituteId) => {
  const scopedInstituteId = await resolveInstituteScope({
    requestedInstituteId: instituteId,
    tenant,
    currentUser
  });
  const batch = await Batch.findOne({ _id: batchId, instituteId: scopedInstituteId });
  if (!batch) throw new AppError("Batch not found.", 404);

  if (hasRole(currentUser, "teacher") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    const teacherScope = await getTeacherScope(currentUser._id, scopedInstituteId);
    if (!teacherScope.batchIds.has(String(batch._id))) {
      throw new AppError("Batch access denied.", 403);
    }
  }

  if (hasRole(currentUser, "student") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    const studentScope = await getStudentBatchScope(currentUser._id, scopedInstituteId);
    if (!studentScope.batchIds.has(String(batch._id))) {
      throw new AppError("Batch access denied.", 403);
    }
  }

  const course = await Course.findById(batch.courseId);
  const subcourse = await Subcourse.findById(batch.subcourseId);
  const teacherRows = await BatchTeacher.find({
    batchId: batch._id,
    instituteId: scopedInstituteId
  });
  const studentRows = await UserBatch.find({
    batchId: batch._id,
    instituteId: scopedInstituteId
  });

  const teacherIds = teacherRows.map((row) => row.userId);
  const studentIds = studentRows.map((row) => row.userId);
  const teachers = await User.find({ _id: { $in: teacherIds }, active: true }).populate("instituteId");
  const students = await User.find({ _id: { $in: studentIds }, active: true }).populate("instituteId");

  return {
    batch_id: String(batch._id),
    batch_name: batch.batchName,
    active: batch.active,
    description: batch.detail?.description ?? null,
    room_name: batch.detail?.roomName ?? null,
    schedule_notes: batch.detail?.scheduleNotes ?? null,
    start_date: batch.detail?.startDate ?? null,
    end_date: batch.detail?.endDate ?? null,
    course: {
      course_id: String(course?._id || batch.courseId),
      course_name: course?.courseName || String(batch.courseId)
    },
    subcourse: {
      subcourse_id: String(subcourse?._id || batch.subcourseId),
      subcourse_name: subcourse?.subcourseName || String(batch.subcourseId)
    },
    teachers: teachers.map(serializeUser),
    students: students.map(serializeUser)
  };
};

const deleteBatch = async (id, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({ tenant, currentUser });
  const batch = await Batch.findOne({ _id: id, instituteId });
  if (!batch) throw new AppError("Batch not found.", 404);
  batch.active = false;
  await batch.save();
};

const assignTeacher = async (payload, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });
  const batch = await Batch.findOne({ _id: payload.batch_id, instituteId });
  if (!batch) throw new AppError("Batch not found.", 404);

  const teacher = await User.findById(payload.user_id);
  if (!teacher || !sameId(teacher.instituteId, instituteId)) {
    throw new AppError("Teacher not found.", 404);
  }

  const existing = await BatchTeacher.findOne({
    instituteId,
    batchId: payload.batch_id,
    userId: payload.user_id
  });
  if (existing) throw new AppError("Teacher already assigned to batch.", 409);

  const row = await BatchTeacher.create({
    instituteId,
    batchId: payload.batch_id,
    userId: payload.user_id
  });
  return serializeBatchTeacher(row);
};

const assignUserToBatch = async (payload, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });
  const batch = await Batch.findOne({ _id: payload.batch_id, instituteId });
  if (!batch) throw new AppError("Batch not found.", 404);

  const user = await User.findById(payload.user_id);
  if (!user || !sameId(user.instituteId, instituteId)) {
    throw new AppError("User not found.", 404);
  }

  const existing = await UserBatch.findOne({
    instituteId,
    batchId: payload.batch_id,
    userId: payload.user_id
  });
  if (existing) throw new AppError("User already assigned to batch.", 409);

  const row = await UserBatch.create({
    instituteId,
    userId: payload.user_id,
    batchId: payload.batch_id,
    active: true
  });
  return serializeUserBatch(row);
};

module.exports = {
  createBatch,
  updateBatch,
  listBatches,
  getBatchDetail,
  deleteBatch,
  assignTeacher,
  assignUserToBatch
};
