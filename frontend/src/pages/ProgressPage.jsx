import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API_URL } from '../App';

export default function ProgressPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selected challenge state for displaying detailed metrics
  const [selectedChallengeId, setSelectedChallengeId] = useState(null);

  const { user } = useContext(AuthContext);

  const fetchProgressData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/progress/user/${user._id}`);
      setStats(data);
      
      // Auto-select the first challenge if available
      const joined = data.joinedChallenges || user.joinedChallenges || [];
      if (joined.length > 0 && !selectedChallengeId) {
        const firstId = typeof joined[0] === 'object' ? joined[0]._id : joined[0];
        setSelectedChallengeId(firstId);
      }
    } catch (err) {
      console.error(err);
      setError('Could not retrieve progress logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressData();
  }, [user?._id]);

  const getCategoryBadgeClass = (cat) => {
    switch (cat) {
      case 'Coding': return 'badge-coding';
      case 'Fitness': return 'badge-fitness';
      case 'Reading': return 'badge-reading';
      case 'Meditation': return 'badge-meditation';
      default: return 'bg-secondary';
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Coding': return <i className="bi bi-code-slash"></i>;
      case 'Fitness': return <i className="bi bi-activity"></i>;
      case 'Reading': return <i className="bi bi-book-half"></i>;
      case 'Meditation': return <i className="bi bi-heptagon-half"></i>;
      default: return <i className="bi bi-lightning-charge"></i>;
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Coding': return '#8b5cf6';
      case 'Fitness': return '#f43f5e';
      case 'Reading': return '#10b981';
      case 'Meditation': return '#06b6d4';
      default: return '#8b5cf6';
    }
  };

  // Helper to generate calendar history blocks
  const getCalendarDays = (duration) => {
    const days = [];
    const limit = Math.min(100, duration || 30);
    for (let i = limit - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const getDayLabel = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const joinedChallenges = stats?.joinedChallenges || user?.joinedChallenges || [];
  const selectedChallenge = joinedChallenges.find(
    c => (typeof c === 'object' ? c._id : c) === selectedChallengeId
  );

  const selectedStats = stats?.challengeStats?.[selectedChallengeId];

  // Calculate if selected challenge is scheduled in the future
  const todayMidnight = new Date(new Date().toISOString().split('T')[0]);
  const selectedStart = selectedChallenge ? new Date(new Date(selectedChallenge.startDate).toISOString().split('T')[0]) : null;
  const isSelectedFuture = selectedChallenge && selectedStart > todayMidnight;

  return (
    <div className="container py-5">
      
      {/* Page Header */}
      <div className="mb-5">
        <h1 className="display-5 text-white brand-font">Habit Progress</h1>
        <p className="text-secondary mb-0">Select any challenge to check your completion ratios and detailed calendar logs.</p>
      </div>

      {loading && !stats ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading progress details...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger p-4 text-center rounded-4">
          {error}
        </div>
      ) : joinedChallenges.length === 0 ? (
        <div className="text-center py-5 glass-card rounded-4 p-5">
          <i className="bi bi-bar-chart-line text-secondary fs-1 mb-3 d-block opacity-25"></i>
          <h4 className="text-white fw-semibold">No Challenges Accepted</h4>
          <p className="text-secondary mb-4 small">Accept a challenge to start tracking your daily progress.</p>
          <Link to="/explore" className="btn btn-primary px-4 py-2 rounded-pill hover-scale fw-semibold">
            <i className="bi bi-compass-fill me-2"></i>Explore Challenges
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          
          {/* LEFT SIDE: CHALLENGE SELECTOR CARDS */}
          <div className="col-lg-5">
            <h3 className="h5 text-secondary fw-bold mb-3">YOUR CHALLENGES</h3>
            <div className="d-flex flex-column gap-3">
              {joinedChallenges.map((challengeItem) => {
                const challenge = typeof challengeItem === 'object' ? challengeItem : null;
                if (!challenge) return null;

                const isSelected = challenge._id === selectedChallengeId;
                const chStat = stats?.challengeStats?.[challenge._id] || { streak: 0, percentage: 0 };

                // Calculate if challenge is scheduled in the future
                const todayMidnightVal = new Date(new Date().toISOString().split('T')[0]);
                const startMidnightVal = new Date(new Date(challenge.startDate).toISOString().split('T')[0]);
                const isCardFuture = startMidnightVal > todayMidnightVal;

                return (
                  <div
                    key={challenge._id}
                    className="card glass-card p-3.5 cursor-pointer hover-scale transition-all"
                    style={{
                      borderLeft: isSelected ? `4px solid ${getCategoryColor(challenge.category)}` : '1px solid var(--glass-border)',
                      background: isSelected ? 'rgba(255, 255, 255, 0.03)' : 'var(--glass-bg)',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedChallengeId(challenge._id)}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className={`badge ${getCategoryBadgeClass(challenge.category)} py-1 px-2.5 rounded-pill text-uppercase font-display fw-bold small mb-2`}>
                          {getCategoryIcon(challenge.category)} {challenge.category}
                        </span>
                        {isCardFuture && (
                          <span 
                            className="badge ms-2 px-2.5 py-1 border rounded-pill small fw-bold"
                            style={{ 
                              background: 'rgba(245, 158, 11, 0.15)', 
                              borderColor: 'rgba(245, 158, 11, 0.35)', 
                              color: '#fbbf24' 
                            }}
                          >
                            On Hold
                          </span>
                        )}
                        <h4 className="h6 text-white fw-bold mb-1">{challenge.title}</h4>
                        <span className="text-secondary small d-block">
                          Target: {challenge.dailyTargetMinutes || 30} Mins/Day
                        </span>
                      </div>
                      <div className="text-end">
                        <span className="h5 text-white fw-black mb-0 d-block">{chStat.percentage}%</span>
                        <span className="text-secondary small">completed</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT SIDE: SELECTED CHALLENGE DETAIL VIEW */}
          <div className="col-lg-7">
            {selectedChallenge ? (
              <div className="card glass-card p-4 p-md-5">
                
                {/* Header Info */}
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <div>
                    <span className={`badge ${getCategoryBadgeClass(selectedChallenge.category)} py-1 px-2.5 rounded-pill text-uppercase font-display fw-bold small mb-2.5`}>
                      {getCategoryIcon(selectedChallenge.category)} {selectedChallenge.category}
                    </span>
                    <h2 className="h3 text-white fw-bold mb-1">{selectedChallenge.title}</h2>
                    <span className="text-gradient-cyan small fw-semibold d-block mb-2" style={{ fontSize: '13px' }}>
                      📅 {new Date(selectedChallenge.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - {new Date(selectedChallenge.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} ({selectedChallenge.durationInDays} Days Total)
                    </span>
                    <p className="text-secondary small mb-0">{selectedChallenge.description}</p>
                  </div>
                </div>

                <hr className="opacity-10 mb-4" />

                {isSelectedFuture ? (
                  <div 
                    className="text-center py-5 rounded-4 p-4 border" 
                    style={{ 
                      background: 'rgba(245, 158, 11, 0.12)', 
                      borderColor: 'rgba(245, 158, 11, 0.35)', 
                      color: '#fbbf24' 
                    }}
                  >
                    <i className="bi bi-pause-circle display-4 mb-3 d-block float-animation" style={{ color: '#fbbf24' }}></i>
                    <h3 className="h5 fw-bold mb-2 text-warning" style={{ color: '#fbbf24' }}>This Challenge is On Hold</h3>
                    <p className="small mb-2" style={{ color: 'var(--bs-heading-color, #ffffff)' }}>
                      The challenge starts on <strong>{new Date(selectedChallenge.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>.
                    </p>
                    <p className="small mb-0 opacity-80" style={{ color: 'var(--bs-body-color, #64748b)' }}>
                      Check-in tracking and consistency progression ratings will unlock once the start date is reached!
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Progress Stats Summary */}
                    <div className="row g-3 mb-4">
                  <div className="col-6 col-sm-4">
                    <div className="bg-dark bg-opacity-35 rounded-3 p-3 border border-white-50 border-opacity-5">
                      <span className="text-secondary small d-block mb-1">COMPLETED DAYS</span>
                      <span className="h4 text-white fw-bold">
                        {selectedStats?.completedCount || 0} / {selectedChallenge.durationInDays} Days
                      </span>
                    </div>
                  </div>
                  <div className="col-6 col-sm-4">
                    <div className="bg-dark bg-opacity-35 rounded-3 p-3 border border-white-50 border-opacity-5">
                      <span className="text-secondary small d-block mb-1">DAILY TARGET</span>
                      <span className="h4 text-gradient-cyan fw-bold">
                        {selectedChallenge.dailyTargetMinutes || 30} Mins
                      </span>
                    </div>
                  </div>
                  <div className="col-12 col-sm-4">
                    <div className="bg-dark bg-opacity-35 rounded-3 p-3 border border-white-50 border-opacity-5">
                      <span className="text-secondary small d-block mb-1">ACTIVE STREAK</span>
                      <span className="h4 text-warning fw-bold">
                        🔥 {selectedStats?.streak || 0} Days
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interactive Glowing Progress Bar */}
                <div className="mb-5">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-secondary small fw-medium">PROGRESS COMPLETION RATE</span>
                    <span className="fw-bold text-white small">{selectedStats?.percentage || 0}%</span>
                  </div>
                  <div className="progress bg-white bg-opacity-5" style={{ height: '14px', borderRadius: '7px' }}>
                    <div
                      className="progress-bar progress-bar-striped progress-bar-animated"
                      role="progressbar"
                      style={{
                        width: `${selectedStats?.percentage || 0}%`,
                        background: `linear-gradient(90deg, ${getCategoryColor(selectedChallenge.category)}, #e0f2fe)`,
                        boxShadow: `0 0 10px ${getCategoryColor(selectedChallenge.category)}`
                      }}
                      aria-valuenow={selectedStats?.percentage || 0}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                </div>

                {/* Milestone history grid */}
                <div>
                  <span className="text-secondary small fw-bold d-block mb-3">
                    CHRONOLOGICAL COMPLETION LOGS ({selectedChallenge.durationInDays} DAYS)
                  </span>
                  <div className="streak-grid bg-dark bg-opacity-20 p-3 rounded-4 border border-white-50 border-opacity-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(28px, 1fr))', gap: '8px' }}>
                    {selectedStats && getCalendarDays(selectedChallenge.durationInDays).map((dayStr) => {
                      const log = selectedStats.history.find(l => l.date.split('T')[0] === dayStr);
                      const isCompleted = log && log.status === 'Completed';
                      const isMissed = log && log.status === 'Missed';
                      
                      let dotClass = '';
                      if (isCompleted) dotClass = 'completed';
                      else if (isMissed) dotClass = 'missed';

                      return (
                        <div
                          key={dayStr}
                          className={`streak-dot ${dotClass}`}
                          style={{ width: '100%', height: '100%', minHeight: '28px', borderRadius: '6px' }}
                          title={`${getDayLabel(dayStr)}: ${log ? log.status : 'Untracked'} ${log?.proofOfWork ? `(${log.proofOfWork})` : ''}`}
                        ></div>
                      );
                    })}
                  </div>
                  <div className="d-flex gap-4 mt-3 justify-content-center text-secondary small">
                    <span className="d-flex align-items-center gap-1.5">
                      <span className="d-inline-block rounded-circle bg-success" style={{ width: '10px', height: '10px' }}></span> Completed
                    </span>
                    <span className="d-flex align-items-center gap-1.5">
                      <span className="d-inline-block rounded-circle bg-danger" style={{ width: '10px', height: '10px' }}></span> Missed
                    </span>
                    <span className="d-flex align-items-center gap-1.5">
                      <span className="d-inline-block rounded-circle bg-secondary bg-opacity-25" style={{ width: '10px', height: '10px' }}></span> Untracked
                    </span>
                  </div>
                </div>
                </>
                )}

              </div>
            ) : (
              <div className="text-center py-5 glass-card rounded-4 p-5">
                <h4 className="text-white">Select a habit to display metrics</h4>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
