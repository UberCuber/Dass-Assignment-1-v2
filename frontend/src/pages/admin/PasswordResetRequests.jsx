import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { FiCheck, FiX } from 'react-icons/fi';
import '../Pages.css';

const PasswordResetRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/password-reset/requests').then(res => setRequests(res.data)).finally(() => setLoading(false));
    }, []);

    const handleReview = async (id, action) => {
        try {
            const res = await api.put(`/password-reset/requests/${id}`, { action });
            toast.success(action === 'approve' ? `New password: ${res.data.newPassword}` : 'Request rejected');
            api.get('/password-reset/requests').then(res => setRequests(res.data));
        } catch (err) { toast.error('Failed'); }
    };

    return (
        <div className="page-container">
            <div className="page-header"><h1>Password Reset Requests</h1></div>
            {loading ? (
                <div className="loading-container"><div className="spinner"></div></div>
            ) : requests.length === 0 ? (
                <div className="empty-state"><p>No password reset requests</p></div>
            ) : (
                <div className="detail-card">
                    {requests.map(req => (
                        <div key={req._id} className="payment-review-card">
                            <div className="payment-info">
                                <h4>{req.organizer?.organizerName || req.organizer?.email}</h4>
                                <p className="subtitle">Reason: {req.reason}</p>
                                <p className="subtitle">{new Date(req.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="payment-info">
                                <span className={`status-badge status-${req.status}`}>{req.status}</span>
                            </div>
                            {req.status === 'pending' && (
                                <div className="payment-actions">
                                    <button className="btn btn-sm btn-success" onClick={() => handleReview(req._id, 'approve')}><FiCheck /> Approve</button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleReview(req._id, 'reject')}><FiX /> Reject</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PasswordResetRequests;
