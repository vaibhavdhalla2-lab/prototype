export interface FeedbackFormData {
  name: string;
  email: string;
  overallRating: number | null;
  usageIntent: string | null;
  favouriteFeatures: string[];
  purchaseIntent: string | null;
  creatorIntent: string | null;
  easeOfUse: number | null;
  likedMost: string;
  improvement: string;
  additionalFeedback: string;
  /** Honeypot — real users never see or fill this field. */
  company: string;
}

export type SubmitFeedbackResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "network" | "server"; message: string };

const ENDPOINT = import.meta.env.VITE_FEEDBACK_ENDPOINT;

/**
 * Posts a feedback submission to the Google Apps Script web app endpoint,
 * which appends exactly one row to the FORMÉ feedback Google Sheet.
 *
 * The body is sent as text/plain (not application/json) on purpose: Apps
 * Script web apps don't handle the OPTIONS preflight a JSON content-type
 * would trigger, so a "simple request" content-type keeps this a plain
 * POST while the body itself remains JSON — Code.gs parses it as such.
 */
export async function submitFeedback(data: FeedbackFormData): Promise<SubmitFeedbackResult> {
  if (!ENDPOINT) {
    return {
      ok: false,
      reason: "not_configured",
      message: "The feedback endpoint isn't configured yet (VITE_FEEDBACK_ENDPOINT is empty).",
    };
  }

  // Spam bots tend to fill every field, including ones hidden from real users.
  // Pretend success without sending anything real.
  if (data.company.trim().length > 0) {
    return { ok: true };
  }

  const payload = {
    name: data.name.trim(),
    email: data.email.trim(),
    overallRating: data.overallRating,
    usageIntent: data.usageIntent,
    favouriteFeature: data.favouriteFeatures.join("; "),
    purchaseIntent: data.purchaseIntent,
    creatorIntent: data.creatorIntent,
    easeOfUse: data.easeOfUse,
    likedMost: data.likedMost.trim(),
    improvement: data.improvement.trim(),
    additionalFeedback: data.additionalFeedback.trim(),
    source: "forme-web",
  };

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, reason: "network", message: "Couldn't reach the server. Check your connection and try again." };
  }

  if (!res.ok) {
    return { ok: false, reason: "server", message: `The server responded with an error (${res.status}).` };
  }

  // Apps Script always returns 200 on a normal exception, so also check the
  // response body for an explicit failure flag when one is present.
  try {
    const json = await res.json();
    if (json && json.status === "error") {
      return { ok: false, reason: "server", message: json.message || "The server rejected the submission." };
    }
  } catch {
    // Non-JSON 2xx body — treat as success.
  }

  return { ok: true };
}
