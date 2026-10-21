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

export class GateQueue {
  holding = true;
  onHold = null; // (item) => void, báo cho mô phỏng có thứ vừa bị giữ
  #entries = [];

  hold(item) {
    // Ping luôn đi thẳng: giữ ping lâu sẽ làm server/client tưởng mất kết nối.
    if (!this.holding || isPingOnly(item)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      this.#entries.push({ item, resolve, reject });
      this.onHold?.(item);
    });
  }

  get pending() {
    return this.#entries.map((e) => e.item);
  }

  releaseNext(predicate = () => true) {
    const index = this.#entries.findIndex((e) => predicate(e.item));
    if (index < 0) return null;
    const [entry] = this.#entries.splice(index, 1);
    entry.resolve();
    return entry.item;
  }

  releaseAll(predicate = () => true) {
    const released = [];
    for (let item = this.releaseNext(predicate); item; item = this.releaseNext(predicate)) released.push(item);
    return released;
  }

  dropAll(reason) {
    const entries = this.#entries.splice(0);
    for (const e of entries) e.reject(new Error(reason));
  }
}
