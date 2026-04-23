"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { ROLE_HOME } from "@/constants/routes";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/Button";

const ROLE_LABELS = {
  super_admin: "Super Admin",
  institute_admin: "Institute Admin",
  teacher: "Teacher",
  student: "Student"
} as const;

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const userEmail = useAuthStore((state) => state.userEmail);
  const instituteId = useAuthStore((state) => state.instituteId);
  const logout = useAuthStore((state) => state.logout);

  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <header className="border-b bg-white">
      <div className="page-shell flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href={role ? ROLE_HOME[role] : "/"} className="text-xl font-semibold text-brand-700">
            Institute LMS
          </Link>
          {role ? (
            <div className="hidden rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 md:block">
              {ROLE_LABELS[role]}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col items-start gap-3 md:flex-row md:items-center">
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link href="/" className="rounded-md px-3 py-2 hover:bg-slate-100">
              Home
            </Link>
            <Link href="/about" className="rounded-md px-3 py-2 hover:bg-slate-100">
              About
            </Link>
            <Link href="/contact" className="rounded-md px-3 py-2 hover:bg-slate-100">
              Contact
            </Link>
            {role ? (
              <Link href={ROLE_HOME[role]} className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50">
                {isDashboard ? "Dashboard Home" : "Dashboard"}
              </Link>
            ) : (
              <>
                <Link href="/login" className="rounded-md border px-3 py-1.5 hover:bg-slate-100">
                  Login
                </Link>
                <Link href="/register" className="rounded-md bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700">
                  Register
                </Link>
              </>
            )}
          </nav>
          {role ? (
            <div className="flex flex-col items-start gap-3 md:flex-row md:items-center">
              <div className="text-sm text-slate-600">
                <p className="font-medium text-slate-800">{userEmail ?? "Signed in user"}</p>
                <p>{instituteId ? `Institute ID: ${instituteId}` : "Global admin access"}</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  logout();
                  router.replace("/login");
                }}
              >
                Logout
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
