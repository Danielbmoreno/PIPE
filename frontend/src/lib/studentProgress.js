import { dailyChallenges, randomIndex } from '../data/studentSpace.js';

export const localDay = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const previousDay = (date = new Date()) => {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  return localDay(yesterday);
};
export const progressKey = (userId) => `pipe:student-space:v1:${userId}`;

export function readProgress(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}

export function visitProgress(saved, date = new Date(), choose = randomIndex) {
  const day = localDay(date);
  const count = Number.isSafeInteger(saved.streak) && saved.streak > 0 ? saved.streak : 0;
  const streak = saved.lastVisit === day ? Math.max(1, count) : saved.lastVisit === previousDay(date) ? count + 1 : 1;
  const sameChallenge = saved.challengeDay === day && Number.isInteger(saved.challengeIndex) && saved.challengeIndex >= 0 && saved.challengeIndex < dailyChallenges.length;
  return {
    lastVisit: day,
    streak,
    challengeDay: day,
    challengeIndex: sameChallenge ? saved.challengeIndex : choose(dailyChallenges.length),
    completed: sameChallenge && saved.completed === true
  };
}

export function saveProgress(key, progress) {
  try { localStorage.setItem(key, JSON.stringify(progress)); return true; }
  catch { return false; }
}
