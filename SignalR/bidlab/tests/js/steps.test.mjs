import { test } from "node:test";
import assert from "node:assert/strict";
import { PHASE1, PHASE2, PHASE2_FAIL, RECONNECT, NODES } from "../../src/BidLab/wwwroot/js/steps.js";

const all = { PHASE1, PHASE2, PHASE2_FAIL, RECONNECT };

test("PHASE2 has the 8 approved steps in order", () => {
  assert.deepEqual(PHASE2.map((s) => s.id), ["click", "invoke-frame", "dispatch", "addbid", "fanout", "caller", "receive", "ui"]);
});

test("PHASE1 follows connect order", () => {
  assert.deepEqual(PHASE1.map((s) => s.id),
    ["build", "negotiate-req", "negotiate-res", "ws-open", "handshake-req", "server-connected", "handshake-res", "started"]);
});

test("PHASE2_FAIL sends addBidFail to caller before fan-out", () => {
  const ids = PHASE2_FAIL.map((s) => s.id);
  assert.ok(ids.indexOf("caller") < ids.indexOf("fanout"));
});

test("RECONNECT ends with the resync best-practice note", () => {
  assert.ok(RECONNECT.some((s) => s.id === "note-resync"));
});

for (const [name, steps] of Object.entries(all)) {
  test(`${name}: ids unique, owners valid, SignalR steps explain what you'd do without it`, () => {
    assert.equal(new Set(steps.map((s) => s.id)).size, steps.length);
    for (const s of steps) {
      assert.ok(["geronimo", "signalr"].includes(s.owner), s.id);
      assert.ok(s.title && s.fn && s.explain, s.id);
      if (s.owner === "signalr") assert.ok(s.without, `${s.id} needs without`);
      for (const n of s.path) assert.ok(NODES.includes(n), `${s.id}: unknown node ${n}`);
    }
  });
}

test("PHASE2 is written for any bidder: no hard-coded an/ben nodes", () => {
  for (const s of [...PHASE2, ...PHASE2_FAIL]) assert.ok(!s.path.some((n) => /-(an|ben)$/.test(n)), s.id);
});

test("invoke-frame warns about the client-supplied bidderId", () => {
  assert.match(PHASE2.find((s) => s.id === "invoke-frame").warn, /bidderId/);
});

test("inbound frames are released at the app step that consumes them", () => {
  assert.deepEqual(PHASE2.find((s) => s.id === "ui").gate, { dir: "in" });
  assert.deepEqual(PHASE1.find((s) => s.id === "started").gate, { dir: "in", kind: "frame" });
});

test("RECONNECT shows the real retry attempts (negotiate requests) and the socket close", () => {
  assert.deepEqual(RECONNECT.find((s) => s.id === "retry").capture, { dir: "out", kind: "http" });
  assert.deepEqual(RECONNECT.find((s) => s.id === "drop").capture, { dir: "in", kind: "ws-close" });
});

test("nothing projected in the demo mentions ProtoLab", () => {
  const text = JSON.stringify(all);
  assert.doesNotMatch(text, /ProtoLab/i);
});

test("RECONNECT quotes what Geronimo really does on reconnect (asks to refresh, does not just hide the banner)", () => {
  const note = RECONNECT.find((s) => s.id === "note-resync").explain;
  assert.match(note, /Refresh your page/);
  assert.doesNotMatch(note, /ẩn banner/);
});

test("RECONNECT forks after the retry step into a success and a give-up branch", () => {
  const ids = RECONNECT.map((s) => `${s.id}${s.branch ? `:${s.branch}` : ""}`);
  assert.deepEqual(ids, ["drop", "reconnecting", "retry", "reconnected:ok", "note-resync:ok", "closed:fail", "note-closed:fail"]);
});
