"use client";

import { Card } from "@/components/ui/Card";

export default function TeacherBatchesPage() {
  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-2xl font-semibold">Teacher: Assigned Batches</h1>
        <p className="mt-2 text-sm text-slate-600">
          Use institute admin assignments to see your current batch list.
        </p>
      </Card>
      <Card>
        <p className="text-sm text-slate-600">
          Backend currently exposes assignment endpoint. Add a `GET /teacher/batches` endpoint to render live batch cards here.
        </p>
      </Card>
    </div>
  );
}
