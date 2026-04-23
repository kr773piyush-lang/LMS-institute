import { api } from "@/services/client";
import { MessageResponse, User } from "@/types/lms";

export async function getUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>("/users");
  return data;
}

export async function createUser(payload: {
  first_name: string;
  last_name: string;
  email: string;
  mob_no: string;
  password: string;
  is_approved?: boolean;
  active?: boolean;
  institute_id?: string;
  role_names: string[];
}): Promise<User> {
  const { data } = await api.post<User>("/users", payload);
  return data;
}

export async function approveUser(userId: string, approve = true): Promise<User> {
  const { data } = await api.put<User>(`/users/${userId}/approve`, { approve });
  return data;
}

export async function assignInstitute(userId: string, instituteId: string): Promise<User> {
  const { data } = await api.put<User>(`/users/${userId}/assign-institute`, {
    institute_id: instituteId
  });
  return data;
}

export async function assignRoles(userId: string, roleNames: string[]): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(`/users/${userId}/roles`, {
    role_names: roleNames
  });
  return data;
}

export async function updateUser(
  userId: string,
  payload: {
    first_name: string;
    last_name: string;
    email: string;
    mob_no: string;
    is_approved: boolean;
    active: boolean;
    institute_id?: string;
    role_names?: string[];
  }
): Promise<User> {
  const { data } = await api.put<User>(`/users/${userId}`, payload);
  return data;
}

export async function deleteUser(userId: string): Promise<MessageResponse> {
  const { data } = await api.delete<MessageResponse>(`/users/${userId}`);
  return data;
}
