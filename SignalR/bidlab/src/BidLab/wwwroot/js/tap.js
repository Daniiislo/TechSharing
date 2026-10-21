// "Tap" cắm vào SignalR client thật qua hai option chính thức của withUrl():
//   { WebSocket: TappedWebSocket, httpClient: TapHttpClient }
// Nó ghi lại mọi frame/HTTP thật và hoãn chúng qua GateQueue. Logic của SignalR không bị thay.
// Bám theo signalr.js 10.0.0: WebSocketTransport gán webSocket.onopen/onmessage/onclose dạng property.

const describeUrl = (url) => {
  const u = new URL(url, location.href);
  return `${u.pathname}${u.search}`;
};

export function createTap(user, gate, onCapture) {
  let offline = false;
  const sockets = new Set();
  const capture = (dir, kind, text) => {
    const item = { user, dir, kind, text, at: performance.now() };
    onCapture(item);
    return item;
  };
  const dropMine = (reason) => gate.dropAll(reason, (i) => i.user === user);

  class TappedWebSocket extends WebSocket {
    constructor(url, protocols) {
      super(url, protocols);
      sockets.add(this);
      capture("out", "ws-open", `GET ${describeUrl(url)}  (Upgrade: websocket)`);
      if (offline) queueMicrotask(() => super.close());
    }

    send(data) {
      const text = typeof data === "string" ? data : "[binary]";
      gate.hold(capture("out", "frame", text)).then(() => super.send(data), () => {});
    }

    set onopen(handler) {
      super.onopen = handler && ((event) => {
        gate.hold(capture("in", "ws-open", "101 Switching Protocols")).then(() => handler(event), () => {});
      });
    }

    set onmessage(handler) {
      super.onmessage = handler && ((event) => {
        const text = typeof event.data === "string" ? event.data : "[binary]";
        gate.hold(capture("in", "frame", text)).then(() => handler(event), () => {});
      });
    }

    set onclose(handler) {
      super.onclose = handler && ((event) => {
        sockets.delete(this);
        // Frame còn giữ của socket đã đóng không bao giờ được giao nữa.
        dropMine("socket closed");
        capture("in", "ws-close", `close ${event.code}${event.wasClean ? "" : " (không sạch)"}`);
        handler(event);
      });
    }
  }

  class TapHttpClient extends signalR.DefaultHttpClient {
    constructor() {
      super({ log() {} });
    }

    async send(request) {
      const attempt = capture("out", "http", `${request.method} ${describeUrl(request.url)}`);
      // Mất mạng: request vẫn được ghi lại (mỗi lần thử reconnect là một negotiate) rồi thất bại.
      if (offline) throw new signalR.HttpError("Mất mạng (demo)", 0);
      await gate.hold(attempt);
      const response = await super.send(request);
      await gate.hold(capture("in", "http", `${response.statusCode} ${response.content ?? ""}`));
      return response;
    }
  }

  return {
    WebSocket: TappedWebSocket,
    httpClient: new TapHttpClient(),
    get offline() {
      return offline;
    },
    setOffline(value) {
      offline = value;
      if (!value) return;
      dropMine("offline");
      // Đóng như đứt cáp: SignalR thấy socket đóng khi đang Connected nên tự reconnect.
      for (const socket of sockets) socket.close();
    },
  };
}
