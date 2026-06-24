/* game.js — Flappy Bird physics engine sized to the original 288×512 canvas. */

var GAME = {
  WIDTH: 288,
  HEIGHT: 512,
  GROUND_H: 112,
  BIRD_X: 70,
  BIRD_R: 12,
  GRAVITY: 0.4,
  FLAP: -7,
  MAX_FALL: 10,
  PIPE_W: 52,
  PIPE_GAP: 120,
  PIPE_SPACING: 180,
  PIPE_SPEED: 2,
};

GAME.FLOOR_Y = GAME.HEIGHT - GAME.GROUND_H;

function makeRNG(seed) {
  var s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function FlappyGame(seed) {
  this.seed = seed >>> 0;
  this.reset();
}

FlappyGame.prototype.reset = function (seed) {
  if (seed !== undefined) this.seed = seed >>> 0;
  this.rng = makeRNG(this.seed);
  this.birdY = GAME.FLOOR_Y * 0.4;
  this.vel = 0;
  this.score = 0;
  this.frames = 0;
  this.alive = true;
  this.pipes = [];
  var x = GAME.WIDTH + 60;
  for (var i = 0; i < 4; i++) {
    this.pipes.push(this._makePipe(x));
    x += GAME.PIPE_SPACING;
  }
};

FlappyGame.prototype._makePipe = function (x) {
  var margin = 50;
  var half = GAME.PIPE_GAP / 2;
  var span = GAME.FLOOR_Y - 2 * margin - GAME.PIPE_GAP;
  var gapY = margin + half + this.rng() * span;
  return { x: x, gapY: gapY, passed: false };
};

FlappyGame.prototype.nextPipe = function () {
  for (var i = 0; i < this.pipes.length; i++) {
    if (this.pipes[i].x + GAME.PIPE_W >= GAME.BIRD_X - GAME.BIRD_R)
      return this.pipes[i];
  }
  return this.pipes[0];
};

FlappyGame.prototype.inputs = function () {
  var p = this.nextPipe();
  var half = GAME.PIPE_GAP / 2;
  return [
    this.birdY / GAME.FLOOR_Y,
    this.vel / GAME.MAX_FALL,
    (p.x - GAME.BIRD_X) / GAME.WIDTH,
    (this.birdY - (p.gapY - half)) / GAME.FLOOR_Y,
    (this.birdY - (p.gapY + half)) / GAME.FLOOR_Y,
  ];
};

FlappyGame.prototype.step = function (flap) {
  if (!this.alive) return;
  this.frames++;

  if (flap) this.vel = GAME.FLAP;
  this.vel = Math.min(this.vel + GAME.GRAVITY, GAME.MAX_FALL);
  this.birdY += this.vel;

  for (var i = 0; i < this.pipes.length; i++) this.pipes[i].x -= GAME.PIPE_SPEED;
  if (this.pipes[0].x + GAME.PIPE_W < 0) {
    this.pipes.shift();
    var lastX = this.pipes[this.pipes.length - 1].x;
    this.pipes.push(this._makePipe(lastX + GAME.PIPE_SPACING));
  }

  if (this.birdY - GAME.BIRD_R <= 0 || this.birdY + GAME.BIRD_R >= GAME.FLOOR_Y) {
    this.alive = false;
    return;
  }

  var half = GAME.PIPE_GAP / 2;
  for (var j = 0; j < this.pipes.length; j++) {
    var p = this.pipes[j];
    if (!p.passed && p.x + GAME.PIPE_W < GAME.BIRD_X - GAME.BIRD_R) {
      p.passed = true;
      this.score++;
    }
    var overlapX =
      GAME.BIRD_X + GAME.BIRD_R > p.x &&
      GAME.BIRD_X - GAME.BIRD_R < p.x + GAME.PIPE_W;
    if (overlapX) {
      var gapTop = p.gapY - half;
      var gapBottom = p.gapY + half;
      if (this.birdY - GAME.BIRD_R < gapTop || this.birdY + GAME.BIRD_R > gapBottom) {
        this.alive = false;
        return;
      }
    }
  }
};
