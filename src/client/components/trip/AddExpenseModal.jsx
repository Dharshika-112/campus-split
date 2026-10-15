import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { api } from '../../services/api.js';
import { formatPaise } from '../../utils/format.js';
import { ErrorMessage } from '../ui/ErrorMessage.jsx';

const CATEGORIES = ['Travel', 'Food', 'Accommodation', 'Tickets', 'Shopping', 'Other'];

export function AddExpenseModal({ tripId, participants, onSaved, onClose }) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    title: '', description: '', category: 'Other',
    amount: '', expenseDate: today, paidByParticipantId: '',
    beneficiaryIds: participants.map(p => p.id),
  });
  const [error,  setError]  = useState(null);
  const [saving, setSaving] = useState(false);

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  function toggleBeneficiary(id) {
    setForm(f => ({
      ...f,
      beneficiaryIds: f.beneficiaryIds.includes(id)
        ? f.beneficiaryIds.filter(b => b !== id)
        : [...f.beneficiaryIds, id],
    }));
  }

  // Preview per-person share
  const sharePreview = useMemo(() => {
    const amountPaise = Math.round(parseFloat(form.amount || 0) * 100);
    const count = form.beneficiaryIds.length;
    if (!amountPaise || count === 0) return null;
    const base = Math.floor(amountPaise / count);
    const remainder = amountPaise % count;
    return form.beneficiaryIds.reduce((acc, id, i) => {
      acc[id] = base + (i < remainder ? 1 : 0);
      return acc;
    }, {});
  }, [form.amount, form.beneficiaryIds]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim())              return setError('Title is required');
    if (!form.amount || parseFloat(form.amount) <= 0) return setError('Amount must be positive');
    if (!form.expenseDate)               return setError('Date is required');
    if (!form.paidByParticipantId)       return setError('Select who paid');
    if (form.beneficiaryIds.length === 0) return setError('Select at least one beneficiary');

    setSaving(true); setError(null);
    try {
      await api.createExpense(tripId, {
        title:                form.title.trim(),
        description:          form.description.trim() || null,
        category:             form.category,
        amountPaise:          Math.round(parseFloat(form.amount) * 100),
        expenseDate:          form.expenseDate,
        paidByParticipantId:  parseInt(form.paidByParticipantId),
        beneficiaryIds:       form.beneficiaryIds,
      });
      onSaved();
    } catch (err) { setError(err); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Add Expense</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <ErrorMessage error={error} />

            <div className="form-group">
              <label className="form-label">Title <span className="form-required">*</span></label>
              <input className="form-input" placeholder="e.g. Conference tickets" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount (₹) <span className="form-required">*</span></label>
                <input className="form-input" type="number" step="0.01" min="0.01" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Paid by <span className="form-required">*</span></label>
                <select className="form-select" value={form.paidByParticipantId} onChange={e => set('paidByParticipantId', e.target.value)}>
                  <option value="">Select payer…</option>
                  {participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date <span className="form-required">*</span></label>
                <input type="date" className="form-input" value={form.expenseDate} onChange={e => set('expenseDate', e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" style={{ minHeight: 52 }} placeholder="Optional notes" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Split between <span className="form-required">*</span>
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}
                    onClick={() => set('beneficiaryIds', participants.map(p => p.id))}>
                    All
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}
                    onClick={() => set('beneficiaryIds', [])}>
                    None
                  </button>
                </div>
              </div>
              <div className="checkbox-list">
                {participants.map((p, i) => {
                  const checked = form.beneficiaryIds.includes(p.id);
                  const share   = sharePreview?.[p.id];
                  return (
                    <label key={p.id} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleBeneficiary(p.id)}
                      />
                      <div className="avatar avatar-sm">{p.name[0].toUpperCase()}</div>
                      <span className="checkbox-item-label">{p.name}</span>
                      {checked && share !== undefined && (
                        <span className="checkbox-item-share">{formatPaise(share)} each</span>
                      )}
                    </label>
                  );
                })}
              </div>
              {sharePreview && form.beneficiaryIds.length > 0 && (
                <p className="form-hint">
                  {formatPaise(Math.round(parseFloat(form.amount || 0) * 100))} ÷ {form.beneficiaryIds.length} people
                </p>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
