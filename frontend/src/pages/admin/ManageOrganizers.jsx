import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import '../Pages.css';

const ManageOrganizers = () => {
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [formData, setFormData] = useState({
        organizerName: '', category: 'Technical', description: '', contactEmail: ''
    });
    const [creating, setCreating] = useState(false);

    useEffect(() => { fetchOrganizers(); }, []);

    const fetchOrganizers = async () => {
        try {
            const res = await api.get('/admin/organizers');
            setOrganizers(res.data);
        } catch { toast.error('Failed to load organizers'); }
        finally { setLoading(false); }
    };

    const handleCreate = async () => {
        if (!formData.organizerName.trim()) return toast.error('Name required');
        setCreating(true);
        try {
            const res = await api.post('/admin/organizers', formData);
            const creds = `Organizer created!\n\nEmail: ${res.data.email}\nPassword: ${res.data.generatedPassword}\n\nPlease share these credentials with the organizer.`;
            alert(creds);
            toast.success('Organizer created successfully');
            setShowCreate(false);
            setFormData({ organizerName: '', category: 'Technical', description: '', contactEmail: '' });
            fetchOrganizers();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setCreating(false); }
    };

    const handleRemove = async (id) => {
        if (!confirm('Are you sure you want to remove this organizer?')) return;
        try {
            await api.delete(`/admin/organizers/${id}`);
            toast.success('Organizer removed');
            fetchOrganizers();
        } catch { toast.error('Failed'); }
    };

    const handleReactivate = async (id) => {
        try {
            await api.put(`/admin/organizers/${id}/reactivate`);
            toast.success('Organizer reactivated');
            fetchOrganizers();
        } catch { toast.error('Failed'); }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Manage Organizers / Clubs</h1>
                <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}><FiPlus /> Create Club</button>
            </div>

            {showCreate && (
                <div className="detail-card" style={{ marginBottom: '1.5rem' }}>
                    <h3>Create New Club Account</h3>
                    <div className="form-row">
                        <div className="form-group"><label>Club Name *</label>
                            <input value={formData.organizerName} onChange={e => setFormData({ ...formData, organizerName: e.target.value })} placeholder="e.g. Robotics Club" /></div>
                        <div className="form-group"><label>Category</label>
                            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                <option>Technical</option><option>Cultural</option><option>Sports</option><option>Literary</option><option>Other</option>
                            </select></div>
                    </div>
                    <div className="form-group"><label>Description</label>
                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} placeholder="Brief description..." /></div>
                    <div className="form-group"><label>Contact Email</label>
                        <input value={formData.contactEmail} onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} placeholder="club@iiit.ac.in" /></div>
                    <div className="form-row">
                        <button className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>{creating ? 'Creating...' : 'Create'}</button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="loading-container"><div className="spinner"></div></div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr><th>Name</th><th>Email</th><th>Category</th><th>Status</th><th>Events</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {organizers.map(org => (
                                <tr key={org._id}>
                                    <td><strong>{org.organizerName}</strong></td>
                                    <td>{org.email}</td>
                                    <td>{org.category}</td>
                                    <td><span className={`status-badge ${org.isActive ? 'status-approved' : 'status-rejected'}`}>{org.isActive ? 'Active' : 'Inactive'}</span></td>
                                    <td>{org.eventsCount || 0}</td>
                                    <td>
                                        {org.isActive ? (
                                            <button className="btn btn-sm btn-danger" onClick={() => handleRemove(org._id)}><FiTrash2 /> Remove</button>
                                        ) : (
                                            <button className="btn btn-sm btn-success" onClick={() => handleReactivate(org._id)}><FiRefreshCw /> Reactivate</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ManageOrganizers;
