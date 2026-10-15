import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { api } from '../services/api.js';
import { formatPaise, formatDate } from '../utils/format.js';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { ErrorMessage } from '../components/ui/ErrorMessage.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

export function TripList() {
  const [trips,   setTrips]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    api.getTrips()
      .then(setTrips)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Trips</h1>
          <p className="page-sub">{trips.length} trip{trips.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link to="/trips/new" className="btn btn-primary"><Plus size={16} /> New Trip</Link>
      </div>

      <ErrorMessage error={error} />

      {trips.length === 0 ? (
        <EmptyState
          icon="✈️"
          title="No trips yet"
          description="Create your first trip to start tracking shared expenses."
          action={<Link to="/trips/new" className="btn btn-primary">Create a Trip</Link>}
        />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {trips.map(trip => (
            <Link key={trip.id} to={`/trips/${trip.id}`} className="trip-card">
              <div className="trip-card-name">{trip.name}</div>
              {trip.description && (
                <div style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 2 }}>{trip.description}</div>
              )}
              <div className="trip-card-amount">{formatPaise(parseInt(trip.total_paise))}</div>
              <div className="trip-card-meta">
                <span>👥 {trip.participant_count} participants</span>
                <span>📅 {formatDate(trip.start_date)}</span>
                {trip.end_date && <span>→ {formatDate(trip.end_date)}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
