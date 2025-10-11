// src/hooks/useOddsSocket.ts
"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const WS_BASE = process.env.NEXT_PUBLIC_BACKEND_WS_URL ?? "http://localhost:3000";

export function useOddsSocket(eventId: string, onUpdate: (data: any) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Crée la connexion socket.io
    const socket = io(WS_BASE, {
      transports: ["websocket"],
      reconnection: true,
    });
    socketRef.current = socket;

    // Connexion
    socket.on("connect", () => {
      console.log("✅ Connected to OddsGateway WebSocket");
      socket.emit("subscribe", { eventId });
    });

    // Réception des mises à jour de cotes
    socket.on("odds_update", (payload) => {
      if (payload?.eventId === eventId) {
        onUpdate(payload.data);
      }
    });

    // Déconnexion
    socket.on("disconnect", () => {
      console.log("❌ Disconnected from WebSocket");
    });

    // Cleanup
    return () => {
      socket.emit("unsubscribe", { eventId });
      socket.disconnect();
    };
  }, [eventId, onUpdate]);
}
