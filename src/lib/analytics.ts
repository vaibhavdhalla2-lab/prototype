export type AnalyticsEvent =
  | "landing_view"
  | "start_creating"
  | "garment_selected"
  | "color_changed"
  | "material_changed"
  | "fit_changed"
  | "image_uploaded"
  | "drawing_started"
  | "prompt_submitted"
  | "muse_opened"
  | "muse_recommendation_used"
  | "design_completed"
  | "price_viewed"
  | "delivery_viewed"
  | "make_it_real_clicked"
  | "publish_clicked"
  | "remix_clicked"
  | "feedback_opened"
  | "feedback_submitted"
  | "micro_feedback";

/**
 * Prototype analytics stub. Structured so a real provider can be swapped in
 * later without touching call sites.
 */
export function track(event: AnalyticsEvent, payload?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const key = "forme_events";
      const existing = JSON.parse(window.localStorage.getItem(key) ?? "[]");
      existing.push({ event, payload, at: Date.now() });
      window.localStorage.setItem(key, JSON.stringify(existing.slice(-200)));
    } catch {
      // ignore storage errors in prototype
    }
  }
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug("[forme:event]", event, payload ?? {});
  }
}
