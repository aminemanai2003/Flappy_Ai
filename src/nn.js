/* nn.js — tiny MLP for the GA birds' brains. */

function randn() {
  var u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function NeuralNet(sizes) {
  this.sizes = sizes.slice();
  this.W = [];
  this.B = [];
  for (var l = 0; l < sizes.length - 1; l++) {
    this.W.push(new Float64Array(sizes[l] * sizes[l + 1]));
    this.B.push(new Float64Array(sizes[l + 1]));
  }
  this.randomize();
}

NeuralNet.prototype.randomize = function () {
  for (var l = 0; l < this.W.length; l++) {
    var scale = Math.sqrt(1 / this.sizes[l]);
    for (var i = 0; i < this.W[l].length; i++) this.W[l][i] = randn() * scale;
    this.B[l].fill(0);
  }
};

NeuralNet.prototype.forward = function (x) {
  var a = x;
  for (var l = 0; l < this.W.length; l++) {
    var inN = this.sizes[l], outN = this.sizes[l + 1];
    var out = new Float64Array(outN);
    var last = l === this.W.length - 1;
    for (var o = 0; o < outN; o++) {
      var s = this.B[l][o];
      for (var i = 0; i < inN; i++) s += this.W[l][i * outN + o] * a[i];
      out[o] = last ? s : Math.tanh(s);
    }
    a = out;
  }
  return a;
};

NeuralNet.prototype.copy = function () {
  var n = new NeuralNet(this.sizes);
  for (var l = 0; l < this.W.length; l++) {
    n.W[l].set(this.W[l]);
    n.B[l].set(this.B[l]);
  }
  return n;
};

NeuralNet.prototype.mutate = function (rate, amount) {
  if (amount === undefined) amount = 0.5;
  for (var l = 0; l < this.W.length; l++) {
    for (var i = 0; i < this.W[l].length; i++)
      if (Math.random() < rate) this.W[l][i] += randn() * amount;
    for (var i2 = 0; i2 < this.B[l].length; i2++)
      if (Math.random() < rate) this.B[l][i2] += randn() * amount;
  }
};

NeuralNet.crossover = function (a, b) {
  var n = a.copy();
  for (var l = 0; l < n.W.length; l++) {
    for (var i = 0; i < n.W[l].length; i++)
      n.W[l][i] = Math.random() < 0.5 ? a.W[l][i] : b.W[l][i];
    for (var i2 = 0; i2 < n.B[l].length; i2++)
      n.B[l][i2] = Math.random() < 0.5 ? a.B[l][i2] : b.B[l][i2];
  }
  return n;
};
