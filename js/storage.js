import { normalizeSettings } from "./settings.js";
import { evaluateGuess, createGame } from "./game.js";
export const STORAGE_KEY = "wordle-tw-v1";
export function emptyData() {
  return {
    version: 1,
    settings: normalizeSettings(),
    daily: {},
    practice: null,
    records: [],
    recent: [],
  };
}
export function restoreGame(raw, answers, allowed, expected = {}) {
  if (
    !raw ||
    !answers.includes(raw.answer) ||
    typeof raw.id !== "string" ||
    !["daily", "practice"].includes(raw.mode) ||
    Object.entries(expected).some(([k, v]) => raw[k] !== v) ||
    !Array.isArray(raw.guesses) ||
    raw.guesses.length > 6
  )
    return null;
  const g = createGame(raw.answer, raw.id, raw.mode);
  for (const item of raw.guesses) {
    if (g.status !== "playing" || !item || !allowed.has(item.word)) return null;
    const word = item.word;
    g.guesses.push({ word, result: evaluateGuess(word, g.answer) });
    if (word === g.answer) g.status = "won";
    else if (g.guesses.length === 6) g.status = "lost";
  }
  g.input =
    g.status === "playing" &&
    typeof raw.input === "string" &&
    /^[A-Z]{0,5}$/.test(raw.input)
      ? raw.input
      : "";
  return g;
}
export function createStorage(backend) {
  let warning = false;
  return {
    get warning() {
      return warning;
    },
    load() {
      try {
        const raw = backend.getItem(STORAGE_KEY);
        if (!raw) return emptyData();
        const d = JSON.parse(raw);
        if (
          !d ||
          d.version !== 1 ||
          !d.daily ||
          typeof d.daily !== "object" ||
          Array.isArray(d.daily) ||
          !Array.isArray(d.records) ||
          !Array.isArray(d.recent)
        )
          throw Error("format");
        return {
          ...emptyData(),
          ...d,
          settings: normalizeSettings(d.settings),
          records: d.records.filter(
            (r) =>
              r &&
              typeof r.id === "string" &&
              ["daily", "practice"].includes(r.mode) &&
              ["won", "lost"].includes(r.status) &&
              Number.isInteger(r.attempts) &&
              r.attempts >= 1 &&
              r.attempts <= 6 &&
              typeof r.date === "string",
          ),
          recent: d.recent
            .filter((w) => typeof w === "string" && /^[A-Z]{5}$/.test(w))
            .slice(-50),
        };
      } catch {
        warning = true;
        return emptyData();
      }
    },
    save(data) {
      try {
        backend.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
      } catch {
        warning = true;
        return false;
      }
    },
  };
}
