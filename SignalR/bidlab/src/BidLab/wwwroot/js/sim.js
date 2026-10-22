// Điều phối một lượt mô phỏng: đi qua template các bước, nhả frame đang giữ ở bước tương ứng,
// gom frame/trace thật để hiển thị. Không chạm DOM: mọi hiển thị đi qua render(view).

const BASE_STEP_MS = 2000;

const other = (user) => (user === "anna" ? "ben" : "anna");
const resolveNode = (node, user) =>
  node.endsWith("-x") ? node.replace(/-x$/, `-${user}`) : node.endsWith("-y") ? node.replace(/-y$/, `-${other(user)}`) : node;
const resolvePath = (path, user) => path.map((n) => resolveNode(n, user));

export class Simulator {
  speed = 1;
  playing = false;
  #gate;
  #render;
  #schedule;
  #canAdvance;
  #branch = null; // nhánh kết quả đã xảy ra ("ok" / "fail"), null khi chưa rõ
  #blocked = null; // lý do bước kế chưa đi tiếp được (kết quả thật chưa xảy ra)
  #name = null;
  #user = null;
  #template = [];
  #index = -1;
  #state = "idle"; // idle | running | done | disconnected
  #armed = [];     // bộ lọc của các bước có gate đã được đi tới trong lượt này
  #captures = [];
  #traces = [];
  #tickGeneration = 0; // tick cũ (trước lần Dừng/Chạy gần nhất) tự bỏ qua

  constructor({ gate, render = () => {}, schedule = (fn, ms) => setTimeout(fn, ms), canAdvance = () => null }) {
    this.#canAdvance = canAdvance;
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
    this.#branch = null;
    this.#blocked = null;
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

  // Chỉ đi qua các bước không thuộc nhánh nào, hoặc thuộc nhánh đã xảy ra.
  #eligible(step) {
    return !step.branch || step.branch === this.#branch;
  }

  #after(index) {
    for (let i = index + 1; i < this.#template.length; i++) if (this.#eligible(this.#template[i])) return i;
    return -1;
  }

  // Còn việc phía sau: bước đủ điều kiện, hoặc một ngã rẽ đang chờ kết quả.
  #hasMore(index) {
    return this.#after(index) >= 0 || (!this.#branch && this.#template.slice(index + 1).some((s) => s.branch));
  }

  #before(index) {
    for (let i = index - 1; i >= 0; i--) if (this.#eligible(this.#template[i])) return i;
    return -1;
  }

  // Kết quả thật đã xảy ra: chọn nhánh tương ứng (kết quả đầu tiên là kết quả cuối cùng).
  chooseBranch(branch) {
    if (!this.isBusy || this.#branch) return;
    this.#branch = branch;
    this.#blocked = null;
    this.#emit();
  }

  next() {
    if (this.#state === "done") {
      // Xem lại sau khi xong lượt: chỉ đổi hình, không nhả thêm gì.
      const to = this.#after(this.#index);
      if (to >= 0) {
        this.#index = to;
        this.#emit();
      }
      return;
    }
    if (!this.isBusy) return;
    const nextStep = this.#template[this.#index + 1];
    // Ngã rẽ: chưa biết kết quả thật thì đứng yên, kèm lý do.
    if (nextStep?.branch && !this.#branch) {
      this.#blocked = this.#canAdvance(nextStep, this.view()) ?? "Đang chờ kết quả…";
      return this.#emit();
    }
    this.#blocked = null;
    const to = this.#after(this.#index);
    if (to >= 0) this.#goTo(to);
  }

  prev() {
    // Chỉ tua hình: những gì đã nhả không gửi lại.
    const to = this.#before(this.#index);
    if (to >= 0) {
      this.#index = to;
      this.#emit();
    }
  }

  play() {
    this.playing = true;
    this.#tickGeneration += 1;
    this.#emit();
    this.#tick();
  }

  pause() {
    this.playing = false;
    this.#tickGeneration += 1;
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
    const generation = this.#tickGeneration;
    this.#schedule(() => {
      if (generation !== this.#tickGeneration || !this.playing || !this.isBusy) return;
      this.next();
      if (this.isBusy) this.#tick();
    }, this.stepMs);
  }

  #filterFor(step, spec) {
    // Bước chỉ chạm người dùng của lượt (x, không có y) thì mặc định lọc theo người đó.
    const onlyX = step.path.some((n) => n.endsWith("-x")) && !step.path.some((n) => n.endsWith("-y"));
    const user = spec.user === "x" ? this.#user : spec.user ?? (onlyX ? this.#user : null);
    return (item) =>
      (!spec.dir || item.dir === spec.dir) && (!spec.kind || item.kind === spec.kind) && (!user || item.user === user);
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
    if (!this.#hasMore(index)) return this.finish();
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
      blocked: this.#blocked,
      branch: this.#branch,
    };
  }

  #emit() {
    this.#render(this.view());
  }
}
