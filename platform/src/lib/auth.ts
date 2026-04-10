import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { redirect } from "next/navigation";

const TRIAL_DAYS = 90;

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export function isTrialActive(user: { trialStartedAt: Date; isPaid: boolean }) {
  if (user.isPaid) return true;
  const trialEnd = new Date(user.trialStartedAt);
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
  return new Date() < trialEnd;
}

export function trialDaysRemaining(user: { trialStartedAt: Date }) {
  const trialEnd = new Date(user.trialStartedAt);
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
  const diff = trialEnd.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
