"use client";

import { useState } from "react";

import { CourseManagementForms } from "@/components/forms/CourseManagementForms";
import { CourseCatalogTables } from "@/components/tables/CourseCatalogTables";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useCoursesQuery, useSubCoursesQuery } from "@/hooks/useLmsQueries";

export default function InstituteAdminCoursesPage() {
  const { data: courses = [], isLoading } = useCoursesQuery();
  const { data: subcourses = [], isLoading: subcoursesLoading } = useSubCoursesQuery();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <Card className="border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">Institute Management</p>
        <h1 className="mb-1 mt-2 text-2xl font-semibold">Courses and SubCourses</h1>
        <p className="text-sm text-slate-600">Create course hierarchy and learning content for your institute.</p>
      </Card>
      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Course Catalog</h2>
          <Button variant={showCreate ? "secondary" : "primary"} onClick={() => setShowCreate((prev) => !prev)}>
            {showCreate ? "Close Add Form" : "Add Course Data"}
          </Button>
        </div>
        {showCreate ? (
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <CourseManagementForms courses={courses} subcourses={subcourses} titlePrefix="Create" />
          </div>
        ) : null}
        {isLoading || subcoursesLoading ? (
          <p>Loading...</p>
        ) : (
          <CourseCatalogTables courses={courses} subcourses={subcourses} />
        )}
      </Card>
    </div>
  );
}
