/**
 * Seed script — creates demo data for "Tech Conference 2026"
 * Safe to run multiple times; skips if demo trip already exists.
 */
import 'dotenv/config';
import pool from './pool.js';

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Skip if demo trip already exists
    const existing = await client.query(
      "SELECT id FROM trips WHERE name = 'Tech Conference 2026' LIMIT 1"
    );
    if (existing.rowCount > 0) {
      console.log('Demo data already exists — skipping seed.');
      await client.query('ROLLBACK');
      return;
    }

    // Create trip
    const tripRes = await client.query(
      `INSERT INTO trips (name, description, start_date, end_date)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Tech Conference 2026', 'Sample demo trip for CampusSplit', '2026-10-15', '2026-10-17']
    );
    const tripId = tripRes.rows[0].id;

    // Create participants
    const ashaRes = await client.query(
      `INSERT INTO participants (trip_id, name, email) VALUES ($1, $2, $3) RETURNING id`,
      [tripId, 'Asha', 'asha@example.com']
    );
    const balaRes = await client.query(
      `INSERT INTO participants (trip_id, name, email) VALUES ($1, $2, $3) RETURNING id`,
      [tripId, 'Bala', 'bala@example.com']
    );
    const charanRes = await client.query(
      `INSERT INTO participants (trip_id, name, email) VALUES ($1, $2, $3) RETURNING id`,
      [tripId, 'Charan', 'charan@example.com']
    );

    const ashaId   = ashaRes.rows[0].id;
    const balaId   = balaRes.rows[0].id;
    const charanId = charanRes.rows[0].id;

    // Expense 1: Asha pays ₹900 shared equally by all three (₹300 each)
    const exp1Res = await client.query(
      `INSERT INTO expenses (trip_id, paid_by_participant_id, title, category, amount_paise, expense_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [tripId, ashaId, 'Conference Registration', 'Tickets', 90000, '2026-10-15']
    );
    const exp1Id = exp1Res.rows[0].id;
    await client.query(
      `INSERT INTO expense_shares (expense_id, participant_id, share_paise) VALUES ($1,$2,$3),($1,$4,$5),($1,$6,$7)`,
      [exp1Id, ashaId, 30000, balaId, 30000, charanId, 30000]
    );

    // Expense 2: Bala pays ₹300 shared equally by Bala and Charan (₹150 each)
    const exp2Res = await client.query(
      `INSERT INTO expenses (trip_id, paid_by_participant_id, title, category, amount_paise, expense_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [tripId, balaId, 'Team Dinner', 'Food', 30000, '2026-10-16']
    );
    const exp2Id = exp2Res.rows[0].id;
    await client.query(
      `INSERT INTO expense_shares (expense_id, participant_id, share_paise) VALUES ($1,$2,$3),($1,$4,$5)`,
      [exp2Id, balaId, 15000, charanId, 15000]
    );

    await client.query('COMMIT');
    console.log('Demo data seeded successfully.');
    console.log('Expected balances:');
    console.log('  Asha:   +₹500 (should receive)');
    console.log('  Bala:   +₹100 (should receive)');
    console.log('  Charan: -₹600 (should pay)');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
