// Vẽ sơ đồ 3 lớp × 3 cột (bố cục đã duyệt ở mockup v4), danh sách bước và ô chi tiết.

const NS = "http://www.w3.org/2000/svg";
const WIRE_Y = 300;
const COL = { anna: 170, server: 450, ben: 730 };
const NODE = {
  "app-anna": { x: COL.anna, y: 83, w: 180, h: 70, kind: "app", title: "itemBid.js", sub: "code trang Item" },
  "sr-anna": { x: COL.anna, y: 196, w: 180, h: 68, kind: "sr", title: "HubConnection", sub: "SignalR client" },
  "app-server": { x: COL.server, y: 83, w: 210, h: 70, kind: "app", title: "BidHub", sub: "AddBid · 6 bước" },
  "sr-server": { x: COL.server, y: 196, w: 240, h: 68, kind: "sr", title: "Hub runtime", sub: "dispatch · HubLifetimeManager" },
  "app-ben": { x: COL.ben, y: 83, w: 180, h: 70, kind: "app", title: "itemBid.js", sub: "code trang Item" },
  "sr-ben": { x: COL.ben, y: 196, w: 180, h: 68, kind: "sr", title: "HubConnection", sub: "SignalR client" },
  redis: { x: COL.server, y: 366, w: 180, h: 48, kind: "sr", title: "Redis backplane", sub: "production: nhiều server" },
};
const WHO = { anna: "Anna", ben: "Ben" };
const OWNER_LABEL = { geronimo: "Geronimo viết", signalr: "SignalR tự làm" };

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function nodeSvg(id, n) {
  const app = n.kind === "app";
  return `<g class="node" data-node="${id}">
    <rect x="${n.x - n.w / 2}" y="${n.y - n.h / 2}" width="${n.w}" height="${n.h}" rx="10"
      fill="${app ? "#E6F6FA" : "#fff"}" stroke="${app ? "#007595" : "#5B21B6"}" stroke-width="1.5" ${app ? "" : 'stroke-dasharray="6 4"'}/>
    <text x="${n.x}" y="${n.y - 2}" text-anchor="middle" font-size="15" font-weight="700" fill="${app ? "#007595" : "#5B21B6"}" class="${app ? "mono" : ""}">${n.title}</text>
    <text x="${n.x}" y="${n.y + 19}" text-anchor="middle" font-size="12" fill="#45556C">${n.sub}</text>
  </g>`;
}

export function drawStage(svg) {
  svg.innerHTML = `
    <defs>
      <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#5B21B6"/></marker>
      <marker id="ah-app" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#007595"/></marker>
    </defs>
    <text x="${COL.anna}" y="22" text-anchor="middle" font-size="15" font-weight="700" fill="#0F172B">Trình duyệt Anna</text>
    <text x="${COL.server}" y="22" text-anchor="middle" font-size="15" font-weight="700" fill="#0F172B">Server (ASP.NET Core)</text>
    <text x="${COL.ben}" y="22" text-anchor="middle" font-size="15" font-weight="700" fill="#0F172B">Trình duyệt Ben</text>
    <text x="10" y="83" font-size="12" fill="#45556C" transform="rotate(-90 10 83)" text-anchor="middle">Code Geronimo</text>
    <text x="10" y="196" font-size="12" fill="#5B21B6" font-weight="700" transform="rotate(-90 10 196)" text-anchor="middle">SignalR</text>
    <text x="10" y="300" font-size="12" fill="#45556C" transform="rotate(-90 10 300)" text-anchor="middle">Mạng</text>
    <rect x="24" y="140" width="868" height="112" rx="14" fill="#F1EBFD" stroke="#5B21B6" stroke-width="1.5" stroke-dasharray="7 5"/>
    <rect x="24" y="282" width="868" height="36" rx="18" fill="#F1F5F9" stroke="#CAD5E2"/>
    <text x="36" y="338" font-size="12" fill="#45556C" class="mono">WebSocket · fallback SSE → Long polling</text>
    <g id="routes"></g>
    <g id="nodes">${Object.entries(NODE).map(([id, n]) => nodeSvg(id, n)).join("")}</g>
    <g id="packets"></g>`;
}

const columnOf = (id) => (id.endsWith("-anna") ? "anna" : id.endsWith("-ben") ? "ben" : "server");

