const Course = require("../models/Course");
const Subcourse = require("../models/Subcourse");
const Module = require("../models/Module");
const SystemSetting = require("../models/SystemSetting");
const AppError = require("../utils/AppError");
const {
  hasRole,
  resolveInstituteScope,
  getTeacherScope,
  getStudentEnrollmentScope,
  sameId
} = require("./accessService");
const {
  serializeCourse,
  serializeSubcourse,
  serializeModule
} = require("../utils/serializers");

const findCourse = (courseId, instituteId) => Course.findOne({ _id: courseId, instituteId });
const findSubcourse = (subcourseId, instituteId) => Subcourse.findOne({ _id: subcourseId, instituteId });

const createCourse = async (payload, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });
  if (hasRole(currentUser, "teacher") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    throw new AppError("Teachers cannot create top-level courses.", 403);
  }

  const course = await Course.create({
    instituteId,
    courseName: payload.course_name,
    active: payload.active
  });
  return serializeCourse(course);
};

const listCourses = async ({ tenant, currentUser, instituteId }) => {
  const scopedInstituteId = await resolveInstituteScope({
    requestedInstituteId: instituteId,
    tenant,
    currentUser
  });

  const query = {
    instituteId: scopedInstituteId,
    ...(hasRole(currentUser, "super_admin") ? {} : { active: true })
  };
  const courses = await Course.find(query).sort({ createdAt: 1 });

  if (hasRole(currentUser, "teacher") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    const teacherScope = await getTeacherScope(currentUser._id, scopedInstituteId);
    return courses
      .filter((course) => teacherScope.courseIds.has(String(course._id)))
      .map(serializeCourse);
  }

  if (hasRole(currentUser, "student") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    const studentScope = await getStudentEnrollmentScope(currentUser._id, scopedInstituteId);
    return courses
      .filter((course) => studentScope.courseIds.has(String(course._id)))
      .map(serializeCourse);
  }

  return courses.map(serializeCourse);
};

const listPublicCourses = async () => {
  const settings = await SystemSetting.findOne().lean();
  if (!settings?.defaultInstituteId) {
    throw new AppError("System settings/default institute not configured.", 500);
  }

  const courses = await Course.find({
    instituteId: settings.defaultInstituteId,
    active: true
  }).sort({ createdAt: 1 });
  return courses.map(serializeCourse);
};

const updateCourse = async (id, payload, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });
  const course = await findCourse(id, instituteId);
  if (!course) throw new AppError("Course not found.", 404);

  course.courseName = payload.course_name;
  course.active = payload.active;
  await course.save();
  return serializeCourse(course);
};

const deleteCourse = async (id, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({ tenant, currentUser });
  const course = await findCourse(id, instituteId);
  if (!course) throw new AppError("Course not found.", 404);
  course.active = false;
  await course.save();
};

const createSubcourse = async (payload, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });
  if (hasRole(currentUser, "teacher") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    throw new AppError("Teachers cannot create top-level subcourses.", 403);
  }

  const course = await findCourse(payload.course_id, instituteId);
  if (!course) throw new AppError("Course not found.", 404);

  const subcourse = await Subcourse.create({
    instituteId,
    courseId: payload.course_id,
    subcourseName: payload.subcourse_name,
    active: payload.active
  });
  return serializeSubcourse(subcourse);
};

const listSubcourses = async ({ tenant, currentUser, instituteId, courseId }) => {
  const scopedInstituteId = await resolveInstituteScope({
    requestedInstituteId: instituteId,
    tenant,
    currentUser
  });

  const query = {
    instituteId: scopedInstituteId,
    ...(courseId ? { courseId } : {}),
    ...(hasRole(currentUser, "super_admin") ? {} : { active: true })
  };
  const subcourses = await Subcourse.find(query).sort({ createdAt: 1 });

  if (hasRole(currentUser, "teacher") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    const teacherScope = await getTeacherScope(currentUser._id, scopedInstituteId);
    return subcourses
      .filter((item) => teacherScope.coursePairs.has(`${String(item.courseId)}::${String(item._id)}`))
      .map(serializeSubcourse);
  }

  if (hasRole(currentUser, "student") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    const studentScope = await getStudentEnrollmentScope(currentUser._id, scopedInstituteId);
    return subcourses
      .filter((item) => studentScope.coursePairs.has(`${String(item.courseId)}::${String(item._id)}`))
      .map(serializeSubcourse);
  }

  return subcourses.map(serializeSubcourse);
};

