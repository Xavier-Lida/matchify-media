import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { LoginRedirect } from "@/components/auth/LoginRedirect";

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<div className="flex-1" />}>
        <LoginRedirect />
      </Suspense>
    </>
  );
}
