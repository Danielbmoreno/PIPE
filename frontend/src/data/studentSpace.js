export const motivationalQuotes = [
  'Hoy también cuenta. Avanza a tu ritmo.',
  'Cada pequeño avance construye algo más grande.',
  'Pedir acompañamiento también es avanzar.',
  'No tienes que hacerlo todo hoy.',
  'Tu proceso importa.',
  'Paso a paso también se llega lejos.',
  'No necesitas tener todo resuelto para continuar.',
  'Tu meta sigue siendo posible.'
];

export const dailyChallenges = [
  'Estudia 20 minutos sin distracciones.',
  'Organiza una actividad pendiente.',
  'Revisa tu próxima cita.',
  'Lee cinco páginas de algo que te guste.',
  'Tómate cinco minutos para descansar.',
  'Escribe una meta para esta semana.',
  'Organiza tu escritorio antes de estudiar.',
  'Haz una pausa y toma agua.'
];

export const minuMessages = [
  '¡Qué bueno verte por aquí! 💙',
  'Vamos paso a paso.',
  'Recuerda revisar tus próximas citas.',
  'Un descanso también hace parte del proceso.',
  'Tómate un respiro si lo necesitas.',
  '¿Ya revisaste tu reto de hoy?'
];

// Local recommendations remain available without any external request.
export const localReadings = [
  { title: 'Aprender a aprender', author: 'Barbara Oakley y Terrence Sejnowski', category: 'Aprendizaje', description: 'Explora maneras de organizar el estudio y acercarte a ideas nuevas.' },
  { title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', category: 'Programación', description: 'Una invitación a comprender la programación a través de ejemplos y ejercicios.' },
  { title: 'Una breve historia de casi todo', author: 'Bill Bryson', category: 'Ciencia', description: 'Un recorrido por las preguntas y los descubrimientos que despiertan curiosidad.' },
  { title: 'Hábitos atómicos', author: 'James Clear', category: 'Productividad', description: 'Ideas para pensar en pequeños hábitos y construir rutinas a tu ritmo.' }
].map((book, index) => ({ ...book, id: `local-${index}`, url: `https://openlibrary.org/search?q=${encodeURIComponent(`${book.title} ${book.author}`)}` }));

export const randomIndex = (length) => Math.floor(Math.random() * length);
export const anotherIndex = (current, length) => length > 1 ? (current + 1 + randomIndex(length - 1)) % length : 0;
