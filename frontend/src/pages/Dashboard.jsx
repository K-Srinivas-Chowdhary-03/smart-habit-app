import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API_URL } from '../App';
import ProgressRing from '../components/ProgressRing';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Check-in modal states
  const [activeCheckInChallenge, setActiveCheckInChallenge] = useState(null);
  const [proof, setProof] = useState('');
  const [checkInLoading, setCheckInLoading] = useState(false);

  const { user, login, updatePoints } = useContext(AuthContext);

  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/progress/user/${user._id}`);
      setStats(data);
      // Sync points in global context in case they changed
      updatePoints(data.points);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve dashboard statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?._id]);

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!activeCheckInChallenge) return;

    setCheckInLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data } = await axios.post(`${API_URL}/progress/log`, {
        challengeId: activeCheckInChallenge._id,
        date: todayStr,
        status: 'Completed',
        proofOfWork: proof
      });

      // Update global context points
      updatePoints(data.points);
      setProof('');
      
      // Close check-in modal in bootstrap
      const modalElement = document.getElementById('checkInModal');
      const closeBtn = modalElement.querySelector('[data-bs-dismiss="modal"]');
      if (closeBtn) closeBtn.click();
      
      // Refresh statistics
      fetchDashboardData();

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error logging check-in');
    } finally {
      setCheckInLoading(false);
      setActiveCheckInChallenge(null);
    }
  };

  // Helper: check if a challenge has been completed today
  const isCompletedToday = (challengeId) => {
    if (!stats || !stats.challengeStats) return false;
    const challenge = stats.challengeStats[challengeId];
    if (!challenge || !challenge.history) return false;

    const todayStr = new Date().toISOString().split('T')[0];
    return challenge.history.some(
      (log) => log.date.split('T')[0] === todayStr && log.status === 'Completed'
    );
  };

  // Gamification formulas
  const calculateLevel = (points) => {
    return Math.floor(Math.sqrt((points || 0) / 100)) + 1;
  };

  const getPointsForNextLevel = (level) => {
    return Math.pow(level, 2) * 100;
  };

  const getPointsForPrevLevel = (level) => {
    return Math.pow(level - 1, 2) * 100;
  };

  const getLevelProgress = (points) => {
    const level = calculateLevel(points);
    const prevLvlPoints = getPointsForPrevLevel(level);
    const nextLvlPoints = getPointsForNextLevel(level);
    const denominator = nextLvlPoints - prevLvlPoints;
    if (denominator === 0) return 0;
    
    const progress = ((points - prevLvlPoints) / denominator) * 100;
    return Math.min(100, Math.max(0, Math.round(progress)));
  };

  const currentLevel = calculateLevel(stats?.points || 0);
  const nextLvlThreshold = getPointsForNextLevel(currentLevel);
  const prevLvlThreshold = getPointsForPrevLevel(currentLevel);
  const levelProgressPercent = getLevelProgress(stats?.points || 0);

  // Helper to generate last 15 calendar days (for history grid)
  const getLast15Days = () => {
    const days = [];
    for (let i = 14; i >= 0; i--) {
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

  const getCategoryBadgeClass = (cat) => {
    switch (cat) {
      case 'Coding': return 'badge-coding';
      case 'Fitness': return 'badge-fitness';
      case 'Reading': return 'badge-reading';
      case 'Meditation': return 'badge-meditation';
      default: return 'bg-secondary';
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Coding': return '#8b5cf6';
      case 'Fitness': return '#f43f5e';
      case 'Reading': return '#10b981';
      case 'Meditation': return '#06b6d4';
      default: return '#6b7280';
    }
  };

  // Calculate daily completion rate: (% of joined challenges completed today)
  const getDailyCompletionRate = () => {
    if (!stats || !user || !user.joinedChallenges || user.joinedChallenges.length === 0) return 0;
    let completedCount = 0;
    user.joinedChallenges.forEach((c) => {
      const id = typeof c === 'object' ? c._id : c;
      if (isCompletedToday(id)) {
        completedCount++;
      }
    });
    return Math.round((completedCount / user.joinedChallenges.length) * 100);
  };

  if (loading && !stats) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      
      {/* 1. OVERVIEW HERO HUD */}
      {stats && (
        <div className="card glass-card p-4 p-md-5 mb-5 border-0 position-relative overflow-hidden">
          


          <div className="row align-items-center g-4">
            
            {/* User Level & Points Progress */}
            <div className="col-lg-7">
              <span className="text-secondary small fw-bold text-uppercase tracking-wider d-block mb-1">HERO STATS</span>
              <h2 className="display-6 text-white brand-font mb-3">Welcome Back, {user?.name}!</h2>
              
              {/* Level HUD */}
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-primary py-1.5 px-3 rounded-pill fw-bold text-uppercase fs-7 shadow">Lvl {currentLevel}</span>
                <span className="text-secondary small">({stats.points} / {nextLvlThreshold} XP)</span>
              </div>

              {/* Progress bar */}
              <div className="progress bg-white bg-opacity-5 mb-2" style={{ height: '10px', borderRadius: '5px' }}>
                <div 
                  className="progress-bar progress-bar-striped progress-bar-animated bg-gradient-purple" 
                  role="progressbar" 
                  style={{ width: `${levelProgressPercent}%`, background: 'linear-gradient(90deg, #8b5cf6, #d946ef)' }} 
                  aria-valuenow={levelProgressPercent} 
                  aria-valuemin="0" 
                  aria-valuemax="100"
                ></div>
              </div>
              <span className="text-secondary small d-block">
                {nextLvlThreshold - stats.points} points needed to level up
              </span>
            </div>

            {/* Quick Stats Grid */}
            <div className="col-lg-5">
              <div className="row g-3">
                {/* Overall Streak Card */}
                <div className="col-6">
                  <div className="bg-dark bg-opacity-40 border border-white-50 border-opacity-5 rounded-4 p-3.5 text-center">
                    <div className="text-warning fs-3 mb-1"><i className="bi bi-fire"></i></div>
                    <span className="text-secondary small d-block mb-1">OVERALL STREAK</span>
                    <span className="h3 text-white fw-black">{stats.overallStreak || 0} Days</span>
                  </div>
                </div>

                {/* Daily Completion Rate */}
                <div className="col-6">
                  <div className="bg-dark bg-opacity-40 border border-white-50 border-opacity-5 rounded-4 p-3.5 text-center">
                    <div className="text-info fs-3 mb-1"><i className="bi bi-calendar-check"></i></div>
                    <span className="text-secondary small d-block mb-1">TODAY'S TARGET</span>
                    <span className="h3 text-white fw-black">{getDailyCompletionRate()}% Done</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. ACTIVE JOINED CHALLENGES */}
      <h2 className="h3 text-white brand-font mb-4">Accepted Challenges</h2>

      {error && (
        <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger p-4 rounded-4 mb-4">
          {error}
        </div>
      )}

      {(!stats?.joinedChallenges || stats.joinedChallenges.length === 0) ? (
        <div className="text-center py-5 glass-card rounded-4 p-5">
          <i className="bi bi-patch-exclamation text-secondary fs-1 mb-3 d-block opacity-25"></i>
          <h4 className="text-white fw-semibold">No challenges accepted.</h4>
          <p className="text-secondary mb-4 small">Build discipline and level up. Explore and accept public or custom challenges to get started.</p>
          <Link to="/explore" className="btn btn-primary px-4 py-2 rounded-pill hover-scale fw-semibold">
            <i className="bi bi-compass-fill me-2"></i>Explore Challenges
          </Link>
        </div>
      ) : (
        <div className="row row-cols-1 g-4">
          {stats.joinedChallenges.map((challengeItem) => {
            const challenge = typeof challengeItem === 'object' ? challengeItem : null;
            if (!challenge) return null;

            const isDoneToday = isCompletedToday(challenge._id);
            const challengeStat = stats.challengeStats[challenge._id] || { streak: 0, percentage: 0, history: [] };
            const categoryColor = getCategoryColor(challenge.category);

            // Calculate if the challenge is scheduled in the future
            const todayMidnight = new Date(new Date().toISOString().split('T')[0]);
            const startMidnight = new Date(new Date(challenge.startDate).toISOString().split('T')[0]);
            const isFuture = startMidnight > todayMidnight;

            return (
              <div className="col" key={challenge._id}>
                <div className="card glass-card p-4">
                  <div className="row align-items-center g-4">
                    
                    {/* SVG Progress Ring */}
                    <div className="col-12 col-md-auto text-center">
                      <ProgressRing 
                        percentage={challengeStat.percentage} 
                        radius={55} 
                        strokeWidth={7} 
                        color={categoryColor}
                      />
                    </div>

                    {/* Challenge Info */}
                    <div className="col-12 col-md-5">
                      <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
                        <span className={`badge ${getCategoryBadgeClass(challenge.category)} py-1 px-2.5 rounded-pill text-uppercase font-display fw-bold small`}>
                          {challenge.category}
                        </span>
                        {isFuture ? (
                          <span 
                            className="badge px-2.5 py-1 border rounded-pill fw-bold small"
                            style={{ 
                              background: 'rgba(245, 158, 11, 0.15)', 
                              borderColor: 'rgba(245, 158, 11, 0.35)', 
                              color: '#fbbf24' 
                            }}
                          >
                            ⏸️ Challenge On Hold
                          </span>
                        ) : challengeStat.streak > 0 ? (
                          <span className="badge bg-warning bg-opacity-10 text-warning px-2 py-1 border border-warning border-opacity-25 rounded-pill fw-bold small">
                            🔥 {challengeStat.streak} Day Streak
                          </span>
                        ) : null}
                        <span className="badge bg-dark bg-opacity-40 text-secondary border border-white-50 border-opacity-10 px-2 py-1 rounded-pill small">
                          ⏱️ {challenge.dailyTargetMinutes || 30} Mins/Day
                        </span>
                      </div>
                      <h3 className="h5 text-white fw-bold mb-1">{challenge.title}</h3>
                      <span className="text-gradient-cyan small fw-semibold d-block mb-2" style={{ fontSize: '12px' }}>
                        📅 {new Date(challenge.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(challenge.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ({challenge.durationInDays} Days)
                      </span>
                      <p className="text-secondary small mb-0 line-clamp-2">{challenge.description}</p>
                    </div>

                    {/* Milestone History Grid (Last 15 days) */}
                    <div className="col-12 col-md-3">
                      <span className="text-secondary small fw-bold d-block mb-2">RECENT HISTORY (15 DAYS)</span>
                      <div className="streak-grid">
                        {getLast15Days().map((dayStr) => {
                          const log = challengeStat.history.find(l => l.date.split('T')[0] === dayStr);
                          const isCompleted = log && log.status === 'Completed';
                          const isMissed = log && log.status === 'Missed';
                          
                          let dotClass = '';
                          if (isCompleted) dotClass = 'completed';
                          else if (isMissed) dotClass = 'missed';

                          return (
                            <div 
                              key={dayStr} 
                              className={`streak-dot ${dotClass}`} 
                              title={`${getDayLabel(dayStr)}: ${log ? log.status : 'Untracked'} ${log?.proofOfWork ? `(${log.proofOfWork})` : ''}`}
                            ></div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="col-12 col-md-2 text-md-end">
                      {isFuture ? (
                        <button
                          className="btn w-100 py-2.5 rounded-3 fw-semibold border-0 btn-on-hold"
                          disabled
                        >
                          <i className="bi bi-pause-circle-fill me-2 fs-5"></i>On Hold
                        </button>
                      ) : isDoneToday ? (
                        <div className="d-flex align-items-center justify-content-md-end gap-2 text-success fw-bold">
                          <i className="bi bi-patch-check-fill fs-4"></i>
                          <span>Logged Today</span>
                        </div>
                      ) : (
                        <button
                          className="btn btn-primary w-100 py-2.5 rounded-3 fw-semibold shadow hover-scale"
                          data-bs-toggle="modal"
                          data-bs-target="#checkInModal"
                          onClick={() => setActiveCheckInChallenge(challenge)}
                        >
                          <i className="bi bi-check2-square me-2"></i>Check In
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DAILY CHECK-IN DRAWER MODAL */}
      <div
        className="modal fade"
        id="checkInModal"
        tabIndex="-1"
        aria-labelledby="checkInModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content glass-card border-0 p-3" style={{ background: 'rgba(15, 12, 27, 0.95)', backdropFilter: 'blur(20px)' }}>
            
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title text-white brand-font fs-3" id="checkInModalLabel">Daily Check-In</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body py-4">
              {activeCheckInChallenge && (
                <>
                  <div className="mb-4">
                    <span className={`badge ${getCategoryBadgeClass(activeCheckInChallenge.category)} py-1 px-2.5 rounded-pill text-uppercase font-display fw-bold mb-2`}>
                      {activeCheckInChallenge.category}
                    </span>
                    <h4 className="text-white fw-bold">{activeCheckInChallenge.title}</h4>
                    <p className="text-secondary small mb-0">{activeCheckInChallenge.description}</p>
                  </div>

                  <form onSubmit={handleCheckInSubmit}>
                    
                    {/* Proof of Work Input */}
                    <div className="mb-4">
                      <label className="form-label text-secondary small fw-medium mb-2">PROOF OF WORK (OPTIONAL)</label>
                      <textarea
                        className="form-control glass-input"
                        rows="3"
                        placeholder="Add a link to git commit, book page numbers, run stats, or a brief note..."
                        value={proof}
                        onChange={(e) => setProof(e.target.value)}
                      ></textarea>
                    </div>

                    <div className="alert bg-success bg-opacity-10 text-success border-0 rounded-3 small py-2.5 px-3 mb-4 d-flex align-items-center gap-2">
                      <i className="bi bi-star-fill text-warning"></i>
                      <span>You will earn **+10 XP points** and advance your streaks!</span>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      className="btn btn-primary w-100 py-2.5 rounded-3 fw-semibold d-flex align-items-center justify-content-center gap-2"
                      disabled={checkInLoading}
                    >
                      {checkInLoading ? (
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                      ) : (
                        <>
                          <span>Verify Completion</span>
                          <i className="bi bi-patch-check-fill"></i>
                        </>
                      )}
                    </button>

                  </form>
                </>
              )}
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
