import React, { useState, useEffect } from 'react';
import { Play, Flag, Clock, BookOpen, AlertCircle, Trash2, HelpCircle, Sun, Moon, Map, Check } from 'lucide-react';
import { getFlaggedIds, saveFlaggedIds, getAnsweredIds, saveAnsweredIds } from '../utils';
import questionsData from '../data/questions.json';

const CATEGORIES = [
  'UK Values & Principles',
  'History',
  'Geography',
  'Society & Culture',
  'Government & Law'
];

const WelcomeScreen = ({ onStart, totalQuestions, theme, onToggleTheme }) => {
  const [mode, setMode] = useState('practice');
  const [setType, setSetType] = useState('random');
  const [selectedCategories, setSelectedCategories] = useState(['All']);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [excludedCount, setExcludedCount] = useState(0);

  // Calculate category counts
  const categoryCounts = questionsData.reduce((acc, q) => {
    acc[q.category] = (acc[q.category] || 0) + 1;
    return acc;
  }, {});
  categoryCounts['All'] = totalQuestions;

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

  const toggleCategory = (cat) => {
    if (cat === 'All') {
      setSelectedCategories(['All']);
      return;
    }

    let newCategories;
    if (selectedCategories.includes('All')) {
      // If switching from All to specific
      newCategories = [cat];
    } else {
      if (selectedCategories.includes(cat)) {
        newCategories = selectedCategories.filter(c => c !== cat);
      } else {
        newCategories = [...selectedCategories, cat];
      }
    }

    // If nothing selected, revert to All
    if (newCategories.length === 0) {
      newCategories = ['All'];
    }

    setSelectedCategories(newCategories);
  };

  const unansweredCount = Math.max(0, totalQuestions - excludedCount);

  return (
    <div className="card" style={{ maxWidth: '700px', margin: '2rem auto', textAlign: 'center' }}>
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

      {/* Categories Bar */}
      <div style={{ marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
          <button
            onClick={() => toggleCategory('All')}
            className={`btn ${selectedCategories.includes('All') ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', borderRadius: '2rem' }}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`btn ${selectedCategories.includes(cat) ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              {selectedCategories.includes(cat) && <Check size={14} strokeWidth={3} />}
              {cat}
              <span style={{
                marginLeft: '0.4rem',
                background: 'var(--error)',
                color: 'white',
                borderRadius: '0.8rem',
                padding: '0.1rem 0.5rem',
                fontSize: '0.8rem',
                fontWeight: 'inherit',
                minWidth: '20px',
                textAlign: 'center',
                lineHeight: '1'
              }}>
                {categoryCounts[cat] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '1rem',
        padding: '1.5rem',
        border: '1px solid var(--border)',
        marginBottom: '2rem'
      }}>
        <div className="grid" style={{ gap: '1rem', marginBottom: '2rem' }}>
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

        <div style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Select Question Set</h3>

            {(flaggedCount > 0 || answeredCount > 0) && (
              <button
                className="btn btn-danger"
                onClick={resetProgress}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              >
                <Trash2 size={14} /> Reset Progress
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
              <span>Random Set</span>
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
                <span>Unanswered</span>
                <span style={{
                  background: 'var(--bg-tertiary)',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  {unansweredCount}
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
                <span>Flagged</span>
                <span style={{
                  background: 'var(--bg-tertiary)',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  color: flaggedCount > 0 ? 'var(--warning)' : 'inherit',
                  fontWeight: 'bold'
                }}>
                  {flaggedCount}
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
                <span>Answered</span>
                <span style={{
                  background: 'var(--bg-tertiary)',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  {answeredCount}
                </span>
              </div>
            </label>
          </div>

          {/* Helper Texts */}
          {setType === 'answered' && answeredCount < 24 && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={14} /> Only {answeredCount} answered. Drawing random to fill.
            </div>
          )}
          {setType === 'flagged' && flaggedCount < 24 && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={14} /> Only {flaggedCount} flagged. Drawing random to fill.
            </div>
          )}
          {setType === 'unanswered' && unansweredCount < 24 && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={14} /> Only {unansweredCount} left. Drawing random to fill.
            </div>
          )}
        </div>
      </div>

      <button
        className="btn btn-primary"
        style={{ width: '100%', fontSize: '1.2rem', padding: '1rem' }}
        onClick={() => onStart(mode, setType, selectedCategories)}
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
