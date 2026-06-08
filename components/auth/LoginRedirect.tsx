"use client";

import { useSearchParams } from "next/navigation";
import { AuthForm } from "./AuthForm";

export function LoginRedirect() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  return <AuthForm mode="login" redirectTo={next} />;
}
