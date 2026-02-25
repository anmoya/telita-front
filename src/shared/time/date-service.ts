export function formatLocalDateTime(value: Date | string, locale = "es-CL"): string {
  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
