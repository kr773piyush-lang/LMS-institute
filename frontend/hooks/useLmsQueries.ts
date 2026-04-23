"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { assignStudentToBatch, assignTeacher, createBatch, enrollStudent } from "@/services/batches";
import {
  addContent,
  createCourse,
  createModule,
  createSubCourse,
  deleteCourse,
  deleteSubCourse,
  getCourses,
  getModules,
  getPublicCourses,
  getPublicSubCourses,
  getSubCourses,
  getStudentCourses,
  getStudentModules,
  updateCourse,
  updateSubCourse
} from "@/services/courses";
import {
  createInstitute,
  deleteInstitute,
  getInstitutes,
  updateInstitute
} from "@/services/institutes";
import { getMyProgress, markProgress } from "@/services/progress";
import { approveUser, createUser, deleteUser, getUsers, updateUser } from "@/services/users";

export function useInstitutesQuery() {
  return useQuery({ queryKey: ["institutes"], queryFn: getInstitutes });
}

export function useUsersQuery() {
  return useQuery({ queryKey: ["users"], queryFn: getUsers });
}

export function useCoursesQuery() {
  return useQuery({ queryKey: ["courses"], queryFn: getCourses });
}

export function useSubCoursesQuery(courseId?: string) {
  return useQuery({
    queryKey: ["subcourses", courseId ?? "all"],
    queryFn: () => getSubCourses(courseId)
  });
}

export function useModulesQuery(filters?: { course_id?: string; subcourse_id?: string }) {
  return useQuery({
    queryKey: ["modules", filters?.course_id ?? "all", filters?.subcourse_id ?? "all"],
    queryFn: () => getModules(filters)
  });
}

export function usePublicCoursesQuery() {
  return useQuery({ queryKey: ["public-courses"], queryFn: getPublicCourses });
}

export function usePublicSubCoursesQuery(courseId?: string) {
  return useQuery({
    queryKey: ["public-subcourses", courseId],
    queryFn: () => getPublicSubCourses(courseId),
    enabled: Boolean(courseId)
  });
}

export function useStudentCoursesQuery() {
  return useQuery({ queryKey: ["student-courses"], queryFn: getStudentCourses });
}

export function useStudentModulesQuery() {
  return useQuery({ queryKey: ["student-modules"], queryFn: getStudentModules });
}

export function useProgressQuery() {
  return useQuery({ queryKey: ["progress"], queryFn: getMyProgress });
}

export function useCreateInstituteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInstitute,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["institutes"] })
  });
}

export function useUpdateInstituteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ instituteId, payload }: { instituteId: string; payload: Parameters<typeof updateInstitute>[1] }) =>
      updateInstitute(instituteId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["institutes"] })
  });
}

export function useDeleteInstituteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteInstitute,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["institutes"] })
  });
}

export function useApproveUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, approve }: { userId: string; approve?: boolean }) =>
      approveUser(userId, approve),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] })
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: Parameters<typeof updateUser>[1] }) =>
      updateUser(userId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] })
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] })
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] })
  });
}

export function useCreateCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCourse,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] })
  });
}

export function useUpdateCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, payload }: { courseId: string; payload: Parameters<typeof updateCourse>[1] }) =>
      updateCourse(courseId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] })
  });
}

export function useDeleteCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["subcourses"] });
    }
  });
}

export function useCreateSubCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSubCourse,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subcourses"] })
  });
}

export function useUpdateSubCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subcourseId, payload }: { subcourseId: string; payload: Parameters<typeof updateSubCourse>[1] }) =>
      updateSubCourse(subcourseId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subcourses"] })
  });
}

export function useDeleteSubCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSubCourse,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subcourses"] })
  });
}

export function useCreateModuleMutation() {
  return useMutation({ mutationFn: createModule });
}

export function useAddContentMutation() {
  return useMutation({ mutationFn: addContent });
}

export function useCreateBatchMutation() {
  return useMutation({ mutationFn: createBatch });
}

export function useAssignTeacherMutation() {
  return useMutation({ mutationFn: assignTeacher });
}

export function useAssignStudentBatchMutation() {
  return useMutation({ mutationFn: assignStudentToBatch });
}

export function useEnrollStudentMutation() {
  return useMutation({ mutationFn: enrollStudent });
}

export function useMarkProgressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markProgress,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["progress"] })
  });
}
