const bcrypt = require("bcryptjs");
const Institute = require("../models/Institute");
const Module = require("../models/Module");
const User = require("../models/User");
const { UserCourse, UserModule, UserSelectedCourse } = require("../models/Enrollment");
const AppError = require("../utils/AppError");
const { hasRole, resolveInstituteScope, sameId } = require("./accessService");
const { serializeUser } = require("../utils/serializers");

const getScopedUser = async (id, tenant, currentUser) => {
  const user = await User.findById(id).populate("instituteId");
  if (!user) throw new AppError("User not found.", 404);
  if (!hasRole(currentUser, "super_admin") && !sameId(user.instituteId?._id || user.instituteId, tenant.instituteId)) {
    throw new AppError("User not found.", 404);
  }
  return user;
};

const listUsers = async ({ instituteId, tenant, currentUser }) => {
  const scopedInstituteId = await resolveInstituteScope({
    requestedInstituteId: instituteId,
    tenant,
    currentUser
  });

  const query = hasRole(currentUser, "super_admin")
    ? { instituteId: scopedInstituteId }
    : { instituteId: scopedInstituteId, active: true };

  const users = await User.find(query).populate("instituteId").sort({ createdAt: -1 });
  return users.map(serializeUser);
};

const createUser = async (payload, tenant, currentUser) => {
  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });
  if (existingUser) throw new AppError("Email already registered.", 409);

  const scopedInstituteId =
    hasRole(currentUser, "super_admin") && payload.institute_id
      ? await resolveInstituteScope({
          requestedInstituteId: payload.institute_id,
          tenant,
          currentUser
        })
      : tenant.instituteId;

  const institute = await Institute.findById(scopedInstituteId);
  if (!institute) throw new AppError("Institute not found.", 404);

  const hash = await bcrypt.hash(payload.password, 12);
  const user = await User.create({
    instituteId: scopedInstituteId,
    firstName: payload.first_name,
    lastName: payload.last_name,
    email: payload.email.toLowerCase(),
    mobNo: payload.mob_no,
    passwordHash: hash,
    roles: payload.role_names || ["student"],
    active: payload.active,
    isApproved: payload.is_approved
  });

  await user.populate("instituteId");
  return serializeUser(user);
};

const updateUser = async (id, payload, tenant, currentUser) => {
  const user = await getScopedUser(id, tenant, currentUser);
  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });
  if (existingUser && !sameId(existingUser._id, user._id)) {
    throw new AppError("Email already registered.", 409);
  }

  user.firstName = payload.first_name;
  user.lastName = payload.last_name;
  user.email = payload.email.toLowerCase();
  user.mobNo = payload.mob_no;
  user.active = payload.active;
  user.isApproved = payload.is_approved;
  if (payload.role_names) {
    user.roles = [...new Set(payload.role_names)];
  }

  await user.save();
  await user.populate("instituteId");
  return serializeUser(user);
};

const approveUser = async (id, approve, tenant) => {
  const user = await User.findById(id).populate("instituteId");
  if (!user || !sameId(user.instituteId?._id || user.instituteId, tenant.instituteId)) {
    throw new AppError("User not found.", 404);
  }

  user.isApproved = Boolean(approve);
  if (approve) {
    const instituteId = user.instituteId?._id || user.instituteId;
    const selectedCourses = await UserSelectedCourse.find({ userId: user._id });
    const existingEnrollments = await UserCourse.find({ userId: user._id, instituteId });
    const existingPairs = new Set(
      existingEnrollments.map((item) => `${String(item.courseId)}::${String(item.subcourseId)}`)
    );

    const existingUserModules = await UserModule.find({ userId: user._id, instituteId });
    const existingModuleIds = new Set(existingUserModules.map((item) => String(item.moduleId)));

    for (const selected of selectedCourses) {
      const pairKey = `${String(selected.courseId)}::${String(selected.subcourseId)}`;
      if (!existingPairs.has(pairKey)) {
        await UserCourse.create({
          instituteId,
          userId: user._id,
          courseId: selected.courseId,
          subcourseId: selected.subcourseId
        });
        existingPairs.add(pairKey);
      }

      const modules = await Module.find({ instituteId, subcourseId: selected.subcourseId }).lean();
      for (const module of modules) {
        if (existingModuleIds.has(String(module._id))) continue;
        await UserModule.create({
          instituteId,
          userId: user._id,
          moduleId: module._id,
          active: true
        });
        existingModuleIds.add(String(module._id));
      }
    }

    await UserSelectedCourse.deleteMany({ userId: user._id });
  }

  await user.save();
  return serializeUser(user);
};

const assignUserInstitute = async (id, instituteId) => {
  const user = await User.findById(id).populate("instituteId");
  if (!user) throw new AppError("User not found.", 404);

  const institute = await Institute.findById(instituteId);
  if (!institute) throw new AppError("Institute not found.", 404);

  user.instituteId = institute._id;
  await user.save();
  await user.populate("instituteId");
  return serializeUser(user);
};

const assignRoles = async (id, roleNames, tenant, currentUser) => {
  const user = await getScopedUser(id, tenant, currentUser);
  user.roles = [...new Set([...(user.roles || []), ...roleNames])];
  await user.save();
  return [...user.roles].sort();
};

const deleteUser = async (id, tenant, currentUser) => {
  const user = await getScopedUser(id, tenant, currentUser);
  user.active = false;
  await user.save();
};

const updateProfile = async (currentUser, payload) => {
  const user = await User.findById(currentUser._id).select("+passwordHash").populate("instituteId");
  if (!user) throw new AppError("User not found.", 404);

  const passwordOk = await bcrypt.compare(payload.current_password, user.passwordHash);
  if (!passwordOk) throw new AppError("Current password is incorrect.", 401);

  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });
  if (existingUser && !sameId(existingUser._id, user._id)) {
    throw new AppError("Email already registered.", 409);
  }

  user.email = payload.email.toLowerCase();
  if (payload.new_password) {
    user.passwordHash = await bcrypt.hash(payload.new_password, 12);
  }

  await user.save();
  return serializeUser(user);
};

module.exports = {
  listUsers,
  createUser,
  updateUser,
  approveUser,
  assignUserInstitute,
  assignRoles,
  deleteUser,
  updateProfile
};
