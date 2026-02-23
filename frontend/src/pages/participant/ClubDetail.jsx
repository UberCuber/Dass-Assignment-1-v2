import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { FiCalendar, FiMail } from 'react-icons/fi';
import '../Pages.css';

const ClubDetail = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/users/organizers/${id}`)
            .then(res => setData(res.data))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="page-container"><div className="loading-container"><div className="spinner"></div></div></div>;
    if (!data) return <div className="page-container"><p>Club not found</p></div>;

    return (
        <div className="page-container">
            <div className="club-detail-header">
                <div className="club-avatar-lg">{data.organizer.organizerName?.charAt(0)}</div>
                <div>
                    <h1>{data.organizer.organizerName}</h1>
                    <span className="club-category">{data.organizer.category}</span>
                    <p>{data.organizer.description}</p>
                    {data.organizer.contactEmail && <p><FiMail /> {data.organizer.contactEmail}</p>}
                </div>
            </div>

            <h2 className="section-title">Upcoming Events</h2>
            {data.upcomingEvents.length === 0 ? (
                <p className="empty-text">No upcoming events</p>
            ) : (
                <div className="card-grid">
                    {data.upcomingEvents.map(event => (
                        <Link to={`/events/${event._id}`} key={event._id} className="event-card event-card-link">
                            <span className={`badge badge-${event.type}`}>{event.type}</span>
                            <h3 className="event-card-title">{event.name}</h3>
                            <span><FiCalendar /> {new Date(event.startDate).toLocaleDateString()}</span>
                        </Link>
                    ))}
                </div>
            )}

            <h2 className="section-title" style={{ marginTop: '2rem' }}>Past Events</h2>
            {data.pastEvents.length === 0 ? (
                <p className="empty-text">No past events</p>
            ) : (
                <div className="card-grid">
                    {data.pastEvents.map(event => (
                        <Link to={`/events/${event._id}`} key={event._id} className="event-card event-card-link" style={{ opacity: 0.7 }}>
                            <span className={`badge badge-${event.type}`}>{event.type}</span>
                            <h3 className="event-card-title">{event.name}</h3>
                            <span><FiCalendar /> {new Date(event.endDate).toLocaleDateString()}</span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClubDetail;
