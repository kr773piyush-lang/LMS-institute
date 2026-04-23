"use client";

import { useState } from "react";

import { Institute } from "@/types/lms";
import {
  useDeleteInstituteMutation,
  useUpdateInstituteMutation
} from "@/hooks/useLmsQueries";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { DataTable } from "@/components/tables/DataTable";

interface Props {
  institutes: Institute[];
}

export function InstitutesTable({ institutes }: Props) {
  const updateInstitute = useUpdateInstituteMutation();
  const deleteInstitute = useDeleteInstituteMutation();
  const [selected, setSelected] = useState<Institute | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    mob_no: "",
    country: "",
    state: "",
    place: "",
    pincode: "",
    active: true
  });

  const openEdit = (institute: Institute) => {
    setSelected(institute);
    setForm({
      name: institute.name,
      email: institute.email,
      mob_no: institute.mob_no,
      country: institute.country,
      state: institute.state,
      place: institute.place,
      pincode: institute.pincode,
      active: institute.active
    });
  };

  return (
    <>
      <DataTable
        rows={institutes}
        rowKey={(row) => row.institute_id}
        columns={[
          { key: "name", header: "Institute Name" },
          { key: "email", header: "Email" },
          { key: "mob_no", header: "Mobile" },
          { key: "place", header: "Place" },
          { key: "state", header: "State" },
          { key: "active", header: "Active", render: (row) => (row.active ? "Yes" : "No") },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => openEdit(row)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (window.confirm(`Delete institute "${row.name}"?`)) {
                      deleteInstitute.mutate(row.institute_id);
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            )
          }
        ]}
      />

      <Modal title="Edit Institute" open={Boolean(selected)} onClose={() => setSelected(null)}>
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
          <Input label="Mobile" value={form.mob_no} onChange={(e) => setForm((prev) => ({ ...prev, mob_no: e.target.value }))} />
          <Input label="Country" value={form.country} onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))} />
          <Input label="State" value={form.state} onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))} />
          <Input label="Place" value={form.place} onChange={(e) => setForm((prev) => ({ ...prev, place: e.target.value }))} />
          <Input label="Pincode" value={form.pincode} onChange={(e) => setForm((prev) => ({ ...prev, pincode: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
            />
            Active
          </label>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (!selected) return;
                updateInstitute.mutate(
                  { instituteId: selected.institute_id, payload: form },
                  { onSuccess: () => setSelected(null) }
                );
              }}
              disabled={updateInstitute.isPending}
            >
              Save
            </Button>
            <Button variant="secondary" onClick={() => setSelected(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
