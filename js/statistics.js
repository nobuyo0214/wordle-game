export function recordResult(data, game, date) {
  if (game.status === "playing" || data.records.some((r) => r.id === game.id))
    return false;
  data.records.push({
    id: game.id,
    mode: game.mode,
    status: game.status,
    attempts: game.guesses.length,
    date,
  });
  return true;
}
export function statistics(records, mode) {
  const rows = records.filter((r) => !mode || r.mode === mode),
    distribution = Array(6).fill(0);
  let wins = 0,
    streak = 0,
    best = 0,
    previous = null;
  for (const r of rows) {
    if (
      mode === "daily" &&
      previous &&
      Date.parse(r.date) - Date.parse(previous) > 86400000
    )
      streak = 0;
    if (r.status === "won") {
      wins++;
      streak++;
      distribution[r.attempts - 1]++;
      best = Math.max(best, streak);
    } else streak = 0;
    previous = r.date;
  }
  return {
    played: rows.length,
    wins,
    winRate: rows.length ? Math.round((wins / rows.length) * 100) : 0,
    streak,
    best,
    distribution,
  };
}
