import React, { useState, useMemo } from 'react';
import { X, Search, ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react';
import questionsData from '../data/questions.json';

const SearchSidebar = ({ isOpen, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    const filteredQuestions = useMemo(() => {
        if (!searchTerm.trim() || searchTerm.length < 2) return [];

        const lowerTerm = searchTerm.toLowerCase();
        return questionsData.filter(q =>
            q.question_detail.toLowerCase().includes(lowerTerm) ||
            q.explanation.toLowerCase().includes(lowerTerm)
        );
    }, [searchTerm]);

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(2px)',
                    zIndex: 99,
                }}
                onClick={onClose}
            />

            {/* Sidebar Panel */}
            <div style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: '90%',
                maxWidth: '400px',
                background: 'var(--bg-secondary)',
                borderLeft: '1px solid var(--border)',
                boxShadow: '-4px 0 20px rgba(0,0,0,0.4)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
                {/* Header */}
                <div style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <Search size={20} color="var(--text-muted)" />
                    <input
                        type="text"
                        placeholder="Search questions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            fontSize: '1rem',
                            outline: 'none'
                        }}
                    />
                    <button
                        onClick={onClose}
                        className="btn"
                        style={{ padding: '0.5rem', background: 'transparent', color: 'var(--text-secondary)' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Results List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                    {searchTerm.length < 2 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
                            <Search size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>Type at least 2 characters to search</p>
                        </div>
                    ) : filteredQuestions.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
                            <AlertCircle size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>No matching questions found</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingBottom: '0.5rem' }}>
                                Found {filteredQuestions.length} matches
                            </div>
                            {filteredQuestions.map(q => {
                                const isExpanded = expandedId === q.question_id;

                                return (
                                    <div key={q.question_id} style={{
                                        background: 'var(--bg-primary)',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--border)',
                                        overflow: 'hidden'
                                    }}>
                                        <button
                                            onClick={() => toggleExpand(q.question_id)}
                                            style={{
                                                width: '100%',
                                                padding: '1rem',
                                                textAlign: 'left',
                                                background: 'transparent',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'start',
                                                gap: '1rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <span style={{ fontSize: '0.95rem', lineHeight: '1.4', color: 'var(--text-primary)' }}>
                                                {q.question_detail}
                                            </span>
                                            {isExpanded ?
                                                <ChevronUp size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '4px' }} /> :
                                                <ChevronDown size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '4px' }} />
                                            }
                                        </button>

                                        {isExpanded && (
                                            <div style={{
                                                padding: '0 1rem 1rem 1rem',
                                                borderTop: '1px solid var(--border)',
                                                background: 'var(--bg-tertiary)'
                                            }}>
                                                <div style={{ paddingTop: '1rem', display: 'grid', gap: '0.5rem' }}>
                                                    {q.possible_answers.map((ans, idx) => {
                                                        const isCorrect = q.correct_answers.includes(ans);
                                                        return (
                                                            <div key={idx} style={{
                                                                padding: '0.5rem 0.75rem',
                                                                borderRadius: '0.25rem',
                                                                background: isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0,0,0,0.1)',
                                                                border: isCorrect ? '1px solid var(--success)' : '1px solid transparent',
                                                                color: isCorrect ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                                fontSize: '0.9rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.5rem'
                                                            }}>
                                                                {isCorrect && <CheckCircle size={14} color="var(--success)" />}
                                                                {ans}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                {q.explanation && (
                                                    <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                                        <strong>Explanation:</strong> {q.explanation}
                                                    </div>
                                                )}
                                                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' }}>
                                                    <span style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px' }}>
                                                        {q.category || 'General'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default SearchSidebar;
