const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // Dashboard
  getDashboard: () => request('GET', '/dashboard'),

  // Trips
  getTrips:       ()            => request('GET',   '/trips'),
  getTrip:        (id)          => request('GET',   `/trips/${id}`),
  createTrip:     (body)        => request('POST',  '/trips', body),
  updateTrip:     (id, body)    => request('PATCH', `/trips/${id}`, body),
  deleteTrip:     (id)          => request('DELETE',`/trips/${id}`),

  // Participants
  getParticipants:    (tripId)        => request('GET',   `/trips/${tripId}/participants`),
  addParticipant:     (tripId, body)  => request('POST',  `/trips/${tripId}/participants`, body),
  updateParticipant:  (id, body)      => request('PATCH', `/participants/${id}`, body),
  deleteParticipant:  (id)            => request('DELETE',`/participants/${id}`),

  // Expenses
  getExpenses:    (tripId)       => request('GET',   `/trips/${tripId}/expenses`),
  createExpense:  (tripId, body) => request('POST',  `/trips/${tripId}/expenses`, body),
  updateExpense:  (tripId, id, body) => request('PATCH', `/trips/${tripId}/expenses/${id}`, body),
  deleteExpense:  (tripId, id)   => request('DELETE',`/trips/${tripId}/expenses/${id}`),

  // Balances + settlement plan
  getBalances:       (tripId) => request('GET', `/trips/${tripId}/balances`),
  getSettlementPlan: (tripId) => request('GET', `/trips/${tripId}/settlement-plan`),

  // Settlements
  getSettlements:   (tripId)       => request('GET',  `/trips/${tripId}/settlements`),
  createSettlement: (tripId, body) => request('POST', `/trips/${tripId}/settlements`, body),
};
