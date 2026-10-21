import { GateQueue } from "./gates.js";
import { Simulator } from "./sim.js";
import { PHASE1, PHASE2, PHASE2_FAIL, RECONNECT } from "./steps.js";
import { createTap } from "./tap.js";
import { createBidder } from "./bidder.js";
import { drawStage, renderDiagram, renderDetail, renderSteps } from "./diagram.js";

const $ = (id) => document.getElementById(id);
const USERS = ["anna", "ben"];
const NAMES = { anna: "Anna", ben: "Ben" };
const SCENARIOS = {
  normal: { hint: "Bấm PLACE BID ở trình duyệt Anna (Exact $1,300)", setup: (b) => b.anna.setBid(1300, true) },
  "too-low": { hint: "Bấm PLACE BID ở trình duyệt Anna ($1,200, thấp hơn giá hiện tại)", setup: (b) => b.anna.setBid(1200, true) },
  "max-bid": {
    hint: "① Ben đặt Maximum Bid $2,000 · ② Anna bid $1,300 và bị vượt ngay",
    setup: (b) => { b.ben.setBid(2000, false); b.anna.setBid(1300, true); },
  },
};

let phase = "phase2";
let stopping = false;

const gate = new GateQueue();
gate.holding = false;
const svg = $("stage");
drawStage(svg);

const sim = new Simulator({ gate, render });
const bidders = {};
const taps = {};

// Lượt reconnect chạy theo sự kiện thật của SignalR client, không giữ frame.
const inReconnectRun = (user) => sim.isBusy && sim.view().name === "reconnect" && sim.view().user === user;
function advanceTo(id) {
  while (sim.isBusy && sim.view().step.id !== id) sim.next();
}

function render(view) {
  renderSteps($("steps"), view);
  renderDetail($("detail"), view);
  renderDiagram(svg, view);
  const busy = view.state === "running";
  $("ctl-prev").disabled = !busy || view.index <= 0;
  $("ctl-next").disabled = !busy;
  $("ctl-play").disabled = !busy;
  $("ctl-play").textContent = view.playing ? "⏸ Dừng" : "▶ Chạy";
  for (const win of document.querySelectorAll(".win")) win.classList.toggle("is-active", busy && win.dataset.user === view.user);
  for (const b of Object.values(bidders)) b.refreshButton();
  if (!busy) $("sim-sub").textContent = phase === "phase1" ? "Bấm Kết nối trên thanh trình duyệt của Anna hoặc Ben" : SCENARIOS[$("ctl-scenario").value].hint;
  else $("sim-sub").textContent = `${NAMES[view.user]} · bước ${view.index + 1}/${view.steps.length}`;
}

const hooks = {
  isBusy: () => sim.isBusy,
  isStopping: () => stopping,
  onReconnecting: (user) => inReconnectRun(user) && advanceTo("reconnecting"),
  onReconnected(user) {
    if (!inReconnectRun(user)) return;
    advanceTo("reconnected");
    setTimeout(() => inReconnectRun(user) && sim.next(), sim.stepMs);
  },
  onClosed: (user) => inReconnectRun(user) && sim.finish(),
  beforeInvoke(bid) {
    // Chọn template theo đúng quy tắc server (bid phải cao hơn giá hiện tại); max bid luôn đi luồng thành công.
    const template = !bid.isMaxBid && bid.bidAmount <= bid.currentAmount ? PHASE2_FAIL : PHASE2;
    $("sim-title").textContent = "Phía sau nút PLACE BID";
    return sim.start("phase2", template, bid.user);
  },
};

const template = $("item-page");
for (const user of USERS) {
  const win = document.querySelector(`.win[data-user="${user}"]`);
  win.append(template.content.cloneNode(true));
  win.querySelector(".who").textContent = NAMES[user];
  const tap = createTap(user, gate, (capture) => {
    sim.addCapture(capture);
    if (capture.dir === "out" && capture.kind === "http" && inReconnectRun(user) && sim.view().step.id === "reconnecting") advanceTo("retry");
  });
  taps[user] = tap;
  bidders[user] = createBidder(user, win, tap, hooks);
  win.querySelector('[data-role="connect"]').addEventListener("click", () => connectWithSim(user));
  win.querySelector('[data-role="offline"]').addEventListener("click", () => toggleOffline(user));
}

