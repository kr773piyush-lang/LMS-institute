import { Role } from "@/types/auth";

export interface NavItem {
  label: string;
  href: string;
  description?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_BY_ROLE: Record<Role, NavGroup[]> = {
  super_admin: [
    {
      title: "Management",
      items: [
        {
          label: "Institute Info",
          href: "/dashboard/admin/institutes",
          description: "Create and review institute records"
        },
        {
          label: "Courses & SubCourses",
          href: "/dashboard/admin/courses",
          description: "Manage course hierarchy and content"
        },
        {
          label: "Users Info",
          href: "/dashboard/admin/users",
          description: "Approve users and assign roles"
        },
        {
          label: "Teachers Info",
          href: "/dashboard/admin/teachers",
          description: "Manage teacher accounts"
        }
      ]
    }
  ],
  institute_admin: [
    {
      title: "Management",
      items: [
        {
          label: "Users Info",
          href: "/dashboard/institute-admin/users",
          description: "Manage approvals and enrollment"
        },
        {
          label: "Courses & SubCourses",
          href: "/dashboard/institute-admin/courses",
          description: "Create academic structure"
        },
        {
          label: "Batches",
          href: "/dashboard/institute-admin/batches",
          description: "Organize delivery groups"
        }
      ]
    }
  ],
  teacher: [
    {
      title: "Teaching",
      items: [
        { label: "My Batches", href: "/dashboard/teacher/batches", description: "Assigned class groups" },
        { label: "Modules", href: "/dashboard/teacher/modules", description: "Learning modules" }
      ]
    }
  ],
  student: [
    {
      title: "Learning",
      items: [
        { label: "My Courses", href: "/dashboard/student/courses", description: "Enrolled programs" },
        { label: "My Modules", href: "/dashboard/student/modules", description: "Study material and progress" }
      ]
    }
  ]
};
