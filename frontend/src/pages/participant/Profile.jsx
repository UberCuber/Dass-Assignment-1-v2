import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FiSave, FiLock } from 'react-icons/fi';
import '../Pages.css';

const INTEREST_OPTIONS = [
    'Technology', 'Cultural', 'Sports', 'Music', 'Art', 'Drama',
    'Literature', 'Photography', 'Gaming', 'Robotics', 'AI/ML',
    'Web Development', 'Design', 'Finance', 'Social Service'
];

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [profile, setProfile] = useState({});
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/me');
            setProfile(res.data);
        } catch { toast.error('Failed to load profile'); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.put('/auth/profile', {
                firstName: profile.firstName,
                lastName: profile.lastName,
                contactNumber: profile.contactNumber,
                college: profile.college,
                interests: profile.interests,
            });
            updateUser(res.data);
            toast.success('Profile updated!');
        } catch (err) { toast.error('Failed to update profile'); }
        finally { setSaving(false); }
    };

    const handlePasswordChange = async () => {
        if (passwords.newPassword !== passwords.confirmPassword) {
            return toast.error('Passwords do not match');
        }
        try {
            await api.put('/auth/change-password', {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword,
            });
            toast.success('Password changed!');
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setShowPasswordForm(false);
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
    };

    const toggleInterest = (interest) => {
        const interests = profile.interests || [];
        setProfile({
            ...profile,
            interests: interests.includes(interest)
                ? interests.filter(i => i !== interest)
                : [...interests, interest]
        });
    };

    if (loading) return <div className="page-container"><div className="loading-container"><div className="spinner"></div></div></div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>My Profile</h1>
            </div>

            <div className="profile-grid">
                <div className="detail-card">
                    <h3>Personal Information</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>First Name</label>
                            <input value={profile.firstName || ''} onChange={e => setProfile({ ...profile, firstName: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            <input value={profile.lastName || ''} onChange={e => setProfile({ ...profile, lastName: e.target.value })} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email <span className="hint">(non-editable)</span></label>
                        <input value={profile.email || ''} disabled className="input-disabled" />
                    </div>

                    <div className="form-group">
                        <label>Participant Type <span className="hint">(non-editable)</span></label>
                        <input value={profile.participantType === 'iiit' ? 'IIIT Student' : 'Non-IIIT'} disabled className="input-disabled" />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>College / Organization</label>
                            <input value={profile.college || ''} onChange={e => setProfile({ ...profile, college: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Contact Number</label>
                            <input value={profile.contactNumber || ''} onChange={e => setProfile({ ...profile, contactNumber: e.target.value })} />
                        </div>
                    </div>
                </div>

                <div className="detail-card">
                    <h3>Interests</h3>
                    <div className="onboarding-grid">
                        {INTEREST_OPTIONS.map(interest => (
                            <button key={interest}
                                className={`chip ${(profile.interests || []).includes(interest) ? 'chip-selected' : ''}`}
                                onClick={() => toggleInterest(interest)}>
                                {interest}
                            </button>
                        ))}
                    </div>
                </div>

                <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ marginTop: '0.5rem' }}>
                    <FiSave /> {saving ? 'Saving...' : 'Save All Changes'}
                </button>

                <div className="detail-card">
                    <h3><FiLock /> Security Settings</h3>
                    {!showPasswordForm ? (
                        <button className="btn btn-outline" onClick={() => setShowPasswordForm(true)}>Change Password</button>
                    ) : (
                        <>
                            <div className="form-group">
                                <label>Current Password</label>
                                <input type="password" value={passwords.currentPassword}
                                    onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <input type="password" value={passwords.newPassword}
                                    onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input type="password" value={passwords.confirmPassword}
                                    onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })} />
                            </div>
                            <div className="form-row">
                                <button className="btn btn-outline" onClick={() => setShowPasswordForm(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handlePasswordChange}>Update Password</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
