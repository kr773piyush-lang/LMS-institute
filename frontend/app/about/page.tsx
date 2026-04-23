export default function AboutPage() {
  return (
    <section className="page-shell">
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">About</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">About Institute LMS</h1>
        <p className="mt-4 max-w-3xl text-slate-600">
          Institute LMS is a role-based learning platform designed for super admins, institute admins,
          teachers, and students. It helps institutes organize courses, enroll learners, and manage
          academic delivery from one connected system.
        </p>
      </div>
    </section>
  );
}
