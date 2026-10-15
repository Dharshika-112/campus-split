/**
 * Centralized Express error handler.
 * Converts known error types to appropriate HTTP responses.
 */
export function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} — ${err.message}`);

  if (err.code === '23505') { // Postgres unique violation
    return res.status(409).json({ error: 'A record with these values already exists' });
  }
  if (err.code === '23503') { // Postgres foreign key violation
    return res.status(400).json({ error: 'Referenced record does not exist' });
  }
  if (err.code === '23514') { // Postgres check constraint violation
    return res.status(400).json({ error: 'Data constraint violation: ' + err.message });
  }

  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
}

export function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
}
