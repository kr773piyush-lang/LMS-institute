export default function ContactPage() {
  return (
    <section className="page-shell">
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">Contact</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Contact Us</h1>
        <div className="mt-4 space-y-3 text-slate-600">
          <p>Email: support@institutelms.com</p>
          <p>Phone: +91 99999 99999</p>
          <p>Address: 123 Learning Avenue, Academic District</p>
        </div>
      </div>
    </section>
  );
}
