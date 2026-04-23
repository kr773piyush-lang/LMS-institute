"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getRoleHome } from "@/constants/routes";
import { useAuthStore } from "@/store/auth";
import { useUiStore } from "@/store/ui";

export default function DashboardEntryPage() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const startNavigation = useUiStore((state) => state.startNavigation);

  useEffect(() => {
    if (role) {
      startNavigation();
      router.replace(getRoleHome(role));
    }
  }, [role, router, startNavigation]);

  return <p className="text-sm text-slate-600">Redirecting...</p>;
}
