import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import '../Pages.css';

const FIELD_TYPES = ['text', 'textarea', 'dropdown', 'checkbox', 'radio', 'file', 'number', 'email', 'date'];

const CreateEvent = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [event, setEvent] = useState({
        name: '', description: '', type: 'normal', eligibility: 'all',
        registrationDeadline: '', startDate: '', endDate: '',
        registrationLimit: 0, registrationFee: 0, tags: '',
        customForm: [], merchandiseItems: []
    });

    const addFormField = () => {
        setEvent({
            ...event,
            customForm: [...event.customForm, { label: '', type: 'text', required: false, options: [], placeholder: '', order: event.customForm.length }]
        });
    };

    const updateFormField = (index, field, value) => {
        const updated = [...event.customForm];
        updated[index] = { ...updated[index], [field]: value };
        setEvent({ ...event, customForm: updated });
    };

    const removeFormField = (index) => {
        setEvent({ ...event, customForm: event.customForm.filter((_, i) => i !== index) });
    };

    const moveField = (index, direction) => {
        const newFields = [...event.customForm];
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= newFields.length) return;
        [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
        setEvent({ ...event, customForm: newFields.map((f, i) => ({ ...f, order: i })) });
    };

    const addMerchItem = () => {
        setEvent({
            ...event,
            merchandiseItems: [...event.merchandiseItems, { itemName: '', price: 0, stock: 0, purchaseLimit: 1, variants: [] }]
        });
    };

    const updateMerchItem = (index, field, value) => {
        const updated = [...event.merchandiseItems];
        updated[index] = { ...updated[index], [field]: value };
        setEvent({ ...event, merchandiseItems: updated });
    };

    const addVariant = (itemIndex) => {
        const updated = [...event.merchandiseItems];
        updated[itemIndex].variants = [...(updated[itemIndex].variants || []), { name: '', options: [] }];
        setEvent({ ...event, merchandiseItems: updated });
    };

    const handleSave = async (publish = false) => {
        setSaving(true);
        try {
            const data = {
                ...event,
                tags: event.tags.split(',').map(t => t.trim()).filter(Boolean),
            };
            const res = await api.post('/events', data);

            if (publish) {
                await api.put(`/events/${res.data._id}`, { status: 'published' });
                toast.success('Event published!');
            } else {
                toast.success('Event saved as draft');
            }
            navigate('/organizer/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create event');
        } finally { setSaving(false); }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Create Event ✨</h1>
                <div className="step-indicator">
                    <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
                    <div className="step-line"></div>
                    <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
                    <div className="step-line"></div>
                    <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
                </div>
            </div>

            {step === 1 && (
                <div className="detail-card">
                    <h3>Basic Information</h3>
                    <div className="form-group"><label>Event Name *</label>
                        <input value={event.name} onChange={e => setEvent({ ...event, name: e.target.value })} placeholder="My awesome event" required /></div>
                    <div className="form-group"><label>Description *</label>
                        <textarea value={event.description} onChange={e => setEvent({ ...event, description: e.target.value })} rows={4} placeholder="Describe your event..." required /></div>
                    <div className="form-row">
                        <div className="form-group"><label>Event Type</label>
                            <select value={event.type} onChange={e => setEvent({ ...event, type: e.target.value })}>
                                <option value="normal">Normal Event</option>
                                <option value="merchandise">Merchandise</option>
                            </select></div>
                        <div className="form-group"><label>Eligibility</label>
                            <select value={event.eligibility} onChange={e => setEvent({ ...event, eligibility: e.target.value })}>
                                <option value="all">Open to All</option>
                                <option value="iiit">IIIT Only</option>
                                <option value="non-iiit">Non-IIIT Only</option>
                            </select></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Start Date *</label>
                            <input type="datetime-local" value={event.startDate} onChange={e => setEvent({ ...event, startDate: e.target.value })} required /></div>
                        <div className="form-group"><label>End Date *</label>
                            <input type="datetime-local" value={event.endDate} onChange={e => setEvent({ ...event, endDate: e.target.value })} required /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Registration Deadline *</label>
                            <input type="datetime-local" value={event.registrationDeadline} onChange={e => setEvent({ ...event, registrationDeadline: e.target.value })} required /></div>
                        <div className="form-group"><label>Registration Limit (0=unlimited)</label>
                            <input type="number" value={event.registrationLimit} onChange={e => setEvent({ ...event, registrationLimit: parseInt(e.target.value) || 0 })} min={0} /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Registration Fee (₹)</label>
                            <input type="number" value={event.registrationFee} onChange={e => setEvent({ ...event, registrationFee: parseInt(e.target.value) || 0 })} min={0} /></div>
                        <div className="form-group"><label>Tags (comma-separated)</label>
                            <input value={event.tags} onChange={e => setEvent({ ...event, tags: e.target.value })} placeholder="tech, hackathon, ai" /></div>
                    </div>
                    <button className="btn btn-primary" onClick={() => setStep(2)}>Next →</button>
                </div>
            )}

            {step === 2 && (
                <div className="detail-card">
                    {event.type === 'normal' ? (
                        <>
                            <h3>Custom Registration Form</h3>
                            <p className="subtitle">Build a custom form for participants to fill during registration</p>
                            {event.customForm.map((field, index) => (
                                <div key={index} className="form-builder-field">
                                    <div className="form-row">
                                        <div className="form-group" style={{ flex: 2 }}>
                                            <label>Field Label</label>
                                            <input value={field.label} onChange={e => updateFormField(index, 'label', e.target.value)} placeholder="e.g. Team Name" />
                                        </div>
                                        <div className="form-group">
                                            <label>Type</label>
                                            <select value={field.type} onChange={e => updateFormField(index, 'type', e.target.value)}>
                                                {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ flex: 0.5 }}>
                                            <label>Required</label>
                                            <input type="checkbox" checked={field.required} onChange={e => updateFormField(index, 'required', e.target.checked)} />
                                        </div>
                                    </div>
                                    {['dropdown', 'radio', 'checkbox'].includes(field.type) && (
                                        <div className="form-group">
                                            <label>Options (comma-separated)</label>
                                            <input value={field.options?.join(', ') || ''} onChange={e => updateFormField(index, 'options', e.target.value.split(',').map(o => o.trim()))} placeholder="Option 1, Option 2, Option 3" />
                                        </div>
                                    )}
                                    <div className="field-actions">
                                        <button className="btn-icon" onClick={() => moveField(index, -1)}><FiArrowUp /></button>
                                        <button className="btn-icon" onClick={() => moveField(index, 1)}><FiArrowDown /></button>
                                        <button className="btn-icon btn-danger" onClick={() => removeFormField(index)}><FiTrash2 /></button>
                                    </div>
                                </div>
                            ))}
                            <button className="btn btn-outline" onClick={addFormField}><FiPlus /> Add Field</button>
                        </>
                    ) : (
                        <>
                            <h3>Merchandise Items</h3>
                            {event.merchandiseItems.map((item, index) => (
                                <div key={index} className="form-builder-field">
                                    <div className="form-row">
                                        <div className="form-group"><label>Item Name</label>
                                            <input value={item.itemName} onChange={e => updateMerchItem(index, 'itemName', e.target.value)} placeholder="T-Shirt" /></div>
                                        <div className="form-group"><label>Price (₹)</label>
                                            <input type="number" value={item.price} onChange={e => updateMerchItem(index, 'price', parseInt(e.target.value) || 0)} min={0} /></div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group"><label>Stock</label>
                                            <input type="number" value={item.stock} onChange={e => updateMerchItem(index, 'stock', parseInt(e.target.value) || 0)} min={0} /></div>
                                        <div className="form-group"><label>Purchase Limit</label>
                                            <input type="number" value={item.purchaseLimit} onChange={e => updateMerchItem(index, 'purchaseLimit', parseInt(e.target.value) || 1)} min={1} /></div>
                                    </div>
                                    {item.variants?.map((v, vi) => (
                                        <div key={vi} className="form-row">
                                            <div className="form-group"><label>Variant Name</label>
                                                <input value={v.name} onChange={e => {
                                                    const updated = [...event.merchandiseItems];
                                                    updated[index].variants[vi].name = e.target.value;
                                                    setEvent({ ...event, merchandiseItems: updated });
                                                }} placeholder="e.g. Size" /></div>
                                            <div className="form-group"><label>Options (comma-sep)</label>
                                                <input value={v.options?.join(', ') || ''} onChange={e => {
                                                    const updated = [...event.merchandiseItems];
                                                    updated[index].variants[vi].options = e.target.value.split(',').map(o => o.trim());
                                                    setEvent({ ...event, merchandiseItems: updated });
                                                }} placeholder="S, M, L, XL" /></div>
                                        </div>
                                    ))}
                                    <button className="btn btn-sm btn-outline" onClick={() => addVariant(index)}><FiPlus /> Add Variant</button>
                                </div>
                            ))}
                            <button className="btn btn-outline" onClick={addMerchItem}><FiPlus /> Add Item</button>
                        </>
                    )}
                    <div className="form-row" style={{ marginTop: '1rem' }}>
                        <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
                        <button className="btn btn-primary" onClick={() => setStep(3)}>Next →</button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="detail-card">
                    <h3>Review & Publish</h3>
                    <div className="review-summary">
                        <p><strong>Name:</strong> {event.name}</p>
                        <p><strong>Type:</strong> {event.type}</p>
                        <p><strong>Eligibility:</strong> {event.eligibility}</p>
                        <p><strong>Start:</strong> {event.startDate}</p>
                        <p><strong>End:</strong> {event.endDate}</p>
                        <p><strong>Deadline:</strong> {event.registrationDeadline}</p>
                        <p><strong>Limit:</strong> {event.registrationLimit || 'Unlimited'}</p>
                        <p><strong>Fee:</strong> ₹{event.registrationFee}</p>
                        {event.type === 'normal' && <p><strong>Form Fields:</strong> {event.customForm.length}</p>}
                        {event.type === 'merchandise' && <p><strong>Items:</strong> {event.merchandiseItems.length}</p>}
                    </div>
                    <div className="form-row" style={{ marginTop: '1rem' }}>
                        <button className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
                        <button className="btn btn-outline" onClick={() => handleSave(false)} disabled={saving}>Save as Draft</button>
                        <button className="btn btn-primary" onClick={() => handleSave(true)} disabled={saving}>
                            {saving ? 'Publishing...' : '🚀 Publish Event'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateEvent;
