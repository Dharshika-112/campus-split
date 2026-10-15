import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { api } from '../../services/api.js';
import { formatPaise } from '../../utils/format.js';
import { LoadingState } from '../ui/LoadingState.jsx';
import { ErrorMessage } from '../ui/ErrorMessage.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';

export function BalancesTab({ tripId }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    api.getSettlementPlan(tripId)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [tripId]);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorMessage error={error} />;
  if (!data)   return null;

  const { balances, plan } = data;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Balance table */}
      <div className="card">
        <div className="card-header"><span className="card-title">Individual Balances</span></div>
        {balances.length === 0 ? (
          <EmptyState icon="⚖️" title="No participants" description="Add participants and expenses to see balances." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Paid for expenses</th>
                  <th>Fair share</th>
                  <th>Settlements paid</th>
                  <th>Settlements received</th>
                  <th>Outstanding balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {balances.map(b => {
                  const balClass = b.balance > 0 ? 'balance-positive' : b.balance < 0 ? 'balance-negative' : 'balance-zero';
                  const status   = b.balance > 0 ? '🟢 Will receive' : b.balance < 0 ? '🔴 Owes' : '✅ Settled';
                  return (
                    <tr key={b.participantId}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar avatar-sm">{b.name[0].toUpperCase()}</div>
                          {b.name}
                        </div>
                      </td>
                      <td>{formatPaise(b.amountPaid)}</td>
                      <td>{formatPaise(b.fairShare)}</td>
                      <td style={{ color: 'var(--color-muted)' }}>{formatPaise(b.settlementsPaid)}</td>
                      <td style={{ color: 'var(--color-muted)' }}>{formatPaise(b.settlementsReceived)}</td>
                      <td className={balClass}>{b.balance >= 0 ? '' : '−'}{formatPaise(Math.abs(b.balance))}</td>
                      <td><span style={{ fontSize: 13 }}>{status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Settlement plan */}
      <div className="card">
        <div className="card-header"><span className="card-title">Suggested Settlement Plan</span></div>
        {plan.length === 0 ? (
          <EmptyState icon="✅" title="Everyone is settled" description="No outstanding payments needed." />
        ) : (
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 4 }}>
              These {plan.length} transfer{plan.length !== 1 ? 's' : ''} will fully settle the group.
              Go to the Settlements tab to record payments.
            </p>
            {plan.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--color-bg)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                <div className="avatar avatar-sm">{t.fromName[0].toUpperCase()}</div>
                <strong style={{ fontSize: 14 }}>{t.fromName}</strong>
                <ArrowRight size={16} style={{ color: 'var(--color-muted)' }} />
                <div className="avatar avatar-sm">{t.toName[0].toUpperCase()}</div>
                <strong style={{ fontSize: 14 }}>{t.toName}</strong>
                <span style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--color-accent)' }}>
                  {formatPaise(t.amountPaise)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
