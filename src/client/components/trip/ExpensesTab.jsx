import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api.js';
import { formatPaise, formatDate } from '../../utils/format.js';
import { LoadingState } from '../ui/LoadingState.jsx';
import { ErrorMessage } from '../ui/ErrorMessage.jsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { AddExpenseModal } from './AddExpenseModal.jsx';

const CATEGORY_COLORS = {
  Travel: 'badge-blue', Food: 'badge-green', Accommodation: 'badge-purple',
  Tickets: 'badge-blue', Shopping: 'badge-gray', Other: 'badge-gray',
};

export function ExpensesTab({ tripId, participants, onRefresh, onToast }) {
  const [expenses,   setExpenses]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [delConfirm, setDelConfirm] = useState(null);
  const [error,      setError]      = useState(null);

  async function loadExpenses() {
    setLoading(true);
    try {
      setExpenses(await api.getExpenses(tripId));
    } catch (err) { setError(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadExpenses(); }, [tripId]);

  async function handleDelete(expense) {
    try {
      await api.deleteExpense(tripId, expense.id);
      setDelConfirm(null);
      await loadExpenses();
      onRefresh();
      onToast('Expense deleted');
    } catch (err) {
      setDelConfirm(null);
      setError(err);
    }
  }

  async function handleExpenseAdded() {
    setShowModal(false);
    await loadExpenses();
    onRefresh();
    onToast('Expense added');
  }

  if (loading) return <LoadingState />;

  return (
    <div>
      <ErrorMessage error={error} />

      <div className="card">
        <div className="card-header">
          <span className="card-title">Expenses ({expenses.length})</span>
          <button
            className="btn btn-primary btn-sm"
            disabled={participants.length === 0}
            title={participants.length === 0 ? 'Add participants first' : ''}
            onClick={() => setShowModal(true)}
          >
            <Plus size={14} /> Add Expense
          </button>
        </div>

        {expenses.length === 0 ? (
          <EmptyState icon="🧾" title="No expenses yet" description="Record the first expense for this trip." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Expense</th>
                  <th>Category</th>
                  <th>Paid by</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Shared with</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{exp.title}</div>
                      {exp.description && <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{exp.description}</div>}
                    </td>
                    <td>
                      <span className={`badge ${CATEGORY_COLORS[exp.category] || 'badge-gray'}`}>{exp.category}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="avatar avatar-sm">{exp.paid_by_name[0].toUpperCase()}</div>
                        {exp.paid_by_name}
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-muted)', fontSize: 13 }}>{formatDate(exp.expense_date)}</td>
                    <td style={{ fontWeight: 600 }}>{formatPaise(parseInt(exp.amount_paise))}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {(exp.shares || []).map(s => (
                          <span key={s.participant_id} style={{ fontSize: 12 }} className="participant-chip">
                            {s.participant_name} ({formatPaise(s.share_paise)})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--color-danger)' }}
                        onClick={() => setDelConfirm(exp)}
                        title="Delete expense"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <AddExpenseModal
          tripId={tripId}
          participants={participants}
          onSaved={handleExpenseAdded}
          onClose={() => setShowModal(false)}
        />
      )}

      {delConfirm && (
        <ConfirmDialog
          title="Delete Expense"
          message={`Delete "${delConfirm.title}" (${formatPaise(parseInt(delConfirm.amount_paise))})? This cannot be done once settlements have been recorded.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => handleDelete(delConfirm)}
          onCancel={() => setDelConfirm(null)}
        />
      )}
    </div>
  );
}
