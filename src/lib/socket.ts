"use client";
import { io, Socket } from "socket.io-client";
import { useEffect, useRef, useCallback } from "react";

export function useOddsSocket(
  eventId: string,
  onUpdate: (payload: any) => void
) {
  const socketRef = useRef<Socket | null>(null);

  // optionnel : stabiliser la callback
  const handleUpdate = useCallback(onUpdate, [onUpdate]);

  useEffect(() => {
    const s = io(process.env.NEXT_PUBLIC_API_URL!); // mets ton URL
    socketRef.current = s;

    s.emit("subscribe", eventId);
    s.on("oddsUpdate", handleUpdate);

    return () => {
      s.off("oddsUpdate", handleUpdate);
      s.emit("unsubscribe", eventId);
      s.disconnect();
      socketRef.current = null;
    };
  }, [eventId, handleUpdate]);

  return socketRef; // si tu veux l’utiliser ailleurs
}
