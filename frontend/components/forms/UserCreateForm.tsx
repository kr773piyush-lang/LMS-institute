"use client";

import { FormEvent, useMemo, useState } from "react";

import { Institute } from "@/types/lms";
import { useCreateUserMutation } from "@/hooks/useLmsQueries";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface Props {
  institutes?: Institute[];
  defaultRoles?: string[];
  title?: string;
  onSuccess?: () => void;
}

export function UserCreateForm({
  institutes = [],
  defaultRoles = ["student"],
  title = "Add User",
  onSuccess
}: Props) {
  const createUser = useCreateUserMutation();
  const role = useAuthStore((state) => state.role);
  const userInstituteId = useAuthStore((state) => state.instituteId);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mob_no: "",
    password: "",
    is_approved: true,
    active: true,
    institute_id: userInstituteId ?? "",
    role_names: defaultRoles.join(", ")
  });

  const instituteOptions = useMemo(
    () => [{ label: "Select institute", value: "" }, ...institutes.map((institute) => ({ label: institute.name, value: institute.institute_id }))],
    [institutes]
  );

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    createUser.mutate(
      {
        ...form,
        institute_id: role === "super_admin" ? form.institute_id || undefined : userInstituteId || undefined,
        role_names: form.role_names
          .split(",")
          .map((roleName) => roleName.trim())
          .filter(Boolean)
      },
      {
        onSuccess: () => {
          setForm({
            first_name: "",
            last_name: "",
            email: "",
            mob_no: "",
            password: "",
            is_approved: true,
            active: true,
            institute_id: userInstituteId ?? "",
            role_names: defaultRoles.join(", ")
          });
          onSuccess?.();
        }
      }
    );
  };

  return (
    <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
      <div className="md:col-span-2">
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <Input label="First Name" required value={form.first_name} onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))} />
      <Input label="Last Name" required value={form.last_name} onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))} />
      <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
      <Input label="Mobile" required value={form.mob_no} onChange={(e) => setForm((prev) => ({ ...prev, mob_no: e.target.value }))} />
      <Input label="Password" type="password" required value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} />
      <Input label="Roles (comma-separated)" required value={form.role_names} onChange={(e) => setForm((prev) => ({ ...prev, role_names: e.target.value }))} />
      {role === "super_admin" ? (
        <Select
          label="Institute"
          options={instituteOptions}
          value={form.institute_id}
          onChange={(e) => setForm((prev) => ({ ...prev, institute_id: e.target.value }))}
          required
        />
      ) : null}
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={form.is_approved} onChange={(e) => setForm((prev) => ({ ...prev, is_approved: e.target.checked }))} />
        Approved
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={form.active} onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))} />
        Active
      </label>
      <div className="md:col-span-2">
        <Button type="submit" disabled={createUser.isPending}>
          {createUser.isPending ? "Saving..." : title}
        </Button>
      </div>
    </form>
  );
}
