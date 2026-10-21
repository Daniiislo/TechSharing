// Điều phối một lượt mô phỏng: đi qua template các bước, nhả frame đang giữ ở bước tương ứng,
// gom frame/trace thật để hiển thị. Không chạm DOM: mọi hiển thị đi qua render(view).

const BASE_STEP_MS = 2000;

const other = (user) => (user === "an" ? "binh" : "an");
const resolveNode = (node, user) =>
  node.endsWith("-x") ? node.replace(/-x$/, `-${user}`) : node.endsWith("-y") ? node.replace(/-y$/, `-${other(user)}`) : node;
const resolvePath = (path, user) => path.map((n) => resolveNode(n, user));

export class Simulator {
  speed = 0.5;
  playing = false;
  #gate;
  #render;
  #schedule;
  #name = null;
  #user = null;
  #template = [];
  #index = -1;
  #state = "idle"; // idle | running | done | disconnected
  #armed = [];     // bộ lọc của các bước có gate đã được đi tới trong lượt này
  #captures = [];
  #traces = [];

  constructor({ gate, render = () => {}, schedule = (fn, ms) => setTimeout(fn, ms) }) {
    this.#gate = gate;
    this.#render = render;
    this.#schedule = schedule;
    gate.onHold = (item) => {
      if (this.#armed.some((match) => match(item))) gate.releaseNext((i) => i === item);
    };
  }

  get isBusy() {
    return this.#state === "running";
  }

  // hold: false cho lượt "trực tiếp" (reconnect): chỉ ghi lại, không hoãn frame nào.
  start(name, template, user, { hold = true } = {}) {
    if (this.isBusy) return false;
    this.#name = name;
    this.#user = user;
    this.#template = template;
    this.#captures = [];
    this.#traces = [];
    this.#armed = [];
    this.#state = "running";
    this.#gate.holding = hold;
    this.#goTo(0);
    return true;
  }

  addCapture(capture) {
    if (this.isBusy) this.#captures.push(capture);
    this.#emit();
  }

  addTrace(trace) {
    if (this.isBusy) this.#traces.push(trace);
    this.#emit();
  }

  next() {
    if (!this.isBusy) return;
    this.#goTo(this.#index + 1);
  }

  prev() {
    // Chỉ tua hình: những gì đã nhả không gửi lại.
    if (this.#index > 0) {
      this.#index -= 1;
      this.#emit();
    }
  }

  play() {
    this.playing = true;
    this.#emit();
    this.#tick();
  }

  pause() {
    this.playing = false;
    this.#emit();
  }

  setSpeed(speed) {
    this.speed = speed;
    this.#emit();
  }

  get stepMs() {
    return BASE_STEP_MS / this.speed;
  }

  finish() {
    if (this.#state !== "running") return;
    this.#end("done");
    this.#gate.releaseAll();
  }

  abort(reason) {
    if (this.#state !== "running") return;
    this.#end("disconnected");
    this.#gate.dropAll(reason);
  }

  #end(state) {
    this.#state = state;
    this.playing = false;
    this.#armed = [];
    this.#gate.holding = false;
    this.#emit();
  }

  #tick() {
    this.#schedule(() => {
      if (!this.playing || !this.isBusy) return;
      this.next();
      if (this.isBusy) this.#tick();
    }, this.stepMs);
  }

  #filterFor(step, spec) {
    // Bước chỉ chạm người dùng của lượt (x, không có y) thì mặc định lọc theo người đó.
    const onlyX = step.path.some((n) => n.endsWith("-x")) && !step.path.some((n) => n.endsWith("-y"));
    const user = spec.user === "x" ? this.#user : spec.user ?? (onlyX ? this.#user : null);
    return (item) =>
      item.dir === spec.dir && (!spec.kind || item.kind === spec.kind) && (!user || item.user === user);
  }

  #goTo(index) {
    this.#index = index;
    const step = this.#template[index];
    if (step.gate) {
      const match = this.#filterFor(step, step.gate);
      this.#armed.push(match);
      this.#gate.releaseAll(match);
    }
    // Bước cuối: kết thúc lượt luôn để nút bid mở lại, không cần bấm thêm.
    if (index === this.#template.length - 1) return this.finish();
    this.#emit();
  }

  view() {
    const raw = this.#template[this.#index];
    const step = raw && { ...raw, path: resolvePath(raw.path, this.#user) };
    const spec = raw && (raw.gate ?? raw.capture);
    const match = spec && this.#filterFor(raw, spec);
    const frames = match ? this.#captures.filter(match) : [];
    const traces = raw?.trace ? this.#traces.filter((t) => raw.trace.includes(t.step)) : [];
    return {
      name: this.#name,
      user: this.#user,
      state: this.#state,
      index: this.#index,
      steps: this.#template,
      step,
      frames,
      traces,
      waiting: Boolean(raw?.gate && frames.length === 0),
      playing: this.playing,
      speed: this.speed,
      stepMs: this.stepMs,
    };
  }

  #emit() {
    this.#render(this.view());
  }
}
