/*
 * HexaBlock Suite — tiny helper that draws hexagonal boards for the UI mockups (D12).
 * It only draws; it holds no game rules. Every mockup uses it, so the board look is
 * defined once. Changing the cell shape (for example squares, ADR-0004) means
 * changing CELL_POINTS and toPixel here, not the screens.
 *
 * Axial coordinates (q, r) and the pointy-top layout follow Red Blob Games,
 * "Hexagonal Grids": https://www.redblobgames.com/grids/hexagons/
 */
(function () {
  const SQRT3 = Math.sqrt(3);
  const CELL_POINTS = "50,0 100,28.87 100,86.6 50,115.47 0,86.6 0,28.87";

  // Shared SVG definitions: shine gradient, filled tile, empty cell, ghost (fits here) cell, star.
  const DEFS = `
  <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.55"/>
      <stop offset="0.5" stop-color="#fff" stop-opacity="0.05"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.25"/>
    </linearGradient>
    <symbol id="hx" viewBox="-4 -4 108 123.47">
      <polygon points="${CELL_POINTS}" stroke="rgba(255,255,255,0.35)" stroke-width="3" stroke-linejoin="round"/>
      <polygon points="${CELL_POINTS}" fill="url(#shine)"/>
    </symbol>
    <symbol id="hx-empty" viewBox="-4 -4 108 123.47">
      <polygon points="${CELL_POINTS}" fill="#121A40" stroke="#34408A" stroke-width="3" stroke-linejoin="round"/>
    </symbol>
    <symbol id="hx-ghost" viewBox="-4 -4 108 123.47">
      <polygon points="${CELL_POINTS}" fill="rgba(63,224,224,0.18)" stroke="#3FE0E0" stroke-width="5" stroke-dasharray="10 7" stroke-linejoin="round"/>
    </symbol>
    <symbol id="hx-flat" viewBox="-4 -4 108 123.47">
      <polygon points="${CELL_POINTS}" stroke-linejoin="round"/>
    </symbol>
    <symbol id="star" viewBox="0 0 24 24"><polygon points="12,2 15,9 22,9.3 16.5,14 18.4,21.5 12,17.3 5.6,21.5 7.5,14 2,9.3 9,9"/></symbol>
  </defs></svg>`;

  function toPixel(q, r, size) {
    return { x: size * SQRT3 * (q + r / 2), y: size * 1.5 * r };
  }

  // All cells of a hexagon of the given radius.
  function hexagon(radius) {
    const cells = [];
    for (let q = -radius; q <= radius; q++) {
      for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) cells.push([q, r]);
    }
    return cells;
  }

  /*
   * board({ cells, size, fill, label, stack, gap }) -> SVG string sized to its content.
   *   cells: array of [q, r]
   *   size:  hex radius in px (center to corner)
   *   fill(q, r)  -> color string | "ghost" | "bad" | null (empty cell)
   *   label(q, r) -> { text, color, size } | null
   *   stack(q, r) -> array of colors, bottom to top (Hexa Sort) | null
   */
  function board(opts) {
    const size = opts.size, gap = opts.gap ?? 2;
    const w = SQRT3 * size, h = 2 * size;
    const pts = opts.cells.map(([q, r]) => ({ q, r, ...toPixel(q, r, size) }));
    const lift = opts.stack ? Math.round(size * 0.22) : 0;
    const maxStack = opts.stack ? Math.max(1, ...pts.map(p => (opts.stack(p.q, p.r) || []).length)) : 1;
    const minX = Math.min(...pts.map(p => p.x)) - w / 2, maxX = Math.max(...pts.map(p => p.x)) + w / 2;
    const minY = Math.min(...pts.map(p => p.y)) - h / 2 - lift * (maxStack - 1), maxY = Math.max(...pts.map(p => p.y)) + h / 2;
    const cw = w - gap, ch = h - gap * 1.15;
    let out = `<svg width="${(maxX - minX).toFixed(0)}" height="${(maxY - minY).toFixed(0)}" viewBox="${minX.toFixed(1)} ${minY.toFixed(1)} ${(maxX - minX).toFixed(1)} ${(maxY - minY).toFixed(1)}">`;
    // Draw back rows first so stacks overlap naturally.
    pts.sort((a, b) => a.y - b.y || a.x - b.x);
    for (const p of pts) {
      const x = p.x - cw / 2, y = p.y - ch / 2;
      out += `<use href="#hx-empty" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cw.toFixed(1)}" height="${ch.toFixed(1)}"/>`;
    }
    for (const p of pts) {
      const x = p.x - cw / 2, y = p.y - ch / 2;
      const stack = opts.stack ? opts.stack(p.q, p.r) : null;
      if (stack && stack.length) {
        stack.forEach((color, i) => {
          out += `<use href="#hx" x="${x.toFixed(1)}" y="${(y - i * lift).toFixed(1)}" width="${cw.toFixed(1)}" height="${ch.toFixed(1)}" fill="${color}"/>`;
        });
        const top = stack[stack.length - 1];
        let run = 0; for (let i = stack.length - 1; i >= 0 && stack[i] === top; i--) run++;
        out += `<text x="${p.x.toFixed(1)}" y="${(p.y - (stack.length - 1) * lift + size * 0.32).toFixed(1)}" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="${(size * 0.8).toFixed(0)}" fill="#1A1300">${run}</text>`;
        continue;
      }
      const f = opts.fill ? opts.fill(p.q, p.r) : null;
      if (f === "ghost") out += `<use href="#hx-ghost" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cw.toFixed(1)}" height="${ch.toFixed(1)}"/>`;
      else if (f) out += `<use href="#hx" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cw.toFixed(1)}" height="${ch.toFixed(1)}" fill="${f}"/>`;
      const l = opts.label ? opts.label(p.q, p.r) : null;
      if (l) out += `<text x="${p.x.toFixed(1)}" y="${(p.y + (l.size || size * 0.7) * 0.36).toFixed(1)}" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="${(l.size || size * 0.7).toFixed(0)}" fill="${l.color || "#F2F4FF"}">${l.text}</text>`;
    }
    return out + "</svg>";
  }

  // A piece (poly-hex) drawn on its own, for trays.
  function piece(cells, size, color) {
    return board({ cells, size, gap: 2, fill: () => color, emptyless: true }).replace(/<use href="#hx-empty"[^>]*\/>/g, "");
  }

  // Phone status bar (time, signal, wifi, battery), shared by every screen.
  const STATUS = `<div class="status"><span>9:41</span><span class="icons">
  <svg width="18" height="12" viewBox="0 0 18 12" fill="#F2F4FF"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
  <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="#F2F4FF" stroke-width="2" stroke-linecap="round"><path d="M1.5 4.2a9.5 9.5 0 0 1 13 0M4 7a5.8 5.8 0 0 1 8 0"/><circle cx="8" cy="10" r="1.3" fill="#F2F4FF" stroke="none"/></svg>
  <svg width="27" height="13" viewBox="0 0 27 13"><rect x="0.8" y="0.8" width="22" height="11.4" rx="3.5" fill="none" stroke="rgba(242,244,255,0.5)" stroke-width="1.4"/><rect x="2.6" y="2.6" width="16" height="7.8" rx="2" fill="#F2F4FF"/><rect x="24" y="4.3" width="2" height="4.4" rx="1" fill="rgba(242,244,255,0.5)"/></svg>
</span></div>`;

  window.HB = { DEFS, STATUS, hexagon, board, piece, toPixel };
  document.addEventListener("DOMContentLoaded", () => {
    document.body.insertAdjacentHTML("afterbegin", DEFS + STATUS);
    document.querySelectorAll("[data-render]").forEach(el => { el.innerHTML = window[el.dataset.render](); });
  });
})();
