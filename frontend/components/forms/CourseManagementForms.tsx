"use client";

import { FormEvent, useMemo, useState } from "react";

import { Course, SubCourse } from "@/types/lms";
import {
  useAddContentMutation,
  useCreateCourseMutation,
  useCreateModuleMutation,
  useCreateSubCourseMutation,
  useModulesQuery
} from "@/hooks/useLmsQueries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface Props {
  courses?: Course[];
  subcourses?: SubCourse[];
  titlePrefix?: string;
}

export function CourseManagementForms({
  courses = [],
  subcourses = [],
  titlePrefix = "Create"
}: Props) {
  const createCourse = useCreateCourseMutation();
  const createSubcourse = useCreateSubCourseMutation();
  const createModule = useCreateModuleMutation();
  const addContent = useAddContentMutation();

  const [courseName, setCourseName] = useState("");
  const [subcourse, setSubcourse] = useState({ course_id: "", subcourse_name: "" });
  const [module, setModule] = useState({ course_id: "", subcourse_id: "", module_name: "" });
  const [content, setContent] = useState({
    course_id: "",
    subcourse_id: "",
    module_id: "",
    title: "",
    type: "video",
    url: "",
    duration: 0
  });

  const submitCourse = (event: FormEvent) => {
    event.preventDefault();
    createCourse.mutate(
      { course_name: courseName },
      {
        onSuccess: () => setCourseName("")
      }
    );
  };

  const submitSubcourse = (event: FormEvent) => {
    event.preventDefault();
    createSubcourse.mutate(subcourse, {
      onSuccess: () =>
        setSubcourse((prev) => ({
          ...prev,
          subcourse_name: ""
        }))
    });
  };

  const submitModule = (event: FormEvent) => {
    event.preventDefault();
    createModule.mutate(module, {
      onSuccess: () =>
        setModule((prev) => ({
          ...prev,
          module_name: ""
        }))
    });
  };

  const submitContent = (event: FormEvent) => {
    event.preventDefault();
    addContent.mutate(content, {
      onSuccess: () =>
        setContent((prev) => ({
          ...prev,
          title: "",
          url: "",
          duration: 0
        }))
    });
  };

  const courseOptions = [
    { label: "Select a course", value: "" },
    ...courses.map((course) => ({ label: course.course_name, value: course.course_id }))
  ];

  const subcourseOptions = [
    { label: "Select a subcourse", value: "" },
    ...subcourses.map((entry) => ({ label: entry.subcourse_name, value: entry.subcourse_id }))
  ];

  const filteredModuleSubcourses = useMemo(
    () => subcourses.filter((entry) => !module.course_id || entry.course_id === module.course_id),
    [module.course_id, subcourses]
  );
  const filteredContentSubcourses = useMemo(
    () => subcourses.filter((entry) => !content.course_id || entry.course_id === content.course_id),
    [content.course_id, subcourses]
  );

  const moduleSubcourseOptions = [
    { label: "Select a subcourse", value: "" },
    ...filteredModuleSubcourses.map((entry) => ({ label: entry.subcourse_name, value: entry.subcourse_id }))
  ];
  const contentSubcourseOptions = [
    { label: "Select a subcourse", value: "" },
    ...filteredContentSubcourses.map((entry) => ({ label: entry.subcourse_name, value: entry.subcourse_id }))
  ];

  const { data: modules = [] } = useModulesQuery(
    content.subcourse_id ? { course_id: content.course_id, subcourse_id: content.subcourse_id } : undefined
  );
  const moduleOptions = [
    { label: "Select a module", value: "" },
    ...modules.map((item) => ({ label: item.module_name, value: item.module_id }))
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <h3 className="mb-3 text-lg font-semibold">{titlePrefix} Course</h3>
        <form className="space-y-3" onSubmit={submitCourse}>
          <Input label="Course Name" value={courseName} onChange={(e) => setCourseName(e.target.value)} required />
          <Button type="submit" disabled={createCourse.isPending}>
            {createCourse.isPending ? "Saving..." : "Save Course"}
          </Button>
        </form>
      </Card>

      <Card>
        <h3 className="mb-3 text-lg font-semibold">{titlePrefix} SubCourse</h3>
        <form className="space-y-3" onSubmit={submitSubcourse}>
          <Select
            label="Course"
            options={courseOptions}
            value={subcourse.course_id}
            onChange={(e) => setSubcourse((prev) => ({ ...prev, course_id: e.target.value }))}
            required
          />
          <Input
            label="SubCourse Name"
            value={subcourse.subcourse_name}
            onChange={(e) => setSubcourse((prev) => ({ ...prev, subcourse_name: e.target.value }))}
            required
          />
          <Button type="submit" disabled={createSubcourse.isPending}>
            {createSubcourse.isPending ? "Saving..." : "Save SubCourse"}
          </Button>
        </form>
      </Card>

      <Card>
        <h3 className="mb-3 text-lg font-semibold">{titlePrefix} Module</h3>
        <form className="space-y-3" onSubmit={submitModule}>
          <Select
            label="Course"
            options={courseOptions}
            value={module.course_id}
            onChange={(e) => setModule((prev) => ({ ...prev, course_id: e.target.value }))}
            required
          />
          <Select
            label="SubCourse"
            options={moduleSubcourseOptions}
            value={module.subcourse_id}
            onChange={(e) => setModule((prev) => ({ ...prev, subcourse_id: e.target.value }))}
            required
          />
          <Input
            label="Module Name"
            value={module.module_name}
            onChange={(e) => setModule((prev) => ({ ...prev, module_name: e.target.value }))}
            required
          />
          <Button type="submit" disabled={createModule.isPending}>
            {createModule.isPending ? "Saving..." : "Save Module"}
          </Button>
        </form>
      </Card>

      <Card>
        <h3 className="mb-3 text-lg font-semibold">Add Content</h3>
        <form className="space-y-3" onSubmit={submitContent}>
          <Select
            label="Course"
            options={courseOptions}
            value={content.course_id}
            onChange={(e) =>
              setContent((prev) => ({
                ...prev,
                course_id: e.target.value,
                subcourse_id: "",
                module_id: ""
              }))
            }
            required
          />
          <Select
            label="SubCourse"
            options={contentSubcourseOptions}
            value={content.subcourse_id}
            onChange={(e) =>
              setContent((prev) => ({
                ...prev,
                subcourse_id: e.target.value,
                module_id: ""
              }))
            }
            required
          />
          <Select
            label="Module"
            options={moduleOptions}
            value={content.module_id}
            onChange={(e) => setContent((prev) => ({ ...prev, module_id: e.target.value }))}
            required
          />
          <Input
            label="Title"
            value={content.title}
            onChange={(e) => setContent((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
          <Input
            label="Type (video/pdf)"
            value={content.type}
            onChange={(e) => setContent((prev) => ({ ...prev, type: e.target.value }))}
            required
          />
          <Input
            label="URL"
            type="url"
            value={content.url}
            onChange={(e) => setContent((prev) => ({ ...prev, url: e.target.value }))}
            required
          />
          <Input
            label="Duration (minutes)"
            type="number"
            value={String(content.duration)}
            onChange={(e) => setContent((prev) => ({ ...prev, duration: Number(e.target.value) }))}
            required
          />
          <Button type="submit" disabled={addContent.isPending}>
            {addContent.isPending ? "Saving..." : "Save Content"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