function toggleOffline(user) {
  const tap = taps[user];
  const goingOffline = !tap.offline;
  document.querySelector(`.win[data-user="${user}"] [data-role="offline"]`).setAttribute("aria-pressed", String(goingOffline));
  if (!goingOffline) return tap.setOffline(false);
  // Chưa kết nối (hoặc đã bỏ cuộc) thì không có gì để reconnect: chỉ đổi trạng thái mạng.
  if (bidders[user].connection.state !== "Connected") {
    if (sim.isBusy && sim.view().user === user) sim.abort("offline");
    return tap.setOffline(true);
  }
  if (sim.isBusy) {
    // Người kia không mất mạng: giao nốt frame của họ rồi mới dừng lượt đang chạy.
    gate.releaseAll((i) => i.user !== user);
    sim.abort("offline");
  }
  $("sim-title").textContent = "Mất mạng và tự kết nối lại";
  sim.start("reconnect", RECONNECT, user, { hold: false });
  tap.setOffline(true);
}

async function connectWithSim(user) {
  const bidder = bidders[user];
  if (bidder.connected || sim.isBusy) return;
  $("sim-title").textContent = "Kết nối vào trang bid";
  sim.start("phase1", PHASE1, user);
  await bidder.connect();
  if (!bidder.connected && sim.isBusy) sim.abort("disconnected");
  syncConnectButtons();
}

function syncConnectButtons() {
  for (const user of USERS) {
    const button = document.querySelector(`.win[data-user="${user}"] [data-role="connect"]`);
    button.disabled = bidders[user].connected;
    button.hidden = phase !== "phase1";
  }
}

async function resetAll() {
  sim.abort("reset");
  for (const user of USERS) {
    taps[user].setOffline(false);
    document.querySelector(`.win[data-user="${user}"] [data-role="offline"]`).setAttribute("aria-pressed", "false");
  }
  stopping = true;
  await Promise.all(USERS.map((u) => bidders[u].disconnect()));
  stopping = false;
  await fetch("/api/reset", { method: "POST" });
  await Promise.all(USERS.map((u) => bidders[u].loadState()));
  if (phase === "phase2") await Promise.all(USERS.map((u) => bidders[u].connect()));
  SCENARIOS[$("ctl-scenario").value].setup(bidders);
  syncConnectButtons();
  render(sim.view());
}

async function setPhase(next) {
  phase = next;
  for (const b of document.querySelectorAll("[data-phase]")) b.setAttribute("aria-pressed", String(b.dataset.phase === next));
  $("sim-title").textContent = next === "phase1" ? "Kết nối vào trang bid" : "Phía sau nút PLACE BID";
  await resetAll();
}

for (const b of document.querySelectorAll("[data-phase]")) b.addEventListener("click", () => setPhase(b.dataset.phase));
$("ctl-reset").addEventListener("click", resetAll);
$("ctl-scenario").addEventListener("change", resetAll);
$("ctl-next").addEventListener("click", () => sim.next());
$("ctl-prev").addEventListener("click", () => sim.prev());
$("ctl-play").addEventListener("click", () => (sim.playing ? sim.pause() : sim.play()));
$("ctl-speed").addEventListener("change", (e) => sim.setSpeed(Number(e.target.value)));
document.addEventListener("keydown", (e) => {
  if (e.target.closest("input, select, textarea")) return;
  if (e.key === "ArrowRight") sim.next();
  if (e.key === "ArrowLeft") sim.prev();
});

// Kênh trace riêng của demo (không vẽ trên sơ đồ, không có trong TravelPledgeAuctions).
const traceConnection = new signalR.HubConnectionBuilder().withUrl("/tracehub").withAutomaticReconnect().build();
traceConnection.on("trace", (t) => sim.addTrace(t));
await traceConnection.start();
await setPhase("phase2");
