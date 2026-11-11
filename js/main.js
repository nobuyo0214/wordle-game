import { createGame, typeKey, submitGuess, shareText } from "./game.js";
import {
  loadWords,
  taiwanDate,
  dailyAnswer,
  millisecondsToMidnight,
  randomAnswer,
  ANSWER_VERSION,
} from "./words.js";
import { buildKeyboard, keyboardColors } from "./keyboard.js";
import { createStorage, restoreGame } from "./storage.js";
import { recordResult, statistics } from "./statistics.js";
import { applySettings, playTone } from "./settings.js";
const $ = (id) => document.getElementById(id);
let backend;
try {
  backend = window.localStorage;
} catch {
  backend = null;
}
const store = createStorage(backend),
  data = store.load();
applySettings(data.settings);
let words,
  game,
  mode = "daily",
  day = taiwanDate(),
  busy = false,
  epoch = 0;
const labels = {
  correct: "位置正確",
  present: "字母正確，位置不同",
  absent: "未配對",
};
function message(text) {
  $("message").textContent = text;
}
function persist() {
  if (game.mode === "daily") data.daily[day] = game;
  else data.practice = game;
  store.save(data);
}
function id() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
}
function start(next = mode, fresh = false) {
  epoch++;
  busy = false;
  mode = next;
  day = taiwanDate();
  if (mode === "daily") {
    const answer = dailyAnswer(words.answers, day),
      key = `${ANSWER_VERSION}:${day}`;
    game =
      restoreGame(data.daily[day], words.answers, words.allowed, {
        id: key,
        mode,
        answer,
      }) || createGame(answer, key, mode);
  } else {
    game =
      !fresh &&
      restoreGame(data.practice, words.answers, words.allowed, { mode });
    if (!game) {
      const answer = randomAnswer(words.answers, data.recent);
      data.recent.push(answer);
      data.recent = data.recent.slice(-50);
      game = createGame(answer, id(), mode);
    }
  }
  if (game.status !== "playing") recordResult(data, game, day);
  persist();
  render();
  message(
    game.status === "playing"
      ? store.warning
        ? "儲存功能無法使用或資料已復原；請勿關閉此頁。"
        : "準備好了嗎？輸入第一個單字。"
      : endMessage(),
  );
}
function endMessage() {
  return game.status === "won"
    ? `太棒了！你在第 ${game.guesses.length} 次猜中了。`
    : `本局結束，正確答案是 ${game.answer}。`;
}
function render() {
  $("daily").setAttribute("aria-pressed", mode === "daily");
  $("practice").setAttribute("aria-pressed", mode === "practice");
  $("mode-label").textContent =
    mode === "daily" ? "每天一道，全世界一起猜" : "隨時開始，慢慢找到你的節奏";
  $("game-title").textContent =
    mode === "daily" ? "今日的五字謎題" : "下一個字，等你發現";
  $("date").textContent =
    mode === "daily" ? day.replaceAll("-", " / ") : "不限次數";
  const board = $("board");
  board.replaceChildren();
  for (let r = 0; r < 6; r++) {
    const row = document.createElement("div");
    row.className = "board-row";
    const guess = game.guesses[r],
      word = guess?.word || (r === game.guesses.length ? game.input : "");
    for (let c = 0; c < 5; c++) {
      const tile = document.createElement("div");
      tile.className =
        "tile" + (guess ? " " + guess.result[c] : word[c] ? " filled" : "");
      tile.textContent = word[c] || "";
      tile.setAttribute(
        "aria-label",
        `第 ${r + 1} 次，第 ${c + 1} 格：${word[c] || "空白"}${guess ? "，" + labels[guess.result[c]] : ""}`,
      );
      row.append(tile);
    }
    board.append(row);
  }
  const colors = keyboardColors(game.guesses);
  for (const b of $("keyboard").querySelectorAll("button")) {
    b.className =
      (b.dataset.key.length > 1 ? "wide " : "") + (colors[b.dataset.key] || "");
    b.setAttribute(
      "aria-label",
      b.dataset.key === "Enter"
        ? "提交猜測"
        : b.dataset.key === "Backspace"
          ? "刪除字母"
          : b.dataset.key +
            (colors[b.dataset.key] ? "，" + labels[colors[b.dataset.key]] : ""),
    );
  }
  $("share").hidden = game.status === "playing";
  $("restart").hidden = mode !== "practice" || game.status === "playing";
}
function checkDate() {
  if (day !== taiwanDate()) {
    if (mode === "daily") {
      start("daily");
      message("台灣時間已跨日，新的每日挑戰已準備好。");
    } else day = taiwanDate();
  }
}
async function onKey(key) {
  if (!words || $("modal").open) return;
  checkDate();
  if (busy || game.status !== "playing") return;
  if (key !== "Enter") {
    if (typeKey(game, key)) {
      persist();
      render();
      if (/^[A-Z]$/.test(key))
        $("board").children[game.guesses.length]?.children[
          game.input.length - 1
        ]?.classList.add("pop");
    }
    return;
  }
  const result = submitGuess(game, words.allowed);
  if (result.error) {
    message(result.error);
    const row = $("board").children[game.guesses.length];
    row?.classList.remove("shake");
    void row?.offsetWidth;
    row?.classList.add("shake");
    return;
  }
  busy = true;
  const token = epoch;
  recordResult(data, game, day);
  persist();
  render();
  playTone(data.settings, game.status === "won");
  const row = $("board").children[game.guesses.length - 1];
  if (
    data.settings.animation &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    [...row.children].forEach((t, i) => {
      t.style.animationDelay = `${i * 100}ms`;
      t.classList.add("flip");
    });
    await new Promise((r) => setTimeout(r, 850));
  }
  if (token !== epoch) return;
  checkDate();
  if (token !== epoch) return;
  busy = false;
  if (game.status !== "playing") {
    message(endMessage());
    if (game.status === "won") row.classList.add("bounce");
  } else message(`還有 ${6 - game.guesses.length} 次機會，繼續加油。`);
}
buildKeyboard($("keyboard"), onKey);
document.addEventListener("keydown", (e) => {
  if (
    !data.settings.physicalKeyboard ||
    e.ctrlKey ||
    e.metaKey ||
    e.altKey ||
    e.isComposing ||
    e.repeat ||
    $("modal").open
  )
    return;
  const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  if (/^[A-Z]$/.test(key) || ["Enter", "Backspace"].includes(key)) {
    if (
      e.target.closest("button") &&
      !e.target.closest("#keyboard") &&
      e.key === "Enter"
    )
      return;
    e.preventDefault();
    onKey(key);
  }
});
$("daily").onclick = () => words && start("daily");
$("practice").onclick = () => words && start("practice");
$("restart").onclick = () => start("practice", true);
function openModal(title, html) {
  $("modal-title").textContent = title;
  $("modal-content").innerHTML = html;
  $("modal").showModal();
}
$("close-modal").onclick = () => $("modal").close();
$("modal").addEventListener("click", (e) => {
  if (e.target === $("modal")) {
    const r = $("modal").getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      $("modal").close();
  }
});
$("help").onclick = () =>
  openModal(
    "每個字母，都是線索",
    `<p>在六次機會內，猜出一個五字母英文單字。使用實體鍵盤或下方按鍵輸入，再按 Enter（送出）。Backspace 可刪除。</p><p>🟩 <strong>綠色：</strong>字母與位置都正確。<br>🟨 <strong>黃色：</strong>答案有這個字母，但位置不同。<br>⬜ <strong>灰色：</strong>答案沒有此字母，或次數已用完。</p><p>重複字母先配對綠色，再依答案剩餘數量配對黃色。例如答案 APPLE、猜測 ALLEY，第一個 A 為綠色，兩個 L 只有一個為黃色。</p><p><strong>每日挑戰</strong>依台灣時間午夜更新，同一天每個人的答案相同。完成後當日不能重玩。單次限制僅儲存在目前瀏覽器；清除網站資料或更換裝置可能重設進度與紀錄。<strong>無限練習</strong>隨時挑戰新單字，紀錄分開保存。</p>`,
  );
