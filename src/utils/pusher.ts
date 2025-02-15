import PusherClient from "pusher-js";
import PusherServer from "pusher";
import { env } from "@/config/env.config";

// Singleton pattern for client-side Pusher instance
declare global {
  // eslint-disable-next-line no-var
  var pusherClient: PusherClient | undefined;
}

// Track subscribed channels
const subscribedChannels = new Set<string>();

export const pusherClient =
  global.pusherClient ||
  new PusherClient(env.client.PUSHER_KEY, {
    cluster: env.client.PUSHER_CLUSTER,
    forceTLS: true,
    enabledTransports: ["ws", "wss"],
  });

// Add connection event handlers
pusherClient.connection.bind("connected", () => {
  console.log("✅ Pusher connected successfully");
});

pusherClient.connection.bind("error", (err: Error & { data?: unknown }) => {
  // Ignore "Existing subscription" errors
  if (err.data && typeof err.data === "object" && "message" in err.data) {
    const message = (err.data as { message: string }).message;
    if (message.includes("Existing subscription")) {
      return;
    }
  }
  console.error("❌ Pusher connection error:", err);
});

pusherClient.connection.bind("disconnected", () => {
  console.log("⚠️ Pusher disconnected");
  // Clear subscribed channels on disconnect
  subscribedChannels.clear();
});

pusherClient.connection.bind("connecting", () => {
  console.log("🔄 Pusher connecting...");
});

if (process.env.NODE_ENV !== "production") {
  global.pusherClient = pusherClient;
}

// Server-side Pusher instance
export const pusherServer = new PusherServer({
  appId: env.server.PUSHER_APP_ID,
  key: env.client.PUSHER_KEY,
  secret: env.server.PUSHER_SECRET,
  cluster: env.client.PUSHER_CLUSTER,
  useTLS: true,
});

// Channel and event names
export const PUSHER_CHANNELS = {
  VERSES: "verses",
} as const;

export const PUSHER_EVENTS = {
  VERSE_DETECTED: "verse:detected",
  AUDIO_CHUNK: "audio:chunk",
  ERROR: "error",
} as const;

// Helper function to safely subscribe to a channel
export function safeSubscribe(channelName: string) {
  if (subscribedChannels.has(channelName)) {
    console.log(`Already subscribed to channel: ${channelName}`);
    return pusherClient.channel(channelName);
  }

  const channel = pusherClient.subscribe(channelName);
  subscribedChannels.add(channelName);
  return channel;
}

// Helper function to safely unsubscribe from a channel
export function safeUnsubscribe(channelName: string) {
  if (subscribedChannels.has(channelName)) {
    pusherClient.unsubscribe(channelName);
    subscribedChannels.delete(channelName);
  }
}