// Chuyển path của bước thành các đoạn đường: cùng cột thì đi thẳng, khác cột thì xuống "Mạng" rồi đi ngang.
function routesFor(path) {
  const routes = [];
  const side = [];
  const wireAt = path.indexOf("wire");
  const chain = (wireAt < 0 ? path : path.slice(0, wireAt)).filter((id) => {
    if (id === "redis") side.push(id);
    return NODE[id] && id !== "redis";
  });
  const targets = wireAt < 0 ? [] : path.slice(wireAt + 1).filter((id) => NODE[id]);

  const top = (n) => n.y - n.h / 2;
  const bottom = (n) => n.y + n.h / 2;
  // Đoạn thẳng đứng giữa hai node cùng cột, từ mép node này tới mép node kia.
  const vertical = (a, b) => (b.y > a.y ? `M${a.x} ${bottom(a)} V${top(b) - 2}` : `M${a.x} ${top(a)} V${bottom(b) + 2}`);

  if (wireAt < 0) {
    for (let i = 0; i + 1 < chain.length; i++) {
      if (columnOf(chain[i]) === columnOf(chain[i + 1])) routes.push(vertical(NODE[chain[i]], NODE[chain[i + 1]]));
    }
  } else {
    for (let i = 0; i + 1 < chain.length; i++) routes.push(vertical(NODE[chain[i]], NODE[chain[i + 1]]));
    const from = NODE[chain.at(-1)];
    targets.forEach((t, i) => {
      const to = NODE[t];
      // Path bắt đầu từ "Mạng" (frame đang tới): chỉ vẽ đoạn từ đường truyền lên node.
      if (!from) return routes.push(`M${to.x} ${WIRE_Y} V${bottom(to) + 2}`);
      const offset = targets.length > 1 ? (to.x > from.x ? 24 : -24) : 0;
      routes.push(`M${from.x + offset} ${bottom(from)} V${WIRE_Y + (i ? 8 : 0)} H${to.x} V${bottom(to) + 2}`);
    });
  }
  return { routes, side };
}

export function renderDiagram(svg, view) {
  const step = view.step;
  const active = new Set(step?.path ?? []);
  for (const g of svg.querySelectorAll(".node")) {
    const on = active.has(g.dataset.node);
    const rect = g.querySelector("rect");
    rect.setAttribute("stroke-width", on ? "3.5" : "1.5");
    g.style.opacity = step && !on ? ".55" : "1";
  }
  const routesEl = svg.querySelector("#routes");
  const packetsEl = svg.querySelector("#packets");
  routesEl.innerHTML = "";
  packetsEl.innerHTML = "";
  if (!step || view.state === "idle") return;

  const color = step.owner === "signalr" ? "#5B21B6" : "#007595";
  const { routes, side } = routesFor(step.path);
  const dur = Math.max(0.6, (view.stepMs * 0.6) / 1000);
  routes.forEach((d, i) => {
    const path = document.createElementNS(NS, "path");
    path.setAttribute("id", `route-${i}`);
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", color);
    path.setAttribute("stroke-width", "3");
    path.setAttribute("marker-end", step.owner === "signalr" ? "url(#ah)" : "url(#ah-app)");
    routesEl.append(path);
    const dot = document.createElementNS(NS, "circle");
    dot.setAttribute("r", "7");
    dot.setAttribute("fill", color);
    dot.setAttribute("class", "packet");
    dot.innerHTML = `<animateMotion dur="${dur}s" repeatCount="indefinite"><mpath href="#route-${i}"/></animateMotion>`;
    packetsEl.append(dot);
  });
  if (side.includes("redis")) {
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", `M${COL.server + 60} ${NODE["sr-server"].y + 34} V${NODE.redis.y - 24}`);
    path.setAttribute("stroke", "#5B21B6");
    path.setAttribute("stroke-width", "2.5");
    path.setAttribute("stroke-dasharray", "4 4");
    path.setAttribute("fill", "none");
    routesEl.append(path);
  }
}

