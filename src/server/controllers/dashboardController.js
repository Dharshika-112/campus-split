import pool from '../db/pool.js';

export async function getDashboard(req, res, next) {
  try {
    const summaryRes = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM trips)::INT                         AS total_trips,
         (SELECT COUNT(*) FROM participants)::INT                  AS total_participants,
         (SELECT COALESCE(SUM(amount_paise), 0) FROM expenses)::BIGINT AS total_paise`
    );

    const recentRes = await pool.query(
      `SELECT t.*,
              (SELECT COUNT(*) FROM participants WHERE trip_id = t.id)::INT AS participant_count,
              (SELECT COALESCE(SUM(amount_paise), 0) FROM expenses WHERE trip_id = t.id)::BIGINT AS total_paise
       FROM trips t
       ORDER BY t.created_at DESC
       LIMIT 5`
    );

    res.json({
      summary: summaryRes.rows[0],
      recentTrips: recentRes.rows,
    });
  } catch (err) { next(err); }
}
