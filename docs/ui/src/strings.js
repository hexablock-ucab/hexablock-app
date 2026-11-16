/*
 * English strings for the mockups (FR-10). Export a mockup in English with ?lang=en.
 * The app keeps its strings in ARB files with ICU placeholders and plurals; the keys below
 * show the message and its placeholders, for example {done} of {total} levels.
 * Numbers use the locale's separator: 3 960 (es) and 3,960 (en).
 */
window.HB_STRINGS = {
  en: {
    "Progreso al día": "Progress up to date",
    "Continuar": "Continue",
    "Hexa Fit · Nivel 7": "Hexa Fit · Level 7",
    "Completa líneas en los 3 ejes.": "Complete lines on all 3 axes.",
    "Encaja todas las piezas.": "Fit every piece.",
    "Apila y junta 10 iguales.": "Stack and gather 10 alike.",
    "Suma fichas hasta 2048.": "Merge tiles up to 2048.",
    "Mejor": "Best",
    "Hechos": "Done",
    "Versión 1.0.0 · UCAB 2026-2": "Version 1.0.0 · UCAB 2026-2",
    "Movimientos": "Moves",
    "Tiempo": "Time",
    "Nivel 7": "Level 7",
    "3★ con": "3★ with",
    "≤ 8 mov. · ≤ 1:00": "≤ 8 moves · ≤ 1:00",
    "Toca una pieza puesta para devolverla a la bandeja.": "Tap a placed piece to send it back to the tray.",
    "Quedan 3 de 5 piezas": "3 of 5 pieces left",
  },
};
(function () {
  const lang = new URLSearchParams(location.search).get("lang");
  const table = lang && window.HB_STRINGS[lang];
  if (!table) return;
  document.documentElement.lang = lang;
  window.addEventListener("load", () => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) {
      const key = n.nodeValue.trim();
      if (!key || n.parentElement.closest("script, style")) continue;
      let v = table[key] ?? key;
      if (lang === "en") v = v.replace(/(\d) (\d{3})\b/g, "$1,$2");   // thousands separator
      if (v !== key) n.nodeValue = n.nodeValue.replace(key, v);
    }
  });
})();
