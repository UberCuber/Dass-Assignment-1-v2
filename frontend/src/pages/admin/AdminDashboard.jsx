import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { FiUsers, FiCalendar, FiDollarSign, FiTrendingUp, FiPlus, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import '../Pages.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/stats').then(res => setStats(res.data)).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="page-container"><div className="loading-container"><div className="spinner"></div></div></div>;

    return (
        <div className="page-container">
            <div className="page-header"><h1>Admin Dashboard</h1></div>

            {stats && (
                <>
                    <div className="stats-row">
                        <div className="stat-card stat-purple"><div className="stat-number">{stats.totalUsers}</div><div className="stat-label">Users</div></div>
                        <div className="stat-card stat-blue"><div className="stat-number">{stats.totalOrganizers}</div><div className="stat-label">Organizers</div></div>
                        <div className="stat-card stat-green"><div className="stat-number">{stats.totalEvents}</div><div className="stat-label">Events</div></div>
                        <div className="stat-card stat-orange"><div className="stat-number">{stats.totalRegistrations}</div><div className="stat-label">Registrations</div></div>
                        <div className="stat-card"><div className="stat-number">{stats.pendingResetRequests}</div><div className="stat-label">Pending Resets</div></div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
