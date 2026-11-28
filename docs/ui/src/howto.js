/*
 * HexaBlock Suite — how-to-play modal, one config per variant (team decision of 2026-11-23).
 * The page sets window.HOWTO to "fit", "lines", "sort" or "merge". The strings are the howTo… keys of docs/ui/l10n.
 * Only Hexa Fit has a clock: its modal stops it and hides the board, like the pause menu.
 */
(function () {
  const C = { r: "var(--tile-red)", o: "var(--tile-orange)", y: "var(--tile-yellow)", g: "var(--tile-green)", c: "var(--tile-cyan)", v: "var(--tile-violet)" };
  const fig = [[0,0],[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
  const merge = (v, size) => HB.board({ cells: [[0,0]], size, gap: 0, fill: () => HB.MERGE.fill(v), label: () => ({ text: v, color: HB.MERGE.ink(v), size: size * (v >= 1000 ? 0.55 : v >= 100 ? 0.7 : 0.9) }) });
  const G = {
    fit: { name: "Hexa Fit", accent: "--variant-fit", behind: "06-hexa-fit.html?paused", clock: true,
      steps: [
        [() => HB.board({ cells: fig, size: 9, gap: 1.4, fill: (q, r) => (q === 1 && r === -1) || (q === 1 && r === 0) || (q === 0 && r === 0) ? "var(--variant-fit)" : null }), "Arrastra una pieza a la figura, o tócala y luego toca una casilla."],
        [() => HB.piece([[0,0],[1,0],[1,-1]], 11, C.g), "Gírala con el botón, de 60° en 60°. Toca una pieza puesta para devolverla."],
        [() => { const a = { "0,0": 1, "1,0": 1, "1,-1": 1 }; return HB.board({ cells: fig, size: 9, gap: 1.4, fill: (q, r) => a[q + "," + r] ? "var(--variant-fit)" : C.g }); }, "Cubre toda la figura, sin huecos ni piezas encimadas."]],
      stars: "1 estrella por ganar, +1 si no pasas los movimientos y +1 si no pasas el tiempo." },
    lines: { name: "Hexa Lines", accent: "--variant-lines", behind: "05-hexa-lines.html",
      steps: [
        [() => HB.piece([[0,0],[1,0],[0,1]], 11, C.y), "Coloca una de las 3 piezas en un lugar libre donde quepa entera."],
        [() => HB.board({ cells: [[-2,0],[-1,0],[0,0],[1,0],[2,0]], size: 7, gap: 1.2, fill: () => C.c }), "Completa líneas en cualquiera de los 3 ejes para borrarlas y sumar puntos."],
        [() => `<span class="mult">×3</span>`, "Varias líneas a la vez y jugadas seguidas con línea multiplican el puntaje. Pierdes cuando ninguna pieza cabe."]] },
    sort: { name: "Hexa Sort", accent: "--variant-sort", behind: "07-hexa-sort.html",
      steps: [
        [() => HB.board({ cells: [[0,0]], size: 16, gap: 0, stack: () => [C.c, C.o, C.o] }), "Toca una casilla vacía para poner la pila de la bandeja."],
        [() => HB.board({ cells: [[0,0],[1,0]], size: 13, gap: 2, stack: (q) => q ? [C.g, C.o, C.o, C.o] : [C.v, C.o] }), "Las fichas iguales de arriba pasan a la pila vecina que tiene más, en cascada."],
        [() => `<span class="mult">10</span>`, "10 fichas iguales juntas cuentan una meta. Cumple las metas antes de llenar el tablero."]] },
    merge: { name: "Hexa Merge", accent: "--variant-merge", behind: "08-hexa-merge.html",
      steps: [
        [() => HB.board({ cells: HB.hexagon(1), size: 9, gap: 1.4, fill: (q, r) => q === 1 && r === -1 ? HB.MERGE.fill(4) : null }), "Desliza en una de las 6 direcciones: todas las fichas se mueven hasta el borde."],
        [() => `<span class="pair">${merge(8, 13)}<b>→</b>${merge(16, 13)}</span>`, "Dos fichas iguales que chocan se suman en una. Cada fusión suma puntos."],
        [() => merge(2048, 18), "Llega a 2048 y sigue jugando. Termina cuando ningún deslizamiento cambia el tablero."]] },
  };
  const g = G[window.HOWTO || "fit"];
  document.addEventListener("DOMContentLoaded", () => {
    document.body.style.setProperty("--accent", `var(${g.accent})`);
    const f = document.querySelector("iframe.behind");
    f.src = g.behind + (location.search ? (g.behind.includes("?") ? "&" : "?") + location.search.slice(1) : "");
    document.querySelector(".gname").textContent = g.name;
    document.querySelector(".sheet").setAttribute("aria-label", "Cómo jugar " + g.name);
    if (!g.clock) document.querySelector(".chip.clock").remove();
    document.querySelector(".steps").innerHTML = g.steps.map(([pic, text], i) =>
      `<li class="step"><div class="pic">${pic()}</div><div><div class="n">${i + 1}</div><div class="t-body">${text}</div></div></li>`).join("");
    const st = document.querySelector(".stars-row");
    if (g.stars) st.querySelector(".t-body").textContent = g.stars; else st.remove();
    document.querySelector(".note").textContent = `Aparece la primera vez que juegas ${g.name} y en Pausa → Cómo jugar.`;
  });
})();
