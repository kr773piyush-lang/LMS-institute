"use client";

import { BatchManagementForms } from "@/components/forms/BatchManagementForms";
import { Card } from "@/components/ui/Card";

export default function InstituteAdminBatchesPage() {
  return (
    <div className="space-y-6">
      <Card>
        <h1 className="mb-1 text-2xl font-semibold">Institute Admin: Batches</h1>
        <p className="text-sm text-slate-600">
          Create batches and assign students/teachers.
        </p>
      </Card>
      <BatchManagementForms />
    </div>
  );
}
