import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../services/api.js';
import { ErrorMessage } from '../components/ui/ErrorMessage.jsx';

export function CreateTrip() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '', startDate: '', endDate: '' });
  const [error,   setError]   = useState(null);
  const [saving,  setSaving]  = useState(false);

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim())      return setError('Trip name is required');
    if (!form.startDate)         return setError('Start date is required');
    if (form.endDate && form.endDate < form.startDate) return setError('End date must be after start date');

    setSaving(true);
    setError(null);
    try {
      const trip = await api.createTrip({
        name:        form.name.trim(),
        description: form.description.trim() || null,
        startDate:   form.startDate,
        endDate:     form.endDate || null,
      });
      navigate(`/trips/${trip.id}`);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <Link to="/trips" className="btn btn-ghost btn-sm" style={{ marginBottom: 8, paddingLeft: 0 }}>
            <ArrowLeft size={14} /> Back to trips
          </Link>
          <h1 className="page-title">Create a Trip</h1>
        </div>
      </div>

      <div className="card card-pad">
        <ErrorMessage error={error} />
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Trip name <span className="form-required">*</span></label>
            <input
              className="form-input"
              placeholder="e.g. Tech Conference 2026"
              value={form.name}
              onChange={e => set('name', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              placeholder="Optional — what's this trip about?"
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start date <span className="form-required">*</span></label>
              <input
                type="date"
                className="form-input"
                value={form.startDate}
                onChange={e => set('startDate', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End date</label>
              <input
                type="date"
                className="form-input"
                value={form.endDate}
                min={form.startDate}
                onChange={e => set('endDate', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <Link to="/trips" className="btn btn-secondary">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
