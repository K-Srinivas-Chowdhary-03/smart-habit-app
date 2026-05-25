import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext, API_URL } from '../App';

export default function Explore() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Custom Challenge Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Coding');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [dailyTargetMinutes, setDailyTargetMinutes] = useState(30);
  const [createSuccess, setCreateSuccess] = useState('');
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { user, login } = useContext(AuthContext);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/challenges`);
      setChallenges(data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve challenges. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleJoin = async (id) => {
    try {
      const { data } = await axios.post(`${API_URL}/challenges/join/${id}`);
      
      // Update global user joinedChallenges array so button switches to 'Joined' immediately
      if (user) {
        const updatedJoined = [...user.joinedChallenges, id];
        login({ ...user, joinedChallenges: updatedJoined });
      }

      // Update challenge participant counter locally
      setChallenges(prev => 
        prev.map(c => 
          c._id === id ? { ...c, participants: [...c.participants, user._id] } : c
        )
      );

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error joining challenge');
    }
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    if (!title || !description || !category) {
      return setCreateError('Please fill out all fields');
    }

    setCreateError('');
    setCreateSuccess('');
    setCreateLoading(true);

    try {
      const { data } = await axios.post(`${API_URL}/challenges/create`, {
        title,
        description,
        category,
        startDate,
        endDate,
        dailyTargetMinutes: Number(dailyTargetMinutes)
      });

      setCreateSuccess('Habit Challenge successfully created and joined!');
      setTitle('');
      setDescription('');
      setCategory('Coding');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
      setDailyTargetMinutes(30);

      // Refresh challenge list
      fetchChallenges();

      // Automatically update user context since creator automatically joins
      if (user) {
        const updatedJoined = [...user.joinedChallenges, data._id];
        login({ ...user, joinedChallenges: updatedJoined });
      }

      // Hide modal after delay
      setTimeout(() => {
        const modalElement = document.getElementById('createChallengeModal');
        // Simple bootstrap modal closing fallback in plain JS
        const closeBtn = modalElement.querySelector('[data-bs-dismiss="modal"]');
        if (closeBtn) closeBtn.click();
        setCreateSuccess('');
      }, 1500);

    } catch (err) {
      console.error(err);
      setCreateError(err.response?.data?.message || 'Failed to create challenge');
    } finally {
      setCreateLoading(false);
    }
  };

  // Filter Categories
  const categories = ['All', 'Coding', 'Fitness', 'Reading', 'Meditation'];

  const filteredChallenges = challenges.filter((c) => {
    // Only show challenges created by the currently logged-in user
    const isCreatedByMe = c.creator && (c.creator._id === user?._id || c.creator === user?._id);
    if (!isCreatedByMe) return false;

    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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

  return (
    <div className="container py-5">
      
      {/* Header and Floating Action Button */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-5 gap-3">
        <div>
          <h1 className="display-5 text-white brand-font">Explore Habits</h1>
          <p className="text-secondary mb-0">Discover challenges created by the community or forge your own path.</p>
        </div>
        <button
          className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2.5 rounded-pill shadow-lg hover-scale"
          data-bs-toggle="modal"
          data-bs-target="#createChallengeModal"
        >
          <i className="bi bi-plus-circle-fill"></i>
          <span>Create Habit Challenge</span>
        </button>
      </div>

      {/* Search & Category Filter Section */}
      <div className="card glass-card p-4 mb-4">
        <div className="row g-3 align-items-center">
          {/* Keyword Search */}
          <div className="col-lg-4">
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0 text-secondary glass-input px-3">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control glass-input border-start-0 ps-0"
                placeholder="Search habits (e.g. JavaScript, Run)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          {/* Category Tabs */}
          <div className="col-lg-8">
            <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`btn btn-sm px-3.5 py-2 rounded-pill transition-all ${
                    selectedCategory === cat
                      ? 'btn-primary'
                      : 'btn-outline-primary text-secondary border-0 bg-transparent'
                  }`}
                >
                  <span className="d-flex align-items-center gap-1.5">
                    {cat !== 'All' && getCategoryIcon(cat)}
                    <span>{cat}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading challenges...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger text-center p-4 rounded-4">
          {error}
        </div>
      ) : filteredChallenges.length === 0 ? (
        <div className="text-center py-5 glass-card rounded-4 p-5">
          <i className="bi bi-compass text-secondary fs-1 mb-3 d-block opacity-25"></i>
          <h4 className="text-white fw-semibold">No Challenges Found</h4>
          <p className="text-secondary small">Be the first to create a custom challenge in the "{selectedCategory}" category!</p>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {filteredChallenges.map((challenge) => {
            const hasJoined = user?.joinedChallenges?.includes(challenge._id);
            return (
              <div className="col" key={challenge._id}>
                <div className="card glass-card h-100 p-4 d-flex flex-column">
                  
                  {/* Card Header & Badge */}
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <span className={`badge ${getCategoryBadgeClass(challenge.category)} py-1.5 px-3 rounded-pill text-uppercase font-display fw-bold small d-flex align-items-center gap-1`}>
                      {getCategoryIcon(challenge.category)}
                      <span>{challenge.category}</span>
                    </span>
                    <div className="text-secondary small d-flex align-items-center gap-1.5">
                      <i className="bi bi-people-fill"></i>
                      <span>{challenge.participants?.length || 0} active</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <h3 className="h5 text-white fw-bold mb-2">{challenge.title}</h3>
                  <p className="text-secondary small flex-grow-1 line-clamp-3 mb-4">{challenge.description}</p>

                  <hr className="opacity-10 my-3" />

                  {/* Metadata Row */}
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="small col-5">
                      <span className="text-secondary d-block small">SCHEDULE</span>
                      <span className="fw-bold text-white small" style={{ fontSize: '11px' }}>
                        {new Date(challenge.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(challenge.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-secondary d-block small mt-0.5">({challenge.durationInDays} Days)</span>
                    </div>
                    <div className="small text-center col-4">
                      <span className="text-secondary d-block small">DAILY TARGET</span>
                      <span className="fw-bold text-gradient-cyan fs-6">{challenge.dailyTargetMinutes || 30} Mins</span>
                    </div>
                    <div className="small text-end col-3">
                      <span className="text-secondary d-block small">CREATOR</span>
                      <span className="fw-semibold text-white-50 small text-truncate d-block">{challenge.creator?.name || 'Community'}</span>
                    </div>
                  </div>

                  {/* Join Button Action */}
                  <button
                    className={`btn w-100 py-2.5 rounded-3 fw-semibold transition-all ${
                      hasJoined
                        ? 'btn-active-challenge border-0'
                        : 'btn-primary'
                    }`}
                    disabled={hasJoined}
                    onClick={() => handleJoin(challenge._id)}
                  >
                    {hasJoined ? (
                      <span className="d-flex align-items-center justify-content-center gap-1.5">
                        <i className="bi bi-patch-check-fill text-success fs-5"></i>
                        <span>Active Challenge</span>
                      </span>
                    ) : (
                      <span>Join Challenge</span>
                    )}
                  </button>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE CHALLENGE BOOTSTRAP MODAL */}
      <div
        className="modal fade"
        id="createChallengeModal"
        tabIndex="-1"
        aria-labelledby="createChallengeModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content glass-card border-0 p-3" style={{ background: 'rgba(15, 12, 27, 0.95)', backdropFilter: 'blur(20px)' }}>
            
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title text-white brand-font fs-3" id="createChallengeModalLabel">New Habit Challenge</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body py-4">
              {createError && (
                <div className="alert alert-danger bg-danger bg-opacity-10 border-0 text-danger py-2 px-3 rounded-3 small mb-3">
                  {createError}
                </div>
              )}
              {createSuccess && (
                <div className="alert alert-success bg-success bg-opacity-10 border-0 text-success py-2 px-3 rounded-3 small mb-3">
                  {createSuccess}
                </div>
              )}

              <form onSubmit={handleCreateChallenge}>
                {/* Challenge Title */}
                <div className="mb-3">
                  <label className="form-label text-secondary small fw-medium mb-2">CHALLENGE TITLE</label>
                  <input
                    type="text"
                    className="form-control glass-input"
                    placeholder="e.g. 100 Days of Code"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Category Selector */}
                <div className="mb-3">
                  <label className="form-label text-secondary small fw-medium mb-2">CATEGORY</label>
                  <select
                    className="form-select glass-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Coding">Coding</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Reading">Reading</option>
                    <option value="Meditation">Meditation</option>
                  </select>
                </div>

                {/* Start Date & End Date Row */}
                <div className="row mb-3 g-3">
                  <div className="col-6">
                    <label className="form-label text-secondary small fw-medium mb-2">START DATE</label>
                    <input
                      type="date"
                      className="form-control glass-input"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-secondary small fw-medium mb-2">END DATE</label>
                    <input
                      type="date"
                      className="form-control glass-input"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Daily Target Time */}
                <div className="mb-3">
                  <label className="form-label text-secondary small fw-medium mb-2">DAILY TARGET TIME (MINUTES)</label>
                  <input
                    type="number"
                    className="form-control glass-input"
                    min="1"
                    max="1440"
                    value={dailyTargetMinutes}
                    onChange={(e) => setDailyTargetMinutes(e.target.value)}
                    required
                  />
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="form-label text-secondary small fw-medium mb-2">GOAL DESCRIPTION</label>
                  <textarea
                    className="form-control glass-input"
                    rows="3"
                    placeholder="Describe what habits need to be logged daily..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  ></textarea>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2.5 rounded-3 fw-semibold d-flex align-items-center justify-content-center gap-2"
                  disabled={createLoading}
                >
                  {createLoading ? (
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                  ) : (
                    <>
                      <span>Launch Challenge</span>
                      <i className="bi bi-rocket-takeoff-fill"></i>
                    </>
                  )}
                </button>
              </form>
            </div>
            
          </div>
        </div>
      </div>

    </div>
  );
}
