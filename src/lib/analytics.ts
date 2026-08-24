export type AnalyticsEvent =
  | "started_creation"
  | "selected_garment"
  | "uploaded_image"
  | "used_prompt"
  | "used_drawing"
  | "opened_muse"
  | "changed_material"
  | "changed_color"
  | "changed_fit"
  | "completed_design"
  | "clicked_make_it_real"
  | "clicked_publish"
  | "clicked_remix"
  | "submitted_feedback"
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
