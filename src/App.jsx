import React, { useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import ExamScreen from './components/ExamScreen';
import ResultScreen from './components/ResultScreen';
import questionsData from './data/questions.json';
import { shuffleArray, getFlaggedIds, saveFlaggedIds, getAnsweredIds, saveAnsweredIds } from './utils';
import { useEffect } from 'react';

function App() {
  const [view, setView] = useState('welcome');
  const [examState, setExamState] = useState(null);
  const [welcomeKey, setWelcomeKey] = useState(0); // Force re-render of welcome screen

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('life_uk_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('life_uk_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const startExam = (mode, setType) => {
    let selectedQuestions = [];
    const allQuestions = [...questionsData];
    const isFromFlaggedSet = setType === 'flagged';

    if (setType === 'random') {
      selectedQuestions = shuffleArray(allQuestions).slice(0, 24);
    } else if (setType === 'flagged') {
      const flaggedIds = getFlaggedIds();
      // Find the question objects for flagged IDs
      const flaggedQuestions = allQuestions.filter(q => flaggedIds.includes(q.question_id));

      if (flaggedQuestions.length >= 24) {
        selectedQuestions = shuffleArray(flaggedQuestions).slice(0, 24);
      } else {
        // Need to fill
        const needed = 24 - flaggedQuestions.length;
        const otherQuestions = allQuestions.filter(q => !flaggedIds.includes(q.question_id));
        const filled = shuffleArray(otherQuestions).slice(0, needed);
        selectedQuestions = [...flaggedQuestions, ...filled];
      }
    } else if (setType === 'answered') {
      const answeredIds = getAnsweredIds();
      const answeredQuestions = allQuestions.filter(q => answeredIds.includes(q.question_id));

      if (answeredQuestions.length >= 24) {
        selectedQuestions = shuffleArray(answeredQuestions).slice(0, 24);
      } else {
        const needed = 24 - answeredQuestions.length;
        const otherQuestions = allQuestions.filter(q => !answeredIds.includes(q.question_id));
        const filled = shuffleArray(otherQuestions).slice(0, needed);
        selectedQuestions = [...answeredQuestions, ...filled];
      }
    } else if (setType === 'unanswered') {
      const answeredIds = getAnsweredIds();
      const flaggedIds = getFlaggedIds();
      const unansweredQuestions = allQuestions.filter(q => !answeredIds.includes(q.question_id) && !flaggedIds.includes(q.question_id));

      if (unansweredQuestions.length >= 24) {
        selectedQuestions = shuffleArray(unansweredQuestions).slice(0, 24);
      } else {
        // If fewer than 24 unanswered, take all of them and fill with others
        const needed = 24 - unansweredQuestions.length;
        // Get already answered questions to fill the gap
        const answeredQuestionsList = allQuestions.filter(q => answeredIds.includes(q.question_id));
        const filled = shuffleArray(answeredQuestionsList).slice(0, needed);
        selectedQuestions = [...unansweredQuestions, ...filled];
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
