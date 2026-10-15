import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Users, Receipt, Scale, History } from 'lucide-react';
import { api } from '../services/api.js';
import { formatPaise, formatDate } from '../utils/format.js';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { ErrorMessage } from '../components/ui/ErrorMessage.jsx';
import { Toast } from '../components/ui/Toast.jsx';
import { ParticipantsTab } from '../components/trip/ParticipantsTab.jsx';
import { ExpensesTab } from '../components/trip/ExpensesTab.jsx';
import { BalancesTab } from '../components/trip/BalancesTab.jsx';
import { SettlementsTab } from '../components/trip/SettlementsTab.jsx';

const TABS = [
  { id: 'overview',     label: 'Overview',     Icon: Receipt },
  { id: 'expenses',     label: 'Expenses',      Icon: Receipt },
  { id: 'participants', label: 'Participants',   Icon: Users },
  { id: 'balances',     label: 'Balances',       Icon: Scale },
  { id: 'settlements',  label: 'Settlements',    Icon: History },
];

export function TripDetails() {
  const { tripId }       = useParams();
  const [trip,           setTrip]           = useState(null);
  const [participants,   setParticipants]   = useState([]);
  const [tab,            setTab]            = useState('overview');
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [toast,          setToast]          = useState(null);

  const loadTrip = useCallback(async () => {
    try {
      const [tripData, parts] = await Promise.all([
        api.getTrip(tripId),
        api.getParticipants(tripId),
      ]);
      setTrip(tripData);
      setParticipants(parts);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => { loadTrip(); }, [loadTrip]);

  function showToast(msg) {
    setToast(msg);
  }

  if (loading) return <LoadingState />;
  if (error)   return <ErrorMessage error={error} />;
  if (!trip)   return <ErrorMessage error="Trip not found" />;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Link to="/trips" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0 }}>
          <ArrowLeft size={14} /> Back to trips
        </Link>
      </div>

      {/* Trip header */}
      <div className="card card-pad" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">{trip.name}</h1>
            {trip.description && <p style={{ color: 'var(--color-muted)', fontSize: 14, marginTop: 4 }}>{trip.description}</p>}
            <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 13, color: 'var(--color-muted)' }}>
              <span>📅 {formatDate(trip.start_date)}{trip.end_date ? ` → ${formatDate(trip.end_date)}` : ''}</span>
              <span>👥 {trip.participant_count} participants</span>
              <span>🧾 {trip.expense_count} expenses</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Total Expenses</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-accent)' }}>{formatPaise(parseInt(trip.total_paise))}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`tab-btn${tab === id ? ' active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <OverviewTab trip={trip} participants={participants} onNavigate={setTab} />
      )}
      {tab === 'participants' && (
        <ParticipantsTab
          tripId={tripId}
          participants={participants}
          onRefresh={loadTrip}
          onToast={showToast}
        />
      )}
      {tab === 'expenses' && (
        <ExpensesTab
          tripId={tripId}
          participants={participants}
          onRefresh={loadTrip}
          onToast={showToast}
        />
      )}
      {tab === 'balances' && (
        <BalancesTab tripId={tripId} />
      )}
      {tab === 'settlements' && (
        <SettlementsTab
          tripId={tripId}
          participants={participants}
          onRefresh={loadTrip}
          onToast={showToast}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

function OverviewTab({ trip, participants, onNavigate }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="stats-grid" style={{ margin: 0 }}>
        <div className="stat-card">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value">{formatPaise(parseInt(trip.total_paise))}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Participants</div>
          <div className="stat-value">{trip.participant_count}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Expense Records</div>
          <div className="stat-value">{trip.expense_count}</div>
        </div>
      </div>

      <div className="card card-pad">
        <div className="card-title" style={{ marginBottom: 14 }}>Participants</div>
        {participants.length === 0 ? (
          <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>No participants yet.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {participants.map(p => (
              <div key={p.id} className="participant-chip">
                <div className="avatar avatar-sm">{p.name[0].toUpperCase()}</div>
                {p.name}
              </div>
            ))}
          </div>
        )}
        <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => onNavigate('participants')}>
          <Plus size={14} /> Manage participants
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => onNavigate('expenses')}>
          <Receipt size={14} /> View Expenses
        </button>
        <button className="btn btn-secondary" onClick={() => onNavigate('balances')}>
          <Scale size={14} /> View Balances
        </button>
        <button className="btn btn-secondary" onClick={() => onNavigate('settlements')}>
          <History size={14} /> Settlements
        </button>
      </div>
    </div>
  );
}
