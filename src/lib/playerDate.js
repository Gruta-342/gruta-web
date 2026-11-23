const BRAZIL_TZ = "America/Sao_Paulo";

export function getBrazilDateKey(daysOffset = 0) {
  const now = new Date();
  const shifted = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BRAZIL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(shifted);

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;

  return `${y}-${m}-${d}`;
}

export function computeTorchFromProfile(profile, todayKey, yesterdayKey) {
  const storedCurrent = Number(profile?.torchCurrentDays) || 0;
  const recordDays = Number(profile?.torchRecordDays) || 0;
  const lastLitDate = profile?.torchLastLitDate || null;

  let currentDays = 0;
  let isLitToday = false;
  let streakBroken = false;

  if (lastLitDate === todayKey) {
    currentDays = Math.max(1, storedCurrent);
    isLitToday = true;
  } else if (lastLitDate === yesterdayKey) {
    currentDays = storedCurrent;
    isLitToday = false;
  } else {
    currentDays = 0;
    isLitToday = false;
    if (storedCurrent > 0) {
      streakBroken = true;
    }
  }

  const safeRecord = Math.max(recordDays, currentDays);
  const strength = currentDays >= 60 ? 3 : currentDays >= 30 ? 2 : 1;

  return {
    currentDays,
    recordDays: safeRecord,
    lastLitDate,
    strength,
    isLitToday,
    streakBroken,
  };
}