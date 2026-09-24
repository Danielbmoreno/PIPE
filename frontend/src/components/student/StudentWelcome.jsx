import { useEffect, useState } from 'react';
import MotivationalQuote from './MotivationalQuote.jsx';

export default function StudentWelcome({ name, heading: Heading = 'h1' }) {
  const [hour, setHour] = useState(() => new Date().getHours());
  useEffect(() => {
    const timer = window.setInterval(() => setHour(new Date().getHours()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
  return <><Heading>{greeting}, {String(name || 'Bienvenido').trim().split(/\s+/)[0]} <span aria-hidden="true">👋</span></Heading><MotivationalQuote /></>;
}
