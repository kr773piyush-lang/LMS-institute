"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { ROLE_HOME } from "@/constants/routes";
import { loginUser, registerUser } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import { LoginPayload, RegisterPayload, Role } from "@/types/auth";
import { decodeJwt } from "@/utils/jwt";

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerUser(payload)
  });
}

export function useLogin() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginUser(payload),
    onSuccess: (data, variables) => {
      const decoded = decodeJwt(data.access_token);
      const role = (decoded?.roles?.[0] as Role | undefined) ?? "student";
      setSession({
        token: data.access_token,
        role,
        instituteId: decoded?.institute_id,
        userId: decoded?.sub,
        userEmail: variables.email
      });
      router.replace(ROLE_HOME[role]);
    }
  });
}
