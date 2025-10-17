import { useState, useEffect } from 'react';
import { socket } from '../utils/socket';

export const useMatchTimer = (roomId: string | undefined) => {
  const [timeLeft, setTimeLeft] = useState("Loading...");
  const [isMatchOver, setIsMatchOver] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    // As soon as the hook is used, ask for match details
    socket.emit("getMatchDetails", { roomId });

    // Listen for the server's response with the endTime
    const handleMatchDetails = ({ endTime }: { endTime: number }) => {
      const intervalId = setInterval(() => {
        const remaining = Math.max(0, endTime - Date.now());

        if (remaining === 0) {
          setTimeLeft("00:00");
          setIsMatchOver(true);
          clearInterval(intervalId);
          return;
        }
        const minutes = String(Math.floor(remaining / 60000)).padStart(2, '0');
        const seconds = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');
        setTimeLeft(`${minutes}:${seconds}`);
      }, 500);

      // Return a cleanup function for this specific interval
      return () => clearInterval(intervalId);
    };

    // This is a bit complex: we get the cleanup function from handleMatchDetails
    let cleanupInterval: (() => void) | undefined;
    socket.on("matchDetails", (data) => {
      cleanupInterval = handleMatchDetails(data);
    });
    
    const handleMatchEnd = ({ reason }: { reason: string }) => {
      if (reason === "time_up") {
        setTimeLeft("00:00");
      }
      setIsMatchOver(true);
      socket.emit("deleteRoom", { roomId })
    };

    socket.on("matchEnd", handleMatchEnd);

    // Cleanup socket listeners on unmount
    return () => {
      socket.off("matchDetails");
      socket.off("matchEnd", handleMatchEnd);
      if (cleanupInterval) {
        cleanupInterval();
      }
    };
  }, [roomId]);

  return { timeLeft, isMatchOver };
};