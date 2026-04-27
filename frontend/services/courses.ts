import { api } from "@/services/client";
import {
  Content,
  Course,
  MessageResponse,
  Module,
  StudentBatchInfo,
  StudentCourseWorkspace,
  StudentSubmission,
  SubCourse
} from "@/types/lms";

export async function getCourses(): Promise<Course[]> {
  const { data } = await api.get<Course[]>("/courses");
  return data;
}

export async function getCoursesByInstitute(instituteId?: string): Promise<Course[]> {
  const { data } = await api.get<Course[]>("/courses", {
    params: instituteId ? { institute_id: instituteId } : undefined
  });
  return data;
}

export async function getSubCourses(courseId?: string): Promise<SubCourse[]> {
  const { data } = await api.get<SubCourse[]>("/subcourses", {
    params: courseId ? { course_id: courseId } : undefined
  });
  return data;
}

export async function getSubCoursesByInstitute(params?: {
  institute_id?: string;
  course_id?: string;
}): Promise<SubCourse[]> {
  const { data } = await api.get<SubCourse[]>("/subcourses", { params });
  return data;
}

export async function getModules(params?: {
  course_id?: string;
  subcourse_id?: string;
  institute_id?: string;
}): Promise<Module[]> {
  const { data } = await api.get<Module[]>("/modules", { params });
  return data;
}

export async function getPublicCourses(): Promise<Course[]> {
  const { data } = await api.get<Course[]>("/public/courses");
  return data;
}

export async function getPublicSubCourses(courseId?: string): Promise<SubCourse[]> {
  const { data } = await api.get<SubCourse[]>("/public/subcourses", {
    params: courseId ? { course_id: courseId } : undefined
  });
  return data;
}

export async function createCourse(payload: { course_name: string; institute_id?: string }): Promise<Course> {
  const { data } = await api.post<Course>("/courses", payload);
  return data;
}

export async function updateCourse(
  courseId: string,
  payload: { course_name: string; active: boolean; institute_id?: string }
): Promise<Course> {
  const { data } = await api.put<Course>(`/courses/${courseId}`, payload);
  return data;
}

export async function deleteCourse(courseId: string): Promise<MessageResponse> {
  const { data } = await api.delete<MessageResponse>(`/courses/${courseId}`);
  return data;
}

export async function createSubCourse(payload: {
  course_id: string;
  subcourse_name: string;
  institute_id?: string;
}): Promise<SubCourse> {
  const { data } = await api.post<SubCourse>("/subcourses", payload);
  return data;
}

export async function updateSubCourse(
  subcourseId: string,
  payload: { course_id: string; subcourse_name: string; active: boolean; institute_id?: string }
): Promise<SubCourse> {
  const { data } = await api.put<SubCourse>(`/subcourses/${subcourseId}`, payload);
  return data;
}

export async function deleteSubCourse(subcourseId: string): Promise<MessageResponse> {
  const { data } = await api.delete<MessageResponse>(`/subcourses/${subcourseId}`);
  return data;
}

export async function createModule(payload: {
  course_id: string;
  subcourse_id: string;
  module_name: string;
  institute_id?: string;
}): Promise<Module> {
  const { data } = await api.post<Module>("/modules", payload);
  return data;
}

function buildContentFormData(payload: {
  module_id?: string;
  title?: string;
  type?: string;
  description?: string;
  external_url?: string;
  order_index?: number;
  category?: string;
  instructions?: string;
  downloadable?: boolean;
  response_type?: string;
  duration?: number;
  institute_id?: string;
  replace_file?: boolean;
  file?: File | null;
}) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    if (key === "file" && value instanceof File) {
      formData.append("file", value);
      return;
    }
    formData.append(key, String(value));
  });
  if (payload.downloadable === false) {
    formData.append("downloadable", "false");
  }
  if (payload.replace_file) {
    formData.append("replace_file", "true");
  }
  return formData;
}

export async function addContent(payload: {
  module_id: string;
  title: string;
  type: string;
  description?: string;
  external_url?: string;
  order_index?: number;
  category?: string;
  instructions?: string;
  downloadable?: boolean;
  response_type?: string;
  duration?: number;
  institute_id?: string;
  file?: File | null;
}): Promise<Content> {
  const { data } = await api.post<Content>("/content", buildContentFormData(payload));
  return data;
}

export async function getModuleContents(moduleId: string): Promise<Content[]> {
  const { data } = await api.get<Content[]>(`/modules/${moduleId}/contents`);
  return data;
}

export async function updateContent(
  contentId: string,
  payload: {
    title?: string;
    type?: string;
    description?: string;
    external_url?: string;
    order_index?: number;
    category?: string;
    instructions?: string;
    downloadable?: boolean;
    response_type?: string;
    duration?: number;
    institute_id?: string;
    replace_file?: boolean;
    file?: File | null;
  }
): Promise<Content> {
  const { data } = await api.put<Content>(`/content/${contentId}`, buildContentFormData(payload));
  return data;
}

export async function deleteContent(contentId: string): Promise<MessageResponse> {
  const { data } = await api.delete<MessageResponse>(`/content/${contentId}`);
  return data;
}

export async function getStudentCourses(): Promise<Array<{ course_id: string; course_name: string; subcourse_id: string; subcourse_name: string }>> {
  const { data } = await api.get("/students/enrolled-courses");
  return data;
}

export async function getStudentModules(): Promise<
  Array<{
    module_id: string;
    module_name: string;
    content: Content[];
  }>
> {
  const { data } = await api.get("/students/modules-content");
  return data;
}

export async function getStudentBatches(): Promise<StudentBatchInfo[]> {
  const { data } = await api.get<StudentBatchInfo[]>("/students/batches");
  return data;
}

export async function getStudentCourseWorkspace(courseId: string, category?: string): Promise<StudentCourseWorkspace> {
  const { data } = await api.get<StudentCourseWorkspace>(`/students/course-workspace/${courseId}`, {
    params: category ? { category } : undefined
  });
  return data;
}

export async function submitStudentContentResponse(payload: {
  content_id: string;
  response_type: string;
  response_text?: string;
  response_url?: string;
}): Promise<StudentSubmission> {
  const { data } = await api.post<StudentSubmission>("/students/content-submissions", payload);
  return data;
}
