import pool from '../db/pool.js';

export async function getAllTrips() {
  const res = await pool.query(
    `SELECT t.*,
            COUNT(DISTINCT p.id)::INT         AS participant_count,
            COALESCE(SUM(e.amount_paise), 0)::BIGINT AS total_paise
     FROM trips t
     LEFT JOIN participants p ON p.trip_id = t.id
     LEFT JOIN expenses e     ON e.trip_id = t.id
     GROUP BY t.id
     ORDER BY t.created_at DESC`
  );
  return res.rows;
}

export async function getTripById(tripId) {
  const res = await pool.query(
    `SELECT t.*,
            (SELECT COUNT(*) FROM participants WHERE trip_id = t.id)::INT AS participant_count,
            (SELECT COUNT(*) FROM expenses WHERE trip_id = t.id)::INT AS expense_count,
            (SELECT COALESCE(SUM(amount_paise), 0) FROM expenses WHERE trip_id = t.id)::BIGINT AS total_paise
     FROM trips t
     WHERE t.id = $1`,
    [tripId]
  );
  return res.rows[0] || null;
}

export async function createTrip({ name, description, startDate, endDate }) {
  const res = await pool.query(
    `INSERT INTO trips (name, description, start_date, end_date)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [name.trim(), description?.trim() || null, startDate, endDate || null]
  );
  return res.rows[0];
}

export async function updateTrip(tripId, { name, description, startDate, endDate }) {
  const res = await pool.query(
    `UPDATE trips SET name=$1, description=$2, start_date=$3, end_date=$4, updated_at=NOW()
     WHERE id=$5 RETURNING *`,
    [name.trim(), description?.trim() || null, startDate, endDate || null, tripId]
  );
  return res.rows[0] || null;
}

export async function deleteTrip(tripId) {
  // Only allow deletion if no expenses or settlements exist
  const expCheck = await pool.query('SELECT 1 FROM expenses WHERE trip_id=$1 LIMIT 1', [tripId]);
  if (expCheck.rowCount > 0) {
    throw new Error('Cannot delete a trip that has recorded expenses');
  }
  const res = await pool.query('DELETE FROM trips WHERE id=$1 RETURNING id', [tripId]);
  return res.rows[0] || null;
}
