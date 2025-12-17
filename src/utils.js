const STORAGE_VERSION = '1.0'; // Increment this when question IDs change
const VERSION_KEY = 'life_uk_version';
const FLAGGED_KEY = 'life_uk_flagged';

export const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const getFlaggedIds = () => {
  // Check version
  const storedVersion = sessionStorage.getItem(VERSION_KEY);
  if (storedVersion !== STORAGE_VERSION) {
    // Version mismatch - clear old data
    sessionStorage.setItem(VERSION_KEY, STORAGE_VERSION);
    sessionStorage.removeItem(FLAGGED_KEY);
    return [];
  }

  const stored = sessionStorage.getItem(FLAGGED_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveFlaggedIds = (ids) => {
  sessionStorage.setItem(VERSION_KEY, STORAGE_VERSION);
  sessionStorage.setItem(FLAGGED_KEY, JSON.stringify(ids));
};

const ANSWERED_KEY = 'life_uk_answered';

export const getAnsweredIds = () => {
  // Check version (using same version logic as flags)
  const storedVersion = sessionStorage.getItem(VERSION_KEY);
  if (storedVersion !== STORAGE_VERSION) {
    sessionStorage.removeItem(ANSWERED_KEY);
    return [];
  }

  const stored = sessionStorage.getItem(ANSWERED_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveAnsweredIds = (ids) => {
  sessionStorage.setItem(VERSION_KEY, STORAGE_VERSION); // Ensure version is set
  sessionStorage.setItem(ANSWERED_KEY, JSON.stringify(ids));
};
