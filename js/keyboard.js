const rank = { absent: 1, present: 2, correct: 3 };
export function keyboardColors(guesses) {
  const colors = {};
  for (const { word, result } of guesses)
    for (let i = 0; i < 5; i++)
      if ((rank[result[i]] || 0) > (rank[colors[word[i]]] || 0))
        colors[word[i]] = result[i];
  return colors;
}
export function buildKeyboard(element, onKey) {
  for (const row of [
    "QWERTYUIOP",
    "ASDFGHJKL",
    ["Enter", ..."ZXCVBNM", "Backspace"],
  ]) {
    const div = document.createElement("div");
    div.className = "key-row";
    for (const key of row) {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.key = key;
      b.textContent =
        key === "Backspace" ? "⌫" : key === "Enter" ? "送出" : key;
      b.setAttribute(
        "aria-label",
        key === "Backspace" ? "刪除字母" : key === "Enter" ? "提交猜測" : key,
      );
      if (key.length > 1) b.className = "wide";
      b.addEventListener("click", () => onKey(key));
      div.append(b);
    }
    element.append(div);
  }
}
