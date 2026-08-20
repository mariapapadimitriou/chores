import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { OnboardingForm } from "./OnboardingForm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.onboardedAt) redirect("/app");

  return (
    <OnboardingForm
      initial={{ id: user.id, name: user.name, emoji: user.emoji, color: user.color }}
    />
  );
}
