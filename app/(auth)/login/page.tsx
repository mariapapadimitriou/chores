import { Suspense } from "react";
import { redirect } from "next/navigation";
import { currentUserId } from "@/lib/auth";
import { AuthForm } from "../AuthForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await currentUserId()) redirect("/app");
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  );
}
