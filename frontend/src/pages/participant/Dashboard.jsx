import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiCalendar, FiClock, FiTag, FiExternalLink } from 'react-icons/fi';
import '../Pages.css';

const Dashboard = () => {
    const { user } = useAuth();
    const [registrations, setRegistrations] = useState([]);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const fetchRegistrations = async () => {
        try {
            const res = await api.get('/events/my-registrations');
            setRegistrations(res.data);
        } catch (err) {
            console.error('Failed to fetch registrations');
        } finally {
            setLoading(false);
        }
    };

    const now = new Date();

    const categorized = {
        upcoming: registrations.filter(r => r.event && new Date(r.event.startDate) > now && ['registered', 'approved'].includes(r.status)),
        normal: registrations.filter(r => r.event?.type === 'normal' && ['registered', 'approved'].includes(r.status)),
        merchandise: registrations.filter(r => r.event?.type === 'merchandise'),
        completed: registrations.filter(r => r.event?.status === 'completed' || r.status === 'completed'),
        cancelled: registrations.filter(r => ['cancelled', 'rejected'].includes(r.status)),
    };

    const tabs = [
        { key: 'upcoming', label: 'Upcoming', count: categorized.upcoming.length },
        { key: 'normal', label: 'Normal', count: categorized.normal.length },
        { key: 'merchandise', label: 'Merchandise', count: categorized.merchandise.length },
        { key: 'completed', label: 'Completed', count: categorized.completed.length },
        { key: 'cancelled', label: 'Cancelled', count: categorized.cancelled.length },
    ];

    const currentList = categorized[activeTab] || [];

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Welcome back, {user?.firstName || 'there'}</h1>
                    <p className="subtitle">Here's your event activity</p>
                </div>
                <Link to="/events" className="btn btn-primary">Browse Events</Link>
            </div>

            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-number">{registrations.length}</div>
                    <div className="stat-label">Total Registrations</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number">{categorized.upcoming.length}</div>
                    <div className="stat-label">Upcoming Events</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number">{categorized.completed.length}</div>
                    <div className="stat-label">Completed</div>
                </div>
            </div>

            <div className="tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        className={`tab ${activeTab === tab.key ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label} <span className="tab-count">{tab.count}</span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading-container"><div className="spinner"></div></div>
            ) : currentList.length === 0 ? (
                <div className="empty-state">

                    <p>No events in this category</p>
                    <Link to="/events" className="btn btn-primary">Discover Events</Link>
                </div>
            ) : (
                <div className="card-grid">
                    {currentList.map(reg => (
                        <div key={reg._id} className="event-card">
                            <div className="event-card-header">
                                <span className={`badge badge-${reg.event?.type || 'normal'}`}>
                                    {reg.event?.type || 'Event'}
                                </span>
                                <span className={`status-badge status-${reg.status}`}>
                                    {reg.status}
                                </span>
                            </div>
                            <h3 className="event-card-title">{reg.event?.name || 'Event'}</h3>
                            <div className="event-card-meta">
                                <span><FiCalendar /> {reg.event?.startDate ? new Date(reg.event.startDate).toLocaleDateString() : 'N/A'}</span>
                                <span><FiTag /> {reg.event?.organizer?.organizerName || 'Organizer'}</span>
                            </div>
                            {reg.ticketId && (
                                <div className="ticket-info">
                                    <span className="ticket-id">{reg.ticketId}</span>
                                </div>
                            )}
                            <div className="event-card-actions">
                                <Link to={`/events/${reg.event?._id}`} className="btn btn-sm btn-outline">
                                    <FiExternalLink /> View Details
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
