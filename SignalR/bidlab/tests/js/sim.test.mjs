import { test } from "node:test";
import assert from "node:assert/strict";
import { GateQueue } from "../../src/BidLab/wwwroot/js/gates.js";
import { Simulator } from "../../src/BidLab/wwwroot/js/sim.js";

const RS = "\x1e";
const TEMPLATE = [
  { id: "a", owner: "geronimo", path: ["app-x", "app-y"], title: "A", fn: "a", explain: "a" },
  { id: "out", owner: "signalr", path: ["sr-x"], title: "Out", fn: "o", explain: "o", without: "w", gate: { dir: "out", kind: "frame" } },
  { id: "srv", owner: "signalr", path: ["sr-server"], title: "Srv", fn: "s", explain: "s", without: "w", trace: ["server.dispatch"] },
  { id: "in", owner: "geronimo", path: ["app-x"], title: "In", fn: "i", explain: "i", gate: { dir: "in" } },
];

const frame = (dir, target, user = "anna") => ({ user, dir, kind: "frame", text: `{"type":1,"target":"${target}"}${RS}` });

function setup() {
  const gate = new GateQueue();
  gate.holding = false;
  const views = [];
  const sim = new Simulator({ gate, render: (v) => views.push(v), schedule: () => {} });
  return { gate, sim, views };
}

test("next_releasesExactlyOneHeldItemPerGatedStep", async () => {
  const { gate, sim } = setup();
  sim.start("t", TEMPLATE, "anna");
  const released = [];
  gate.hold(frame("out", "AddBid")).then(() => released.push("out"));
  gate.hold(frame("in", "updateItem")).then(() => released.push("in"));

  sim.next(); // -> "out": releases only the outbound frame
  await Promise.resolve();
  assert.deepEqual(released, ["out"]);
  assert.equal(gate.pending.length, 1);

  sim.next(); // -> "srv": no gate
  await Promise.resolve();
  assert.deepEqual(released, ["out"]);

  sim.next(); // -> "in"
  await Promise.resolve();
  assert.deepEqual(released, ["out", "in"]);
});

test("prev_thenNext_doesNotReleaseTwice", async () => {
  const { gate, sim } = setup();
  sim.start("t", TEMPLATE, "anna");
  let count = 0;
  gate.hold(frame("out", "AddBid")).then(() => count++);
  sim.next();
  sim.prev();
  sim.next();
  await Promise.resolve();
  assert.equal(count, 1);
  assert.equal(sim.view().step.id, "out");
});

test("gate user x means the user of the run", async () => {
  const { gate, sim } = setup();
  sim.start("t", [TEMPLATE[0], { ...TEMPLATE[1], path: ["sr-server"], gate: { dir: "out", kind: "frame", user: "x" } }, TEMPLATE[2]], "ben");
  let anna = false, ben = false;
  gate.hold(frame("out", "A", "anna")).then(() => (anna = true));
  gate.hold(frame("out", "B", "ben")).then(() => (ben = true));
  sim.next();
  await Promise.resolve();
  assert.deepEqual([anna, ben], [false, true]);
});

test("item held after its step was reached is released immediately", async () => {
  const { gate, sim } = setup();
  sim.start("t", TEMPLATE, "anna");
  sim.next(); // arm "out" before the frame exists
  let passed = false;
  await gate.hold(frame("out", "AddBid")).then(() => (passed = true));
  assert.equal(passed, true);
});

test("busy_blocksNewRunUntilFinished", () => {
  const { sim } = setup();
  assert.equal(sim.start("t", TEMPLATE, "anna"), true);
  assert.equal(sim.isBusy, true);
  assert.equal(sim.start("t", TEMPLATE, "ben"), false);
  for (let i = 0; i < TEMPLATE.length; i++) sim.next();
  assert.equal(sim.isBusy, false);
  assert.equal(sim.view().state, "done");
  assert.equal(sim.start("t", TEMPLATE, "ben"), true);
});

test("finishing releases anything still held and stops holding", async () => {
  const { gate, sim } = setup();
  sim.start("t", TEMPLATE, "anna");
  let passed = false;
  gate.hold(frame("in", "late", "ben")).then(() => (passed = true));
  sim.finish();
  await Promise.resolve();
  assert.equal(passed, true);
  assert.equal(gate.holding, false);
});

test("offline_dropsHeldAndEndsRunWithDisconnectedState", async () => {
  const { gate, sim } = setup();
  sim.start("t", TEMPLATE, "anna");
  const held = gate.hold(frame("in", "updateItem"));
  sim.abort("offline");
  await assert.rejects(held, /offline/);
  assert.equal(sim.isBusy, false);
  assert.equal(sim.view().state, "disconnected");
  assert.equal(gate.holding, false);
});

test("view resolves the x placeholder, collects captures and traces for the step", () => {
  const { sim } = setup();
  sim.start("t", TEMPLATE, "ben");
  sim.addCapture({ user: "ben", dir: "out", kind: "frame", text: `{"type":1,"target":"AddBid"}${RS}` });
  sim.addTrace({ seq: 1, step: "server.dispatch", fn: "BidHub.AddBid", data: [1042] });
  assert.deepEqual(sim.view().step.path, ["app-ben", "app-anna"]);
  sim.next();
  assert.deepEqual(sim.view().step.path, ["sr-ben"]);
  assert.equal(sim.view().frames.length, 1);
  sim.next();
  assert.equal(sim.view().traces[0].fn, "BidHub.AddBid");
});

