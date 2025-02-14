import { io, Socket } from "socket.io-client";
import { Server as SocketServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { processAudioChunk } from "@/services/sermon.service";
import { AudioChunk } from "@/types/bible.type";
import { APP_CONFIG } from "@/config/app.config";
import { env } from "@/config/env.config";

// Client-side socket instance
let clientSocket: Socket | null = null;

// Server-side socket instance
let serverIO: SocketServer | null = null;

// Client-side functions
export const initializeSocket = async (): Promise<Socket> => {
  // Initialize socket connection
  const socket = io(env.NEXT_PUBLIC_APP_URL, {
    path: "/api/socket/io",
    transports: ["websocket"],
  });

  return new Promise((resolve, reject) => {
    socket.on("connect", () => {
      console.log("Socket connected");
      clientSocket = socket; // Store the socket instance
      resolve(socket);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      reject(error);
    });

    socket.connect();
  });
};

export const getSocket = (): Socket => {
  if (!clientSocket) {
    throw new Error("Socket not initialized. Call initializeSocket first.");
  }
  return clientSocket;
};

export const closeSocket = (): void => {
  if (clientSocket) {
    clientSocket.close();
    clientSocket = null;
  }
};

// Server-side functions
const setupSocketHandlers = (io: SocketServer) => {
  io.on("connection", (socket) => {
    console.log("Client connected to server");

    socket.on(
      APP_CONFIG.SOCKET.EVENTS.AUDIO_CHUNK,
      async (chunk: AudioChunk) => {
        try {
          const verses = await processAudioChunk(chunk);
          if (verses.length > 0) {
            socket.emit(APP_CONFIG.SOCKET.EVENTS.VERSES_DETECTED, verses);
          }
        } catch (error) {
          console.error("Server processing error:", error);
          socket.emit(APP_CONFIG.SOCKET.EVENTS.ERROR, {
            message: "Failed to process audio chunk on server",
          });
        }
      }
    );

    socket.on("disconnect", () => {
      console.log("Client disconnected from server");
    });
  });
};

export const initializeSocketServer = (server: HTTPServer) => {
  if (!serverIO) {
    serverIO = new SocketServer(server, {
      cors: {
        origin: env.NEXT_PUBLIC_APP_URL,
        methods: ["GET", "POST"],
      },
    });
    setupSocketHandlers(serverIO);
  }
  return serverIO;
};
