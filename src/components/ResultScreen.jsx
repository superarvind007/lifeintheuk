import React, { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, Flag, Home, ChevronDown, ChevronUp } from 'lucide-react';

import { saveFlaggedIds } from '../utils';

const ResultScreen = ({ questions, answers, flaggedIds, onRestart, allQuestions, mode }) => {
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [currentFlags, setCurrentFlags] = useState(new Set(flaggedIds));

  // Calculate score
  let correctCount = 0;
  const questionResults = questions.map(q => {
    const userAns = answers[q.question_id] || [];
    const correctAns = q.correct_answers.sort();
    const userAnsStrings = userAns.map(idx => q.possible_answers[idx]).sort();
    const isCorrect = correctAns.length === userAnsStrings.length &&
      correctAns.every((val, index) => val === userAnsStrings[index]);

    if (isCorrect) correctCount++;

    return { question: q, userAns, isCorrect };
  });

  const percentage = Math.round((correctCount / questions.length) * 100);
  const passed = correctCount >= 18; // 18/24 to pass

  const toggleQuestion = (idx) => {
    setExpandedQuestion(expandedQuestion === idx ? null : idx);
  };

  const handleToggleFlag = (e, qId) => {
    e.stopPropagation(); // Prevent toggling expansion if clicking flag
    const newFlags = new Set(currentFlags);
    if (newFlags.has(qId)) {
      newFlags.delete(qId);
    } else {
      newFlags.add(qId);
    }
    setCurrentFlags(newFlags);
    saveFlaggedIds(Array.from(newFlags));
  };

  return (
    <div className="container" style={{ padding: '1rem' }}>
      {/* Result Summary Card */}
      <div className="card" style={{
        marginBottom: '2rem',
        textAlign: 'center',
        background: passed
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))'
          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
        borderColor: passed ? 'var(--success)' : 'var(--danger)',
        borderWidth: '2px'
      }}>
        <div style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: passed ? 'var(--success)' : 'var(--danger)'
        }}>
          {passed ? '🎉 PASS' : '❌ FAIL'}
        </div>

        <div style={{
          fontSize: '4rem',
          fontWeight: 'bold',
          color: passed ? 'var(--success)' : 'var(--danger)',
          marginBottom: '0.5rem'
        }}>
          {percentage}%
        </div>

        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          You answered <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{correctCount} out of {questions.length}</span> questions correctly.
        </p>

        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
          You need 18 or more correct answers to pass.
        </p>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={onRestart}>
            <RefreshCw size={20} /> Try Again
          </button>
        </div>
      </div>

      {/* Questions Review */}
      {mode === 'timed' ? (
        // Timed mode: Clickable list with expandable details
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>Review Your Answers</h3>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {questionResults.map((result, idx) => {
              const { question: q, userAns, isCorrect } = result;
              const isExpanded = expandedQuestion === idx;
              const isFlagged = flaggedIds.includes(q.question_id);

              return (
                <div key={q.question_id} style={{ marginBottom: '0.5rem' }}>
                  {/* Question Header - Clickable */}
                  <button
                    onClick={() => toggleQuestion(idx)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: isCorrect
                        ? 'rgba(16, 185, 129, 0.1)'
                        : 'rgba(239, 68, 68, 0.15)',
                      border: isCorrect
                        ? '2px solid var(--success)'
                        : '2px solid var(--danger)',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                      <div style={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: isCorrect ? 'var(--success)' : 'var(--danger)',
                        minWidth: '40px'
                      }}>
                        Q{idx + 1}
                      </div>
                      <div style={{ flex: 1, color: 'var(--text-primary)' }}>
                        {q.question_detail.substring(0, 80)}...
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          onClick={(e) => handleToggleFlag(e, q.question_id)}
                          style={{
                            background: 'transparent',
                            padding: '4px',
                            borderRadius: '4px',
                            color: currentFlags.has(q.question_id) ? 'var(--warning)' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            border: '1px solid transparent'
                          }}
                          aria-label={currentFlags.has(q.question_id) ? "Unflag" : "Flag"}
                        >
                          <Flag size={20} fill={currentFlags.has(q.question_id) ? 'currentColor' : 'none'} />
                        </button>
                        {isCorrect
                          ? <CheckCircle size={24} color="var(--success)" />
                          : <XCircle size={24} color="var(--danger)" />
                        }
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="card" style={{
                      marginTop: '0.5rem',
                      background: 'var(--bg-secondary)',
                      borderLeftWidth: '4px',
                      borderLeftColor: isCorrect ? 'var(--success)' : 'var(--danger)'
                    }}>
                      <p style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: '500' }}>
                        {q.question_detail}
                      </p>

                      <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                        {q.possible_answers.map((opt, i) => {
                          const isSelected = userAns.includes(i);
                          const isActuallyCorrect = q.correct_answers.includes(opt);

                          let bg = 'rgba(255,255,255,0.05)';
                          let border = 'transparent';

                          if (isSelected && isActuallyCorrect) {
                            bg = 'rgba(16, 185, 129, 0.2)';
                            border = 'var(--success)';
                          } else if (isSelected && !isActuallyCorrect) {
                            bg = 'rgba(239, 68, 68, 0.2)';
                            border = 'var(--danger)';
                          } else if (!isSelected && isActuallyCorrect) {
                            bg = 'rgba(16, 185, 129, 0.1)';
                            border = 'var(--success)';
                          }

                          return (
                            <div key={i} style={{
                              padding: '0.75rem',
                              borderRadius: '0.5rem',
                              background: bg,
                              border: `1px solid ${border}`,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '4px',
                                border: '2px solid ' + (isSelected || isActuallyCorrect ? border : '#666'),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {isSelected && <div style={{ width: '10px', height: '10px', background: border, borderRadius: '2px' }} />}
                              </div>
                              <span style={{ color: isActuallyCorrect ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                {opt}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div style={{
                        background: 'rgba(51, 65, 85, 0.5)',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)'
                      }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Explanation:</strong> {q.explanation}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // Practice mode: Full details shown
        <div className="grid">
          {questionResults.map((result, idx) => {
            const { question: q, userAns, isCorrect } = result;
            const isFlagged = flaggedIds.includes(q.question_id);

            return (
              <div key={q.question_id} className="card" style={{
                borderColor: isCorrect ? 'var(--success)' : 'var(--danger)',
                borderLeftWidth: '4px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Question {idx + 1}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={(e) => handleToggleFlag(e, q.question_id)}
                      style={{
                        background: 'transparent',
                        padding: '4px',
                        borderRadius: '4px',
                        color: currentFlags.has(q.question_id) ? 'var(--warning)' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: 'none'
                      }}
                      aria-label={currentFlags.has(q.question_id) ? "Unflag" : "Flag"}
                    >
                      <Flag size={20} fill={currentFlags.has(q.question_id) ? 'currentColor' : 'none'} />
                    </button>
                    {isCorrect ? <CheckCircle size={20} color="var(--success)" /> : <XCircle size={20} color="var(--danger)" />}
                  </div>
                </div>

                <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{q.question_detail}</p>

                <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                  {q.possible_answers.map((opt, i) => {
                    const isSelected = userAns.includes(i);
                    const isActuallyCorrect = q.correct_answers.includes(opt);

                    let bg = 'rgba(255,255,255,0.05)';
                    let border = 'transparent';

                    if (isSelected && isActuallyCorrect) {
                      bg = 'rgba(16, 185, 129, 0.2)';
                      border = 'var(--success)';
                    } else if (isSelected && !isActuallyCorrect) {
                      bg = 'rgba(239, 68, 68, 0.2)';
                      border = 'var(--danger)';
                    } else if (!isSelected && isActuallyCorrect) {
                      bg = 'rgba(16, 185, 129, 0.1)';
                      border = 'var(--success)';
                    }

                    return (
                      <div key={i} style={{
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        background: bg,
                        border: `1px solid ${border}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          border: '2px solid ' + (isSelected || isActuallyCorrect ? border : '#666'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {isSelected && <div style={{ width: '10px', height: '10px', background: border, borderRadius: '2px' }} />}
                        </div>
                        <span style={{ color: isActuallyCorrect ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {opt}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div style={{
                  background: 'rgba(51, 65, 85, 0.5)',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)'
                }}>
                  <strong>Explanation:</strong> {q.explanation}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ResultScreen;
