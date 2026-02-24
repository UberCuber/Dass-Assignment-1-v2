import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import DiscussionForum from '../../components/DiscussionForum';
import { FiCalendar, FiMapPin, FiUsers, FiDollarSign, FiClock, FiTag, FiDownload } from 'react-icons/fi';
import '../Pages.css';

const EventDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [formResponses, setFormResponses] = useState({});
    const [merchSelections, setMerchSelections] = useState([]);
    const [paymentProof, setPaymentProof] = useState(null);
    const [existingReg, setExistingReg] = useState(null);
    const [showRegForm, setShowRegForm] = useState(false);
    const [feedback, setFeedback] = useState({ rating: 5, comment: '' });
    const [feedbackData, setFeedbackData] = useState(null);

    // Calculate total amount for merchandise
    const calculateTotal = () => {
        let total = event?.registrationFee || 0;
        if (event?.type === 'merchandise') {
            merchSelections.forEach(selection => {
                total += selection.price * selection.quantity;
            });
        }
        return total;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be under 5MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => setPaymentProof(reader.result);
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        fetchEvent();
        checkExistingRegistration();
        fetchFeedback();
    }, [id]);

    const fetchEvent = async () => {
        try {
            const res = await api.get(`/events/${id}`);
            setEvent(res.data);
        } catch { toast.error('Event not found'); navigate('/events'); }
        finally { setLoading(false); }
    };

    const checkExistingRegistration = async () => {
        try {
            const res = await api.get('/events/my-registrations');
            const reg = res.data.find(r => r.event?._id === id);
            if (reg) setExistingReg(reg);
        } catch { }
    };

    const fetchFeedback = async () => {
        try {
            const res = await api.get(`/feedback/${id}`);
            setFeedbackData(res.data);
        } catch { }
    };

    const canRegister = () => {
        if (!event) return false;
        if (existingReg) return false;
        if (event.status !== 'published' && event.status !== 'ongoing') return false;
        if (new Date() > new Date(event.registrationDeadline)) return false;
        if (event.registrationLimit > 0 && event.registrationCount >= event.registrationLimit) return false;
        return true;
    };

    const getBlockReason = () => {
        if (existingReg) return 'You are already registered';
        if (event?.status === 'draft') return 'Event not yet published';
        if (event?.status === 'completed' || event?.status === 'closed') return 'Event has ended';
        if (new Date() > new Date(event?.registrationDeadline)) return 'Registration deadline passed';
        if (event?.registrationLimit > 0 && event?.registrationCount >= event?.registrationLimit) return 'Registration limit reached';
        return null;
    };

    const handleRegister = async () => {
        setRegistering(true);
        try {
            const data = {};
            if (event.type === 'normal' && event.customForm?.length > 0) {
                data.formResponses = Object.entries(formResponses).map(([fieldId, value]) => ({
                    fieldId, label: event.customForm.find(f => f._id === fieldId)?.label || '', value
                }));
            }
            if (event.type === 'merchandise') {
                data.merchandiseSelections = merchSelections;
                if (calculateTotal() > 0) {
                    if (!paymentProof) throw new Error('Payment proof is required for this purchase');
                    data.paymentProof = paymentProof;
                }
            }

            const res = await api.post(`/events/${id}/register`, data);
            toast.success('Registration successful!');
            setExistingReg(res.data);
            setShowRegForm(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally { setRegistering(false); }
    };

    const handleFeedback = async () => {
        try {
            await api.post(`/feedback/${id}`, feedback);
            toast.success('Feedback submitted!');
            fetchFeedback();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit feedback');
        }
    };

    const generateICS = () => {
        if (!event) return;
        const start = new Date(event.startDate).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        const end = new Date(event.endDate).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${start}\nDTEND:${end}\nSUMMARY:${event.name}\nDESCRIPTION:${event.description?.substring(0, 200)}\nEND:VEVENT\nEND:VCALENDAR`;
        const blob = new Blob([ics], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${event.name}.ics`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const googleCalUrl = event ? `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${new Date(event.startDate).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${new Date(event.endDate).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}&details=${encodeURIComponent(event.description?.substring(0, 200) || '')}` : '';

    if (loading) return <div className="page-container"><div className="loading-container"><div className="spinner"></div></div></div>;
    if (!event) return null;

    return (
        <div className="page-container">
            <div className="event-details-header">
                <div className="event-details-info">
                    <div className="event-detail-badges">
                        <span className={`badge badge-${event.type}`}>{event.type}</span>
                        <span className={`status-badge status-${event.status}`}>{event.status}</span>
                        <span className={`badge badge-eligibility`}>{event.eligibility === 'all' ? 'Open to All' : event.eligibility.toUpperCase()}</span>
                    </div>
                    <h1>{event.name}</h1>
                    <p className="event-organizer">by {event.organizer?.organizerName || 'Unknown'}</p>
                </div>
            </div>

            <div className="event-details-grid">
                <div className="event-details-main">
                    <div className="detail-card">
                        <h3>About this Event</h3>
                        <p>{event.description}</p>
                    </div>

                    <div className="detail-card">
                        <h3>Event Details</h3>
                        <div className="detail-items">
                            <div className="detail-item"><FiCalendar /> <span>Start: {new Date(event.startDate).toLocaleString()}</span></div>
                            <div className="detail-item"><FiClock /> <span>End: {new Date(event.endDate).toLocaleString()}</span></div>
                            <div className="detail-item"><FiClock /> <span>Deadline: {new Date(event.registrationDeadline).toLocaleString()}</span></div>
                            <div className="detail-item"><FiUsers /> <span>{event.registrationCount || 0} / {event.registrationLimit || '∞'} registered</span></div>
                            <div className="detail-item"><FiDollarSign /> <span>Fee: {event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}</span></div>
                        </div>
                    </div>

                    {event.tags?.length > 0 && (
                        <div className="detail-card">
                            <h3>Tags</h3>
                            <div className="event-tags">{event.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>
                        </div>
                    )}

                    {/* Merchandise Items */}
                    {event.type === 'merchandise' && event.merchandiseItems?.length > 0 && (
                        <div className="detail-card">
                            <h3>Merchandise Items</h3>
                            {event.merchandiseItems.map(item => (
                                <div key={item._id} className="merch-item">
                                    <h4>{item.itemName}</h4>
                                    <p>Price: ₹{item.price} | Stock: {item.stock} | Limit: {item.purchaseLimit}/person</p>
                                    {item.variants?.map(v => (
                                        <div key={v._id}><strong>{v.name}:</strong> {v.options.join(', ')}</div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Existing Registration / Ticket */}
                    {existingReg && (
                        <div className="detail-card ticket-card">
                            <h3>Your Ticket</h3>
                            <p><strong>Ticket ID:</strong> {existingReg.ticketId}</p>
                            <p><strong>Status:</strong> <span className={`status-badge status-${existingReg.status}`}>{existingReg.status}</span></p>
                            {existingReg.qrCode && (
                                <div className="qr-display">
                                    <img src={existingReg.qrCode} alt="QR Code" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Discussion Forum */}
                    {event.discussionEnabled && existingReg && (
                        <DiscussionForum eventId={id} />
                    )}

                    {/* Feedback Section */}
                    {existingReg && (event.status === 'completed' || event.status === 'closed') && (
                        <div className="detail-card">
                            <h3>Leave Feedback</h3>
                            <div className="feedback-form">
                                <div className="star-rating">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <button key={s} className={`star ${feedback.rating >= s ? 'star-active' : ''}`}
                                            onClick={() => setFeedback({ ...feedback, rating: s })}>★</button>
                                    ))}
                                </div>
                                <textarea value={feedback.comment} onChange={e => setFeedback({ ...feedback, comment: e.target.value })}
                                    placeholder="Share your experience..." rows={3} />
                                <button className="btn btn-primary" onClick={handleFeedback}>Submit Feedback</button>
                            </div>
                        </div>
                    )}

                    {feedbackData && feedbackData.stats?.totalFeedbacks > 0 && (
                        <div className="detail-card">
                            <h3>Event Feedback</h3>
                            <div className="feedback-stats">
                                <div className="avg-rating">{feedbackData.stats.averageRating} / 5</div>
                                <p>{feedbackData.stats.totalFeedbacks} reviews</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="event-details-sidebar">
                    <div className="sidebar-card">
                        {user?.role === 'participant' && (
                            <>
                                {canRegister() ? (
                                    <button className="btn btn-primary btn-full" onClick={() => setShowRegForm(true)}>
                                        {event.type === 'merchandise' ? 'Purchase' : 'Register Now'}
                                    </button>
                                ) : (
                                    <div className="blocked-msg">{getBlockReason()}</div>
                                )}
                            </>
                        )}

                        {existingReg && (
                            <div className="calendar-actions">
                                <h4>Add to Calendar</h4>
                                <button className="btn btn-sm btn-outline btn-full" onClick={generateICS}>
                                    <FiDownload /> Download .ics
                                </button>
                                <a href={googleCalUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline btn-full">
                                    <FiCalendar /> Google Calendar
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Registration Modal */}
            {showRegForm && (
                <div className="modal-overlay" onClick={() => setShowRegForm(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>Register for {event.name}</h2>

                        {event.type === 'normal' && event.customForm?.map(field => (
                            <div key={field._id} className="form-group">
                                <label>{field.label} {field.required && <span className="required">*</span>}</label>
                                {field.type === 'text' || field.type === 'email' || field.type === 'number' ? (
                                    <input type={field.type} placeholder={field.placeholder}
                                        onChange={e => setFormResponses({ ...formResponses, [field._id]: e.target.value })}
                                        required={field.required} />
                                ) : field.type === 'textarea' ? (
                                    <textarea placeholder={field.placeholder}
                                        onChange={e => setFormResponses({ ...formResponses, [field._id]: e.target.value })}
                                        required={field.required} />
                                ) : field.type === 'dropdown' ? (
                                    <select onChange={e => setFormResponses({ ...formResponses, [field._id]: e.target.value })}
                                        required={field.required}>
                                        <option value="">Select...</option>
                                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                ) : field.type === 'checkbox' ? (
                                    <label className="checkbox-label">
                                        <input type="checkbox"
                                            onChange={e => setFormResponses({ ...formResponses, [field._id]: e.target.checked })} />
                                        {field.placeholder || field.label}
                                    </label>
                                ) : field.type === 'radio' ? (
                                    <div className="radio-group">
                                        {field.options?.map(opt => (
                                            <label key={opt} className="radio-label">
                                                <input type="radio" name={field._id} value={opt}
                                                    onChange={e => setFormResponses({ ...formResponses, [field._id]: e.target.value })} />
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        ))}

                        {event.type === 'merchandise' && event.merchandiseItems?.map(item => (
                            <div key={item._id} className="merch-selection">
                                <h4>{item.itemName} — ₹{item.price}</h4>
                                <p>Stock: {item.stock} | Max: {item.purchaseLimit}</p>
                                <div className="form-group">
                                    <label>Quantity</label>
                                    <input type="number" min={0} max={Math.min(item.stock, item.purchaseLimit)} defaultValue={0}
                                        onChange={e => {
                                            const qty = parseInt(e.target.value) || 0;
                                            setMerchSelections(prev => {
                                                const filtered = prev.filter(s => s.itemId !== item._id);
                                                if (qty > 0) filtered.push({ itemId: item._id, itemName: item.itemName, quantity: qty, price: item.price });
                                                return filtered;
                                            });
                                        }} />
                                </div>
                            </div>
                        ))}

                        {event.type === 'merchandise' && calculateTotal() > 0 && (
                            <div className="payment-proof-section">
                                <div className="total-amount-display">
                                    <strong>Total Amount to Pay: ₹{calculateTotal()}</strong>
                                </div>
                                <div className="payment-instructions">
                                    <p>Please pay <strong>₹{calculateTotal()}</strong> to the following UPI ID and upload the screenshot.</p>
                                    <p className="upi-id">felicity-events@upi</p>
                                </div>
                                <div className="form-group">
                                    <label>Upload Payment Proof (Image) <span className="required">*</span></label>
                                    <input type="file" accept="image/*" onChange={handleFileChange} required />
                                    {paymentProof && (
                                        <div className="payment-preview">
                                            <img src={paymentProof} alt="Preview" style={{ maxWidth: '100px', marginTop: '10px', borderRadius: '4px' }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="modal-actions">
                            <button className="btn btn-outline" onClick={() => setShowRegForm(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleRegister} disabled={registering}>
                                {registering ? 'Processing...' : 'Confirm Registration'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventDetails;
