// Bản rút gọn của TravelPledgeAuctions/wwwroot/js/itemBid.js cho một pane.
// Giữ: cách tạo connection, tên handler, câu chữ toast/banner, luồng PLACE BID → CONFIRM → invoke.
// Khác: không reload trang khi lỗi, không có Buy it now / thẻ tín dụng / SMS.

const ITEM_ID = 1042;
const STEP = 50;
const USER_IDS = { an: "u-an", binh: "u-binh" };
const money = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);
const parseMoney = (text) => Number(String(text).replace(/[^0-9.]/g, "")) || 0;

const FAIL_MESSAGES = {
  ITEM_CLOSED: "This item is no longer available for bidding.",
  ALREADY_WON: "You already have a winning bid for this item.",
  BID_TOO_LOW: "Your bid is too low. Please refresh the page for the current bid amount.",
  BUY_NOW_UNAVAILABLE: "Buy It Now is no longer available for this item.",
  QUANTITY_UNAVAILABLE: "Sorry! The quantity you requested is no longer available.",
};

export function createBidder(user, root, tap, hooks) {
  const $ = (role) => root.querySelector(`[data-role="${role}"]`);
  const state = { connected: false, myBidAmount: 0, minBid: 0, currentAmount: 0, isExact: true };
  $("bidder-id").value = USER_IDS[user];

  // itemBid.js:5 — cùng builder, cộng tap của demo. serverTimeout dài vì demo giữ frame khi thuyết trình.
  const connection = new signalR.HubConnectionBuilder()
    .withUrl("/bidhub", { transport: signalR.HttpTransportType.WebSockets, WebSocket: tap.WebSocket, httpClient: tap.httpClient })
    .withAutomaticReconnect()
    .withServerTimeout(600_000)
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  function toast(kind, message) {
    const el = document.createElement("div");
    el.className = `tpa-toast ${kind}`;
    el.textContent = message;
    $("toast-host").append(el);
    setTimeout(() => el.remove(), 5000);
  }

  function setConn(text, tone = "") {
    const el = $("conn-state");
    el.textContent = text;
    el.className = `conn ${tone}`;
  }

  function banner(html) {
    const el = $("conn-banner");
    el.hidden = !html;
    el.innerHTML = html ?? "";
  }

  function updateBidButton() {
    $("bid-button").disabled = !state.connected || hooks.isBusy();
  }

  function setAmount(amount) {
    $("max-bid-amount").value = money(Math.max(amount, state.minBid));
  }

  // itemBid.js:109 — on("updateItem"): giá, số bid, banner, ô nhập về mức tối thiểu kế tiếp.
  function updateItem(itemId, currentAmount, nextBidAmount, numberOfBids, _closing, _seconds, highBidderUserId) {
    if (itemId !== ITEM_ID) return;
    const amountEl = $("current-bid-amount");
    if (state.currentAmount && currentAmount !== state.currentAmount) {
      amountEl.classList.remove("flash");
      void amountEl.offsetWidth;
      amountEl.classList.add("flash");
    }
    state.currentAmount = currentAmount;
    state.minBid = nextBidAmount;
    $("bid-circle-count").textContent = numberOfBids;
    amountEl.textContent = money(currentAmount);
    const isHigh = highBidderUserId === USER_IDS[user];
    $("winning-bid").hidden = !isHigh;
    $("outbid-bid").hidden = isHigh || !(state.myBidAmount > 0);
    setAmount(nextBidAmount);
    $("confirm-panel").hidden = true;
    $("bid-panel").hidden = false;
    $("confirm-bid-button").disabled = false;
  }

  connection.on("updateItem", updateItem);

  // itemBid.js:23 — chỉ connection đã gọi AddBid nhận addBidSuccess.
  connection.on("addBidSuccess", (_itemId, _bidderId, isHighBidder) => {
    if (isHighBidder) toast("success", "Your bid was successful! You're winning!");
    else toast("info", "Your bid was placed, but you were immediately outbid by another bidder's max bid.");
  });

  // itemBid.js:77 — Geronimo reload trang sau 1,5 giây; demo giữ nguyên trang để còn quan sát.
  connection.on("addBidFail", (_itemId, _bidderId, errorReason) => {
    toast("error", FAIL_MESSAGES[errorReason] ?? "Your bid could not be submitted. Please refresh the page and try again.");
    $("confirm-panel").hidden = true;
    $("bid-panel").hidden = false;
  });

  // itemBid.js:437-450 — câu chữ gốc.
  connection.onreconnecting(() => {
    state.connected = false;
    updateBidButton();
    setConn("Đang kết nối lại…", "is-warn");
    banner('<b>Connection to WinningBidder.com was lost.</b><br>Attempting to reconnect... <i class="fa fa-spinner fa-spin" aria-hidden="true"></i>');
    hooks.onReconnecting?.(user);
  });
  connection.onreconnected(() => {
    state.connected = true;
    updateBidButton();
    setConn("● WebSocket", "is-on");
    banner(null);
    hooks.onReconnected?.(user);
  });
  connection.onclose(() => {
    state.connected = false;
    updateBidButton();
    setConn("Đã ngắt", "is-warn");
    if (!hooks.isStopping()) {
      banner("<b>Connection to WinningBidder.com was closed due to an error.</b><br>Refresh this page to restart the connection.");
    }
    hooks.onClosed?.(user);
  });

  async function loadState() {
    const item = await (await fetch(`/api/item?user=${USER_IDS[user]}`)).json();
    state.myBidAmount = item.myBidAmount;
    $("toast-host").replaceChildren();
    state.currentAmount = 0;
    updateItem(item.itemId, item.currentAmount, item.nextBidAmount, item.numberOfBids, "", 0, item.highBidderUserId);
  }

  async function connect() {
    setConn("Đang kết nối…");
    try {
      await connection.start();
      // itemBid.js:389 — chỉ bật nút bid khi đã kết nối.
      state.connected = true;
      setConn("● WebSocket", "is-on");
    } catch (err) {
      setConn("Lỗi kết nối", "is-warn");
      console.warn(`[${user}] start failed`, err);
    }
    updateBidButton();
  }

  async function disconnect() {
    await connection.stop();
    state.connected = false;
    setConn("Chưa kết nối");
    banner(null);
    updateBidButton();
  }

  // --- Tương tác trên trang (itemBid.js:455 và các handler +/-, Exact/Max) ---
  $("plus").addEventListener("click", () => setAmount(parseMoney($("max-bid-amount").value) + STEP));
  $("minus").addEventListener("click", () => setAmount(parseMoney($("max-bid-amount").value) - STEP));
  for (const [role, exact] of [["bid-type-exact", true], ["bid-type-max", false]]) {
    $(role).addEventListener("click", () => {
      state.isExact = exact;
      $("bid-type-exact").classList.toggle("bid-type-tab-active", exact);
      $("bid-type-max").classList.toggle("bid-type-tab-active", !exact);
      $("bid-type-exact").setAttribute("aria-pressed", String(exact));
      $("bid-type-max").setAttribute("aria-pressed", String(!exact));
    });
  }

  $("bid-button").addEventListener("click", () => {
    $("bid-panel").hidden = true;
    $("confirm-bid-type-label").textContent = state.isExact ? "Your exact bid:" : "Your maximum bid:";
    $("confirm-bid-amount").textContent = $("max-bid-amount").value;
    $("confirm-panel").hidden = false;
    $("confirm-bid-button").focus();
  });
  $("confirm-cancel").addEventListener("click", () => {
    $("confirm-panel").hidden = true;
    $("bid-panel").hidden = false;
  });

  $("confirm-bid-button").addEventListener("click", () => {
    const bidAmount = parseMoney($("confirm-bid-amount").textContent);
    const bid = { user, bidAmount, isMaxBid: !state.isExact, currentAmount: state.currentAmount };
    if (!hooks.beforeInvoke(bid)) return;
    $("confirm-bid-button").disabled = true;
    state.myBidAmount = Math.max(state.myBidAmount, state.isExact ? bidAmount : state.minBid);
    // itemBid.js:939 — bidderId đọc từ hidden field và gửi lên server (lỗ hổng được giữ nguyên để minh hoạ).
    connection
      .invoke("AddBid", ITEM_ID, $("bidder-id").value, bidAmount, false, !state.isExact)
      .catch((err) => {
        console.error(err.toString());
        toast("error", "Your bid could not be submitted. Please refresh the page and try again.");
      });
  });

  return {
    user,
    connection,
    connect,
    disconnect,
    loadState,
    refreshButton: updateBidButton,
    setBid(amount, exact) {
      $(exact ? "bid-type-exact" : "bid-type-max").click();
      $("max-bid-amount").value = money(amount);
    },
    get connected() {
      return state.connected;
    },
  };
}
