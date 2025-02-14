import { Server as SocketServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { processAudioChunk } from "@/services/sermon.service";
import { AudioChunk } from "@/types/bible.type";
import { APP_CONSTANTS } from "@/constants/app";
import { env } from "@/config/env.config";

let io: SocketServer | null = null;

export const initializeSocketServer = (server: HTTPServer) => {
  if (!io) {
    io = new SocketServer(server, {
      cors: {
        origin: env.NEXT_PUBLIC_APP_URL,
        methods: ["GET", "POST"],
      },
    });
    setupSocketHandlers();
  }
  return io;
};

const setupSocketHandlers = () => {
  if (!io) return;

  io.on("connection", (socket) => {
    console.log("Client connected to server");

    socket.on(
      APP_CONSTANTS.SOCKET.EVENTS.AUDIO_CHUNK,
      async (chunk: AudioChunk) => {
        try {
          const verses = await processAudioChunk(chunk);
          if (verses.length > 0) {
            socket.emit(APP_CONSTANTS.SOCKET.EVENTS.VERSES_DETECTED, verses);
          }
        } catch (error) {
          console.error("Server processing error:", error);
          socket.emit(APP_CONSTANTS.SOCKET.EVENTS.ERROR, {
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
