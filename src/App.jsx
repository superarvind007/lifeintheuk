import React, { useState, useEffect } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import ExamScreen from './components/ExamScreen';
import ResultScreen from './components/ResultScreen';
import questionsData from './data/questions.json';
import { shuffleArray, getFlaggedIds, saveFlaggedIds, getAnsweredIds, saveAnsweredIds } from './utils';
import { Search } from 'lucide-react';
import SearchSidebar from './components/SearchSidebar';

function App() {
  const [view, setView] = useState('welcome');
  const [examState, setExamState] = useState(null);
  const [welcomeKey, setWelcomeKey] = useState(0); // Force re-render of welcome screen
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('life_uk_theme');
    const allowed = ['light', 'dark', 'gradient'];
    return allowed.includes(saved) ? saved : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('life_uk_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const themes = ['light', 'dark', 'gradient'];
    setTheme(prev => {
      const nextIdx = (themes.indexOf(prev) + 1) % themes.length;
      return themes[nextIdx];
    });
  };

  const startExam = (mode, setType, categories = ['All']) => {
    let selectedQuestions = [];
    const allQuestions = [...questionsData];
    const isFromFlaggedSet = setType === 'flagged';

    // 1. Global Filter by Category
    let pool = allQuestions;
    const catsToCheck = Array.isArray(categories) ? categories : [categories];
    // Filter if specific categories selected AND 'All' is not present
    if (catsToCheck.length > 0 && !catsToCheck.includes('All')) {
      pool = allQuestions.filter(q => catsToCheck.includes(q.category));
      // Fallback if pool becomes empty (unlikely with broad categories but safe to have)
      if (pool.length === 0) pool = allQuestions;
    }

    // 2. Select based on setType from the filtered pool
    if (setType === 'random') {
      selectedQuestions = shuffleArray(pool).slice(0, 24);

    } else if (setType === 'flagged') {
      const flaggedIds = getFlaggedIds();
      // Only consider flagged questions that are in our filtered pool (e.g. Flagged + History)
      const flaggedInPool = pool.filter(q => flaggedIds.includes(q.question_id));

      if (flaggedInPool.length >= 24) {
        selectedQuestions = shuffleArray(flaggedInPool).slice(0, 24);
      } else {
        // Fill with other questions FROM THE POOL (same category)
        const needed = 24 - flaggedInPool.length;
        const othersInPool = pool.filter(q => !flaggedIds.includes(q.question_id));

        // If pool is too small (e.g. <24 questions in History total), take what we have
        const filled = shuffleArray(othersInPool).slice(0, needed);
        selectedQuestions = [...flaggedInPool, ...filled];
      }

    } else if (setType === 'answered') {
      const answeredIds = getAnsweredIds();
      const answeredInPool = pool.filter(q => answeredIds.includes(q.question_id));

      if (answeredInPool.length >= 24) {
        selectedQuestions = shuffleArray(answeredInPool).slice(0, 24);
      } else {
        const needed = 24 - answeredInPool.length;
        const othersInPool = pool.filter(q => !answeredIds.includes(q.question_id));
        const filled = shuffleArray(othersInPool).slice(0, needed);
        selectedQuestions = [...answeredInPool, ...filled];
      }

    } else if (setType === 'unanswered') {
      const answeredIds = getAnsweredIds();
      const flaggedIds = getFlaggedIds();
      // Unanswered in pool
      const unansweredInPool = pool.filter(q => !answeredIds.includes(q.question_id) && !flaggedIds.includes(q.question_id));

      if (unansweredInPool.length >= 24) {
        selectedQuestions = shuffleArray(unansweredInPool).slice(0, 24);
      } else {
        const needed = 24 - unansweredInPool.length;
        // Fill with Answered from Pool
        const answeredInPool = pool.filter(q => answeredIds.includes(q.question_id));
        const filled = shuffleArray(answeredInPool).slice(0, needed);
        selectedQuestions = [...unansweredInPool, ...filled];
      }
    }

    // Ensure we have questions (if empty data/flags)
    if (selectedQuestions.length === 0) {
      // Fallback if no questions at all
      selectedQuestions = shuffleArray(allQuestions).slice(0, 24);
    }

    // IMPORTANT: Shuffle possible_answers for each selected question
    // We must clone the objects so we don't mutate the original data
    selectedQuestions = selectedQuestions.map(q => ({
      ...q,
      possible_answers: shuffleArray([...q.possible_answers])
    }));

    setExamState({
      mode,
      questions: selectedQuestions,
      initialFlags: getFlaggedIds(),
      startTime: Date.now(),
      isFromFlaggedSet
    });
    setView('exam');
  };

  const handleSubmit = (data) => {
    // Save answered questions
    if (data.answers) {
      const answeredIds = getAnsweredIds();
      // Get IDs of questions that have at least one answer selected
      const newAnsweredIds = Object.keys(data.answers)
        .filter(qId => data.answers[qId] && data.answers[qId].length > 0)
        .map(Number);

      const mergedAnswered = [...new Set([...answeredIds, ...newAnsweredIds])];
      saveAnsweredIds(mergedAnswered);
    }

    // Flags are already saved in real-time in ExamScreen
    setExamState(prev => ({ ...prev, ...data }));
    setView('result');
  };

  const handleExit = () => {
    setExamState(null);
    setWelcomeKey(prev => prev + 1); // Force re-render to update flag/answered count
    setView('welcome');
  };

  const handleRestart = () => {
    setExamState(null);
    setWelcomeKey(prev => prev + 1); // Force re-render to update flag/answered count
    setView('welcome');
  };

  return (
    <div className="App">
      <SearchSidebar isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Search Floating Button */}
      {view !== 'exam' && (
        <button
          onClick={() => setIsSearchOpen(true)}
          className="btn btn-primary"
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 50,
            padding: 0
          }}
          aria-label="Search Questions"
        >
          <Search size={24} />
        </button>
      )}

      {view === 'welcome' && (
        <WelcomeScreen
          key={welcomeKey}
          onStart={startExam}
          totalQuestions={questionsData.length}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
      {view === 'exam' && examState && (
        <ExamScreen
          mode={examState.mode}
          questions={examState.questions}
          initialFlags={examState.initialFlags}
          initialAnswers={{}}
          onSubmit={handleSubmit}
          onExit={handleExit}
          isFromFlaggedSet={examState.isFromFlaggedSet}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
      {view === 'result' && examState && (
        <ResultScreen
          mode={examState.mode}
          questions={examState.questions}
          answers={examState.answers || {}}
          flaggedIds={examState.flags || []}
          onRestart={handleRestart}
          allQuestions={questionsData}
        />
      )}
    </div>
  );
}

export default App;
