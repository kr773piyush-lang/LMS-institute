"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { ROLE_HOME } from "@/constants/routes";
import { useAuthStore } from "@/store/auth";

export function useRouteGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!role) {
      router.replace("/login");
      return;
    }
    if (pathname.startsWith("/dashboard/admin") && role !== "super_admin") {
      router.replace(ROLE_HOME[role]);
    }
    if (pathname.startsWith("/dashboard/institute-admin") && role !== "institute_admin") {
      router.replace(ROLE_HOME[role]);
    }
    if (pathname.startsWith("/dashboard/teacher") && role !== "teacher") {
      router.replace(ROLE_HOME[role]);
    }
    if (pathname.startsWith("/dashboard/student") && role !== "student") {
      router.replace(ROLE_HOME[role]);
    }
  }, [isHydrated, pathname, role, router, token]);

  return { token, role, isHydrated };
}
