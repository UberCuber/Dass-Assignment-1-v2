import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { FiSearch, FiFilter, FiCalendar, FiUsers, FiTrendingUp } from 'react-icons/fi';
import '../Pages.css';

const BrowseEvents = () => {
    const [events, setEvents] = useState([]);
    const [trending, setTrending] = useState([]);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ type: '', eligibility: '', startDate: '', endDate: '', followed: false });
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => { fetchEvents(); fetchTrending(); }, []);

    const fetchEvents = async (params = {}) => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            if (params.search || search) query.set('search', params.search || search);
            if (filters.type) query.set('type', filters.type);
            if (filters.eligibility) query.set('eligibility', filters.eligibility);
            if (filters.startDate) query.set('startDate', filters.startDate);
            if (filters.endDate) query.set('endDate', filters.endDate);
            if (filters.followed) query.set('followed', 'true');
            const res = await api.get(`/events?${query.toString()}`);
            setEvents(res.data.events || []);
        } catch (err) {
            console.error('Failed to fetch events');
        } finally {
            setLoading(false);
        }
    };

    const fetchTrending = async () => {
        try {
            const res = await api.get('/events?trending=true');
            setTrending(res.data.events || []);
        } catch (err) { console.error(err); }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchEvents({ search });
    };

    const applyFilters = () => {
        fetchEvents();
        setShowFilters(false);
    };

    const clearFilters = () => {
        setFilters({ type: '', eligibility: '', startDate: '', endDate: '', followed: false });
        setSearch('');
        fetchEvents({ search: '' });
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Browse Events</h1>
                    <p className="subtitle">Discover and register for upcoming events</p>
                </div>
            </div>

            {/* Trending Section */}
            {trending.length > 0 && (
                <div className="trending-section">
                    <h2 className="section-title"><FiTrendingUp /> Trending Now</h2>
                    <div className="trending-scroll">
                        {trending.map(event => (
                            <Link to={`/events/${event._id}`} key={event._id} className="trending-card">
                                <div className="trending-rank"><FiTrendingUp /></div>
                                <h4>{event.name}</h4>
                                <span className="trending-meta">{event.registrationCount || 0} registrations</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Search & Filters */}
            <div className="search-bar">
                <form onSubmit={handleSearch} className="search-form">
                    <FiSearch className="search-icon" />
                    <input
                        type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search events, organizers..." className="search-input"
                    />
                    <button type="submit" className="btn btn-primary btn-sm">Search</button>
                </form>
                <button className="btn btn-outline btn-sm" onClick={() => setShowFilters(!showFilters)}>
                    <FiFilter /> Filters
                </button>
            </div>

            {showFilters && (
                <div className="filters-panel">
                    <div className="filter-row">
                        <div className="form-group">
                            <label>Event Type</label>
                            <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
                                <option value="">All Types</option>
                                <option value="normal">Normal</option>
                                <option value="merchandise">Merchandise</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Eligibility</label>
                            <select value={filters.eligibility} onChange={e => setFilters({ ...filters, eligibility: e.target.value })}>
                                <option value="">All</option>
                                <option value="all">Open to All</option>
                                <option value="iiit">IIIT Only</option>
                                <option value="non-iiit">Non-IIIT Only</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Start Date</label>
                            <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>End Date</label>
                            <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
                        </div>
                    </div>
                    <div className="filter-actions">
                        <label className="checkbox-label">
                            <input type="checkbox" checked={filters.followed} onChange={e => setFilters({ ...filters, followed: e.target.checked })} />
                            Followed Clubs Only
                        </label>
                        <div>
                            <button className="btn btn-sm btn-outline" onClick={clearFilters}>Clear</button>
                            <button className="btn btn-sm btn-primary" onClick={applyFilters}>Apply</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Events Grid */}
            {loading ? (
                <div className="loading-container"><div className="spinner"></div></div>
            ) : events.length === 0 ? (
                <div className="empty-state">

                    <p>No events found</p>
                </div>
            ) : (
                <div className="card-grid">
                    {events.map(event => (
                        <Link to={`/events/${event._id}`} key={event._id} className="event-card event-card-link">
                            <div className="event-card-header">
                                <span className={`badge badge-${event.type}`}>{event.type}</span>
                                <span className={`status-badge status-${event.status}`}>{event.status}</span>
                            </div>
                            <h3 className="event-card-title">{event.name}</h3>
                            <p className="event-card-desc">{event.description?.substring(0, 100)}...</p>
                            <div className="event-card-meta">
                                <span><FiCalendar /> {new Date(event.startDate).toLocaleDateString()}</span>
                                <span><FiUsers /> {event.organizer?.organizerName}</span>
                            </div>
                            <div className="event-card-footer">
                                <span className="event-fee">
                                    {event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}
                                </span>
                                <span className="event-reg-count">{event.registrationCount || 0} registered</span>
                            </div>
                            {event.tags?.length > 0 && (
                                <div className="event-tags">
                                    {event.tags.slice(0, 3).map(tag => (
                                        <span key={tag} className="tag">{tag}</span>
                                    ))}
                                </div>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BrowseEvents;
