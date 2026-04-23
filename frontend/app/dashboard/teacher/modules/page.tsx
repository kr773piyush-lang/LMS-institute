"use client";

import { DataTable } from "@/components/tables/DataTable";
import { Card } from "@/components/ui/Card";
import { useStudentModulesQuery } from "@/hooks/useLmsQueries";

export default function TeacherModulesPage() {
  const { data = [], isLoading } = useStudentModulesQuery();
  const flatRows = data.map((module) => ({
    module_id: module.module_id,
    module_name: module.module_name,
    content_count: module.content.length
  }));

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-2xl font-semibold">Teacher: Modules</h1>
        <p className="mt-2 text-sm text-slate-600">Review module content by assignment context.</p>
      </Card>
      <Card>
        {isLoading ? (
          <p>Loading modules...</p>
        ) : (
          <DataTable
            rows={flatRows}
            rowKey={(row) => row.module_id}
            columns={[
              { key: "module_name", header: "Module" },
              { key: "module_id", header: "Module ID" },
              { key: "content_count", header: "Content Items" }
            ]}
          />
        )}
      </Card>
    </div>
  );
}
