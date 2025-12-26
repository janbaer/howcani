// Live reload client - connects to dev server WebSocket

const WEBSOCKET_PORT = 3001;

export function initLiveReload() {
  if (typeof window === "undefined") return;

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//localhost:${WEBSOCKET_PORT}`;

  let ws: WebSocket | null = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 10;

  function connect() {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[live-reload] Connected");
      reconnectAttempts = 0;
    };

    ws.onmessage = (event) => {
      const message = event.data;
      if (message === "reload") {
        console.log("[live-reload] Reloading...");
        window.location.reload();
      }
    };

    ws.onclose = () => {
      console.log("[live-reload] Disconnected");
      ws = null;
      scheduleReconnect();
    };

    ws.onerror = () => {
      ws?.close();
    };
  }

  function scheduleReconnect() {
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      const delay = Math.min(1000 * reconnectAttempts, 5000);
      console.log(`[live-reload] Reconnecting in ${delay}ms...`);
      setTimeout(connect, delay);
    }
  }

  connect();
}
