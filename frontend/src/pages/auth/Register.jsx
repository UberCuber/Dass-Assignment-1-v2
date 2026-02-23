import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
        participantType: 'non-iiit', college: '', contactNumber: ''
    });
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            return toast.error('Passwords do not match');
        }
        if (formData.password.length < 6) {
            return toast.error('Password must be at least 6 characters');
        }
        setLoading(true);
        try {
            const { confirmPassword, ...data } = formData;
            await register(data);
            toast.success('Account created successfully!');
            navigate('/onboarding');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '520px' }}>
                <h2>Join Felicity</h2>
                <p className="subtitle">Create your participant account</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>First Name</label>
                            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" required />
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Participant Type</label>
                        <select name="participantType" value={formData.participantType} onChange={handleChange}>
                            <option value="non-iiit">Non-IIIT Participant</option>
                            <option value="iiit">IIIT Student</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Email {formData.participantType === 'iiit' && <span className="hint">(must be @iiit.ac.in)</span>}</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange}
                            placeholder={formData.participantType === 'iiit' ? 'name@iiit.ac.in' : 'your@email.com'} required />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>College / Organization</label>
                            <input type="text" name="college" value={formData.college} onChange={handleChange} placeholder="Your college" />
                        </div>
                        <div className="form-group">
                            <label>Contact Number</label>
                            <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} placeholder="+91 98765..." />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min 6 characters" required />
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat password" required />
                        </div>
                    </div>

                    <button type="submit" className="btn-auth" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>
                <div className="auth-footer">
                    <p>Already have an account? <Link to="/login">Sign In</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Register;
