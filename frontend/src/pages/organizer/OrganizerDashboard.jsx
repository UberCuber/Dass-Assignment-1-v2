import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { FiCalendar, FiUsers, FiDollarSign, FiBarChart2 } from 'react-icons/fi';
import '../Pages.css';

const OrganizerDashboard = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/events?myEvents=true')
            .then(res => setEvents(res.data.events || []))
            .finally(() => setLoading(false));
    }, []);

    const stats = {
        total: events.length,
        published: events.filter(e => e.status === 'published').length,
        ongoing: events.filter(e => e.status === 'ongoing').length,
        completed: events.filter(e => e.status === 'completed').length,
        totalRegistrations: events.reduce((sum, e) => sum + (e.registrationCount || 0), 0),
        totalRevenue: events.reduce((sum, e) => sum + (e.totalRevenue || 0), 0),
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Organizer Dashboard</h1>
                <Link to="/organizer/create-event" className="btn btn-primary">+ Create Event</Link>
            </div>

            <div className="stats-row">
                <div className="stat-card"><div className="stat-number">{stats.total}</div><div className="stat-label">Total Events</div></div>
                <div className="stat-card"><div className="stat-number">{stats.published}</div><div className="stat-label">Published</div></div>
                <div className="stat-card"><div className="stat-number">{stats.ongoing}</div><div className="stat-label">Ongoing</div></div>
                <div className="stat-card"><div className="stat-number">{stats.totalRegistrations}</div><div className="stat-label">Total Registrations</div></div>
                <div className="stat-card"><div className="stat-number">₹{stats.totalRevenue}</div><div className="stat-label">Revenue</div></div>
            </div>

            <h2 className="section-title">Your Events</h2>
            {loading ? (
                <div className="loading-container"><div className="spinner"></div></div>
            ) : events.length === 0 ? (
                <div className="empty-state">

                    <p>You haven't created any events yet</p>
                    <Link to="/organizer/create-event" className="btn btn-primary">Create Your First Event</Link>
                </div>
            ) : (
                <div className="events-carousel">
                    {events.map(event => (
                        <Link to={`/organizer/events/${event._id}`} key={event._id} className="event-card event-card-link">
                            <div className="event-card-header">
                                <span className={`badge badge-${event.type}`}>{event.type}</span>
                                <span className={`status-badge status-${event.status}`}>{event.status}</span>
                            </div>
                            <h3 className="event-card-title">{event.name}</h3>
                            <div className="event-card-meta">
                                <span><FiCalendar /> {new Date(event.startDate).toLocaleDateString()}</span>
                                <span><FiUsers /> {event.registrationCount || 0} registered</span>
                            </div>
                            {event.type === 'merchandise' && (
                                <span className="event-fee"><FiDollarSign /> ₹{event.totalRevenue || 0}</span>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrganizerDashboard;
