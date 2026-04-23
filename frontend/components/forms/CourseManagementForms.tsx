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
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type CourseFormMode = "course" | "subcourse" | "module" | "content";

interface Props {
  mode: CourseFormMode;
  courses?: Course[];
  subcourses?: SubCourse[];
  selectedCourseId?: string;
  selectedSubcourseId?: string;
  onSuccess?: () => void;
}

export function CourseManagementForms({
  mode,
  courses = [],
  subcourses = [],
  selectedCourseId,
  selectedSubcourseId,
  onSuccess
}: Props) {
  const createCourse = useCreateCourseMutation();
  const createSubcourse = useCreateSubCourseMutation();
  const createModule = useCreateModuleMutation();
  const addContent = useAddContentMutation();

  const [courseName, setCourseName] = useState("");
  const [subcourse, setSubcourse] = useState({
    course_id: selectedCourseId ?? "",
    subcourse_name: ""
  });
  const [module, setModule] = useState({
    course_id: selectedCourseId ?? "",
    subcourse_id: selectedSubcourseId ?? "",
    module_name: ""
  });
  const [content, setContent] = useState({
    course_id: selectedCourseId ?? "",
    subcourse_id: selectedSubcourseId ?? "",
    module_id: "",
    title: "",
    type: "resource",
    category: "reading",
    url: "",
    duration: 0,
    body_text: "",
    instructions: "",
    downloadable: false,
    response_type: ""
  });

  const visibleSubcourses = useMemo(
    () =>
      subcourses.filter(
        (entry) =>
          (!selectedCourseId || entry.course_id === selectedCourseId) &&
          (!selectedSubcourseId || entry.subcourse_id === selectedSubcourseId)
      ),
    [selectedCourseId, selectedSubcourseId, subcourses]
  );

  const { data: modules = [] } = useModulesQuery(
    content.subcourse_id ? { course_id: content.course_id, subcourse_id: content.subcourse_id } : undefined
  );

  const courseOptions = [
    { label: "Select a course", value: "" },
    ...courses.map((course) => ({ label: course.course_name, value: course.course_id }))
  ];

  const subcourseOptions = [
    { label: "Select a subcourse", value: "" },
    ...visibleSubcourses.map((entry) => ({ label: entry.subcourse_name, value: entry.subcourse_id }))
  ];

  const moduleOptions = [
    { label: "Select a module", value: "" },
    ...modules.map((item) => ({ label: item.module_name, value: item.module_id }))
  ];

  if (mode === "course") {
    return (
      <form
        className="space-y-3"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          createCourse.mutate(
            { course_name: courseName },
            {
              onSuccess: () => {
                setCourseName("");
                onSuccess?.();
              }
            }
          );
        }}
      >
        <h3 className="text-lg font-semibold">Add Course</h3>
        <Input label="Course Name" value={courseName} onChange={(e) => setCourseName(e.target.value)} required />
        <Button type="submit" disabled={createCourse.isPending}>
          {createCourse.isPending ? "Saving..." : "Save Course"}
        </Button>
      </form>
    );
  }

  if (mode === "subcourse") {
    return (
      <form
        className="space-y-3"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          createSubcourse.mutate(subcourse, {
            onSuccess: () => {
              setSubcourse((prev) => ({ ...prev, subcourse_name: "" }));
              onSuccess?.();
            }
          });
        }}
      >
        <h3 className="text-lg font-semibold">Add SubCourse</h3>
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
    );
  }

  if (mode === "module") {
    return (
      <form
        className="space-y-3"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          createModule.mutate(module, {
            onSuccess: () => {
              setModule((prev) => ({ ...prev, module_name: "" }));
              onSuccess?.();
            }
          });
        }}
      >
        <h3 className="text-lg font-semibold">Add Module</h3>
        <Select
          label="Course"
          options={courseOptions}
          value={module.course_id}
          onChange={(e) =>
            setModule((prev) => ({ ...prev, course_id: e.target.value, subcourse_id: "" }))
          }
          required
        />
        <Select
          label="SubCourse"
          options={subcourseOptions}
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
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        addContent.mutate(content, {
          onSuccess: () => {
            setContent((prev) => ({
              ...prev,
              title: "",
              url: "",
              duration: 0,
              body_text: "",
              instructions: "",
              downloadable: false,
              response_type: ""
            }));
            onSuccess?.();
          }
        });
      }}
    >
      <h3 className="text-lg font-semibold">Add Content</h3>
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
        options={subcourseOptions}
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
        label="Content Type"
        value={content.type}
        onChange={(e) => setContent((prev) => ({ ...prev, type: e.target.value }))}
        required
      />
      <Select
        label="Learning Category"
        options={[
          { label: "Reading", value: "reading" },
          { label: "Writing", value: "writing" },
          { label: "Listening", value: "listening" },
          { label: "Speaking", value: "speaking" }
        ]}
        value={content.category}
        onChange={(e) => setContent((prev) => ({ ...prev, category: e.target.value }))}
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
        label="Body Text / Notes"
        value={content.body_text}
        onChange={(e) => setContent((prev) => ({ ...prev, body_text: e.target.value }))}
      />
      <Input
        label="Instructions / Prompt"
        value={content.instructions}
        onChange={(e) => setContent((prev) => ({ ...prev, instructions: e.target.value }))}
      />
      {(content.category === "writing" || content.category === "speaking") ? (
        <Select
          label="Student Response Type"
          options={[
            { label: "Text", value: "text" },
            { label: "Audio", value: "audio" },
            { label: "Video", value: "video" }
          ]}
          value={content.response_type}
          onChange={(e) => setContent((prev) => ({ ...prev, response_type: e.target.value }))}
          required
        />
      ) : null}
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={content.downloadable}
          onChange={(e) => setContent((prev) => ({ ...prev, downloadable: e.target.checked }))}
        />
        Allow students to download the file
      </label>
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
  );
}
