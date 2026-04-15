import { useState, useEffect } from 'react';
import { socket } from '../utils/socket';

export const useMatchTimer = (roomId: string | undefined) => {
  const [timeLeft, setTimeLeft] = useState("Loading...");
  const [isMatchOver, setIsMatchOver] = useState(false);
  const [submissionsLocked, setSubmissionsLocked] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    // As soon as the hook is used, ask for match details
    socket.emit("getMatchDetails", { roomId });

    // Listen for the server's response with the endTime
    const handleMatchDetails = ({ endTime, graceEndTime, isFFA }: { endTime: number, graceEndTime: number | null, isFFA: boolean }) => {
      const intervalId = setInterval(() => {
        const now = Date.now();
        const remainingCoding = Math.max(0, endTime - now);

        if (remainingCoding > 0) {
          // Phase 1: Normal Coding Phase
          const minutes = String(Math.floor(remainingCoding / 60000)).padStart(2, '0');
          const seconds = String(Math.floor((remainingCoding % 60000) / 1000)).padStart(2, '0');
          setTimeLeft(`${minutes}:${seconds}`);
          setSubmissionsLocked(false);
          
        } else if (isFFA && graceEndTime) {
          setSubmissionsLocked(true);
          const remainingGrace = Math.max(0, graceEndTime - now);
          
          if (remainingGrace === 0) {
            setTimeLeft("00:00");
            setIsMatchOver(true);
            clearInterval(intervalId);
            return;
          }

          const minutes = String(Math.floor(remainingGrace / 60000)).padStart(2, '0');
          const seconds = String(Math.floor((remainingGrace % 60000) / 1000)).padStart(2, '0');
          // Update the UI string to let them know coding is over
          setTimeLeft(`Evaluating: ${minutes}:${seconds}`);
        } else {
          setTimeLeft("00:00");
          setIsMatchOver(true);
          setSubmissionsLocked(true);
          clearInterval(intervalId);
        }

      }, 500);

      // Return a cleanup function for this specific interval
      return () => clearInterval(intervalId);
    };

    // This is a bit complex: we get the cleanup function from handleMatchDetails
    let cleanupInterval: (() => void) | undefined;
    socket.on("matchDetails", (data) => {
      cleanupInterval = handleMatchDetails(data);
    });

    const handleCodingTimeUp = () => {
      setSubmissionsLocked(true);
    };
    
    const handleMatchEnd = ({ reason }: { reason: string }) => {
      if (reason === "time_up") {
        setTimeLeft("00:00");
      }
      setIsMatchOver(true);
      setSubmissionsLocked(true);
      socket.emit("deleteRoom", { roomId })
    };

    socket.on("codingTimeUp", handleCodingTimeUp);
    socket.on("matchEnd", handleMatchEnd);

    // Cleanup socket listeners on unmount
    return () => {
      socket.off("matchDetails");
      socket.off("codingTimeUp", handleCodingTimeUp);
      socket.off("matchEnd", handleMatchEnd);
      if (cleanupInterval) {
        cleanupInterval();
      }
    };
  }, [roomId]);

  return { timeLeft, isMatchOver, submissionsLocked };
};