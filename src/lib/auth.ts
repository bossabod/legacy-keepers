/* ────────────────────────────────────────────────────────────────
   Authentication — pure, dependency-free credential check.
   Keeps the existing credentials and flow; the login screen and any
   test harness share exactly this logic.
   ──────────────────────────────────────────────────────────────── */

export const VALID_MEMBERSHIP_ID = "Q-T-971";
export const VALID_MEMBERSHIP_PASS = "COVENANT";

export type AuthReason = "missing-id" | "missing-pass" | "missing-both" | "denied";

export type AuthResult =
  | { ok: true }
  | { ok: false; reason: AuthReason };

/** Validates the membership form. Returns the message shown in the UI. */
export function checkCredentials(id: string, pass: string): AuthResult {
  const cleanId = (id ?? "").trim();
  const cleanPass = (pass ?? "").trim();

  if (!cleanId && !cleanPass) return { ok: false, reason: "missing-both" };
  if (!cleanId) return { ok: false, reason: "missing-id" };
  if (!cleanPass) return { ok: false, reason: "missing-pass" };

  if (cleanId.toUpperCase() !== VALID_MEMBERSHIP_ID || cleanPass.toUpperCase() !== VALID_MEMBERSHIP_PASS) {
    return { ok: false, reason: "denied" };
  }

  return { ok: true };
}

export const AUTH_MESSAGES: Record<AuthReason, string> = {
  "missing-both": "Please enter your membership ID and password.",
  "missing-id": "Please enter your membership ID.",
  "missing-pass": "Please enter your membership password.",
  denied: "Access denied — these credentials do not match our register.",
};