// Số thứ tự: các nhánh của một ngã rẽ cùng bắt đầu từ số kế tiếp, mỗi nhánh đếm riêng.
// total: số bước thực sự phải đi (nhánh đã xảy ra, hoặc nhánh dài nhất khi chưa rõ).
export function numbering(view) {
  const seen = {};
  let main = 0;
  const numbers = view.steps.map((s) => (s.branch ? main + (seen[s.branch] = (seen[s.branch] ?? 0) + 1) : ++main));
  const branchLength = view.branch ? (seen[view.branch] ?? 0) : Math.max(0, ...Object.values(seen));
  return { numbers, total: main + branchLength };
}

export function renderSteps(list, view) {
  if (!view.steps.length) {
    list.innerHTML = "";
    return;
  }
  const { numbers } = numbering(view);
  list.innerHTML = view.steps
    .map((s, i) => {
      const n = numbers[i];
      const label = s.branchLabel ? `<li class="fork" aria-hidden="true">${esc(s.branchLabel)}</li>` : "";
      const skipped = s.branch && view.branch && s.branch !== view.branch ? " skipped" : "";
      const current = i === view.index ? ' aria-current="step"' : "";
      const done = !skipped && (i < view.index || view.state === "done") ? " done" : "";
      const branch = s.branch ? " branch" : "";
      return `${label}<li class="${s.owner}${done}${skipped}${branch}"${current}><span class="n">${n}</span>${esc(s.title)}<span class="tag">${s.owner === "signalr" ? "SignalR" : "Geronimo"}</span></li>`;
    })
    .join("");
  list.querySelector('[aria-current="step"]')?.scrollIntoView({ block: "nearest" });
}

const frameLine = (f, t0) => {
  const arrow = f.dir === "out" ? `${WHO[f.user]} → server` : `server → ${WHO[f.user]}`;
  const at = t0 === undefined ? "" : ` +${((f.at - t0) / 1000).toFixed(1)}s`;
  return `<span class="dir">${arrow}${at}</span>  ${esc(String(f.text).replaceAll("\x1e", "␞"))}`;
};

const short = (v) => esc(JSON.stringify(v));

function traceLines(view) {
  return view.traces.map((t) => {
    if (t.step === "server.sendAll") return `<span class="dir">Clients.All → ${t.data.recipients} connection</span>  ${esc(t.data.method)}(${short(t.data.args).slice(1, -1)})`;
    if (t.step === "server.sendCaller") return `<span class="dir">Clients.Caller</span>  ${esc(t.data.method)}(${short(t.data.args).slice(1, -1)})`;
    if (t.step === "server.dispatch") return `<span class="dir">gọi</span>  ${esc(t.fn)}(${short(t.data).slice(1, -1)})`;
    if (t.step === "server.connected") return `<span class="dir">connectionId</span>  ${esc(t.connectionId)} · tổng ${t.data.total} connection`;
    return `<span class="dir">${esc(t.fn)}</span>  ${t.data ? short(t.data) : ""}`;
  });
}

export function renderDetail(el, view) {
  const step = view.step;
  if (!step) {
    el.innerHTML = "";
    return;
  }
  const parts = [`<span class="owner ${step.owner}">${OWNER_LABEL[step.owner]}</span>`, `<h3>${esc(step.fn)}</h3>`, `<p>${esc(step.explain)}</p>`];
  if (step.trace?.length > 1) {
    const seen = new Set(view.traces.map((t) => t.step));
    parts.push(`<ol class="substeps">${step.trace.map((name) => `<li class="${seen.has(name) ? "on" : ""}">${esc(name.replace("hub.", ""))}</li>`).join("")}</ol>`);
  }
  const t0 = view.name === "reconnect" ? view.frames[0]?.at : undefined;
  const lines = [...view.frames.map((f) => frameLine(f, t0)), ...(step.trace?.length > 1 ? [] : traceLines(view))];
  if (lines.length) parts.push(`<pre class="wire">${lines.join("\n")}</pre>`);
  else if (view.waiting) parts.push(`<pre class="wire">…</pre>`);
  if (view.blocked) parts.push(`<div class="warn-note"><b>Đang chờ:</b> ${esc(view.blocked)}</div>`);
  if (step.warn) parts.push(`<div class="warn-note"><b>Lỗ hổng:</b> ${esc(step.warn)}</div>`);
  if (step.without) parts.push(`<div class="without"><b>Nếu không dùng SignalR:</b> ${esc(step.without)}</div>`);
  el.innerHTML = parts.join("");
}
