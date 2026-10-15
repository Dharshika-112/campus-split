import { useState, useEffect } from 'react';
import { Plus, ArrowRight } from 'lucide-react';
import { api } from '../../services/api.js';
import { formatPaise, formatDate } from '../../utils/format.js';
import { LoadingState } from '../ui/LoadingState.jsx';
import { ErrorMessage } from '../ui/ErrorMessage.jsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';

export function SettlementsTab({ tripId, participants, onRefresh, onToast }) {
  const [settlements,  setSettlements]  = useState([]);
  const [plan,         setPlan]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [confirm,      setConfirm]      = useState(null);  // { from, to, amount, fromId, toId }
  const [error,        setError]        = useState(null);

  const [form, setForm] = useState({
    fromParticipantId: '', toParticipantId: '', amount: '',
    settledAt: new Date().toISOString().split('T')[0],
  });
  const [formError, setFormError] = useState(null);

  async function load() {
    try {
      const [s, planData] = await Promise.all([
        api.getSettlements(tripId),
        api.getSettlementPlan(tripId),
      ]);
      setSettlements(s);
      setPlan(planData.plan);
    } catch (err) { setError(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [tripId]);

  function prepareConfirm(e) {
    e.preventDefault();
    if (!form.fromParticipantId) return setFormError('Select who is paying');
    if (!form.toParticipantId)   return setFormError('Select who is receiving');
    if (form.fromParticipantId === form.toParticipantId) return setFormError('Cannot settle with yourself');
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0)  return setFormError('Enter a valid amount');

    const fromName = participants.find(p => p.id === parseInt(form.fromParticipantId))?.name;
    const toName   = participants.find(p => p.id === parseInt(form.toParticipantId))?.name;
    setFormError(null);
    setConfirm({ fromName, toName, ...form });
  }

  async function handleRecord() {
    try {
      await api.createSettlement(tripId, {
        fromParticipantId: parseInt(confirm.fromParticipantId),
        toParticipantId:   parseInt(confirm.toParticipantId),
        amountPaise:       Math.round(parseFloat(confirm.amount) * 100),
        settledAt:         confirm.settledAt,
      });
      setConfirm(null);
      setShowForm(false);
      setForm({ fromParticipantId: '', toParticipantId: '', amount: '', settledAt: new Date().toISOString().split('T')[0] });
      await load();
      onRefresh();
      onToast('Settlement recorded');
    } catch (err) {
      setConfirm(null);
      setError(err);
    }
  }

  function prefillFromPlan(t) {
    setForm({
      fromParticipantId: String(t.fromParticipantId),
      toParticipantId:   String(t.toParticipantId),
      amount:            (t.amountPaise / 100).toFixed(2),
      settledAt:         new Date().toISOString().split('T')[0],
    });
    setShowForm(true);
  }

  if (loading) return <LoadingState />;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <ErrorMessage error={error} />

      {/* Suggested plan */}
      {plan.length > 0 && (
        <div className="card">
          <div className="card-header"><span className="card-title">Suggested Payments</span></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {plan.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--color-bg)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                <strong style={{ fontSize: 14 }}>{t.fromName}</strong>
                <ArrowRight size={14} style={{ color: 'var(--color-muted)' }} />
                <strong style={{ fontSize: 14 }}>{t.toName}</strong>
                <span style={{ fontWeight: 700, color: 'var(--color-accent)', marginLeft: 'auto' }}>{formatPaise(t.amountPaise)}</span>
                <button className="btn btn-primary btn-sm" onClick={() => prefillFromPlan(t)}>Record</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record settlement */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Record a Payment</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(s => !s)}>
            <Plus size={14} /> {showForm ? 'Cancel' : 'Record Payment'}
          </button>
        </div>

        {showForm && (
          <div className="card-body">
            <ErrorMessage error={formError} />
            <form onSubmit={prepareConfirm}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">From (paying) <span className="form-required">*</span></label>
                  <select className="form-select" value={form.fromParticipantId} onChange={e => setForm(f => ({ ...f, fromParticipantId: e.target.value }))}>
                    <option value="">Select payer…</option>
                    {participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">To (receiving) <span className="form-required">*</span></label>
                  <select className="form-select" value={form.toParticipantId} onChange={e => setForm(f => ({ ...f, toParticipantId: e.target.value }))}>
                    <option value="">Select recipient…</option>
                    {participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Amount (₹) <span className="form-required">*</span></label>
                  <input className="form-input" type="number" step="0.01" min="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={form.settledAt} onChange={e => setForm(f => ({ ...f, settledAt: e.target.value }))} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Review &amp; Confirm</button>
            </form>
          </div>
        )}
      </div>

      {/* Settlement history */}
      <div className="card">
        <div className="card-header"><span className="card-title">Settlement History ({settlements.length})</span></div>
        {settlements.length === 0 ? (
          <EmptyState icon="💸" title="No settlements yet" description="Record payments between participants to reduce outstanding balances." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>From</th>
                  <th></th>
                  <th>To</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="avatar avatar-sm">{s.from_name[0].toUpperCase()}</div>
                        {s.from_name}
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-muted)' }}><ArrowRight size={14} /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="avatar avatar-sm">{s.to_name[0].toUpperCase()}</div>
                        {s.to_name}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--color-success)' }}>{formatPaise(parseInt(s.amount_paise))}</td>
                    <td style={{ color: 'var(--color-muted)', fontSize: 13 }}>{formatDate(s.settled_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirm && (
        <ConfirmDialog
          title="Confirm Settlement"
          message={`Record ${confirm.fromName} paying ${confirm.toName} ₹${parseFloat(confirm.amount).toFixed(2)}?`}
          confirmLabel="Record Payment"
          onConfirm={handleRecord}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
