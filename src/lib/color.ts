function clamp(n: number) {
  return Math.max(0, Math.min(255, n));
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => clamp(Math.round(v)).toString(16).padStart(2, "0")).join("")}`;
}

/** Mixes toward white (amt > 0) or black (amt < 0). amt in [-1, 1]. */
export function shade(hex: string, amt: number) {
  const { r, g, b } = hexToRgb(hex);
  const target = amt >= 0 ? 255 : 0;
  const a = Math.abs(amt);
  return rgbToHex(r + (target - r) * a, g + (target - g) * a, b + (target - b) * a);
}

export function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function isLight(hex: string) {
  return relativeLuminance(hex) > 0.55;
}

/** A believable thread/rib tone for the given base garment color. */
export function threadTone(hex: string) {
  return isLight(hex) ? shade(hex, -0.22) : shade(hex, 0.24);
}
