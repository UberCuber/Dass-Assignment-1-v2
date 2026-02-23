import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import '../Pages.css';

const Clubs = () => {
    const { user } = useAuth();
    const [organizers, setOrganizers] = useState([]);
    const [followed, setFollowed] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrganizers();
        if (user) {
            api.get('/auth/me').then(res => setFollowed(res.data.followedOrganizers?.map(o => o._id || o) || []));
        }
    }, []);

    const fetchOrganizers = async () => {
        try {
            const res = await api.get('/users/organizers');
            setOrganizers(res.data);
        } catch { toast.error('Failed to load clubs'); }
        finally { setLoading(false); }
    };

    const toggleFollow = async (orgId) => {
        try {
            const res = await api.post(`/users/organizers/${orgId}/follow`);
            if (res.data.following) {
                setFollowed(prev => [...prev, orgId]);
                toast.success('Followed!');
            } else {
                setFollowed(prev => prev.filter(id => id !== orgId));
                toast.info('Unfollowed');
            }
        } catch { toast.error('Action failed'); }
    };

    if (loading) return <div className="page-container"><div className="loading-container"><div className="spinner"></div></div></div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Clubs & Organizers 🏛️</h1>
                <p className="subtitle">Discover and follow your favorite clubs</p>
            </div>
            <div className="card-grid">
                {organizers.map(org => (
                    <div key={org._id} className="club-card">
                        <div className="club-avatar">{org.organizerName?.charAt(0) || '?'}</div>
                        <h3>{org.organizerName}</h3>
                        <span className="club-category">{org.category}</span>
                        <p className="club-desc">{org.description?.substring(0, 100)}</p>
                        <div className="club-actions">
                            <Link to={`/clubs/${org._id}`} className="btn btn-sm btn-outline">View</Link>
                            {user?.role === 'participant' && (
                                <button
                                    className={`btn btn-sm ${followed.includes(org._id) ? 'btn-following' : 'btn-primary'}`}
                                    onClick={() => toggleFollow(org._id)}
                                >
                                    {followed.includes(org._id) ? '✓ Following' : '+ Follow'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Clubs;
