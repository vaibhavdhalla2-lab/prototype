export interface FeedbackFormData {
  name: string;
  email: string;
  overallRating: number | null;
  usageIntent: string | null;
  favouriteFeatures: string[];
  purchaseIntent: string | null;
  creatorIntent: string | null;
  easeOfUse: number | null;
  exciteMoreThanClothing: string | null;
  excitingOutputs: string[];
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
 *
 * Request mode is "no-cors" rather than the default "cors" — Apps Script's
 * /exec URL responds with a redirect to a script.googleusercontent.com
 * URL that doesn't reliably carry CORS headers back, which previously left
 * the fetch promise either rejecting inconsistently or the UI reading it
 * as still-pending well after the row had already been appended (the
 * "submitting..." button spinning forever even though the sheet updated).
 * We never needed to read the response body anyway — the row append either
 * happens server-side or the request never reaches the server — so an
 * opaque no-cors response is enough, and the AbortController timeout below
 * guarantees the UI always settles into an error state if the request
 * itself stalls for any other reason.
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
    rating: data.overallRating,
    usageIntent: data.usageIntent,
    favouriteFeature: data.favouriteFeatures.join("; "),
    purchaseIntent: data.purchaseIntent,
    creatorIntent: data.creatorIntent,
    easeOfUse: data.easeOfUse,
    exciteMoreThanClothing: data.exciteMoreThanClothing,
    excitingOutputs: data.excitingOutputs.join("; "),
    likedMost: data.likedMost.trim(),
    improvement: data.improvement.trim(),
    additionalFeedback: data.additionalFeedback.trim(),
  };

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 12000);

  try {
    await fetch(ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, reason: "network", message: "The request took too long to respond. Please try again." };
    }
    return { ok: false, reason: "network", message: "Couldn't reach the server. Check your connection and try again." };
  } finally {
    window.clearTimeout(timeoutId);
  }

  return { ok: true };
}
