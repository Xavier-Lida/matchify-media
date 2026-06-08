import { SiteHeader } from "@/components/SiteHeader";
import { AuthForm } from "@/components/auth/AuthForm";

export default function SignupPage() {
  return (
    <>
      <SiteHeader />
      <AuthForm mode="signup" redirectTo="/dashboard" />
    </>
  );
}
