# Flappy Bird AI — The Complete Guide (A → Z)

This single document explains the **entire project**: what we built, the journey we
took to get here, every file, and — most importantly — **every term and concept**,
explained from scratch as if you've never seen them before.

> **The one-sentence summary:** We built a browser game where a flock of 50 birds,
> each controlled by its own tiny artificial brain, teaches *itself* to play Flappy
> Bird through **artificial evolution** — no human ever tells it the rules.

---

## Table of Contents

1. [The Big Picture](#1-the-big-picture)
2. [The Journey: how this project evolved](#2-the-journey)
3. [The Files: what each one does](#3-the-files)
4. [PART A — The Game (physics & rules)](#part-a--the-game)
5. [PART B — The Brain (neural networks)](#part-b--the-brain)
6. [PART C — The Learning (genetic algorithm)](#part-c--the-learning)
7. [PART D — The Look (rendering & sprites)](#part-d--the-look)
8. [PART E — The Glue (game loop & controls)](#part-e--the-glue)
9. [The Road Not Taken: Reinforcement Learning](#9-the-road-not-taken)
10. [Full Glossary](#10-full-glossary)
11. [How to Run & Tweak](#11-how-to-run--tweak)

---

## 1. The Big Picture

**The goal:** watch a computer *learn* to play Flappy Bird, and understand *how* it
learns — not by being programmed with rules ("if a pipe is close, flap"), but by
**evolution**, the same process that shaped life on Earth.

**How it works in three sentences:**
1. We create 50 birds. Each bird has a tiny **neural network** (an artificial brain)
   with random connections, so at first they all fly stupidly and crash.
2. We measure how well each bird did (its **fitness**), then breed the best ones
   together — mixing their brains and adding small random changes — to make 50 new
   birds for the next **generation**.
3. Repeat. Generation after generation, the birds get better, because good "brain
   wiring" survives and bad wiring dies out. Within ~10–20 generations they fly
   through hundreds of pipes.

This technique is called **neuroevolution** (evolving neural networks). It's a
combination of two big ideas: **neural networks** (Part B) and **genetic algorithms**
(Part C).

---

## 2. The Journey

This is how the project actually unfolded, decision by decision — useful context for
understanding *why* the code looks the way it does.

| Stage | What happened |
|-------|---------------|
| **Planning** | We agreed on: a browser app (plain JavaScript, no installation), AI-only (no human play), educational focus, classic Flappy Bird look. |
| **First build** | Originally **two** AIs side-by-side: a Genetic Algorithm *and* a Reinforcement Learning agent, to compare them. Graphics were drawn by hand with canvas shapes. |
| **Real textures** | You asked for the authentic Flappy Bird look, so the bird/pipes/ground were redrawn to look like the original game. |
| **A bug we hit** | When the browser tab was in the background, the animation froze. Fixed by adding a backup timer (explained in Part E). |
| **The RL problem** | The Reinforcement Learning bird **refused to learn**. We tried many fixes (bigger network, different math, reward tweaks). It's a genuinely hard algorithm to get working in plain JavaScript. (Details in Section 9.) |
| **The pivot** | You decided to **remove Reinforcement Learning entirely** and keep only the Genetic Algorithm — which works beautifully — and to use the **real Flappy Bird sprite files** from an open-source asset pack. |
| **Polish** | Finally, we redesigned the user interface: a wider two-column layout, bigger game, readable stat cards, and a learning-curve graph. |

The current project is the clean, final result: **Genetic Algorithm only, real sprites,
polished UI.**

---

## 3. The Files

```
flappy-ai/
├── index.html          ← the page structure (canvas, sidebar, buttons)
├── style.css           ← the visual styling / layout
├── README.md           ← short "how to run" notes
├── PROJECT_EXPLAINED.md ← this document
├── sprites/            ← the real Flappy Bird images (bird, pipes, background…)
├── audio/              ← the real Flappy Bird sounds (not yet wired in)
└── src/
    ├── game.js         ← the GAME: physics, pipes, collisions, scoring
    ├── nn.js           ← the BRAIN: a small neural network
    ├── ga.js           ← the LEARNING: the genetic algorithm
    ├── render.js       ← the LOOK: draws everything using the sprites
    ├── graph.js        ← the small learning-curve line chart
    └── main.js         ← the GLUE: runs the loop, handles buttons
```

**Why separate files?** Each file has **one job** (this is called *separation of
concerns*). The game physics doesn't know or care how things are drawn; the brain
doesn't know it's playing Flappy Bird; the evolution doesn't know what a neural network
is inside. This makes each piece easy to understand and change on its own.

The files are loaded in order by `index.html` using plain `<script>` tags, so
everything shares the same global space — no build tools, no compiling. You can just
open the file and it runs.

---

## PART A — The Game

**File: `src/game.js`**

This is pure Flappy Bird, with **no graphics** — just the math of how the bird and
pipes move. Keeping it separate from drawing means it can run thousands of times per
second during fast-forward.

### The constants (the "feel" of the game)

```js
WIDTH: 288, HEIGHT: 512   // canvas size, matching the original game
GRAVITY: 0.4              // how fast the bird accelerates downward each frame
FLAP: -7                  // upward velocity when the bird flaps
MAX_FALL: 10             // terminal velocity (can't fall faster than this)
PIPE_GAP: 120            // vertical opening the bird must fly through
PIPE_SPEED: 2            // how fast pipes scroll left
```

**Term — `velocity`:** the bird's current speed *and direction*. Negative = moving up,
positive = moving down. Each frame, gravity adds `0.4` to it, so the bird constantly
accelerates downward unless it flaps (which snaps velocity to `-7`, an upward jump).

### Frames and the game loop

**Term — `frame`:** one "tick" of the game. The game advances in tiny discrete steps,
like the individual pictures in a flip-book. Each call to `step()` is one frame. At
normal speed the screen shows ~60 frames per second, so motion looks smooth.

The `step(flap)` function is the heart of the game. Every frame it:
1. If `flap` is true, set velocity to the upward jump (`-7`).
2. Add gravity to velocity, then add velocity to the bird's height. *(This is basic
   physics: position changes by velocity, velocity changes by acceleration/gravity.)*
3. Move every pipe left by `PIPE_SPEED`.
4. If the leftmost pipe scrolled off-screen, remove it and add a fresh one on the right
   (this **recycles** pipes so we only ever track 4 at a time).
5. **Check for collisions** (below). If the bird hit something, mark it `alive = false`.
6. If the bird passed a pipe, add 1 to the score.

### Collision detection

The bird is treated as a circle (`BIRD_R` = radius 12). It "dies" if:
- It touches the **ground** or the **ceiling** (top/bottom of the play area), or
- Its circle overlaps a **pipe**. We check: is the bird horizontally inside a pipe's
  column? If yes, is it above the gap's top edge or below the gap's bottom edge? If
  either, it crashed.

This is called **axis-aligned collision detection** — comparing rectangle/circle edges
on the horizontal (x) and vertical (y) axes separately. It's simple and fast.

### Seeded randomness — and why it matters

**Term — `RNG` (Random Number Generator):** code that produces "random" numbers.

**Term — `seed`:** a starting number that determines the *entire sequence* a random
generator will produce. **Same seed → same sequence, every time.** This is called
*deterministic* randomness.

We use a tiny, well-known generator called **mulberry32**:

```js
function makeRNG(seed) { ... returns a function that spits out the next number ... }
```

**Why we need this:** in each generation, **all 50 birds must face the exact same
pipes.** Otherwise a bird that got lucky with easy pipes would look "fitter" than a
better bird that got hard pipes — an unfair comparison. By giving every bird in a
generation the *same seed*, the pipe layout is identical for all of them, so fitness
differences come purely from *skill*, not luck. Each new generation gets a new seed, so
the birds don't just memorize one fixed level.

---

## PART B — The Brain

**File: `src/nn.js`**

Each bird is steered by an **artificial neural network**. Let's build up what that means.

### What is a neural network?

It's a simplified, mathematical imitation of how brains process information. It takes in
some **numbers** (what the bird senses), passes them through layers of simple
calculations, and outputs some **numbers** (the decision: flap or don't).

It's made of:

- **Neurons (nodes):** little units that each hold a number. Think of one as a single
  "brain cell."
- **Layers:** neurons are organized in columns:
  - **Input layer** — the senses. Here, **5 neurons** (the 5 things the bird perceives).
  - **Hidden layer** — the "thinking" in between. Here, **6 neurons**.
  - **Output layer** — the decision. Here, **2 neurons** (scores for "don't flap" vs "flap").

  We write this shape as `[5, 6, 2]` in the code (`ARCH`). This kind of network — info
  flowing straight from input to output with no loops — is a **feedforward
  multilayer perceptron (MLP)**, the most basic type of neural network.

- **Weights:** every neuron in one layer connects to every neuron in the next. Each
  connection has a **weight** — a number saying *how strongly* that input matters.
  Big positive weight = "this input strongly pushes the next neuron up." Negative =
  "pushes it down." **The weights ARE the brain.** Learning = finding good weights.

- **Bias:** each neuron also has a **bias**, an extra number added in regardless of
  input — like a neuron's baseline eagerness to fire. It lets a neuron activate even
  when all its inputs are zero.

### The 5 inputs (what each bird senses)

From `game.js`, every frame the bird perceives 5 numbers, all **normalized** (scaled to
roughly the range −1 to 1 — neural networks behave best when inputs are small and
comparable in size):

1. The bird's **height** on screen.
2. The bird's **velocity** (rising or falling, how fast).
3. The **horizontal distance** to the next pipe.
4. The vertical gap between the bird and the **top** edge of the next opening.
5. The vertical gap between the bird and the **bottom** edge of the next opening.

> The on-screen circles labeled `0,1,2,3,5` with a line to a `4` on the pipe are an
> *illustrative nod* to this idea — showing that the lead bird "sees" the gap. The real
> brain uses the 5 values above.

### The 2 outputs (the decision)

The network produces 2 numbers. We simply compare them: **if output #2 > output #1, the
bird flaps**, otherwise it doesn't. (Using 2 outputs and picking the bigger one is a
clean, standard way to choose between 2 actions.)

### Forward propagation (how a decision is computed)

**Term — `forward pass` / `forward propagation`:** feeding the inputs through the
network to get the outputs. For each neuron in the next layer:

```
neuron value = bias + (input1 × weight1) + (input2 × weight2) + ...
```

then we apply an **activation function** (next), and pass the result onward. Do this
layer by layer until you reach the outputs. That's it — a forward pass is just a lot of
"multiply, add, squish."

### Activation functions

**Term — `activation function`:** a function applied to each neuron's value to **add
non-linearity**. Without it, stacking layers would be mathematically equivalent to a
single layer, and the network could only learn straight-line relationships. Real
problems (like "when exactly should I flap?") are curvy, not straight, so we need it.

We use **`tanh`** (hyperbolic tangent) on the hidden layer. It takes any number and
squishes it into the range **−1 to +1** — a smooth S-curve. The output layer is left
**linear** (no squishing) so the two action-scores can be any size.

### The brain's special abilities (for evolution)

Because brains here are *evolved*, not trained with calculus, the network supports three
genetic operations (used in Part C):

- **`copy()`** — make an exact clone of a brain.
- **`mutate(rate)`** — randomly nudge some weights/biases. `rate` (here `0.15`) is the
  *chance* each individual weight gets a small random change.
- **`crossover(a, b)`** — make a child brain by, for each weight, flipping a coin to
  take it from parent A or parent B. (Genetic mixing — like inheriting your mom's eyes
  and dad's hair.)

**Term — `He / Xavier initialization`:** when a brand-new brain is created, its weights
start as small random numbers scaled by `√(1/inputs)`. Starting with the right *size* of
random weights helps the network behave sensibly from frame one. (In our GA-only build
we use the tanh-friendly "Xavier" scaling.)

---

## PART C — The Learning

**File: `src/ga.js`**

This is the star of the show: the **Genetic Algorithm (GA)** — learning by simulated
evolution. It treats the 50 bird-brains as a *population of creatures* and applies the
logic of natural selection.

### The core idea (Darwin, in code)

> **Survival of the fittest.** Make many random variants, keep the ones that do best,
> breed them together with small random changes, repeat. Over many generations, the
> population gets better — not because anyone *designed* a good solution, but because bad
> solutions keep dying and good ones keep reproducing.

### Key terms

- **Population:** the whole group of candidate solutions alive at once. Here, **50 birds**.
- **Individual / genome:** one candidate — here, one bird's neural-network weights. The
  set of weights *is* its "DNA."
- **Generation:** one full cycle of "everyone plays → pick the best → breed the next
  batch." We track this as `generation` (1, 2, 3, …).
- **Fitness:** a single number scoring how *good* an individual was. **This is the only
  feedback the algorithm gets.** Our formula:

  ```js
  fitness = frames_survived + (pipes_passed × 120)
  ```

  So staying alive earns a little, and **passing a pipe earns a big bonus (120)**. This
  pushes evolution toward birds that actually clear pipes, not just hover.

### One generation, step by step

1. **Everyone plays at once.** All 50 birds run on the *same seeded pipes* (Part A,
   "why seeded matters"). Each frame, every living bird's brain does a forward pass and
   decides to flap or not. Dead birds drop out — this is why the on-screen flock visibly
   *thins out*.

2. **Wait for total wipeout.** When the last bird crashes, the generation is over.

3. **Score & remember the champion.** We find the bird with the highest fitness and keep
   a copy of its brain (`bestBrain`). We log its fitness to the history graph.

4. **Selection — pick parents.** We use **fitness-proportionate selection**, a.k.a.
   **roulette-wheel selection**: imagine a roulette wheel where each bird gets a slice
   *proportional to its fitness*. Fitter birds get bigger slices, so they're more likely
   to be chosen as parents — but weaker birds still have a small chance (which preserves
   *diversity*, keeping the gene pool from collapsing too fast).

5. **Crossover — breed.** Pick two parents via the roulette wheel and `crossover` their
   brains into a child (each weight comes from one parent or the other, by coin flip).

6. **Mutation — add novelty.** `mutate` the child: with a 15% chance per weight, nudge it
   randomly. **Why mutate?** Crossover only *recombines* existing genes; it can never
   invent something new. Mutation is the source of genuinely new behavior — without it,
   evolution would stall once the population became similar. Too *much* mutation, though,
   and good birds get scrambled into noise. `0.15` is a tuned middle ground.

7. **Elitism — protect the best.** We copy the single best brain into the next
   generation *unchanged*. **Term — `elitism`:** always carrying the champion forward
   untouched, so a lucky-good brain is never lost to bad breeding. This guarantees the
   best-ever fitness never goes *down* between generations.

8. **Repeat** with the new population of 50 and a fresh pipe seed.

### Why is this called "neuroevolution"?

Because we're using **evolution** (the genetic algorithm) to design **neural networks**
(the brains). Neuroevolution = GA + NN. It's powerful here because:
- The "right answer" (perfect weights) is unknown, but it's easy to *score* any attempt.
- We can run 50 attempts in parallel and let competition do the work.
- It needs no calculus/gradients — just play, score, breed.

---

## PART D — The Look

**File: `src/render.js`** + the `sprites/` folder.

### Canvas and sprites

**Term — `canvas`:** an HTML element that's basically a blank rectangle you can draw
pixels onto with JavaScript. Everything you see in the game is painted onto one `<canvas>`
every frame.

**Term — `sprite`:** a small image used in a game (the bird, a pipe, etc.). We use the
**real Flappy Bird sprite files** from the open-source pack
[`samuelcust/flappy-bird-assets`](https://github.com/samuelcust/flappy-bird-assets):
`background-day.png`, `base.png` (ground), `pipe-green.png`, the three bird colors, and
the number digits `0.png`–`9.png`.

At startup, `render.js` loads all the images (`new Image()`), and only starts drawing
sprites once they've finished loading (`ready`).

### Drawing each frame

Every frame we repaint the whole scene **back to front** (painter's algorithm — draw far
things first, near things last so they overlap correctly):

1. **Background** — `drawImage` the day-sky sprite across the canvas.
2. **Pipes** — draw each pipe. The bottom pipe is the sprite as-is; the **top pipe is the
   same sprite flipped upside-down** (we flip the canvas vertically with `scale(1, -1)`
   so the pipe's lip points down).
3. **Birds** — draw all 50 living birds at the same x but their individual heights (the
   stacked "flock"). The lead bird is drawn solid; the rest slightly transparent.
   Birds are tilted with `rotate()` based on velocity (nose-up when rising, nose-down when
   diving) — exactly like the original game.
4. **Ground** — the `base` sprite, drawn twice side-by-side and scrolled left so it looks
   like it's continuously moving (`groundShift`).
5. **Score** — the current score painted top-center using the original number-digit
   sprites.
6. **Overlay text & sensor** — "Generation / Alive" counters, and the lead bird's input
   nodes + line to the gap.

**Term — `image smoothing` / `pixelated`:** by default browsers blur images when scaling
them. We turn that off (`imageSmoothingEnabled = false` and CSS `image-rendering:
pixelated`) so the pixel-art stays crisp and blocky, the way retro games should look.

### Wing-flap animation

**Term — `sprite animation`:** cycling through a few images to fake motion. Each bird
color has 3 frames (`downflap`, `midflap`, `upflap`). We switch between them every few
game-frames (`Math.floor(frameCount / 6) % 3`), so the wings appear to flap.

---

## PART E — The Glue

**File: `src/main.js`** + `src/graph.js`

This file connects everything and runs the show.

### The game loop

**Term — `requestAnimationFrame` (rAF):** a browser function that calls your code right
before the next screen repaint — typically ~60 times per second, perfectly synced to the
display. It's the standard way to animate. Our `rafLoop()` calls `tick()` each time.

**`tick()` does, every frame:**
1. Advance the GA by `speed` steps (so at 50× it simulates 50 frames per drawn frame —
   that's how fast-forward works).
2. Tell the renderer to scroll the ground.
3. Draw the game, draw the learning-curve graph, update the stat cards.

### Speed, Pause, Reset

- **Speed slider (1×–100×):** simply how many simulation steps to run per drawn frame.
  Higher = evolution happens faster, but the motion looks faster too.
- **Pause:** stops calling `tick()`.
- **Reset:** throws away the current population and starts fresh from generation 1 with
  brand-new random brains.

### The background-tab fix

**The bug:** browsers *throttle* (slow down) `requestAnimationFrame` to nearly zero when
a tab isn't visible, to save power. So when you clicked away, training froze.

**The fix:** we also run a backup `setInterval(..., 200)` timer that advances the game
**only when the tab is hidden** (`document.hidden`). `setInterval` keeps firing in the
background (throttled, but it fires), so training keeps progressing even when you're not
looking. When the tab is visible, the smooth rAF loop takes over.

### The learning-curve graph

**File: `src/graph.js`.** A tiny line chart. It plots the **best fitness of each
generation** over time. A rising line = the population is learning. This is the single
clearest way to *see* progress: early generations are low and flat, then the line shoots
up as a "breakthrough" brain appears and spreads through the population.

---

## 9. The Road Not Taken — Reinforcement Learning

Originally the project compared the Genetic Algorithm against **Reinforcement Learning
(RL)**. We removed RL, but it's worth understanding what it was and *why it was hard*,
because it sharpens what makes the GA special.

### What is Reinforcement Learning?

A different style of machine learning where a **single agent** learns by **trial and
error from rewards**. There's no population and no breeding. The agent acts, receives a
**reward** (good/bad signal), and gradually adjusts itself to earn more reward over time.

Key RL terms:
- **Agent:** the learner/decision-maker (one bird).
- **State:** the situation right now (the same 5 sensed numbers).
- **Action:** what it can do (flap / don't).
- **Reward:** feedback after each action (e.g. +1 for passing a pipe, −1 for crashing).
- **Policy:** the agent's strategy — its mapping from states to actions.
- **Episode:** one full attempt (one life, from start to crash).

### The two RL methods we tried

1. **DQN (Deep Q-Network):** uses a neural network to estimate the **Q-value** (expected
   future reward) of each action in each state, and improves it with **gradient descent**
   (calculus-based weight tweaking) plus tricks like **experience replay** (learning from
   a memory of past moments) and a **target network** (a stabilizing second copy).

   **Why it struggled here:** gradient-based learning is finicky. With `tanh` neurons the
   gradients **saturated** (flattened to near-zero, so almost no learning happened), and
   random early exploration in Flappy Bird produces such short lives that the bird almost
   never reached a pipe to *get* a useful reward. It learned the lazy answer: "never
   flap." We tried a bigger network, `ReLU` neurons, and reward shaping — it improved but
   never became reliable.

2. **Tabular Q-Learning:** the classic, no-neural-network RL. It **discretizes** the
   state (chops the continuous numbers into a grid of bins) and keeps a giant lookup
   **table** of Q-values for every (state, action) box, updated by the **Bellman
   equation**. This actually *worked well* (it reached 40+ pipes) and is guaranteed to
   converge — but you ultimately chose to keep the project focused on the **single, clean,
   visually beautiful Genetic Algorithm**, so RL was removed.

### GA vs RL — the lesson

- **GA** learns at the level of the **whole population**: 50 parallel experiments,
  ranked by a single fitness score, bred together. No calculus. Robust and easy to get
  working. Great when you can *score* a solution but not *differentiate* it.
- **RL** learns at the level of the **individual decision**: one agent assigning credit
  to specific actions via rewards and gradients. More sample-efficient in theory and
  scales to far harder problems — but fussier to tune. It's the family behind
  game-playing and robotics breakthroughs.

Neither is "better" universally; they're different tools. For *this* problem, the GA is
the clear winner: simpler, prettier, and it learns fast.

---

## 10. Full Glossary

**Activation function** — a per-neuron function (we use `tanh`) that bends the network's
math so it can learn curved, complex relationships instead of only straight lines.

**Agent** *(RL)* — the single entity that learns by acting and receiving rewards.

**Bias** — an extra number added inside each neuron; its adjustable baseline.

**Canvas** — the HTML drawing surface where the game is painted.

**Collision detection** — checking whether the bird's circle overlaps a pipe, the ground,
or the ceiling.

**Crossover** — breeding two parent brains into a child by mixing their weights.

**Deterministic** — produces the same result every time given the same starting input
(our seeded random pipes).

**Elitism** — copying the best individual into the next generation unchanged so it's never
lost.

**Episode** *(RL)* — one full attempt/life.

**Feedforward / Forward pass** — computing outputs from inputs by flowing data forward
through the layers once.

**Fitness** — the single score measuring how good an individual was; the GA's only
feedback. Ours: `frames + pipes × 120`.

**Frame** — one discrete tick/step of the game (like one flip-book page).

**Generation** — one complete play-score-breed cycle of the whole population.

**Genetic Algorithm (GA)** — optimization by simulated evolution: population → fitness →
selection → crossover → mutation → repeat.

**Genome / Individual** — one candidate solution; here, one bird's set of weights (its
"DNA").

**Gradient descent** *(RL/DQN)* — a calculus-based method that nudges weights in the
direction that reduces error. The GA does **not** use this.

**Hidden layer** — the middle layer of neurons between input and output where
intermediate "thinking" happens.

**Hyperparameter** — a setting you choose rather than learn (population size 50, mutation
rate 0.15, pipe gap 120, etc.).

**Mutation** — small random changes to a child's weights; the source of new behavior.

**Neuron / Node** — a single unit in the network holding one number.

**Neural network (MLP)** — layers of connected neurons that turn input numbers into output
numbers; our shape is `[5, 6, 2]`.

**Neuroevolution** — using a genetic algorithm to evolve neural networks (what this whole
project is).

**Normalization** — scaling inputs to a small, comparable range (≈ −1…1) so the network
trains well.

**Policy** *(RL)* — an agent's strategy mapping states to actions.

**Population** — all individuals (50 birds) alive in one generation.

**requestAnimationFrame (rAF)** — the browser's ~60 fps animation callback that drives the
loop.

**Reward** *(RL)* — the good/bad signal an RL agent gets after each action.

**RNG / Seed** — random number generator / the number that fixes its sequence so results
are reproducible.

**Roulette-wheel (fitness-proportionate) selection** — choosing parents with probability
proportional to fitness; fitter = more likely, but everyone has a chance.

**Sprite** — a small game image (bird, pipe, digit) drawn onto the canvas.

**Throttling** — the browser slowing background tabs; we work around it with a backup
timer.

**Velocity** — the bird's speed and direction (negative up, positive down).

**Weight** — the strength of a connection between two neurons; collectively, the "brain."

---

## 11. How to Run & Tweak

### Run it
Just **double-click `index.html`** (or open it in any browser). No installation, no build
step. To view the sounds/sprites without any browser file restrictions, you can
optionally serve the folder: `python -m http.server` then open `http://localhost:8000`.

### Things you can safely experiment with

| Want to… | Change this | In file |
|----------|-------------|---------|
| Bigger/smaller flock | `popSize` (default 50) | `ga.js` |
| More/less random change | `mutationRate` (0.15) | `ga.js` |
| Smarter brains | `ARCH` e.g. `[5, 8, 2]` | `ga.js` |
| Harder/easier game | `PIPE_GAP`, `PIPE_SPEED`, `GRAVITY` | `game.js` |
| Change what the bird senses | the `inputs()` function | `game.js` |
| Reward different behavior | the `fitness` formula | `ga.js` |

### What you'll observe
- **Generations 1–3:** birds flap wildly and die fast; fitness near zero.
- **A breakthrough:** suddenly one generation's best fitness spikes — a brain "figured
  it out." Because of elitism + breeding, that skill spreads.
- **Generations ~10–20:** the best birds routinely clear *hundreds* of pipes, and the
  learning-curve graph climbs steeply. In testing we saw **339 pipes by generation 17.**

That's the whole magic: **nobody taught the bird to play. It evolved the ability — and
you watched it happen.**
