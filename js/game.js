export const WORD_LENGTH = 5,
  MAX_GUESSES = 6;
export function evaluateGuess(guess, answer) {
  const result = Array(5).fill("absent"),
    remaining = {};
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) result[i] = "correct";
    else remaining[answer[i]] = (remaining[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < 5; i++)
    if (result[i] !== "correct" && remaining[guess[i]] > 0) {
      result[i] = "present";
      remaining[guess[i]]--;
    }
  return result;
}
export function createGame(answer, id, mode = "practice") {
  return { id, mode, answer, guesses: [], input: "", status: "playing" };
}
export function typeKey(game, key) {
  if (game.status !== "playing") return false;
  if (key === "Backspace") {
    game.input = game.input.slice(0, -1);
    return true;
  }
  if (/^[A-Z]$/.test(key) && game.input.length < 5) {
    game.input += key;
    return true;
  }
  return false;
}
export function submitGuess(game, allowed) {
  if (game.status !== "playing") return { error: "遊戲已結束" };
  if (game.input.length !== 5) return { error: "請輸入五個英文字母" };
  if (!allowed.has(game.input))
    return { error: "單字清單中找不到這個字，請再試一次" };
  const word = game.input,
    result = evaluateGuess(word, game.answer);
  game.guesses.push({ word, result });
  game.input = "";
  if (word === game.answer) game.status = "won";
  else if (game.guesses.length === 6) game.status = "lost";
  return { word, result, status: game.status };
}
export function shareText(game, date = "") {
  const blocks = { correct: "🟩", present: "🟨", absent: "⬜" };
  return (
    `Wordle ${game.mode === "daily" ? "每日挑戰 " + date : "練習模式"} ${game.status === "won" ? game.guesses.length : "X"}/6\n\n` +
    game.guesses.map((g) => g.result.map((r) => blocks[r]).join("")).join("\n")
  );
}
