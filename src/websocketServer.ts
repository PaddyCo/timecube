import { IncomingMessage, Server } from "http";
import internal from "stream";
import WebSocket from "ws";

export default (expressServer: Server) => {
  const websocketServer = new WebSocket.Server({
    noServer: true,
    path: "/ws",
  });

  expressServer.on(
    "upgrade",
    (request: IncomingMessage, socket: internal.Duplex, head: Buffer) => {
      websocketServer.handleUpgrade(request, socket, head, (websocket) => {
        websocketServer.emit("connection", websocket, request);
      });
    }
  );

  websocketServer.on("connection", (websocketConnection, connectionRequest) => {
    const url = connectionRequest?.url;

    // NOTE: connectParams are not used here but good to understand how to get
    // to them if you need to pass data with the connection to identify it (e.g., a userId).
    console.log("WS URL", url);

    websocketConnection.on("message", (message) => {
      console.log("MESSAGE", message.toString());
    });
  });

  return websocketServer;
};
