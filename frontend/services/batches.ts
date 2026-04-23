import { api } from "@/services/client";
import { Batch } from "@/types/lms";

export async function createBatch(payload: {
  course_id: string;
  subcourse_id: string;
  batch_name: string;
  institute_id?: string;
}): Promise<Batch> {
  const { data } = await api.post<Batch>("/batches", payload);
  return data;
}

export async function assignTeacher(payload: {
  batch_id: string;
  user_id: string;
  institute_id?: string;
}): Promise<{ id: string }> {
  const { data } = await api.post<{ id: string }>("/assign-teacher", payload);
  return data;
}

export async function assignStudentToBatch(payload: {
  user_id: string;
  batch_id: string;
  institute_id?: string;
}): Promise<{ user_batch_id: string }> {
  const { data } = await api.post<{ user_batch_id: string }>("/assign-batch", payload);
  return data;
}

export async function enrollStudent(payload: {
  user_id: string;
  course_id: string;
  subcourse_id: string;
  institute_id?: string;
}): Promise<{ id: string }> {
  const { data } = await api.post<{ id: string }>("/enroll", payload);
  return data;
}