$("stats").onclick = () => {
  const html = ["daily", "practice"]
    .map((m) => {
      const s = statistics(data.records, m),
        max = Math.max(1, ...s.distribution);
      return `<section><h3>${m === "daily" ? "每日挑戰" : "無限練習"}</h3><div class="metrics"><div><b>${s.played}</b>場數</div><div><b>${s.winRate}%</b>勝率</div><div><b>${s.streak}</b>目前連勝</div><div><b>${s.best}</b>最長連勝</div></div><p>勝利 ${s.wins} 場 · 猜測次數分布</p>${s.distribution.map((n, i) => `<div class="histogram"><span>${i + 1}</span><meter min="0" max="${max}" value="${n}" aria-label="${i + 1} 次猜中 ${n} 場"></meter><b>${n}</b></div>`).join("")}</section>`;
    })
    .join("");
  const total = statistics(data.records);
  openModal(
    "你的猜字足跡",
    `<p>合計 ${total.played} 場，勝利 ${total.wins} 場，勝率 ${total.winRate}%</p>` +
      html,
  );
};
$("settings").onclick = () => {
  const s = data.settings;
  openModal(
    "打造你的遊戲節奏",
    `<label class="setting">外觀<select id="theme"><option value="light">淺色</option><option value="dark">深色</option></select></label>${[
      ["contrast", "高對比色彩"],
      ["animation", "翻轉與跳動動畫"],
      ["sound", "音效"],
      ["physicalKeyboard", "實體鍵盤輸入"],
    ]
      .map(
        ([k, t]) =>
          `<label class="setting">${t}<input id="${k}" type="checkbox" ${s[k] ? "checked" : ""}></label>`,
      )
      .join(
        "",
      )}<label class="setting">音量<input id="volume" type="range" min="0" max="1" step="0.05" value="${s.volume}"></label><p class="muted">設定自動儲存。即使關閉動畫，仍可使用文字提示閱讀結果。</p>`,
  );
  $("theme").value = s.theme;
  for (const k of Object.keys(s))
    $(k).addEventListener("change", () => {
      s[k] =
        k === "theme"
          ? $(k).value
          : k === "volume"
            ? Number($(k).value)
            : $(k).checked;
      applySettings(s);
      store.save(data);
      if (store.warning) message("無法儲存設定，本次分頁仍可使用。");
    });
};
$("share").onclick = async () => {
  const text = shareText(game, day);
  try {
    await navigator.clipboard.writeText(text);
    message("結果已複製，不含答案。");
  } catch {
    openModal(
      "複製分享結果",
      '<p>無法自動複製，請選取以下文字：</p><textarea id="share-text" rows="10" readonly aria-label="分享結果"></textarea>',
    );
    $("share-text").value = text;
    $("share-text").select();
  }
};
function tick() {
  if (!words) return;
  checkDate();
  const seconds = Math.ceil(millisecondsToMidnight() / 1000),
    h = Math.floor(seconds / 3600),
    m = Math.floor((seconds % 3600) / 60),
    s = seconds % 60;
  $("countdown").textContent =
    `下次每日挑戰 ${[h, m, s].map((n) => String(n).padStart(2, "0")).join(" : ")}`;
}
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) tick();
});
try {
  words = await loadWords();
  start();
  tick();
  setInterval(tick, 1000);
} catch (error) {
  message("單字資料載入失敗，請確認透過 HTTP 開啟並重新整理。");
  console.error(error);
}
