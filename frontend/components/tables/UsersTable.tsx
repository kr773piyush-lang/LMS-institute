"use client";

import { useState } from "react";

import {
  useApproveUserMutation,
  useDeleteUserMutation,
  useInstitutesQuery,
  useUpdateUserMutation
} from "@/hooks/useLmsQueries";
import { User } from "@/types/lms";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/tables/DataTable";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useAuthStore } from "@/store/auth";

interface Props {
  users: User[];
  allowInstituteAssign?: boolean;
  roleFilter?: "teacher" | "student" | "institute_admin" | "super_admin";
  title?: string;
}

export function UsersTable({
  users,
  allowInstituteAssign = false,
  roleFilter,
  title = "Manage User Access"
}: Props) {
  const approveUser = useApproveUserMutation();
  const updateUser = useUpdateUserMutation();
  const deleteUser = useDeleteUserMutation();
  const { data: institutes = [] } = useInstitutesQuery();
  const role = useAuthStore((state) => state.role);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mob_no: "",
    is_approved: false,
    active: true,
    institute_id: "",
    role_names: "student"
  });

  const rows = roleFilter
    ? users.filter((user) => user.role_names.includes(roleFilter))
    : users;

  const instituteOptions = [
    { label: "Select institute", value: "" },
    ...institutes.map((institute) => ({ label: institute.name, value: institute.institute_id }))
  ];

  const openEdit = (user: User) => {
    setSelectedUser(user);
    setForm({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      mob_no: user.mob_no,
      is_approved: user.is_approved,
      active: user.active,
      institute_id: user.institute_id,
      role_names: user.role_names.join(", ")
    });
  };

  return (
    <>
      <DataTable
        rows={rows}
        rowKey={(user) => user.user_id}
        columns={[
          { key: "first_name", header: "First Name" },
          { key: "last_name", header: "Last Name" },
          { key: "email", header: "Email" },
          { key: "institute_name", header: "Institute" },
          { key: "role_names", header: "Roles", render: (user) => user.role_names.join(", ") || "-" },
          { key: "is_approved", header: "Approved", render: (user) => (user.is_approved ? "Yes" : "No") },
          {
            key: "actions",
            header: "Actions",
            render: (user) => (
              <div className="flex flex-wrap gap-2">
                {!user.is_approved ? (
                  <Button
                    onClick={() => approveUser.mutate({ userId: user.user_id, approve: true })}
                    disabled={approveUser.isPending}
                  >
                    Approve
                  </Button>
                ) : null}
                <Button variant="secondary" onClick={() => openEdit(user)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (window.confirm(`Delete user "${user.first_name} ${user.last_name}"?`)) {
                      deleteUser.mutate(user.user_id);
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

      <Modal title={title} open={Boolean(selectedUser)} onClose={() => setSelectedUser(null)}>
        <div className="space-y-3">
          <Input
            label="First Name"
            value={form.first_name}
            onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))}
          />
          <Input
            label="Last Name"
            value={form.last_name}
            onChange={(event) => setForm((prev) => ({ ...prev, last_name: event.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          />
          <Input
            label="Mobile"
            value={form.mob_no}
            onChange={(event) => setForm((prev) => ({ ...prev, mob_no: event.target.value }))}
          />
          <Input
            label="Role names (comma-separated)"
            value={form.role_names}
            onChange={(event) => setForm((prev) => ({ ...prev, role_names: event.target.value }))}
          />
          {allowInstituteAssign && role === "super_admin" ? (
            <Select
              label="Institute"
              options={instituteOptions}
              value={form.institute_id}
              onChange={(event) => setForm((prev) => ({ ...prev, institute_id: event.target.value }))}
            />
          ) : null}
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.is_approved}
              onChange={(event) => setForm((prev) => ({ ...prev, is_approved: event.target.checked }))}
            />
            Approved
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
            />
            Active
          </label>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (!selectedUser) {
                  return;
                }
                updateUser.mutate(
                  {
                    userId: selectedUser.user_id,
                    payload: {
                      first_name: form.first_name,
                      last_name: form.last_name,
                      email: form.email,
                      mob_no: form.mob_no,
                      is_approved: form.is_approved,
                      active: form.active,
                      institute_id: allowInstituteAssign ? form.institute_id : undefined,
                      role_names: form.role_names
                        .split(",")
                        .map((roleName) => roleName.trim())
                        .filter(Boolean)
                    }
                  },
                  {
                    onSuccess: () => setSelectedUser(null)
                  }
                );
              }}
              disabled={updateUser.isPending}
            >
              Save
            </Button>
            <Button variant="secondary" onClick={() => setSelectedUser(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
