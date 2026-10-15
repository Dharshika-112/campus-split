import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight } from 'lucide-react';
import { api } from '../services/api.js';
import { formatPaise, formatDate } from '../utils/format.js';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { ErrorMessage } from '../components/ui/ErrorMessage.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

export function Dashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    api.getDashboard()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorMessage error={error} />;
  if (!data)   return <ErrorMessage error={{ message: 'No data received from server' }} />;

  const { summary, recentTrips } = data;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Your trip expense overview</p>
        </div>
        <Link to="/trips/new" className="btn btn-primary">
          <Plus size={16} /> New Trip
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Trips</div>
          <div className="stat-value">{summary.total_trips}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Participants</div>
          <div className="stat-value">{summary.total_participants}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value">{formatPaise(parseInt(summary.total_paise))}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Trips</span>
          <Link to="/trips" className="btn btn-ghost btn-sm">View all <ArrowRight size={14} /></Link>
        </div>
        {recentTrips.length === 0 ? (
          <EmptyState
            icon="✈️"
            title="No trips yet"
            description="Create your first trip to start tracking shared expenses."
            action={<Link to="/trips/new" className="btn btn-primary">Create a Trip</Link>}
          />
        ) : (
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentTrips.map(trip => (
              <Link key={trip.id} to={`/trips/${trip.id}`} className="trip-card">
                <div className="trip-card-name">{trip.name}</div>
                {trip.description && (
                  <div style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 2 }}>{trip.description}</div>
                )}
                <div className="trip-card-amount">{formatPaise(parseInt(trip.total_paise))}</div>
                <div className="trip-card-meta">
                  <span>👥 {trip.participant_count} participants</span>
                  <span>📅 {formatDate(trip.start_date)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
