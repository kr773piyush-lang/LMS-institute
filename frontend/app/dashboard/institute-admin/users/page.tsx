"use client";

import { useState } from "react";

import { EnrollmentForm } from "@/components/forms/EnrollmentForm";
import { UserCreateForm } from "@/components/forms/UserCreateForm";
import { UsersTable } from "@/components/tables/UsersTable";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useUsersQuery } from "@/hooks/useLmsQueries";

export default function InstituteAdminUsersPage() {
  const { data: users = [], isLoading } = useUsersQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [showEnrollment, setShowEnrollment] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="mb-1 text-2xl font-semibold">Institute Admin: Users</h1>
        <p className="text-sm text-slate-600">Approve and manage students and teachers.</p>
      </Card>
      <Card>
        <div className="flex flex-wrap gap-3">
          <Button variant={showCreate ? "secondary" : "primary"} onClick={() => setShowCreate((prev) => !prev)}>
            {showCreate ? "Close Add User" : "Add User"}
          </Button>
          <Button variant={showEnrollment ? "secondary" : "primary"} onClick={() => setShowEnrollment((prev) => !prev)}>
            {showEnrollment ? "Close Enrollment" : "Enroll Student"}
          </Button>
        </div>
        {showCreate ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <UserCreateForm defaultRoles={["student"]} title="Add User" onSuccess={() => setShowCreate(false)} />
          </div>
        ) : null}
        {showEnrollment ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <EnrollmentForm />
          </div>
        ) : null}
      </Card>
      <Card>{isLoading ? <p>Loading users...</p> : <UsersTable users={users} title="Edit User" />}</Card>
    </div>
  );
}
