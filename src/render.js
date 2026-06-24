/* render.js — draws the game using the original Flappy Bird sprite assets. */

var Render = (function () {
  var W = GAME.WIDTH, H = GAME.HEIGHT, FLOOR = GAME.FLOOR_Y;
  var groundShift = 0;
  var ready = false;
  var frameCount = 0;

  // ---- load sprites ----
  var imgs = {};
  var toLoad = [
    "background-day", "base", "pipe-green",
    "yellowbird-downflap", "yellowbird-midflap", "yellowbird-upflap",
    "bluebird-downflap", "bluebird-midflap", "bluebird-upflap",
    "redbird-downflap", "redbird-midflap", "redbird-upflap",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  ];
  var loaded = 0;

  for (var i = 0; i < toLoad.length; i++) {
    (function (name) {
      var img = new Image();
      img.onload = function () { loaded++; if (loaded >= toLoad.length) ready = true; };
      img.onerror = function () { loaded++; if (loaded >= toLoad.length) ready = true; };
      img.src = "sprites/" + name + ".png";
      imgs[name] = img;
    })(toLoad[i]);
  }

  // bird color sets for variety in the flock
  var birdColors = [
    ["yellowbird-downflap", "yellowbird-midflap", "yellowbird-upflap"],
    ["bluebird-downflap", "bluebird-midflap", "bluebird-upflap"],
    ["redbird-downflap", "redbird-midflap", "redbird-upflap"],
  ];

  function birdFrame(colorIdx) {
    var cycle = Math.floor(frameCount / 6) % 3; // animate wings
    var set = birdColors[colorIdx % birdColors.length];
    return imgs[set[cycle]];
  }

  // ---- background ----
  function background(ctx) {
    if (!ready) { ctx.fillStyle = "#4ec0ca"; ctx.fillRect(0, 0, W, H); return; }
    var bg = imgs["background-day"];
    if (bg.width) ctx.drawImage(bg, 0, 0, W, H);
  }

  // ---- ground (scrolling base) ----
  function ground(ctx) {
    if (!ready) return;
    var base = imgs["base"];
    if (!base.width) return;
    var bw = base.width;
    var shift = groundShift % bw;
    for (var x = -shift; x < W + bw; x += bw) {
      ctx.drawImage(base, x, FLOOR);
    }
  }

  // ---- pipe ----
  function pipe(ctx, p) {
    if (!ready) return;
    var img = imgs["pipe-green"];
    if (!img.width) return;
    var half = GAME.PIPE_GAP / 2;
    var topY = p.gapY - half;
    var botY = p.gapY + half;
    var pw = GAME.PIPE_W;
    var ph = img.height * (pw / img.width);

    // upper pipe (flipped)
    ctx.save();
    ctx.translate(p.x + pw / 2, topY);
    ctx.scale(1, -1);
    ctx.drawImage(img, -pw / 2, 0, pw, ph);
    ctx.restore();

    // lower pipe
    ctx.drawImage(img, p.x, botY, pw, ph);
  }

  // ---- bird ----
  function bird(ctx, x, y, alpha, vel, colorIdx) {
    if (!ready) return;
    var spr = birdFrame(colorIdx || 0);
    if (!spr || !spr.width) return;
    var bw = 34, bh = 24;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    var tilt = Math.max(-0.5, Math.min(1.2, (vel || 0) / 10));
    ctx.rotate(tilt);
    ctx.drawImage(spr, -bw / 2, -bh / 2, bw, bh);
    ctx.restore();
  }

  // ---- score digits ----
  function drawScore(ctx, score, cx, y) {
    var s = String(score);
    var dw = 24, dh = 36, gap = 3;
    var totalW = s.length * (dw + gap) - gap;
    var sx = cx - totalW / 2;
    for (var i = 0; i < s.length; i++) {
      var dig = imgs[s[i]];
      if (dig && dig.width) ctx.drawImage(dig, sx, y, dw, dh);
      sx += dw + gap;
    }
  }

  // ---- sensor overlay (what the lead bird sees) ----
  function sensor(ctx, game) {
    var p = game.nextPipe();
    var gx = p.x + GAME.PIPE_W / 2, gy = p.gapY;

    ctx.strokeStyle = "rgba(20,40,90,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(GAME.BIRD_X, game.birdY);
    ctx.lineTo(gx, gy);
    ctx.stroke();

    ctx.fillStyle = "#13284a";
    ctx.beginPath();
    ctx.arc(gx, gy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("4", gx, gy);

    var labels = ["0", "1", "2", "3", "5"];
    var nx = GAME.BIRD_X + 30;
    var ny = game.birdY - 22;
    for (var i = 0; i < labels.length; i++) {
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#13284a";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(nx, ny, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#13284a";
      ctx.fillText(labels[i], nx, ny);
      ny += 16;
    }
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
  }

  // ---- text overlay ----
  function overlay(ctx, lines) {
    ctx.font = "bold 16px 'Segoe UI', sans-serif";
    ctx.textBaseline = "top";
    var y = 10;
    for (var i = 0; i < lines.length; i++) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.strokeText(lines[i], 10, y);
      ctx.fillStyle = "#fff";
      ctx.fillText(lines[i], 10, y);
      y += 22;
    }
  }

  function tickGround(speed) {
    groundShift += GAME.PIPE_SPEED * speed;
    frameCount += speed;
  }

  // ---- public: render the GA flock ----
  function ga(ctx, model) {
    ctx.imageSmoothingEnabled = false;
    background(ctx);

    var lead = model.leader();
    for (var j = 0; j < lead.game.pipes.length; j++) pipe(ctx, lead.game.pipes[j]);

    // draw all alive birds (flock)
    for (var i = 0; i < model.birds.length; i++) {
      var b = model.birds[i];
      if (b.alive && b !== lead) {
        bird(ctx, GAME.BIRD_X, b.game.birdY, 0.7, b.game.vel, i % 3);
      }
    }
    // leader on top with sensor
    if (lead.alive) {
      bird(ctx, GAME.BIRD_X, lead.game.birdY, 1, lead.game.vel, 0);
      sensor(ctx, lead.game);
    }

    ground(ctx);

    // score in the original top-center style
    drawScore(ctx, lead.game.score, W / 2, 32);

    overlay(ctx, [
      "Generation " + model.generation,
      "Alive " + model.aliveCount + " / " + model.population,
    ]);
  }

  return { ga: ga, tickGround: tickGround, ready: function () { return ready; } };
})();
