/* ga.js — Genetic Algorithm / neuroevolution (the flock). */

var ARCH = [5, 6, 2];

function GA(opts) {
  opts = opts || {};
  this.popSize = opts.popSize || 50;
  this.mutationRate = opts.mutationRate || 0.15;
  this.seedBase = (Math.random() * 1e9) >>> 0;
  this.generation = 1;
  this.bestFitness = 0;
  this.avgFitness = 0;
  this.allTimeBest = 0;
  this.bestScore = 0;
  this.bestBrain = null;
  this.history = [];
  this._spawn();
}

GA.prototype._spawn = function (brains) {
  this.seed = (this.seedBase + this.generation * 7919) >>> 0;
  this.birds = [];
  for (var i = 0; i < this.popSize; i++) {
    this.birds.push({
      game: new FlappyGame(this.seed),
      brain: brains ? brains[i] : new NeuralNet(ARCH),
      fitness: 0,
      alive: true,
    });
  }
  this.aliveCount = this.popSize;
};

Object.defineProperty(GA.prototype, 'population', { get: function () { return this.popSize; } });

GA.prototype.step = function () {
  var anyAlive = false;
  for (var i = 0; i < this.birds.length; i++) {
    var b = this.birds[i];
    if (!b.alive) continue;
    var out = b.brain.forward(b.game.inputs());
    b.game.step(out[1] > out[0]);
    b.fitness = b.game.frames + b.game.score * 120;
    if (!b.game.alive) {
      b.alive = false;
      this.aliveCount--;
    } else {
      anyAlive = true;
    }
  }
  if (!anyAlive) this._evolve();
};

GA.prototype._evolve = function () {
  var best = 0, sum = 0, bestBird = this.birds[0];
  for (var i = 0; i < this.birds.length; i++) {
    var b = this.birds[i];
    sum += b.fitness;
    if (b.fitness > best) { best = b.fitness; bestBird = b; }
  }
  this.bestFitness = best;
  this.avgFitness = sum / this.birds.length;
  if (best > this.allTimeBest) this.allTimeBest = best;
  if (bestBird.game.score > this.bestScore) this.bestScore = bestBird.game.score;
  this.bestBrain = bestBird.brain.copy();
  this.history.push(best);
  if (this.history.length > 300) this.history.shift();

  var total = sum || 1;
  var birds = this.birds;
  var pick = function () {
    var r = Math.random() * total;
    for (var j = 0; j < birds.length; j++) {
      r -= birds[j].fitness;
      if (r <= 0) return birds[j].brain;
    }
    return bestBird.brain;
  };

  var next = [this.bestBrain.copy()];
  while (next.length < this.popSize) {
    var child = NeuralNet.crossover(pick(), pick());
    child.mutate(this.mutationRate);
    next.push(child);
  }

  this.generation++;
  this._spawn(next);
};

GA.prototype.leader = function () {
  var best = null;
  for (var i = 0; i < this.birds.length; i++) {
    var b = this.birds[i];
    if (b.alive && (!best || b.fitness > best.fitness)) best = b;
  }
  return best || this.birds[0];
};
