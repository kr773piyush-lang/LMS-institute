import Link from "next/link";

export default function LandingPage() {
  return (
    <section className="page-shell">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 p-8 shadow-sm">
        <h1 className="text-3xl font-bold sm:text-4xl">Multi-Tenant LMS Frontend</h1>
        <p className="mt-3 max-w-2xl text-slate-700">
          Fast, modular dashboard experience for Super Admin, Institute Admin, Teachers, and Students with secure auth and API-driven workflows.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          This demo home page
        </div>
      </div>
    </section>
  );
}
