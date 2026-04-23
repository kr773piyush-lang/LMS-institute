"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ROLE_HOME } from "@/constants/routes";
import { useAuthStore } from "@/store/auth";

export default function DashboardEntryPage() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);

  useEffect(() => {
    if (role) {
      router.replace(ROLE_HOME[role]);
    }
  }, [role, router]);

  return <p className="text-sm text-slate-600">Redirecting...</p>;
}
