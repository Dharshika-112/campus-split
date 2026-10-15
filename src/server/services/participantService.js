import pool from '../db/pool.js';

export async function getParticipants(tripId) {
  const res = await pool.query(
    'SELECT * FROM participants WHERE trip_id=$1 ORDER BY created_at',
    [tripId]
  );
  return res.rows;
}

export async function addParticipant(tripId, { name, email }) {
  // Check for duplicate (case-insensitive)
  const dup = await pool.query(
    'SELECT id FROM participants WHERE trip_id=$1 AND LOWER(name)=LOWER($2)',
    [tripId, name.trim()]
  );
  if (dup.rowCount > 0) {
    throw new Error(`A participant named "${name.trim()}" already exists in this trip`);
  }

  const res = await pool.query(
    `INSERT INTO participants (trip_id, name, email) VALUES ($1,$2,$3) RETURNING *`,
    [tripId, name.trim(), email?.trim() || null]
  );
  return res.rows[0];
}

export async function updateParticipant(participantId, { name, email }) {
  const res = await pool.query(
    `UPDATE participants SET name=$1, email=$2, updated_at=NOW() WHERE id=$3 RETURNING *`,
    [name.trim(), email?.trim() || null, participantId]
  );
  return res.rows[0] || null;
}

export async function deleteParticipant(participantId) {
  // Block deletion if participant has expenses or settlements
  const expCheck = await pool.query(
    `SELECT 1 FROM expenses WHERE paid_by_participant_id=$1
     UNION SELECT 1 FROM expense_shares WHERE participant_id=$1
     UNION SELECT 1 FROM settlements WHERE from_participant_id=$1 OR to_participant_id=$1
     LIMIT 1`,
    [participantId]
  );
  if (expCheck.rowCount > 0) {
    throw new Error('Cannot remove a participant who has expense or settlement records');
  }
  const res = await pool.query('DELETE FROM participants WHERE id=$1 RETURNING id', [participantId]);
  return res.rows[0] || null;
}

export async function participantBelongsToTrip(participantId, tripId) {
  const res = await pool.query(
    'SELECT 1 FROM participants WHERE id=$1 AND trip_id=$2',
    [participantId, tripId]
  );
  return res.rowCount > 0;
}
