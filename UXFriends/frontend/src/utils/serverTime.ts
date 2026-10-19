export interface ServerClockSnapshot {
  serverEpochMs: number;
  capturedPerformanceMs: number;
}

export function parseServerDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function readPerformanceNow() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }

  return Date.now();
}

export function createServerClockSnapshot(serverNow: string | null | undefined) {
  const parsed = parseServerDate(serverNow);
  if (!parsed) {
    return null;
  }

  return {
    serverEpochMs: parsed.getTime(),
    capturedPerformanceMs: readPerformanceNow(),
  } satisfies ServerClockSnapshot;
}

export function getCurrentServerEpochMs(clock: ServerClockSnapshot | null) {
  if (!clock) {
    return Date.now();
  }

  const elapsedMs = readPerformanceNow() - clock.capturedPerformanceMs;
  return clock.serverEpochMs + Math.max(0, elapsedMs);
}

export function formatServerRemainingTime(
  expiresAt: string,
  language: "ar" | "en",
  clock: ServerClockSnapshot | null,
) {
  const parsed = parseServerDate(expiresAt);
  if (!parsed) {
    return language === "ar" ? "غير متاح" : "Unavailable";
  }

  const expiresAtMs = parsed.getTime();
  const diffMs = expiresAtMs - getCurrentServerEpochMs(clock);
  if (diffMs <= 0) {
    return language === "ar" ? "انتهى" : "Ended";
  }

  const totalMinutes = Math.ceil(diffMs / (1000 * 60));
  const totalHours = Math.ceil(diffMs / (1000 * 60 * 60));
  const totalDays = Math.floor(totalHours / 24);

  if (totalDays >= 1) {
    return language === "ar"
      ? `${totalDays} ${totalDays === 1 ? "يوم" : "أيام"}`
      : `${totalDays} ${totalDays === 1 ? "day" : "days"}`;
  }

  if (totalHours >= 1) {
    return language === "ar"
      ? `${totalHours} ${totalHours === 1 ? "ساعة" : "ساعات"}`
      : `${totalHours} ${totalHours === 1 ? "hour" : "hours"}`;
  }

  return language === "ar"
    ? `${totalMinutes} ${totalMinutes === 1 ? "دقيقة" : "دقائق"}`
    : `${totalMinutes} ${totalMinutes === 1 ? "minute" : "minutes"}`;
}

export function getServerRemainingMs(
  expiresAt: string,
  clock: ServerClockSnapshot | null,
) {
  const parsed = parseServerDate(expiresAt);
  if (!parsed) {
    return null;
  }

  return parsed.getTime() - getCurrentServerEpochMs(clock);
}

export function formatServerCountdownDetailed(
  expiresAt: string,
  language: "ar" | "en",
  clock: ServerClockSnapshot | null,
) {
  const remainingMs = getServerRemainingMs(expiresAt, clock);
  if (remainingMs === null) {
    return language === "ar" ? "غير متاح" : "Unavailable";
  }

  if (remainingMs <= 0) {
    return language === "ar" ? "انتهت المهلة" : "Expired";
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (language === "ar") {
    const parts = [];
    if (days > 0) parts.push(`${days} ${days === 1 ? "يوم" : "أيام"}`);
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? "ساعة" : "ساعات"}`);
    if (days === 0 && minutes >= 0) parts.push(`${minutes} ${minutes === 1 ? "دقيقة" : "دقائق"}`);
    return parts.join(" • ");
  }

  const parts = [];
  if (days > 0) parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  if (days === 0 && minutes >= 0) parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
  return parts.join(" • ");
}
