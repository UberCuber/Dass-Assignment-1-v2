import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { FiUsers, FiDollarSign, FiDownload, FiCheck, FiX, FiCamera } from 'react-icons/fi';
import DiscussionForum from '../../components/DiscussionForum';
import '../Pages.css';

const OrganizerEventDetail = () => {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [attendance, setAttendance] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [scanInput, setScanInput] = useState('');

    useEffect(() => { fetchAll(); }, [id]);

    const fetchAll = async () => {
        try {
            const [evRes, regRes, anaRes, attRes] = await Promise.all([
                api.get(`/events/${id}`),
                api.get(`/events/${id}/registrations`),
                api.get(`/events/${id}/analytics`),
                api.get(`/events/${id}/attendance`),
            ]);
            setEvent(evRes.data);
            setRegistrations(regRes.data.registrations || []);
            setAnalytics(anaRes.data);
            setAttendance(attRes.data);
        } catch { toast.error('Failed to load event'); }
        finally { setLoading(false); }
    };

    const changeStatus = async (newStatus) => {
        try {
            await api.put(`/events/${id}`, { status: newStatus });
            toast.success(`Event ${newStatus}!`);
            fetchAll();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handlePaymentReview = async (regId, action) => {
        try {
            await api.put(`/events/${id}/registrations/${regId}/payment`, { action });
            toast.success(`Payment ${action}d`);
            fetchAll();
        } catch (err) { toast.error('Failed'); }
    };

    const handleScan = async () => {
        if (!scanInput.trim()) return;
        try {
            const res = await api.post(`/events/${id}/attendance`, { ticketId: scanInput.trim() });
            toast.success(`${res.data.participant.firstName} ${res.data.participant.lastName} — Attendance marked!`);
            setScanInput('');
            fetchAll();
        } catch (err) { toast.error(err.response?.data?.message || 'Invalid ticket'); }
    };

    const exportCSV = () => {
        window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/events/${id}/export?token=${localStorage.getItem('token')}`, '_blank');
    };

    if (loading) return <div className="page-container"><div className="loading-container"><div className="spinner"></div></div></div>;
    if (!event) return null;

    const pendingPayments = registrations.filter(r => r.paymentStatus === 'pending');

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>{event.name}</h1>
                    <div className="event-detail-badges">
                        <span className={`badge badge-${event.type}`}>{event.type}</span>
                        <span className={`status-badge status-${event.status}`}>{event.status}</span>
                    </div>
                </div>
                <div className="header-actions">
                    {event.status === 'draft' && <button className="btn btn-primary" onClick={() => changeStatus('published')}>Publish</button>}
                    {event.status === 'published' && <button className="btn btn-warning" onClick={() => changeStatus('ongoing')}>Start</button>}
                    {(event.status === 'ongoing' || event.status === 'published') && <button className="btn btn-outline" onClick={() => changeStatus('closed')}>Close</button>}
                    {event.status === 'ongoing' && <button className="btn btn-success" onClick={() => changeStatus('completed')}>Complete</button>}
                </div>
            </div>

            <div className="tabs">
                {['overview', 'participants', 'payments', 'attendance', 'discussion'].map(tab => (
                    <button key={tab} className={`tab ${activeTab === tab ? 'tab-active' : ''}`} onClick={() => setActiveTab(tab)}>
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        {tab === 'payments' && pendingPayments.length > 0 && <span className="tab-count tab-alert">{pendingPayments.length}</span>}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && analytics && (
                <div className="stats-row">
                    <div className="stat-card"><div className="stat-number">{analytics.totalRegistrations}</div><div className="stat-label">Registrations</div></div>
                    <div className="stat-card"><div className="stat-number">{analytics.attended}</div><div className="stat-label">Attended</div></div>
                    <div className="stat-card"><div className="stat-number">{analytics.pendingPayments}</div><div className="stat-label">Pending Payments</div></div>
                    <div className="stat-card"><div className="stat-number">₹{analytics.totalRevenue}</div><div className="stat-label">Revenue</div></div>
                </div>
            )}

            {activeTab === 'participants' && (
                <div className="detail-card">
                    <div className="card-header-row">
                        <h3>Participants ({registrations.length})</h3>
                        <button className="btn btn-sm btn-outline" onClick={exportCSV}><FiDownload /> Export CSV</button>
                    </div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th><th>Email</th><th>Status</th><th>Ticket ID</th><th>Attended</th><th>Registered</th>
                                </tr>
                            </thead>
                            <tbody>
                                {registrations.map(r => (
                                    <tr key={r._id}>
                                        <td>{r.participant?.firstName} {r.participant?.lastName}</td>
                                        <td>{r.participant?.email}</td>
                                        <td><span className={`status-badge status-${r.status}`}>{r.status}</span></td>
                                        <td className="ticket-cell">{r.ticketId}</td>
                                        <td>{r.attended ? 'Yes' : '—'}</td>
                                        <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'payments' && (
                <div className="detail-card">
                    <h3>Payment Approvals</h3>
                    {pendingPayments.length === 0 ? (
                        <p className="empty-text">No pending payments</p>
                    ) : (
                        pendingPayments.map(r => (
                            <div key={r._id} className="payment-review-card">
                                <div className="payment-info">
                                    <h4>{r.participant?.firstName} {r.participant?.lastName}</h4>
                                    <p>{r.participant?.email} • ₹{r.totalAmount}</p>
                                    {r.paymentProof && <img src={`http://localhost:5000/${r.paymentProof}`} alt="Payment proof" className="payment-proof-img" />}
                                </div>
                                <div className="payment-actions">
                                    <button className="btn btn-sm btn-success" onClick={() => handlePaymentReview(r._id, 'approve')}><FiCheck /> Approve</button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handlePaymentReview(r._id, 'reject')}><FiX /> Reject</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'attendance' && (
                <div className="detail-card">
                    <h3><FiCamera /> QR Scanner & Attendance</h3>
                    <div className="scanner-section">
                        <div className="form-row">
                            <input value={scanInput} onChange={e => setScanInput(e.target.value)}
                                placeholder="Enter or scan Ticket ID (e.g., FEL-ABCD1234)"
                                className="scan-input" onKeyDown={e => e.key === 'Enter' && handleScan()} />
                            <button className="btn btn-primary" onClick={handleScan}>Mark Attendance</button>
                        </div>
                    </div>

                    {attendance && (
                        <div className="attendance-stats">
                            <div className="stats-row">
                                <div className="stat-card"><div className="stat-number">{attendance.attended}</div><div className="stat-label">Scanned</div></div>
                                <div className="stat-card"><div className="stat-number">{attendance.notAttended}</div><div className="stat-label">Not Yet</div></div>
                                <div className="stat-card"><div className="stat-number">{attendance.total}</div><div className="stat-label">Total</div></div>
                            </div>
                            {attendance.attendees?.length > 0 && (
                                <div className="table-container" style={{ marginTop: '1rem' }}>
                                    <table className="data-table">
                                        <thead><tr><th>Name</th><th>Ticket</th><th>Scanned At</th></tr></thead>
                                        <tbody>
                                            {attendance.attendees.map(a => (
                                                <tr key={a.ticketId}>
                                                    <td>{a.participant?.firstName} {a.participant?.lastName}</td>
                                                    <td>{a.ticketId}</td>
                                                    <td>{new Date(a.attendedAt).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'discussion' && (
                <DiscussionForum eventId={id} />
            )}
        </div>
    );
};

export default OrganizerEventDetail;
