import { createServer } from "http";
import { env } from "./config/env.config";
import { initializeSocketServer } from "./utils/socket-server";

// Create HTTP server
const httpServer = createServer();

// Initialize Socket.IO server
initializeSocketServer(httpServer);

// Start the server
httpServer.listen(env.NEXT_PUBLIC_WS_PORT, () => {
  console.log(`WebSocket server is running on port ${env.NEXT_PUBLIC_WS_PORT}`);
});

export default httpServer;