const listPublicSubcourses = async (courseId) => {
  const settings = await SystemSetting.findOne().lean();
  if (!settings?.defaultInstituteId) {
    throw new AppError("System settings/default institute not configured.", 500);
  }

  const subcourses = await Subcourse.find({
    instituteId: settings.defaultInstituteId,
    active: true,
    ...(courseId ? { courseId } : {})
  }).sort({ createdAt: 1 });
  return subcourses.map(serializeSubcourse);
};

const updateSubcourse = async (id, payload, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });
  const subcourse = await findSubcourse(id, instituteId);
  if (!subcourse) throw new AppError("Subcourse not found.", 404);

  const course = await findCourse(payload.course_id, instituteId);
  if (!course) throw new AppError("Course not found.", 404);

  subcourse.courseId = payload.course_id;
  subcourse.subcourseName = payload.subcourse_name;
  subcourse.active = payload.active;
  await subcourse.save();
  return serializeSubcourse(subcourse);
};

const deleteSubcourse = async (id, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({ tenant, currentUser });
  const subcourse = await findSubcourse(id, instituteId);
  if (!subcourse) throw new AppError("Subcourse not found.", 404);
  subcourse.active = false;
  await subcourse.save();
};

const createModule = async (payload, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });
  const subcourse = await findSubcourse(payload.subcourse_id, instituteId);
  if (!subcourse || !sameId(subcourse.courseId, payload.course_id)) {
    throw new AppError("Subcourse not found.", 404);
  }

  if (hasRole(currentUser, "teacher") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    const teacherScope = await getTeacherScope(currentUser._id, instituteId);
    if (!teacherScope.coursePairs.has(`${payload.course_id}::${payload.subcourse_id}`)) {
      throw new AppError("Teachers can only manage course data for their assigned batches.", 403);
    }
  }

  const moduleItem = await Module.create({
    instituteId,
    courseId: payload.course_id,
    subcourseId: payload.subcourse_id,
    moduleName: payload.module_name,
    active: payload.active
  });
  return serializeModule(moduleItem);
};

const listModules = async ({ tenant, currentUser, instituteId, courseId, subcourseId }) => {
  const scopedInstituteId = await resolveInstituteScope({
    requestedInstituteId: instituteId,
    tenant,
    currentUser
  });

  const query = {
    instituteId: scopedInstituteId,
    ...(courseId ? { courseId } : {}),
    ...(subcourseId ? { subcourseId } : {}),
    ...(hasRole(currentUser, "super_admin") ? {} : { active: true })
  };
  const modules = await Module.find(query).sort({ createdAt: 1 });

  if (hasRole(currentUser, "teacher") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    const teacherScope = await getTeacherScope(currentUser._id, scopedInstituteId);
    return modules
      .filter((item) => teacherScope.coursePairs.has(`${String(item.courseId)}::${String(item.subcourseId)}`))
      .map(serializeModule);
  }

  if (hasRole(currentUser, "student") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    const studentScope = await getStudentEnrollmentScope(currentUser._id, scopedInstituteId);
    return modules
      .filter((item) => studentScope.coursePairs.has(`${String(item.courseId)}::${String(item.subcourseId)}`))
      .map(serializeModule);
  }

  return modules.map(serializeModule);
};

module.exports = {
  createCourse,
  listCourses,
  listPublicCourses,
  updateCourse,
  deleteCourse,
  createSubcourse,
  listSubcourses,
  listPublicSubcourses,
  updateSubcourse,
  deleteSubcourse,
  createModule,
  listModules
};
