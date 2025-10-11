"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const WS_BASE = process.env.NEXT_PUBLIC_BACKEND_WS_URL ?? "http://localhost:3000";

/**
 * Hook WebSocket pour écouter plusieurs matchs en même temps.
 * @param eventIds - tableau d'IDs des matchs à écouter
 * @param onUpdate - callback déclenchée à chaque mise à jour
 */
export function useMultiOddsSocket(eventIds: string[], onUpdate: (data: any) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!eventIds?.length) return;

    const socket = io(WS_BASE, { transports: ["websocket"], reconnection: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Connected to MultiOddsSocket");
      eventIds.forEach((id) => socket.emit("subscribe", { eventId: id }));
    });

    socket.on("odds_update", (payload) => {
      if (payload?.eventId) onUpdate(payload);
    });

    socket.on("disconnect", () => console.log("❌ Disconnected from WS"));

    return () => {
      eventIds.forEach((id) => socket.emit("unsubscribe", { eventId: id }));
      socket.disconnect();
    };
  }, [JSON.stringify(eventIds), onUpdate]);
}
