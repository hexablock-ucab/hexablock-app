/*
 * HexaBlock Suite — leaderboard mockups (draft until the API contract, D5).
 * One layout for every variant; each variant only chooses its columns, from the order of RANK-1 in docs/game-rules.md.
 * Players are invented for the mockup. Each player appears once per table, with their best result (RANK-2).
 */
(function () {
  const GAMES = {
    fit: { name: "Hexa Fit", accent: "--variant-fit", scope: "Nivel 7", levels: true,
      cols: ["★", "Mov.", "Tiempo"],
      rows: [["andrea_k", 3, 9, "0:38"], ["luisgm", 3, 9, "0:44"], ["mar.p", 3, 10, "0:31"], ["tomasr", 3, 11, "0:52"],
             ["dani_07", 2, 8, "1:12"], ["sofi.h", 2, 12, "0:58"], ["kevinz", 2, 13, "1:05"], ["ines", 1, 16, "2:10"]],
      me: [18, "valen (tú)", 2, 14, "1:20"] },
    lines: { name: "Hexa Lines", accent: "--variant-lines", scope: "Global", levels: false,
      cols: ["Puntaje", "Fecha"],
      rows: [["luisgm", "18 420", "21 nov"], ["andrea_k", "15 960", "19 nov"], ["kevinz", "12 300", "22 nov"], ["mar.p", "9 870", "20 nov"],
             ["tomasr", "8 440", "18 nov"], ["sofi.h", "6 120", "22 nov"], ["dani_07", "5 400", "17 nov"], ["ines", "4 980", "23 nov"]],
      me: [12, "valen (tú)", "3 960", "16 nov"] },
  };
  const g = GAMES[window.BOARD_GAME || "fit"];
  const games = [["lines", "Lines"], ["fit", "Fit"], ["sort", "Sort"], ["merge", "Merge"]];
  const medal = n => n <= 3 ? `<span class="medal m${n}">${n}</span>` : `<span class="rank">${n}</span>`;
  const cells = r => r.slice(1).map((v, i) => `<span class="c">${g.cols[i] === "★" ? HB.stars(v, 3, 14) : v}</span>`).join("");
  document.addEventListener("DOMContentLoaded", () => {
    document.body.style.setProperty("--accent", `var(${g.accent})`);
    document.getElementById("games").innerHTML = games.map(([k, n]) => `<span class="${GAMES[window.BOARD_GAME || "fit"] === GAMES[k] ? "active" : ""}">${n}</span>`).join("");
    document.getElementById("scope").innerHTML = g.levels
      ? `<span class="chip pick">${g.scope}<span class="dd" data-icon="next"></span></span><span class="segmented seg-sm"><span class="active">Por nivel</span><span>Global</span></span>`
      : `<span class="chip">Récord de cada jugador · todas las partidas</span>`;
    document.getElementById("head").innerHTML = `<span class="rank">#</span><span class="name">Jugador</span>` + g.cols.map(c => `<span class="c">${c}</span>`).join("");
    document.getElementById("rows").innerHTML = g.rows.map((r, i) => `<div class="row">${medal(i + 1)}<span class="name">${r[0]}</span>${cells(r)}</div>`).join("");
    const [n, ...me] = g.me;
    document.getElementById("me").innerHTML = `${medal(n)}<span class="name">${me[0]}</span>${cells(me)}`;
    document.querySelectorAll("[data-icon]").forEach(el => { if (!el.innerHTML) el.innerHTML = HB.ICONS[el.dataset.icon]; });
  });
})();
