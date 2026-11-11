export const defaults = {
  theme: "light",
  contrast: false,
  animation: true,
  sound: false,
  volume: 0.25,
  physicalKeyboard: true,
};
export function normalizeSettings(value = {}) {
  const s = { ...defaults };
  if (["light", "dark"].includes(value.theme)) s.theme = value.theme;
  for (const k of ["contrast", "animation", "sound", "physicalKeyboard"])
    if (typeof value[k] === "boolean") s[k] = value[k];
  if (typeof value.volume === "number" && Number.isFinite(value.volume))
    s.volume = Math.min(1, Math.max(0, value.volume));
  return s;
}
export function applySettings(s) {
  document.documentElement.dataset.theme = s.theme;
  document.documentElement.classList.toggle("high-contrast", s.contrast);
  document.documentElement.classList.toggle("no-animation", !s.animation);
}
export function playTone(s, won = false) {
  if (!s.sound) return;
  try {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    const c = new C(),
      o = c.createOscillator(),
      g = c.createGain();
    o.frequency.value = won ? 660 : 330;
    g.gain.setValueAtTime(s.volume * 0.15, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.16);
    o.onended = () => c.close();
  } catch {
    /* Sound is optional. */
  }
}
