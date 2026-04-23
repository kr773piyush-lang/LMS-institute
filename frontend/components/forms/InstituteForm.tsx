"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCreateInstituteMutation } from "@/hooks/useLmsQueries";

export function InstituteForm() {
  const createInstitute = useCreateInstituteMutation();
  const [form, setForm] = useState({
    name: "",
    email: "",
    mob_no: "",
    country: "",
    state: "",
    place: "",
    pincode: ""
  });

  const update = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    createInstitute.mutate(form);
  };

  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
      <Input label="Institute Name" required value={form.name} onChange={(e) => update("name", e.target.value)} />
      <Input label="Email" type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} />
      <Input label="Mobile" required value={form.mob_no} onChange={(e) => update("mob_no", e.target.value)} />
      <Input label="Country" required value={form.country} onChange={(e) => update("country", e.target.value)} />
      <Input label="State" required value={form.state} onChange={(e) => update("state", e.target.value)} />
      <Input label="Place" required value={form.place} onChange={(e) => update("place", e.target.value)} />
      <Input label="Pincode" required value={form.pincode} onChange={(e) => update("pincode", e.target.value)} />
      <div className="sm:col-span-2">
        <Button type="submit" disabled={createInstitute.isPending}>
          {createInstitute.isPending ? "Creating..." : "Create Institute"}
        </Button>
      </div>
    </form>
  );
}
