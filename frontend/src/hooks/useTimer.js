import { useState, useEffect } from 'react';

export const useTimer = (session) => {
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    if (!session || !session.startTime) {
      setElapsed(0);
      setRemaining(0);
      setIsTimeUp(false);
      return;
    }

    const { isLimit, limitMinutes, modeHistory, status } = session;
    const limitMs = limitMinutes * 60 * 1000;

    const calculateElapsedSeconds = () => {
      let totalMs = 0;
      
      if (modeHistory && modeHistory.length > 0) {
        modeHistory.forEach(mode => {
          const start = new Date(mode.startTime).getTime();
          const end = mode.endTime ? new Date(mode.endTime).getTime() : Date.now();
          totalMs += (end - start);
        });
      } else {
        // Fallback for legacy sessions without modeHistory
        const start = new Date(session.startTime).getTime();
        const end = status === 'Paused' || status === 'Finished' ? new Date(session.updatedAt).getTime() : Date.now();
        totalMs = end - start;
      }

      return Math.floor(totalMs / 1000);
    };

    const updateTime = () => {
      const currentElapsedSeconds = calculateElapsedSeconds();
      setElapsed(currentElapsedSeconds);
      
      if (isLimit) {
        const remainingSeconds = (limitMs / 1000) - currentElapsedSeconds;
        if (remainingSeconds <= 0) {
          setRemaining(0);
          setIsTimeUp(true);
        } else {
          setRemaining(Math.floor(remainingSeconds));
          setIsTimeUp(false);
        }
      }
    };

    updateTime();
    
    let interval;
    if (status === 'Active') {
      interval = setInterval(updateTime, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [session]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0'),
    ].join(':');
  };

  return {
    timeString: formatTime(session?.isLimit ? Math.max(0, remaining) : elapsed),
    isTimeUp: session?.isLimit && isTimeUp
  };
};
