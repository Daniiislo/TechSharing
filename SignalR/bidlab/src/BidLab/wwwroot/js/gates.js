// Lõi thuần (không DOM) của cơ chế "giữ frame ở cổng mạng".
// SignalR client thật vẫn chạy bình thường; demo chỉ hoãn thời điểm frame đi ra/vào socket
// để người xem theo kịp từng bước.

const RECORD_SEPARATOR = "\x1e"; // JSON Hub Protocol kết thúc mỗi message bằng 0x1E

// Một text frame có thể chứa nhiều message; trả về mảng, mỗi phần tử một message.
export function classifyFrame(text) {
  return String(text)
    .split(RECORD_SEPARATOR)
    .filter((part) => part.trim() !== "")
    .map((part) => {
      let msg = {};
      try { msg = JSON.parse(part); } catch { /* frame không phải JSON: để nguyên */ }
      const type = typeof msg.type === "number" ? msg.type : null;
      return {
        type,
        target: msg.target,
        invocationId: msg.invocationId,
        isPing: type === 6,
        isHandshake: type === null && (Object.keys(msg).length === 0 || "protocol" in msg),
        message: msg,
        raw: part,
      };
    });
}

const isPingOnly = (item) =>
  item.kind === "frame" && classifyFrame(item.text).every((f) => f.isPing);
const sameStream = (a, b) => a.user === b.user && a.dir === b.dir;

export class GateQueue {
  holding = true;
  onHold = null; // (item) => void, báo cho mô phỏng có thứ vừa bị giữ
  #entries = [];

  hold(item) {
    if (!this.holding) return Promise.resolve();
    const ping = isPingOnly(item);
    // Ping đi thẳng (giữ lâu thì hai bên tưởng mất kết nối), trừ khi phía trước trong cùng luồng
    // còn frame bị giữ: vượt lên sẽ sai thứ tự, ví dụ ping tới trước handshake response.
    if (ping && !this.#entries.some((e) => sameStream(e.item, item))) return Promise.resolve();
    return new Promise((resolve, reject) => {
      this.#entries.push({ item, resolve, reject, ping });
      if (!ping) this.onHold?.(item);
    });
  }

  get pending() {
    return this.#entries.filter((e) => !e.ping).map((e) => e.item);
  }

  releaseNext(predicate = () => true) {
    const index = this.#entries.findIndex((e) => !e.ping && predicate(e.item));
    if (index < 0) return null;
    const [entry] = this.#entries.splice(index, 1);
    entry.resolve();
    this.#drainPings();
    return entry.item;
  }

  // Nhả các ping không còn frame nào bị giữ đứng trước trong cùng luồng.
  #drainPings() {
    this.#entries = this.#entries.filter((entry, i) => {
      if (!entry.ping || this.#entries.slice(0, i).some((e) => !e.ping && sameStream(e.item, entry.item))) return true;
      entry.resolve();
      return false;
    });
  }

  releaseAll(predicate = () => true) {
    const released = [];
    for (let item = this.releaseNext(predicate); item; item = this.releaseNext(predicate)) released.push(item);
    return released;
  }

  dropAll(reason, predicate = () => true) {
    const dropped = this.#entries.filter((e) => predicate(e.item));
    this.#entries = this.#entries.filter((e) => !predicate(e.item));
    for (const e of dropped) e.reject(new Error(reason));
    this.#drainPings();
  }
}
