import React, { useState, useEffect } from 'react';
import { Play, Flag, Clock, BookOpen, AlertCircle, Trash2, HelpCircle, Sun, Moon } from 'lucide-react';
import { getFlaggedIds, saveFlaggedIds, getAnsweredIds, saveAnsweredIds } from '../utils';

const WelcomeScreen = ({ onStart, totalQuestions, theme, onToggleTheme }) => {
  const [mode, setMode] = useState('practice');
  const [setType, setSetType] = useState('random');
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [excludedCount, setExcludedCount] = useState(0);

  // Re-fetch counts on mount and when component becomes visible
  useEffect(() => {
    const updateCounts = () => {
      const flagged = getFlaggedIds();
      const answered = getAnsweredIds();
      setFlaggedCount(flagged.length);
      setAnsweredCount(answered.length);

      const distinctExcluded = new Set([...flagged, ...answered]);
      setExcludedCount(distinctExcluded.size);
    };
    updateCounts();

    // Update count when window gains focus (user comes back from exam)
    window.addEventListener('focus', updateCounts);
    return () => window.removeEventListener('focus', updateCounts);
  }, []);

  const resetProgress = () => {
    if (window.confirm('Are you sure you want to reset ALL progress? This will clear all flagged and answered questions.')) {
      saveFlaggedIds([]);
      saveAnsweredIds([]);
      setFlaggedCount(0);
      setAnsweredCount(0);
      setExcludedCount(0);
    }
  };

  const unansweredCount = Math.max(0, totalQuestions - excludedCount);

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 className="title" style={{ fontSize: '2.5rem', margin: 0, textAlign: 'left' }}>Life in the UK Test</h1>
        <button
          onClick={onToggleTheme}
          className="btn btn-secondary"
          style={{ padding: '0.6rem', borderRadius: '50%' }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Master the official test material with our premium practice tool.
      </p>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <button
          className={`btn ${mode === 'practice' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMode('practice')}
          style={{ flexDirection: 'column', padding: '1.5rem' }}
        >
          <BookOpen size={24} />
          <span>Practice Mode</span>
          <span style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: 400 }}>Untimed, instant feedback</span>
        </button>
        <button
          className={`btn ${mode === 'timed' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMode('timed')}
          style={{ flexDirection: 'column', padding: '1.5rem' }}
        >
          <Clock size={24} />
          <span>Exam Mode</span>
          <span style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: 400 }}>90 Minutes, 24 Questions</span>
        </button>
      </div>

      <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Select Question Set</h3>

          {(flaggedCount > 0 || answeredCount > 0) && (
            <button
              className="btn btn-danger"
              onClick={resetProgress}
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              <Trash2 size={16} /> Reset All Progress
            </button>
          )}
        </div>
        <div className="grid">
          <label className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
            <input
              type="radio"
              name="setType"
              checked={setType === 'random'}
              onChange={() => setSetType('random')}
              style={{ marginRight: '1rem' }}
            />
            <span>Random Set (24 Questions)</span>
          </label>

          <label className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
            <input
              type="radio"
              name="setType"
              checked={setType === 'unanswered'}
              onChange={() => setSetType('unanswered')}
              style={{ marginRight: '1rem' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Unanswered Questions</span>
              <span style={{
                background: 'var(--bg-tertiary)',
                padding: '0.2rem 0.5rem',
                borderRadius: '1rem',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                fontWeight: 'bold'
              }}>
                {unansweredCount} left
              </span>
            </div>
          </label>

          <label className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
            <input
              type="radio"
              name="setType"
              checked={setType === 'flagged'}
              onChange={() => setSetType('flagged')}
              style={{ marginRight: '1rem' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Flagged Questions</span>
              <span style={{
                background: 'var(--bg-tertiary)',
                padding: '0.2rem 0.5rem',
                borderRadius: '1rem',
                fontSize: '0.8rem',
                color: flaggedCount > 0 ? 'var(--warning)' : 'var(--text-muted)',
                fontWeight: 'bold'
              }}>
                {flaggedCount} flagged
              </span>
            </div>
          </label>

          <label className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
            <input
              type="radio"
              name="setType"
              checked={setType === 'answered'}
              onChange={() => setSetType('answered')}
              style={{ marginRight: '1rem' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Answered Questions</span>
              <span style={{
                background: 'var(--bg-tertiary)',
                padding: '0.2rem 0.5rem',
                borderRadius: '1rem',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                fontWeight: 'bold'
              }}>
                {answeredCount} answered
              </span>
            </div>
          </label>
        </div>

        {setType === 'answered' && answeredCount < 24 && (
          <div style={{
            marginTop: '0.5rem',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            Only {answeredCount} answered questions. Drawing random questions to complete the set.
          </div>
        )}

        {setType === 'flagged' && flaggedCount < 24 && (
          <div style={{
            marginTop: '0.5rem',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            Drawing {24 - flaggedCount} random questions to complete the set.
          </div>
        )}

        {setType === 'unanswered' && unansweredCount < 24 && (
          <div style={{
            marginTop: '0.5rem',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            Only {unansweredCount} new questions left. Drawing random questions to complete the set.
          </div>
        )}
      </div>

      <button
        className="btn btn-primary"
        style={{ width: '100%', fontSize: '1.2rem', padding: '1rem' }}
        onClick={() => onStart(mode, setType)}
      >
        <Play size={20} fill="currentColor" />
        Start Exam
      </button>

      <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        <p>Total Questions: {totalQuestions} • Answered: {answeredCount} • Progress: {Math.round(answeredCount / totalQuestions * 100)}%</p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
