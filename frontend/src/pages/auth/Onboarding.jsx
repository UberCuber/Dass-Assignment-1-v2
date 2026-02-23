import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './Auth.css';

const INTEREST_OPTIONS = [
    'Technology', 'Cultural', 'Sports', 'Music', 'Art', 'Drama',
    'Literature', 'Photography', 'Gaming', 'Robotics', 'AI/ML',
    'Web Development', 'Design', 'Finance', 'Social Service'
];

const Onboarding = () => {
    const [interests, setInterests] = useState([]);
    const [organizers, setOrganizers] = useState([]);
    const [followedOrganizers, setFollowedOrganizers] = useState([]);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const { updateUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/users/organizers').then(res => setOrganizers(res.data)).catch(() => { });
    }, []);

    const toggleInterest = (interest) => {
        setInterests(prev =>
            prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
        );
    };

    const toggleFollow = (id) => {
        setFollowedOrganizers(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await api.post('/auth/onboarding', { interests, followedOrganizers });
            updateUser({ onboardingComplete: true, interests, followedOrganizers });
            toast.success('Preferences saved!');
            navigate('/dashboard');
        } catch (err) {
            toast.error('Failed to save preferences');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        try {
            await api.post('/auth/onboarding', { interests: [], followedOrganizers: [] });
            updateUser({ onboardingComplete: true });
            navigate('/dashboard');
        } catch {
            navigate('/dashboard');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-bg-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
            </div>
            <div className="auth-card auth-card-wide">
                <div className="auth-header">
                    <span className="auth-logo">✨</span>
                    <h1>{step === 1 ? 'What interests you?' : 'Follow Clubs'}</h1>
                    <p>{step === 1 ? 'Select your areas of interest' : 'Follow clubs to get updates'}</p>
                    <div className="step-indicator">
                        <div className={`step-dot ${step >= 1 ? 'active' : ''}`}></div>
                        <div className={`step-dot ${step >= 2 ? 'active' : ''}`}></div>
                    </div>
                </div>

                {step === 1 && (
                    <div className="onboarding-grid">
                        {INTEREST_OPTIONS.map(interest => (
                            <button
                                key={interest}
                                className={`chip ${interests.includes(interest) ? 'chip-selected' : ''}`}
                                onClick={() => toggleInterest(interest)}
                            >
                                {interest}
                            </button>
                        ))}
                    </div>
                )}

                {step === 2 && (
                    <div className="onboarding-list">
                        {organizers.length === 0 ? (
                            <p style={{ color: '#a0a0b8', textAlign: 'center' }}>No clubs available yet</p>
                        ) : (
                            organizers.map(org => (
                                <div
                                    key={org._id}
                                    className={`org-card ${followedOrganizers.includes(org._id) ? 'org-selected' : ''}`}
                                    onClick={() => toggleFollow(org._id)}
                                >
                                    <div className="org-info">
                                        <h4>{org.organizerName}</h4>
                                        <span className="org-category">{org.category}</span>
                                    </div>
                                    <span className="follow-badge">
                                        {followedOrganizers.includes(org._id) ? '✓ Following' : '+ Follow'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                )}

                <div className="onboarding-actions">
                    {step === 2 && (
                        <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
                    )}
                    <button className="btn-skip" onClick={handleSkip}>Skip</button>
                    {step === 1 ? (
                        <button className="auth-btn" onClick={() => setStep(2)}>Next</button>
                    ) : (
                        <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Saving...' : 'Get Started'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
