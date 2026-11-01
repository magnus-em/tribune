/**
 * Escape text for interpolation into an HTML email. Every value a template
 * interpolates that comes from a user or the database goes through this, so a
 * name or address can't inject markup into an email Tribune sends.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
