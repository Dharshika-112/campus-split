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
              COUNT(DISTINCT p.id)::INT          AS participant_count,
              COALESCE(SUM(e.amount_paise), 0)::BIGINT AS total_paise
       FROM trips t
       LEFT JOIN participants p ON p.trip_id = t.id
       LEFT JOIN expenses e     ON e.trip_id = t.id
       GROUP BY t.id
       ORDER BY t.created_at DESC
       LIMIT 5`
    );

    res.json({
      summary: summaryRes.rows[0],
      recentTrips: recentRes.rows,
    });
  } catch (err) { next(err); }
}
