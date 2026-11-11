import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  evaluateGuess,
  createGame,
  typeKey,
  submitGuess,
  shareText,
} from "../js/game.js";
import { keyboardColors } from "../js/keyboard.js";
import {
  taiwanDate,
  dailyAnswer,
  millisecondsToMidnight,
  randomAnswer,
} from "../js/words.js";
import { createStorage, restoreGame, emptyData } from "../js/storage.js";
import { statistics, recordResult } from "../js/statistics.js";
import { normalizeSettings } from "../js/settings.js";
const answers = JSON.parse(
    fs.readFileSync(new URL("../data/answers.json", import.meta.url)),
  ),
  allowed = new Set(
    JSON.parse(
      fs.readFileSync(new URL("../data/allowed-guesses.json", import.meta.url)),
    ),
  );
const guess = (g, w) => {
  g.input = w;
  return submitGuess(g, allowed);
};
test("五格全對", () =>
  assert.deepEqual(evaluateGuess("APPLE", "APPLE"), Array(5).fill("correct")));
test("五格全錯", () =>
  assert.deepEqual(evaluateGuess("QUICK", "BANDS"), Array(5).fill("absent")));
test("字母正確但位置錯誤", () =>
  assert.deepEqual(evaluateGuess("EARTH", "HEART"), Array(5).fill("present")));
test("重複字母先綠後黃", () =>
  assert.deepEqual(evaluateGuess("ALLEY", "APPLE"), [
    "correct",
    "present",
    "absent",
    "present",
    "absent",
  ]));
test("答案重複字母", () =>
  assert.deepEqual(evaluateGuess("PAPAL", "APPLE"), [
    "present",
    "present",
    "correct",
    "absent",
    "present",
  ]));
test("猜測重複字母不超配", () =>
  assert.deepEqual(evaluateGuess("EERIE", "APPLE"), [
    "absent",
    "absent",
    "absent",
    "absent",
    "correct",
  ]));
test("不合法英文單字", () => {
  const g = createGame("APPLE", "x");
  assert.ok(guess(g, "ZZZZZ").error);
  assert.equal(g.guesses.length, 0);
});
test("少於五字母", () =>
  assert.ok(guess(createGame("APPLE", "x"), "APP").error));
