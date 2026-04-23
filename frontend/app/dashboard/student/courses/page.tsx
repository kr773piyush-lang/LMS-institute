"use client";

import { DataTable } from "@/components/tables/DataTable";
import { Card } from "@/components/ui/Card";
import { useStudentCoursesQuery } from "@/hooks/useLmsQueries";

export default function StudentCoursesPage() {
  const { data = [], isLoading } = useStudentCoursesQuery();

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-2xl font-semibold">Student: Enrolled Courses</h1>
        <p className="mt-2 text-sm text-slate-600">View all approved course enrollments.</p>
      </Card>
      <Card>
        {isLoading ? (
          <p>Loading courses...</p>
        ) : (
          <DataTable
            rows={data}
            rowKey={(row) => `${row.course_id}-${row.subcourse_id}`}
            columns={[
              { key: "course_name", header: "Course" },
              { key: "subcourse_name", header: "SubCourse" },
              { key: "course_id", header: "Course ID" },
              { key: "subcourse_id", header: "SubCourse ID" }
            ]}
          />
        )}
      </Card>
    </div>
  );
}
