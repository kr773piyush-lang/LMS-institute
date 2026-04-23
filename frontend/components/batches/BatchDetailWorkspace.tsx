"use client";

import { DataTable } from "@/components/tables/DataTable";
import { Card } from "@/components/ui/Card";
import { CourseManagementForms } from "@/components/forms/CourseManagementForms";
import { useBatchDetailQuery, useModulesQuery } from "@/hooks/useLmsQueries";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

interface Props {
  batchId: string;
  instituteId?: string;
  badge: string;
}

export function BatchDetailWorkspace({ batchId, instituteId, badge }: Props) {
  const { data, isLoading } = useBatchDetailQuery(batchId, instituteId);
  const [showContentForm, setShowContentForm] = useState(false);
  const { data: modules = [] } = useModulesQuery(
    data ? { course_id: data.course.course_id, subcourse_id: data.subcourse.subcourse_id, institute_id: instituteId } : undefined
  );

  if (isLoading) {
    return <p className="text-sm text-slate-600">Loading batch details...</p>;
  }

  if (!data) {
    return <p className="text-sm text-slate-600">Batch not found.</p>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">{badge}</p>
        <h1 className="mt-2 text-2xl font-semibold">{data.batch_name}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Review batch data, enrolled learners, and update learning content for this batch course path.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h2 className="text-lg font-semibold">Course</h2>
          <p className="mt-3 text-sm text-slate-700">{data.course.course_name}</p>
          <p className="text-xs text-slate-500">{data.course.course_id}</p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">SubCourse</h2>
          <p className="mt-3 text-sm text-slate-700">{data.subcourse.subcourse_name}</p>
          <p className="text-xs text-slate-500">{data.subcourse.subcourse_id}</p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Batch Details</h2>
          <div className="mt-3 space-y-1 text-sm text-slate-700">
            <p>Room / Branch: {data.room_name || "-"}</p>
            <p>Start Date: {data.start_date || "-"}</p>
            <p>End Date: {data.end_date || "-"}</p>
            <p>Schedule: {data.schedule_notes || "-"}</p>
            <p>Description: {data.description || "-"}</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Batch Content</h2>
            <p className="text-sm text-slate-600">Add new content directly against this batch course path.</p>
          </div>
          <Button variant={showContentForm ? "secondary" : "primary"} onClick={() => setShowContentForm((prev) => !prev)}>
            {showContentForm ? "Close Content Form" : "Add Content"}
          </Button>
        </div>
        {showContentForm ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <CourseManagementForms
              mode="content"
              courses={[{ course_id: data.course.course_id, course_name: data.course.course_name, institute_id: instituteId ?? "", active: true }]}
              subcourses={[{ subcourse_id: data.subcourse.subcourse_id, subcourse_name: data.subcourse.subcourse_name, course_id: data.course.course_id, institute_id: instituteId ?? "", active: true }]}
              selectedCourseId={data.course.course_id}
              selectedSubcourseId={data.subcourse.subcourse_id}
              onSuccess={() => setShowContentForm(false)}
            />
          </div>
        ) : null}
        <div className="mt-4">
          <DataTable
            rows={modules}
            rowKey={(row) => row.module_id}
            initialPageSize={5}
            columns={[
              { key: "module_name", header: "Module" },
              { key: "module_id", header: "Module ID" },
              { key: "active", header: "Active", render: (row) => (row.active ? "Yes" : "No") }
            ]}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Teachers</h2>
        <div className="mt-4">
          <DataTable
            rows={data.teachers}
            rowKey={(row) => row.user_id}
            initialPageSize={5}
            columns={[
              { key: "first_name", header: "First Name" },
              { key: "last_name", header: "Last Name" },
              { key: "email", header: "Email" },
              { key: "mob_no", header: "Mobile" },
              { key: "is_approved", header: "Approved", render: (row) => (row.is_approved ? "Yes" : "No") }
            ]}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Students</h2>
        <div className="mt-4">
          <DataTable
            rows={data.students}
            rowKey={(row) => row.user_id}
            initialPageSize={10}
            columns={[
              { key: "first_name", header: "First Name" },
              { key: "last_name", header: "Last Name" },
              { key: "email", header: "Email" },
              { key: "mob_no", header: "Mobile" },
              { key: "active", header: "Active", render: (row) => (row.active ? "Yes" : "No") },
              { key: "is_approved", header: "Approved", render: (row) => (row.is_approved ? "Yes" : "No") }
            ]}
          />
        </div>
      </Card>
    </div>
  );
}

