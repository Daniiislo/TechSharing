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

const frame = (dir, target, user = "an") => ({ user, dir, kind: "frame", text: `{"type":1,"target":"${target}"}${RS}` });

function setup() {
  const gate = new GateQueue();
  gate.holding = false;
  const views = [];
  const sim = new Simulator({ gate, render: (v) => views.push(v), schedule: () => {} });
  return { gate, sim, views };
}

test("next_releasesExactlyOneHeldItemPerGatedStep", async () => {
  const { gate, sim } = setup();
  sim.start("t", TEMPLATE, "an");
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
  sim.start("t", TEMPLATE, "an");
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
  sim.start("t", [TEMPLATE[0], { ...TEMPLATE[1], path: ["sr-server"], gate: { dir: "out", kind: "frame", user: "x" } }, TEMPLATE[2]], "binh");
  let an = false, binh = false;
  gate.hold(frame("out", "A", "an")).then(() => (an = true));
  gate.hold(frame("out", "B", "binh")).then(() => (binh = true));
  sim.next();
  await Promise.resolve();
  assert.deepEqual([an, binh], [false, true]);
});

test("item held after its step was reached is released immediately", async () => {
  const { gate, sim } = setup();
  sim.start("t", TEMPLATE, "an");
  sim.next(); // arm "out" before the frame exists
  let passed = false;
  await gate.hold(frame("out", "AddBid")).then(() => (passed = true));
  assert.equal(passed, true);
});

test("busy_blocksNewRunUntilFinished", () => {
  const { sim } = setup();
  assert.equal(sim.start("t", TEMPLATE, "an"), true);
  assert.equal(sim.isBusy, true);
  assert.equal(sim.start("t", TEMPLATE, "binh"), false);
  for (let i = 0; i < TEMPLATE.length; i++) sim.next();
  assert.equal(sim.isBusy, false);
  assert.equal(sim.view().state, "done");
  assert.equal(sim.start("t", TEMPLATE, "binh"), true);
});

test("finishing releases anything still held and stops holding", async () => {
  const { gate, sim } = setup();
  sim.start("t", TEMPLATE, "an");
  let passed = false;
  gate.hold(frame("in", "late", "binh")).then(() => (passed = true));
  sim.finish();
  await Promise.resolve();
  assert.equal(passed, true);
  assert.equal(gate.holding, false);
});

test("offline_dropsHeldAndEndsRunWithDisconnectedState", async () => {
  const { gate, sim } = setup();
  sim.start("t", TEMPLATE, "an");
  const held = gate.hold(frame("in", "updateItem"));
  sim.abort("offline");
  await assert.rejects(held, /offline/);
  assert.equal(sim.isBusy, false);
  assert.equal(sim.view().state, "disconnected");
  assert.equal(gate.holding, false);
});

test("view resolves the x placeholder, collects captures and traces for the step", () => {
  const { sim } = setup();
  sim.start("t", TEMPLATE, "binh");
  sim.addCapture({ user: "binh", dir: "out", kind: "frame", text: `{"type":1,"target":"AddBid"}${RS}` });
  sim.addTrace({ seq: 1, step: "server.dispatch", fn: "BidHub.AddBid", data: [1042] });
  assert.deepEqual(sim.view().step.path, ["app-binh", "app-an"]);
  sim.next();
  assert.deepEqual(sim.view().step.path, ["sr-binh"]);
  assert.equal(sim.view().frames.length, 1);
  sim.next();
  assert.equal(sim.view().traces[0].fn, "BidHub.AddBid");
});

test("a gate on a step that touches both users releases both users' frames", async () => {
  const { gate, sim } = setup();
  sim.start("t", [TEMPLATE[0], { ...TEMPLATE[3], path: ["sr-x", "app-x", "sr-y", "app-y"] }, TEMPLATE[2]], "an");
  let an = false, binh = false;
  gate.hold(frame("in", "updateItem", "an")).then(() => (an = true));
  gate.hold(frame("in", "updateItem", "binh")).then(() => (binh = true));
  sim.next();
  await Promise.resolve();
  assert.deepEqual([an, binh], [true, true]);
});

test("reaching the last step finishes the run so the bid buttons unlock", () => {
  const { sim } = setup();
  sim.start("t", TEMPLATE, "an");
  for (let i = 1; i < TEMPLATE.length; i++) sim.next();
  assert.equal(sim.view().step.id, "in");
  assert.equal(sim.isBusy, false);
  assert.equal(sim.view().state, "done");
});

test("a live run (hold: false) never holds frames", async () => {
  const { gate, sim } = setup();
  sim.start("reconnect", TEMPLATE, "an", { hold: false });
  assert.equal(gate.holding, false);
  let passed = false;
  await gate.hold(frame("in", "updateItem")).then(() => (passed = true));
  assert.equal(passed, true);
});
