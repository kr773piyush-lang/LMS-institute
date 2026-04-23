"use client";

import { FormEvent, useMemo, useState } from "react";

import {
  useAssignStudentBatchMutation,
  useAssignTeacherMutation,
  useCreateBatchMutation,
  useCoursesQuery,
  useUsersQuery
} from "@/hooks/useLmsQueries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { MultiSelect } from "@/components/ui/MultiSelect";

export function BatchManagementForms() {
  const createBatch = useCreateBatchMutation();
  const assignTeacher = useAssignTeacherMutation();
  const assignStudentToBatch = useAssignStudentBatchMutation();
  const { data: users = [] } = useUsersQuery();
  const { data: courses = [] } = useCoursesQuery();

  const [batch, setBatch] = useState({
    course_id: "",
    subcourse_id: "",
    batch_name: ""
  });
  const [teacherAssign, setTeacherAssign] = useState({ batch_id: "", user_id: "" });
  const [studentBatchId, setStudentBatchId] = useState("");
  const [studentIds, setStudentIds] = useState<string[]>([]);

  const teacherOptions = useMemo(
    () =>
      users
        .filter((user) => user.active)
        .map((user) => ({ label: `${user.first_name} ${user.last_name}`, value: user.user_id })),
    [users]
  );

  const studentOptions = teacherOptions;

  const submitBatch = (event: FormEvent) => {
    event.preventDefault();
    createBatch.mutate(batch);
  };

  const submitTeacher = (event: FormEvent) => {
    event.preventDefault();
    assignTeacher.mutate(teacherAssign);
  };

  const submitStudentAssignments = (event: FormEvent) => {
    event.preventDefault();
    studentIds.forEach((userId) => {
      assignStudentToBatch.mutate({ user_id: userId, batch_id: studentBatchId });
    });
  };

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card>
        <h3 className="mb-3 text-lg font-semibold">Create Batch</h3>
        <form className="space-y-3" onSubmit={submitBatch}>
          <Input
            label="Course ID"
            placeholder={courses[0]?.course_id ?? "course UUID"}
            value={batch.course_id}
            onChange={(e) => setBatch((prev) => ({ ...prev, course_id: e.target.value }))}
            required
          />
          <Input
            label="SubCourse ID"
            value={batch.subcourse_id}
            onChange={(e) => setBatch((prev) => ({ ...prev, subcourse_id: e.target.value }))}
            required
          />
          <Input
            label="Batch Name"
            value={batch.batch_name}
            onChange={(e) => setBatch((prev) => ({ ...prev, batch_name: e.target.value }))}
            required
          />
          <Button type="submit" disabled={createBatch.isPending}>
            Save Batch
          </Button>
        </form>
      </Card>

      <Card>
        <h3 className="mb-3 text-lg font-semibold">Assign Teacher</h3>
        <form className="space-y-3" onSubmit={submitTeacher}>
          <Input
            label="Batch ID"
            value={teacherAssign.batch_id}
            onChange={(e) => setTeacherAssign((prev) => ({ ...prev, batch_id: e.target.value }))}
            required
          />
          <Input
            label="Teacher User ID"
            value={teacherAssign.user_id}
            onChange={(e) => setTeacherAssign((prev) => ({ ...prev, user_id: e.target.value }))}
            required
          />
          <Button type="submit" disabled={assignTeacher.isPending}>
            Assign Teacher
          </Button>
        </form>
      </Card>

      <Card>
        <h3 className="mb-3 text-lg font-semibold">Assign Students</h3>
        <form className="space-y-3" onSubmit={submitStudentAssignments}>
          <Input
            label="Batch ID"
            value={studentBatchId}
            onChange={(e) => setStudentBatchId(e.target.value)}
            required
          />
          <MultiSelect label="Students" options={studentOptions} value={studentIds} onChange={setStudentIds} />
          <Button type="submit" disabled={assignStudentToBatch.isPending}>
            Assign Students
          </Button>
        </form>
      </Card>
    </div>
  );
}
