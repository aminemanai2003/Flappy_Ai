/* graph.js — tiny learning-curve sparkline. Plots a series (best fitness per
 * generation, or score per episode) so you can compare how fast each AI climbs.
 */

const Graph = {
  draw(ctx, data, color) {
    const w = ctx.canvas.width, h = ctx.canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fillRect(0, 0, w, h);

    if (!data || data.length < 2) {
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "11px Segoe UI, sans-serif";
      ctx.fillText("collecting data…", 10, h / 2);
      return;
    }

    const pad = 6;
    const max = Math.max(...data, 1);
    const n = data.length;
    const xAt = (i) => pad + (i / (n - 1)) * (w - 2 * pad);
    const yAt = (v) => h - pad - (v / max) * (h - 2 * pad);

    // filled area
    ctx.beginPath();
    ctx.moveTo(xAt(0), h - pad);
    for (let i = 0; i < n; i++) ctx.lineTo(xAt(i), yAt(data[i]));
    ctx.lineTo(xAt(n - 1), h - pad);
    ctx.closePath();
    ctx.fillStyle = color + "22";
    ctx.fill();

    // line
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = xAt(i), y = yAt(data[i]);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // peak label
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "10px Segoe UI, sans-serif";
    ctx.fillText("max " + Math.round(max), w - 56, 12);
  },
};