test("六次失敗後無法提交", () => {
  const g = createGame("APPLE", "x");
  for (let i = 0; i < 6; i++) guess(g, "CRANE");
  assert.equal(g.status, "lost");
  assert.ok(guess(g, "APPLE").error);
  assert.equal(g.guesses.length, 6);
});
test("第一次猜中", () => {
  const g = createGame("APPLE", "x");
  assert.equal(guess(g, "APPLE").status, "won");
});
test("第六次猜中", () => {
  const g = createGame("APPLE", "x");
  for (let i = 0; i < 5; i++) guess(g, "CRANE");
  guess(g, "APPLE");
  assert.equal(g.status, "won");
  assert.equal(g.guesses.length, 6);
});
test("台灣午夜切換", () => {
  assert.equal(taiwanDate(new Date("2026-11-11T15:59:59Z")), "2026-11-11");
  assert.equal(taiwanDate(new Date("2026-11-11T16:00:00Z")), "2026-11-12");
  assert.equal(millisecondsToMidnight(new Date("2026-11-11T15:59:59Z")), 1000);
});
test("每日答案跨裝置固定且翌日更新", () => {
  assert.equal(
    dailyAnswer(answers, "2026-11-12"),
    dailyAnswer(answers, "2026-11-12"),
  );
  assert.notEqual(
    dailyAnswer(answers, "2026-11-12"),
    dailyAnswer(answers, "2026-11-13"),
  );
});
test("每日進度恢復並重建顏色", () => {
  const g = createGame("APPLE", "daily", "daily");
  guess(g, "CRANE");
  g.input = "AP";
  const restored = restoreGame(
    JSON.parse(JSON.stringify(g)),
    answers,
    allowed,
    { id: "daily" },
  );
  assert.deepEqual(restored, g);
  assert.equal(restoreGame(g, answers, allowed, { id: "other" }), null);
});
test("統計正確且重複提交僅記一次", () => {
  const d = emptyData(),
    g = createGame("APPLE", "x");
  guess(g, "APPLE");
  assert.ok(recordResult(d, g, "2026-11-12"));
  assert.equal(recordResult(d, g, "2026-11-12"), false);
  assert.deepEqual(statistics(d.records, "practice"), {
    played: 1,
    wins: 1,
    winRate: 100,
    streak: 1,
    best: 1,
    distribution: [1, 0, 0, 0, 0, 0],
  });
});
test("每日與練習紀錄分開、敗局重設連勝", () => {
  const records = [
    { mode: "daily", status: "won", attempts: 2, date: "2026-11-10" },
    { mode: "practice", status: "lost", attempts: 6, date: "2026-11-10" },
    { mode: "daily", status: "won", attempts: 3, date: "2026-11-12" },
  ];
  assert.equal(statistics(records, "daily").streak, 1);
  assert.equal(statistics(records, "practice").wins, 0);
});
test("鍵盤綠色優先，不被後續降級", () => {
  const a = { word: "APPLE", result: Array(5).fill("correct") },
    b = { word: "APPLE", result: Array(5).fill("absent") };
  assert.equal(keyboardColors([a, b]).A, "correct");
  assert.equal(
    keyboardColors([{ word: "APPLE", result: Array(5).fill("present") }, b]).A,
    "present",
  );
});
test("結束後禁止輸入", () => {
  const g = createGame("APPLE", "x");
  guess(g, "APPLE");
  assert.equal(typeKey(g, "B"), false);
  assert.equal(typeKey(g, "Backspace"), false);
});
test("localStorage 損壞復原", () => {
  const s = createStorage({ getItem: () => "{oops" });
  assert.equal(s.load().version, 1);
  assert.ok(s.warning);
});
test("localStorage 不可用仍能遊玩", () => {
  const s = createStorage(null);
  assert.equal(s.load().records.length, 0);
  assert.equal(s.save(emptyData()), false);
});
test("儲存格式版本不符復原", () => {
  const s = createStorage({ getItem: () => '{"version":2}' });
  assert.equal(s.load().version, 1);
  assert.ok(s.warning);
});
test("快速輸入不超過五格", () => {
  const g = createGame("APPLE", "x");
  for (const c of "ABCDEFGHIJKLM") typeKey(g, c);
  assert.equal(g.input, "ABCDE");
});
test("非法恢復資料、過多猜測被拒絕", () => {
  const g = createGame("APPLE", "x");
  g.guesses = Array(7).fill({ word: "CRANE" });
  assert.equal(restoreGame(g, answers, allowed), null);
});
test("答案與合法猜測資料完整", () => {
  assert.ok(answers.length >= 2000);
  assert.equal(new Set(answers).size, answers.length);
  assert.ok(answers.every((w) => /^[A-Z]{5}$/.test(w) && allowed.has(w)));
  assert.ok([...allowed].every((w) => /^[A-Z]{5}$/.test(w)));
});
test("練習排除近期答案", () =>
  assert.equal(
    randomAnswer(["APPLE", "CRANE"], ["APPLE"], () => 0),
    "CRANE",
  ));
test("分享不洩漏答案", () => {
  const g = createGame("APPLE", "x");
  guess(g, "APPLE");
  assert.ok(!shareText(g).includes("APPLE"));
  assert.ok(shareText(g).includes("🟩🟩🟩🟩🟩"));
});
test("設定型別與音量復原", () => {
  const s = normalizeSettings({ theme: "oops", volume: 4, animation: "yes" });
  assert.equal(s.theme, "light");
  assert.equal(s.volume, 1);
  assert.equal(s.animation, true);
});
test("localStorage 完整往返", () => {
  let value;
  const s = createStorage({
    getItem: () => value,
    setItem: (k, v) => (value = v),
  });
  const d = emptyData();
  d.practice = createGame("APPLE", "x");
  s.save(d);
  assert.deepEqual(s.load(), d);
});
