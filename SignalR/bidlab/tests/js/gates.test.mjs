import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyFrame, GateQueue } from "../../src/BidLab/wwwroot/js/gates.js";

const RS = "\x1e";

test("classifyFrame detects ping", () => {
  const [f] = classifyFrame(`{"type":6}${RS}`);
  assert.equal(f.isPing, true);
  assert.equal(f.type, 6);
});

test("classifyFrame reads invocation target and id", () => {
  const [f] = classifyFrame(`{"type":1,"invocationId":"0","target":"AddBid","arguments":[]}${RS}`);
  assert.equal(f.type, 1);
  assert.equal(f.target, "AddBid");
  assert.equal(f.invocationId, "0");
  assert.equal(f.isPing, false);
});

test("classifyFrame detects handshake (request and empty response)", () => {
  assert.equal(classifyFrame(`{}${RS}`)[0].isHandshake, true);
  assert.equal(classifyFrame(`{"protocol":"json","version":1}${RS}`)[0].isHandshake, true);
});

test("classifyFrame splits several records in one text frame", () => {
  const frames = classifyFrame(`{"type":1,"target":"updateItem","arguments":[]}${RS}{"type":3,"invocationId":"0"}${RS}`);
  assert.deepEqual(frames.map((f) => f.type), [1, 3]);
});

const frame = (text, user = "an", dir = "in") => ({ user, dir, kind: "frame", text });

test("GateQueue releases held items in FIFO order", async () => {
  const gate = new GateQueue();
  const order = [];
  gate.hold(frame(`{"type":1,"target":"a"}${RS}`)).then(() => order.push("a"));
  gate.hold(frame(`{"type":1,"target":"b"}${RS}`)).then(() => order.push("b"));
  assert.equal(gate.pending.length, 2);

  assert.equal(gate.releaseNext().text.includes('"a"'), true);
  await Promise.resolve();
  assert.deepEqual(order, ["a"]);
  gate.releaseNext();
  await Promise.resolve();
  assert.deepEqual(order, ["a", "b"]);
  assert.equal(gate.releaseNext(), null);
});

test("GateQueue never holds pings", async () => {
  const gate = new GateQueue();
  let passed = false;
  await gate.hold(frame(`{"type":6}${RS}`)).then(() => (passed = true));
  assert.equal(passed, true);
  assert.equal(gate.pending.length, 0);
});

test("GateQueue passes everything through when not holding", async () => {
  const gate = new GateQueue();
  gate.holding = false;
  await gate.hold(frame(`{"type":1,"target":"x"}${RS}`));
  assert.equal(gate.pending.length, 0);
});

test("GateQueue releaseAll with predicate only releases matching items", async () => {
  const gate = new GateQueue();
  gate.hold(frame(`{"type":1,"target":"x"}${RS}`, "an"));
  gate.hold(frame(`{"type":1,"target":"y"}${RS}`, "binh"));
  const released = gate.releaseAll((i) => i.user === "binh");
  assert.equal(released.length, 1);
  assert.equal(gate.pending.length, 1);
  assert.equal(gate.pending[0].user, "an");
});

test("GateQueue dropAll rejects waiting holders with the reason", async () => {
  const gate = new GateQueue();
  const p = gate.hold(frame(`{"type":1,"target":"x"}${RS}`));
  gate.dropAll("offline");
  await assert.rejects(p, /offline/);
  assert.equal(gate.pending.length, 0);
});

test("GateQueue notifies listener when an item is held", () => {
  const gate = new GateQueue();
  const seen = [];
  gate.onHold = (item) => seen.push(item.user);
  gate.hold(frame(`{"type":1,"target":"x"}${RS}`, "binh"));
  assert.deepEqual(seen, ["binh"]);
});

test("GateQueue dropAll with predicate keeps other users' items", async () => {
  const gate = new GateQueue();
  const an = gate.hold(frame(`{"type":1,"target":"x"}${RS}`, "an"));
  gate.hold(frame(`{"type":1,"target":"y"}${RS}`, "binh"));
  gate.dropAll("closed", (i) => i.user === "an");
  await assert.rejects(an, /closed/);
  assert.deepEqual(gate.pending.map((i) => i.user), ["binh"]);
});
