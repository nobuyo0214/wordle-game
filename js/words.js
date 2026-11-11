export const ANSWER_VERSION = "v1-d48afc24";
export function taiwanDate(now = new Date()) {
  return new Date(now.getTime() + 8 * 3600000).toISOString().slice(0, 10);
}
export function dailyAnswer(answers, date) {
  const day = Math.floor(Date.parse(date + "T00:00:00Z") / 86400000);
  return answers[
    (((day * 997 + 137) % answers.length) + answers.length) % answers.length
  ];
}
export function millisecondsToMidnight(now = new Date()) {
  return 86400000 - ((now.getTime() + 28800000) % 86400000);
}
export function randomAnswer(answers, recent = [], random = Math.random) {
  const available = answers.filter((w) => !recent.includes(w));
  const pool = available.length ? available : answers;
  return pool[Math.floor(random() * pool.length)];
}
export async function loadWords() {
  const responses = await Promise.all(
    ["answers", "allowed-guesses"].map((p) =>
      fetch(new URL(`../data/${p}.json`, import.meta.url)),
    ),
  );
  if (responses.some((r) => !r.ok)) throw Error("無法載入單字資料");
  const [answers, allowed] = await Promise.all(responses.map((r) => r.json()));
  return { answers, allowed: new Set([...allowed, ...answers]) };
}
