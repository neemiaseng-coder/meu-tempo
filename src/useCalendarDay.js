import { useEffect, useState } from 'react';

const currentDay = () => new Date().toLocaleDateString('en-CA');

export default function useCalendarDay() {
  const [day, setDay] = useState(currentDay);
  useEffect(() => {
    let timer;
    function synchronize() {
      setDay(currentDay());
      clearTimeout(timer);
      const nextMidnight = new Date();
      nextMidnight.setHours(24, 0, 0, 0);
      timer = setTimeout(synchronize, nextMidnight.getTime() - Date.now() + 25);
    }
    synchronize();
    window.addEventListener('focus', synchronize);
    document.addEventListener('visibilitychange', synchronize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', synchronize);
      document.removeEventListener('visibilitychange', synchronize);
    };
  }, []);
  return day;
}
