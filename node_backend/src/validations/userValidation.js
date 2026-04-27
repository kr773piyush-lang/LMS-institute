const Joi = require("joi");

const rolesSchema = Joi.array()
  .items(Joi.string().valid("super_admin", "institute_admin", "teacher", "student"))
  .min(1);

exports.userCreateSchema = Joi.object({
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  email: Joi.string().email().required(),
  mob_no: Joi.string().required(),
  password: Joi.string().min(8).required(),
  is_approved: Joi.boolean().default(false),
  active: Joi.boolean().default(true),
  institute_id: Joi.string().optional(),
  role_names: rolesSchema.default(["student"])
});

exports.userUpdateSchema = Joi.object({
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  email: Joi.string().email().required(),
  mob_no: Joi.string().required(),
  is_approved: Joi.boolean().default(false),
  active: Joi.boolean().default(true),
  institute_id: Joi.string().optional(),
  role_names: rolesSchema.optional()
});

exports.userApproveSchema = Joi.object({
  approve: Joi.boolean().default(true)
});

exports.assignRolesSchema = Joi.object({
  role_names: rolesSchema.required()
});

exports.assignInstituteSchema = Joi.object({
  institute_id: Joi.string().required()
});

exports.profileUpdateSchema = Joi.object({
  email: Joi.string().email().required(),
  current_password: Joi.string().required(),
  new_password: Joi.string().min(8).allow("", null)
});
