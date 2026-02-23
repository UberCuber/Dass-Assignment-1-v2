import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FiSave, FiKey } from 'react-icons/fi';
import '../Pages.css';

const OrganizerProfile = () => {
    const { user, updateUser } = useAuth();
    const [profile, setProfile] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [resetReason, setResetReason] = useState('');
    const [resetSubmitting, setResetSubmitting] = useState(false);
    const [resetRequests, setResetRequests] = useState([]);

    useEffect(() => {
        api.get('/auth/me').then(res => setProfile(res.data)).finally(() => setLoading(false));
        api.get('/password-reset/my-requests').then(res => setResetRequests(res.data)).catch(() => { });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.put('/auth/profile', {
                organizerName: profile.organizerName,
                description: profile.description,
                category: profile.category,
                contactEmail: profile.contactEmail,
                website: profile.website,
                socialLinks: profile.socialLinks,
            });
            updateUser(res.data);
            toast.success('Profile updated!');
        } catch { toast.error('Failed to update profile'); }
        finally { setSaving(false); }
    };

    const requestPasswordReset = async () => {
        if (!resetReason.trim()) return toast.error('Please provide a reason');
        setResetSubmitting(true);
        try {
            await api.post('/password-reset/request', { reason: resetReason });
            toast.success('Password reset request submitted to admin');
            setResetReason('');
            api.get('/password-reset/my-requests').then(res => setResetRequests(res.data));
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setResetSubmitting(false); }
    };

    if (loading) return <div className="page-container"><div className="loading-container"><div className="spinner"></div></div></div>;

    return (
        <div className="page-container">
            <div className="page-header"><h1>Club Profile</h1></div>
            <div className="profile-grid">
                <div className="detail-card">
                    <h3>Club Information</h3>
                    <div className="form-group"><label>Club Name</label>
                        <input value={profile.organizerName || ''} onChange={e => setProfile({ ...profile, organizerName: e.target.value })} /></div>
                    <div className="form-group"><label>Description</label>
                        <textarea value={profile.description || ''} onChange={e => setProfile({ ...profile, description: e.target.value })} rows={3} /></div>
                    <div className="form-row">
                        <div className="form-group"><label>Category</label>
                            <input value={profile.category || ''} onChange={e => setProfile({ ...profile, category: e.target.value })} placeholder="e.g. Technical" /></div>
                        <div className="form-group"><label>Contact Email</label>
                            <input value={profile.contactEmail || ''} onChange={e => setProfile({ ...profile, contactEmail: e.target.value })} /></div>
                    </div>
                    <div className="form-group"><label>Website</label>
                        <input value={profile.website || ''} onChange={e => setProfile({ ...profile, website: e.target.value })} /></div>
                    <div className="form-group"><label>Email (non-editable)</label>
                        <input value={profile.email || ''} disabled className="input-disabled" /></div>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}><FiSave /> {saving ? 'Saving...' : 'Save Changes'}</button>
                </div>

                <div className="detail-card">
                    <h3><FiKey /> Request Password Reset</h3>
                    <p className="subtitle">Admin will review and generate a new password for you</p>
                    <div className="form-group"><label>Reason for reset</label>
                        <textarea value={resetReason} onChange={e => setResetReason(e.target.value)} rows={2} placeholder="e.g. Forgot password, account compromised..." /></div>
                    <button className="btn btn-primary" onClick={requestPasswordReset} disabled={resetSubmitting}>
                        {resetSubmitting ? 'Submitting...' : 'Submit Request'}
                    </button>

                    {resetRequests.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                            <h4>Previous Requests</h4>
                            {resetRequests.map(r => (
                                <div key={r._id} className="reset-request-item">
                                    <span className={`status-badge status-${r.status}`}>{r.status}</span>
                                    <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                                    <span>{r.reason?.substring(0, 50)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrganizerProfile;
