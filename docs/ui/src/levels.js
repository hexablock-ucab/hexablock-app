/*
 * Level select data for the mockups. The screen is the same for every level-based variant;
 * a new variant adds one entry here (the app does the same with its level catalog, D3).
 */
(function () {
  const GAMES = {
    fit:  { title: "Hexa Fit",  accent: "--variant-fit",  stars: [3, 3, 2, 3, 1, 2], total: 15, tapped: 9, help: "Cubre toda la figura con las piezas. Gíralas de 60° en 60°; puedes deshacer sin límite.", icon: "rotate" },
    sort: { title: "Hexa Sort", accent: "--variant-sort", stars: [3, 2, 3],          total: 10, tapped: 6, help: "Coloca cada pila en una celda vacía. 10 fichas del mismo símbolo y color forman una meta.", icon: "levels" },
  };
  const g = GAMES[window.GAME || "fit"];
  const HEX = "50,0 100,28.87 100,86.6 50,115.47 0,86.6 0,28.87";
  const next = g.stars.length + 1, earned = g.stars.reduce((a, b) => a + b, 0);
  document.body.style.setProperty("--accent", `var(${g.accent})`);

  function tile(n) {
    if (n <= g.stars.length) return `<svg class="bg" viewBox="-4 -4 108 123.47"><polygon points="${HEX}" fill="var(--surface-2)" stroke="var(--accent)" stroke-width="3"/></svg>
      <span class="n">${n}</span><span class="stars">${HB.stars(g.stars[n - 1], 3, 14)}</span>`;
    if (n === next) return `<svg class="bg" viewBox="-4 -4 108 123.47"><polygon points="${HEX}" fill="var(--primary)" stroke="var(--primary-light)" stroke-width="3"/></svg>
      <span class="n" style="color:var(--text-on-accent)">${n}</span><span class="t-label" style="position:relative; color:var(--text-on-accent); margin-top:5px">Jugar</span>`;
    return `<svg class="bg" viewBox="-4 -4 108 123.47"><polygon points="${HEX}" fill="var(--surface)" stroke="var(--line-strong)" stroke-width="3" stroke-dasharray="8 6"/></svg>
      <span style="position:relative; width:22px; height:22px; color:var(--line-strong)">${HB.ICONS.lock}</span>
      <span class="t-label" style="position:relative; margin-top:2px">${n}</span>`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("title").textContent = g.title;
    document.getElementById("starsTotal").innerHTML = `${HB.stars(1, 1, 18)}${earned}`;
    document.getElementById("progress").innerHTML = `<b style="font-family:var(--font-display); font-size:18px">${g.stars.length}</b> <span style="color:var(--text-muted)">de ${g.total} niveles · ${earned} de ${g.total * 3} ★</span>`;
    document.getElementById("bar").style.width = `${Math.round(100 * g.stars.length / g.total)}%`;
    document.getElementById("help").textContent = g.help;
    document.getElementById("helpIcon").innerHTML = HB.ICONS[g.icon];
    // Honeycomb: rows of 3 and 2 alternate. Center line at 175 (screen 350 wide).
    const comb = document.getElementById("comb");
    // S7: tapping a locked level shakes it (red outline) and shows this snackbar for a few seconds.
    comb.insertAdjacentHTML("beforeend", `<div class="tip"><b>Nivel ${g.tapped} bloqueado.</b> Completa el nivel ${next} para desbloquearlo.</div>`);
    let n = 1, row = 0;
    while (n <= g.total) {
      const xs = row % 2 === 0 ? [79, 175, 271] : [127, 223];
      for (const x of xs) {
        if (n > g.total) break;
        const el = document.createElement("div");
        el.className = "lvl" + (n === next ? " next" : "") + (n === g.tapped ? " tapped" : "");
        el.style.left = (x - 42) + "px"; el.style.top = (8 + row * 80) + "px";
        el.innerHTML = tile(n);
        comb.appendChild(el);
        // S7: what tapping a locked level does.
        n++;
      }
      row++;
    }
  });
})();
