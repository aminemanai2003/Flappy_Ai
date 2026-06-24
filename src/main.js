/* main.js — GA only, wired to the single game canvas + stats + controls. */

(function () {
  var ctx = document.getElementById("gameCanvas").getContext("2d");
  var curveCtx = document.getElementById("curve").getContext("2d");
  var statsEl = document.getElementById("stats");

  var speedEl = document.getElementById("speed");
  var speedValEl = document.getElementById("speedVal");
  var pauseBtn = document.getElementById("pause");
  var resetBtn = document.getElementById("reset");

  var GA_COLOR = "#4ade80";
  var ga, speed = 1, paused = false;

  function init() {
    ga = new GA();
  }

  function stat(k, v) {
    return '<div class="stat"><div class="k">' + k + '</div><div class="v">' + v + "</div></div>";
  }

  function renderStats() {
    statsEl.innerHTML =
      stat("Generation", ga.generation) +
      stat("Alive", ga.aliveCount + " / " + ga.population) +
      stat("Best pipes", ga.bestScore) +
      stat("Best fitness", Math.round(ga.allTimeBest));
  }

  function tick() {
    if (paused) return;
    for (var i = 0; i < speed; i++) ga.step();
    Render.tickGround(speed);
    Render.ga(ctx, ga);
    Graph.draw(curveCtx, ga.history, GA_COLOR);
    renderStats();
  }

  function rafLoop() {
    if (!document.hidden) tick();
    requestAnimationFrame(rafLoop);
  }
  setInterval(function () { if (document.hidden) tick(); }, 200);

  speedEl.addEventListener("input", function () {
    speed = +speedEl.value;
    speedValEl.innerHTML = speed + "&times;";
  });
  pauseBtn.addEventListener("click", function () {
    paused = !paused;
    pauseBtn.innerHTML = paused ? "&#9654; Resume" : "&#10073;&#10073; Pause";
  });
  resetBtn.addEventListener("click", function () { init(); });

  init();
  requestAnimationFrame(rafLoop);
})();
