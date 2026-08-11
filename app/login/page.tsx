import { AuthForm } from "@/components/dashboard/auth-form";

export default function LoginPage() {
  return (
    <main className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <AuthForm mode="login" />
    </main>
  );
}
