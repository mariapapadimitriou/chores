import { requireUser } from "@/lib/auth-guard";
import { ProfileClient } from "./ProfileClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <ProfileClient
      initial={{
        id: user.id,
        name: user.name,
        emoji: user.emoji,
        color: user.color,
        email: user.email,
        onboarded: !!user.onboardedAt,
      }}
    />
  );
}
