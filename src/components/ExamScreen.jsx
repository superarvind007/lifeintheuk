import React, { useState, useEffect } from 'react';
import { Menu, X, Clock, ChevronLeft, ChevronRight, CheckSquare, Flag, Home, Palette } from 'lucide-react';
import { saveFlaggedIds, getFlaggedIds, getAnsweredIds, saveAnsweredIds } from '../utils';

const ExamScreen = ({ mode, questions, initialFlags, initialAnswers, onSubmit, isFromFlaggedSet, onExit, theme, onToggleTheme }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState(initialAnswers);
  const [flagged, setFlagged] = useState(new Set(initialFlags));
  const [timeLeft, setTimeLeft] = useState(mode === 'timed' ? 45 * 60 : null);
  const [showNav, setShowNav] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track which questions are from the flagged pool (if this is a flagged set exam)
  const [questionsFlaggedStatus, setQuestionsFlaggedStatus] = useState(() => {
    if (isFromFlaggedSet) {
      // Mark which questions were originally flagged
      const status = {};
      questions.forEach(q => {
        status[q.question_id] = initialFlags.includes(q.question_id);
      });
      return status;
    }
    return {};
  });

  const currentQ = questions[currentIdx];
  const requiredCount = currentQ.correct_answers.length;
  const currentAnswers = answers[currentQ.question_id] || [];

  // Check if current answer is correct (for practice mode)
  const checkAnswer = () => {
    if (currentAnswers.length === 0) return null;

    const userAnsStrings = currentAnswers.map(idx => currentQ.possible_answers[idx]).sort();
    const correctAns = currentQ.correct_answers.sort();

    return correctAns.length === userAnsStrings.length &&
      correctAns.every((val, index) => val === userAnsStrings[index]);
  };

  const isCorrect = checkAnswer();

  // Timer for timed mode
  useEffect(() => {
    if (mode === 'timed' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            onSubmit({ answers, flags: Array.from(flagged) });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [mode, timeLeft]);

  // Handle arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      const totalQuestions = questions.length;
      const itemsPerRow = 4;
      const currentRow = Math.floor(currentIdx / itemsPerRow);
      const currentCol = currentIdx % itemsPerRow;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          if (currentIdx < totalQuestions - 1) {
            setCurrentIdx(currentIdx + 1);
            setShowExplanation(false);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (currentIdx > 0) {
            setCurrentIdx(currentIdx - 1);
            setShowExplanation(false);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          const nextRowIdx = (currentRow + 1) * itemsPerRow + currentCol;
          if (nextRowIdx < totalQuestions) {
            setCurrentIdx(nextRowIdx);
            setShowExplanation(false);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (currentRow > 0) {
            const prevRowIdx = (currentRow - 1) * itemsPerRow + currentCol;
            setCurrentIdx(prevRowIdx);
            setShowExplanation(false);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdx, questions.length]);

  const handleToggleOption = (idx) => {
    const currentAnswers = answers[currentQ.question_id] || [];
    let newAnswers = {};

    if (requiredCount === 1) {
      // Single answer: replace
      newAnswers = { ...answers, [currentQ.question_id]: [idx] };
    } else {
      // Multiple answers: toggle
      if (currentAnswers.includes(idx)) {
        newAnswers = { ...answers, [currentQ.question_id]: currentAnswers.filter(i => i !== idx) };
      } else if (currentAnswers.length < requiredCount) {
        newAnswers = { ...answers, [currentQ.question_id]: [...currentAnswers, idx] };
      } else {
        return; // Already at max
      }
    }
    setAnswers(newAnswers);

    // Track answered status globally immediately
    // If the question has at least one answer selected, mark it as answered globally
    const qAnswers = newAnswers[currentQ.question_id];
    if (qAnswers && qAnswers.length > 0) {
      const answeredIds = getAnsweredIds();
      if (!answeredIds.includes(currentQ.question_id)) {
        saveAnsweredIds([...answeredIds, currentQ.question_id]);
      }

      // In practice mode, auto-show explanation when all required answers are selected
      if (mode === 'practice' && qAnswers.length === requiredCount) {
        setShowExplanation(true);
      }
    }
  };

  const toggleFlag = () => {
    const newFlags = new Set(flagged);
    const questionId = currentQ.question_id;

    if (newFlags.has(questionId)) {
      newFlags.delete(questionId);
    } else {
      newFlags.add(questionId);
    }
    setFlagged(newFlags);

    // Save immediately to storage
    saveFlaggedIds(Array.from(newFlags));

    // Update the status if this is a flagged set exam
    if (isFromFlaggedSet) {
      setQuestionsFlaggedStatus(prev => ({
        ...prev,
        [questionId]: newFlags.has(questionId)
      }));
    }
  };

  const handleExit = () => {
    const answeredCount = Object.keys(answers).length;
    const confirmMsg = answeredCount > 0
      ? `You have answered ${answeredCount} question(s). Are you sure you want to exit? Your progress will be lost.`
      : 'Are you sure you want to exit the exam?';

    if (window.confirm(confirmMsg)) {
      onExit();
    }
  };

  const handleSubmit = () => {
    // Check for unanswered or flagged questions
    const total = questions.length;

    // An answer is considered valid if the array of selected indices is not empty
    const answeredCount = questions.filter(q => {
      const qAns = answers[q.question_id];
      return qAns && qAns.length > 0;
    }).length;

    const unansweredCount = total - answeredCount;
    const flaggedCount = flagged.size;

    // Filter flaggedCount to only include flags that are part of the current question set
    const currentSetFlaggedCount = Array.from(flagged).filter(id =>
      questions.some(q => q.question_id === id)
    ).length;

    if (unansweredCount > 0 || currentSetFlaggedCount > 0) {
      let msg = 'Warning:\n';
      if (unansweredCount > 0) msg += `- You have ${unansweredCount} unanswered question(s).\n`;
      if (currentSetFlaggedCount > 0) msg += `- You have ${currentSetFlaggedCount} flagged question(s).\n`;
      msg += '\nAre you sure you want to submit the exam?';

      if (!window.confirm(msg)) {
        return;
      }
    }

    onSubmit({ answers, flags: Array.from(flagged) });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (idx) => {
    if (idx === currentIdx) return 'var(--accent)';
    const q = questions[idx];
    const ans = answers[q.question_id] || [];

    // In flagged set mode, show different colors
    if (isFromFlaggedSet) {
      const wasOriginallyFlagged = questionsFlaggedStatus[q.question_id];
      const isCurrentlyFlagged = flagged.has(q.question_id);

      if (wasOriginallyFlagged && isCurrentlyFlagged) {
        // Still flagged (orange/warning)
        return 'var(--warning)';
      } else if (wasOriginallyFlagged && !isCurrentlyFlagged) {
        // Was flagged, now unflagged (green - resolved)
        return 'var(--success)';
      } else if (!wasOriginallyFlagged) {
        // Random filler question (gray)
        return ans.length > 0 ? 'var(--bg-tertiary)' : '#475569';
      }
    }

    // Normal mode
    if (flagged.has(q.question_id)) return 'var(--warning)';
    if (ans.length > 0) return 'var(--success)';
    return 'var(--bg-tertiary)';
  };

  const getOptionStyle = (idx) => {
    const isSelected = currentAnswers.includes(idx);
    const isCorrectOption = currentQ.correct_answers.includes(currentQ.possible_answers[idx]);

    // In practice mode with explanation shown
    if (mode === 'practice' && showExplanation && currentAnswers.length > 0) {
      if (isSelected && isCorrectOption) {
        return {
          background: 'rgba(16, 185, 129, 0.2)',
          border: '2px solid var(--success)',
          color: 'white'
        };
      } else if (isSelected && !isCorrectOption) {
        return {
          background: 'rgba(239, 68, 68, 0.2)',
          border: '2px solid var(--danger)',
          color: 'white'
        };
      } else if (!isSelected && isCorrectOption) {
        return {
          background: 'rgba(16, 185, 129, 0.1)',
          border: '2px solid var(--success)',
          color: 'var(--text-secondary)'
        };
      }
    }

    // Normal state (timed mode or before answer in practice)
    return {
      background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.03)',
      border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)'
    };
  };

  // Get description for flagged set mode
  const getFlagStatusText = () => {
    if (!isFromFlaggedSet) return null;

    const wasOriginallyFlagged = questionsFlaggedStatus[currentQ.question_id];
    const isCurrentlyFlagged = flagged.has(currentQ.question_id);

    if (wasOriginallyFlagged && isCurrentlyFlagged) {
      return { text: 'From flagged pool', color: 'var(--warning)' };
    } else if (wasOriginallyFlagged && !isCurrentlyFlagged) {
      return { text: 'Unflagged (will return to main pool)', color: 'var(--success)' };
    } else {
      return { text: 'Random filler question', color: 'var(--text-muted)' };
    }
  };

  const flagStatusText = getFlagStatusText();

  const [shake, setShake] = useState(false);

  const handleNext = () => {
    const requiredCount = currentQ.correct_answers.length;
    const currentAns = answers[currentQ.question_id] || [];

    // If user has selected SOME answers but not ALL required ones, block them
    if (currentAns.length > 0 && currentAns.length < requiredCount) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setShowExplanation(false);
    setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1));
  };

  // Helper to determine text color based on background status
  const getTextColor = (idx) => {
    // Current question (Active/Blue) or Flagged (Orange) or Answered (Green) -> White text is best
    if (idx === currentIdx) return 'white';

    const q = questions[idx];
    const ans = answers[q.question_id] || [];

    // Check specific conditions that return colorful backgrounds
    if (isFromFlaggedSet) {
      const wasOriginallyFlagged = questionsFlaggedStatus[q.question_id];
      // If it has a color status, return white
      if (wasOriginallyFlagged) return 'white';
      // If random/unflagged, it might be grey
    }

    if (flagged.has(q.question_id)) return 'white'; // Warning (Orange)
    if (ans.length > 0) return 'white'; // Success (Green)

    // Default case: bg-tertiary (Unanswered/Unvisited)
    // In Dark Mode: bg-tertiary is dark -> Text should be light (primary)
    // In Light Mode: bg-tertiary is light -> Text should be dark (primary)
    return 'var(--text-primary)';
  };

  return (
    <div className="container" style={{ padding: 0, maxWidth: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header className="header" style={{ padding: '1rem 2rem', background: 'var(--bg-secondary)', marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowNav(!showNav)}
            aria-label={showNav ? 'Close question navigator' : 'Open question navigator'}
            aria-expanded={showNav}
          >
            {showNav ? <X size={20} aria-hidden="false" /> : <Menu size={20} aria-hidden="false" />}
            <span style={{ display: 'none', '@media (min-width: 768px)': { display: 'inline' } }}>Review</span>
          </button>
          <div className="title" style={{ fontSize: '1.2rem' }} role="status" aria-live="polite">
            Question {currentIdx + 1} <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>/ {questions.length}</span>
          </div>
          {flagStatusText && (
            <span style={{ fontSize: '0.85rem', color: flagStatusText.color, fontWeight: 500 }} role="status">
              • {flagStatusText.text}
            </span>
          )}
        </div>

        {mode === 'timed' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: timeLeft < 300 ? 'var(--danger)' : 'var(--text-primary)',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            marginRight: '1rem'
          }} role="status" aria-live="polite" aria-label={`Time remaining: ${formatTime(timeLeft)}`}>
            <Clock size={20} aria-hidden="false" />
            {formatTime(timeLeft)}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={onToggleTheme}
            className="btn"
            style={{
              padding: '0.5rem',
              borderRadius: '50%',
              background: 'transparent',
              color: 'var(--text-secondary)'
            }}
            title={`Switch Theme (Current: ${theme.charAt(0).toUpperCase() + theme.slice(1)})`}
            aria-label="Switch Theme"
          >
            <Palette size={20} aria-hidden="false" />
          </button>

          <button
            className="btn"
            onClick={toggleFlag}
            aria-label={flagged.has(currentQ.question_id) ? 'Unflag this question' : 'Flag this question for review'}
            style={{
              backgroundColor: flagged.has(currentQ.question_id) ? 'var(--warning)' : 'transparent',
              color: flagged.has(currentQ.question_id) ? '#1e293b' : 'var(--text-muted)',
              fontWeight: flagged.has(currentQ.question_id) ? '600' : 'normal',
              padding: '0.5rem 1rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Flag size={20} fill={flagged.has(currentQ.question_id) ? 'currentColor' : 'none'} aria-hidden="false" />
            {flagged.has(currentQ.question_id) ? 'Flagged' : 'Flag'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* Mobile Overlay */}
        <div
          className={`sidebar-overlay ${showNav ? 'visible' : ''}`}
          onClick={() => setShowNav(false)}
          role="presentation"
          aria-hidden="false"
        />

        {/* Question Navigation Sidebar (Collapsible) */}
        <div className={`sidebar ${showNav ? 'open' : ''}`} style={{ minWidth: isMobile ? '0' : 'auto' }} role="navigation" aria-label="Question navigator">
          {/* Exit Button at Top */}
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
            <button
              className="btn btn-danger"
              onClick={handleExit}
              style={{ width: '100%', justifyContent: 'center' }}
              aria-label="Exit exam and return to home"
            >
              <Home size={18} aria-hidden="false" /> Exit Exam
            </button>
          </div>

          {/* Desktop Grid - 4 columns */}
          <div style={{
            padding: '1rem',
            display: !isMobile ? 'grid' : 'none',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.5rem'
          }} role="group" aria-label="Question selector grid">
            {questions.map((q, idx) => {
              const isFlagged = flagged.has(q.question_id);
              const hasAnswered = (answers[q.question_id] || []).length > 0;

              let statusText = "Unanswered";
              if (idx === currentIdx) statusText = "Current Question";
              else if (isFlagged) statusText = "Flagged";
              else if (hasAnswered) statusText = "Answered";

              return (
                <button
                  key={q.question_id}
                  onClick={() => {
                    setCurrentIdx(idx);
                    if (isMobile) setShowNav(false);
                    setShowExplanation(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setCurrentIdx(idx);
                      if (isMobile) setShowNav(false);
                      setShowExplanation(false);
                    }
                  }}
                  aria-label={`Question ${idx + 1}: ${statusText}`}
                  aria-current={idx === currentIdx ? 'true' : undefined}
                  style={{
                    aspectRatio: '1',
                    background: getStatusColor(idx),
                    color: getTextColor(idx),
                    borderRadius: '0.5rem',
                    border: idx === currentIdx ? '2px solid var(--accent)' : 'none',
                    fontWeight: 'bold',
                    position: 'relative',
                    cursor: 'pointer',
                    boxShadow: idx === currentIdx ? '0 0 0 2px var(--bg-secondary), 0 0 0 4px var(--accent)' : 'none',
                    fontSize: '0.9rem'
                  }}
                >
                  {idx + 1}
                  {isFlagged && idx !== currentIdx && (
                    <div style={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      width: 8,
                      height: 8,
                      background: 'var(--warning)',
                      borderRadius: '50%'
                    }} aria-hidden="false" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile List - Compact */}
          <div style={{
            padding: '1rem',
            display: isMobile ? 'flex' : 'none',
            flexDirection: 'column',
            gap: '0.5rem',
            maxHeight: '70vh',
            overflowY: 'auto'
          }} role="group" aria-label="Question list">
            {questions.map((q, idx) => {
              const isFlagged = flagged.has(q.question_id);
              const hasAnswered = (answers[q.question_id] || []).length > 0;

              let statusText = "Unanswered";
              let statusIcon = '';
              if (idx === currentIdx) {
                statusText = "Current";
                statusIcon = '●';
              } else if (isFlagged) {
                statusText = "Flagged";
                statusIcon = '⚡';
              } else if (hasAnswered) {
                statusText = "Answered";
                statusIcon = '✓';
              }

              return (
                <button
                  key={q.question_id}
                  onClick={() => {
                    setCurrentIdx(idx);
                    setShowNav(false);
                    setShowExplanation(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setCurrentIdx(idx);
                      setShowNav(false);
                      setShowExplanation(false);
                    }
                  }}
                  aria-label={`Question ${idx + 1}: ${statusText}`}
                  aria-current={idx === currentIdx ? 'true' : undefined}
                  style={{
                    padding: '0.75rem',
                    background: getStatusColor(idx),
                    color: getTextColor(idx),
                    borderRadius: '0.5rem',
                    border: idx === currentIdx ? '2px solid var(--accent)' : '1px solid var(--border)',
                    fontWeight: idx === currentIdx ? 'bold' : 'normal',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.9rem'
                  }}
                >
                  <span>Q{idx + 1}</span>
                  <span aria-hidden="false">{statusIcon}</span>
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 'auto', padding: '1rem' }}>
            {isFromFlaggedSet ? (
              <>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  Flagged Set Mode
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: 12, height: 12, background: 'var(--warning)', borderRadius: 2 }}></div> Flagged
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: 12, height: 12, background: 'var(--success)', borderRadius: 2 }}></div> Resolved
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem' }}>
                  <div style={{ width: 12, height: 12, background: '#475569', borderRadius: 2 }}></div> Random
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: 12, height: 12, background: 'var(--success)', borderRadius: 2 }}></div> Answered
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: 12, height: 12, background: 'var(--warning)', borderRadius: 2 }}></div> Flagged
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem' }}>
                  <div style={{ width: 12, height: 12, background: 'var(--bg-tertiary)', borderRadius: 2 }}></div> Unanswered
                </div>
              </>
            )}
          </div>

          <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-primary" onClick={handleSubmit} style={{ width: '100%', justifyContent: 'center' }} aria-label="Submit exam">
              Submit Exam <CheckSquare size={18} aria-hidden="false" />
            </button>
          </div>
        </div>

        {/* Question Area */}
        <div className="exam-content">
          <div className={`card ${shake ? 'shake' : ''}`} style={{ maxWidth: '800px', width: '100%', margin: '0 auto', transition: 'border-color 0.3s' }}>
            <div style={{
              display: 'inline-block',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              padding: '0.25rem 0.75rem',
              borderRadius: '0.4rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '1rem'
            }}>
              {currentQ.category}
            </div>
            <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              {currentQ.question_detail}
            </p>

            <p style={{
              color: shake ? 'var(--danger)' : 'var(--accent)',
              fontSize: '0.9rem',
              marginBottom: '1rem',
              fontWeight: 600,
              transition: 'color 0.3s'
            }}>
              {requiredCount > 1 ? `Select ${requiredCount} answers` : 'Select 1 answer'}
              {shake && ` (Please select ${requiredCount - (answers[currentQ.question_id] || []).length} more)`}
            </p>

            <div style={{ display: 'grid', gap: '0.8rem' }}>
              {currentQ.possible_answers.map((opt, idx) => {
                const isSelected = currentAnswers.includes(idx);
                const optStyle = getOptionStyle(idx);

                return (
                  <button
                    key={idx}
                    onClick={() => handleToggleOption(idx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggleOption(idx);
                      }
                    }}
                    className="option-btn"
                    aria-label={`${isSelected ? 'Selected: ' : ''}${opt}`}
                    aria-pressed={isSelected}
                    style={{
                      textAlign: 'left',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      ...optStyle,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: requiredCount > 1 ? '4px' : '50%',
                      border: isSelected ? '6px solid var(--accent)' : '2px solid var(--text-muted)',
                      flexShrink: 0
                    }} aria-hidden="true" />
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Show explanation in practice mode after answering */}
            {mode === 'practice' && showExplanation && (
              <div style={{
                marginTop: '1.5rem',
                background: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: isCorrect ? '1px solid var(--success)' : '1px solid var(--danger)',
                padding: '1rem',
                borderRadius: '0.5rem',
                fontSize: '0.95rem'
              }}>
                <div style={{
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                  color: isCorrect ? 'var(--success)' : 'var(--danger)',
                  fontSize: '1.1rem'
                }}>
                  {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  <strong>Explanation:</strong> {currentQ.explanation}
                </div>
              </div>
            )}
          </div>

          <div style={{
            maxWidth: '800px',
            margin: '2rem auto 0',
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%'
          }}>
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
              disabled={currentIdx === 0}
              aria-label={`Previous question (Question ${Math.max(1, currentIdx)} of ${questions.length})`}
            >
              <ChevronLeft size={20} aria-hidden="false" /> Previous
            </button>

            {currentIdx === questions.length - 1 ? (
              <button className="btn btn-primary" onClick={handleSubmit} aria-label="Submit exam">
                Submit Exam <CheckSquare size={20} aria-hidden="false" />
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleNext}
                aria-label={`Next question (Question ${currentIdx + 2} of ${questions.length})`}
              >
                Next <ChevronRight size={20} aria-hidden="false" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamScreen;
