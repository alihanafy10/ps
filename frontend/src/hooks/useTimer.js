import { useState, useEffect } from 'react';

export const useTimer = (startTime, isLimit = false, limitMinutes = 0) => {
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    if (!startTime) {
      setElapsed(0);
      setRemaining(0);
      setIsTimeUp(false);
      return;
    }

    const start = new Date(startTime).getTime();
    const limitMs = limitMinutes * 60 * 1000;
    const end = start + limitMs;
    
    const updateTime = () => {
      const now = Date.now();
      setElapsed(Math.floor((now - start) / 1000));
      
      if (isLimit) {
        const diff = end - now;
        if (diff <= 0) {
          setRemaining(0);
          setIsTimeUp(true);
        } else {
          setRemaining(Math.floor(diff / 1000));
          setIsTimeUp(false);
        }
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [startTime, isLimit, limitMinutes]);

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
    timeString: formatTime(isLimit ? Math.max(0, remaining) : elapsed),
    isTimeUp: isLimit && isTimeUp
  };
};
