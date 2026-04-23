import { Role } from "@/types/auth";

export const ROLE_HOME: Record<Role, string> = {
  super_admin: "/dashboard/admin/institutes",
  institute_admin: "/dashboard/institute-admin/users",
  teacher: "/dashboard/teacher/batches",
  student: "/dashboard/student/courses"
};

export const PROTECTED_PREFIX = "/dashboard";

export function getRoleHome(role: Role | null | undefined) {
  if (!role) {
    return "/login";
  }
  return ROLE_HOME[role] ?? "/login";
}