test("a gate on a step that touches both users releases both users' frames", async () => {
  const { gate, sim } = setup();
  sim.start("t", [TEMPLATE[0], { ...TEMPLATE[3], path: ["sr-x", "app-x", "sr-y", "app-y"] }, TEMPLATE[2]], "anna");
  let anna = false, ben = false;
  gate.hold(frame("in", "updateItem", "anna")).then(() => (anna = true));
  gate.hold(frame("in", "updateItem", "ben")).then(() => (ben = true));
  sim.next();
  await Promise.resolve();
  assert.deepEqual([anna, ben], [true, true]);
});

test("reaching the last step finishes the run so the bid buttons unlock", () => {
  const { sim } = setup();
  sim.start("t", TEMPLATE, "anna");
  for (let i = 1; i < TEMPLATE.length; i++) sim.next();
  assert.equal(sim.view().step.id, "in");
  assert.equal(sim.isBusy, false);
  assert.equal(sim.view().state, "done");
});

test("a live run (hold: false) never holds frames", async () => {
  const { gate, sim } = setup();
  sim.start("reconnect", TEMPLATE, "anna", { hold: false });
  assert.equal(gate.holding, false);
  let passed = false;
  await gate.hold(frame("in", "updateItem")).then(() => (passed = true));
  assert.equal(passed, true);
});

test("pause then play keeps a single timer chain (no double-speed advance)", () => {
  const gate = new GateQueue();
  gate.holding = false;
  const queued = [];
  const sim = new Simulator({ gate, render: () => {}, schedule: (fn) => queued.push(fn) });
  sim.start("t", [...TEMPLATE, TEMPLATE[2]].map((s, i) => ({ ...s, id: `${s.id}-${i}` })), "anna");
  sim.play();
  sim.pause();
  sim.play();
  for (const fn of queued.splice(0)) fn();
  assert.equal(sim.view().index, 1);
});

test("after a run finishes, prev/next still scrub the picture without releasing anything", () => {
  const { sim } = setup();
  sim.start("t", TEMPLATE, "anna");
  for (let i = 1; i < TEMPLATE.length; i++) sim.next();
  assert.equal(sim.view().state, "done");
  sim.prev();
  assert.equal(sim.view().index, TEMPLATE.length - 2);
  sim.next();
  assert.equal(sim.view().index, TEMPLATE.length - 1);
  sim.next();
  assert.equal(sim.view().index, TEMPLATE.length - 1);
  assert.equal(sim.view().state, "done");
});



const FORK = [
  { id: "a", owner: "geronimo", path: ["app-x"], title: "A", fn: "a", explain: "a" },
  { id: "ok-1", owner: "signalr", path: ["sr-x"], title: "OK1", fn: "o", explain: "o", without: "w", branch: "ok" },
  { id: "ok-2", owner: "geronimo", path: ["app-x"], title: "OK2", fn: "o", explain: "o", branch: "ok" },
  { id: "fail-1", owner: "signalr", path: ["sr-x"], title: "F1", fn: "f", explain: "f", without: "w", branch: "fail" },
  { id: "fail-2", owner: "geronimo", path: ["app-x"], title: "F2", fn: "f", explain: "f", branch: "fail" },
];

function forkSim() {
  const gate = new GateQueue();
  gate.holding = false;
  const sim = new Simulator({ gate, render: () => {}, schedule: () => {}, canAdvance: () => "waiting" });
  sim.start("t", FORK, "anna");
  return sim;
}

test("fork: waits at the fork until the outcome is known", () => {
  const sim = forkSim();
  sim.next();
  assert.equal(sim.view().step.id, "a");
  assert.equal(sim.view().blocked, "waiting");
  assert.equal(sim.view().branch, null);
});

test("fork: the success outcome walks only the ok branch, then finishes", () => {
  const sim = forkSim();
  sim.chooseBranch("ok");
  sim.next();
  assert.equal(sim.view().step.id, "ok-1");
  assert.equal(sim.view().blocked, null);
  sim.next();
  assert.equal(sim.view().step.id, "ok-2");
  assert.equal(sim.view().state, "done");
});

test("fork: the failure outcome walks only the fail branch, and stepping back skips the other branch", () => {
  const sim = forkSim();
  sim.chooseBranch("fail");
  sim.next();
  assert.equal(sim.view().step.id, "fail-1");
  sim.next();
  assert.equal(sim.view().step.id, "fail-2");
  assert.equal(sim.view().state, "done");
  sim.prev();
  assert.equal(sim.view().step.id, "fail-1");
  sim.prev();
  assert.equal(sim.view().step.id, "a");
});

test("fork: the first outcome wins; a later chooseBranch is ignored", () => {
  const sim = forkSim();
  sim.chooseBranch("ok");
  sim.chooseBranch("fail");
  assert.equal(sim.view().branch, "ok");
});
