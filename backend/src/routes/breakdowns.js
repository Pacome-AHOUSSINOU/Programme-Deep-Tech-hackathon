const router = require('express').Router();
const { pool } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authMiddleware);

const WORKFLOW_STEPS = ['declared', 'analysis', 'inspection', 'validation', 'fabrication', 'delivery', 'closed'];

// List breakdowns
router.get('/', async (req, res) => {
  const { status, severity, equipment_id } = req.query;
  let query = `SELECT b.*, e.name as equipment_name, u.name as declared_by_name
    FROM breakdowns b
    LEFT JOIN equipment e ON b.equipment_id = e.id
    LEFT JOIN users u ON b.declared_by = u.id
    WHERE b.company_id = $1`;
  const params = [req.user.company_id];
  if (status) { params.push(status); query += ` AND b.status = $${params.length}`; }
  if (severity) { params.push(severity); query += ` AND b.severity = $${params.length}`; }
  if (equipment_id) { params.push(equipment_id); query += ` AND b.equipment_id = $${params.length}`; }
  query += ' ORDER BY b.created_at DESC';
  const { rows } = await pool.query(query, params);
  res.json(rows);
});

// Get one with history
router.get('/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT b.*, e.name as equipment_name, u.name as declared_by_name
     FROM breakdowns b LEFT JOIN equipment e ON b.equipment_id = e.id LEFT JOIN users u ON b.declared_by = u.id
     WHERE b.id = $1 AND b.company_id = $2`,
    [req.params.id, req.user.company_id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  const { rows: history } = await pool.query(
    'SELECT bh.*, u.name as updated_by_name FROM breakdown_history bh LEFT JOIN users u ON bh.updated_by = u.id WHERE bh.breakdown_id = $1 ORDER BY bh.created_at',
    [req.params.id]
  );
  const { rows: parts } = await pool.query(
    'SELECT * FROM spare_parts_requests WHERE breakdown_id = $1',
    [req.params.id]
  );
  res.json({ ...rows[0], history, spare_parts: parts });
});

// Declare breakdown
router.post('/', upload.array('photos', 5), async (req, res) => {
  const { equipment_id, title, description, severity, category } = req.body;
  const photo_urls = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO breakdowns (equipment_id, company_id, declared_by, title, description, severity, category, photo_urls)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [equipment_id, req.user.company_id, req.user.id, title, description, severity || 'medium', category, JSON.stringify(photo_urls)]
    );
    // Update equipment status
    await client.query('UPDATE equipment SET status = $1 WHERE id = $2', ['breakdown', equipment_id]);
    // Log history
    await client.query(
      'INSERT INTO breakdown_history (breakdown_id, status, notes, updated_by) VALUES ($1, $2, $3, $4)',
      [rows[0].id, 'declared', 'Breakdown declared', req.user.id]
    );
    // Create notifications
    await client.query(
      `INSERT INTO notifications (company_id, title, message, type, reference_id, reference_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.company_id, 'New Breakdown Declared', `${title} on equipment`, 'breakdown', rows[0].id, 'breakdown']
    );
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally { client.release(); }
});

// Update status (workflow)
router.patch('/:id/status', async (req, res) => {
  const { status, notes } = req.body;
  if (!WORKFLOW_STEPS.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'UPDATE breakdowns SET status=$1, updated_at=NOW() WHERE id=$2 AND company_id=$3 RETURNING *',
      [status, req.params.id, req.user.company_id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    await client.query(
      'INSERT INTO breakdown_history (breakdown_id, status, notes, updated_by) VALUES ($1, $2, $3, $4)',
      [req.params.id, status, notes || '', req.user.id]
    );
    if (status === 'closed') {
      await client.query('UPDATE equipment SET status = $1 WHERE id = $2', ['operational', rows[0].equipment_id]);
    }
    await client.query(
      `INSERT INTO notifications (company_id, title, message, type, reference_id, reference_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.company_id, 'Breakdown Status Updated', `Status changed to ${status}`, 'status_change', req.params.id, 'breakdown']
    );
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally { client.release(); }
});

// Add AI diagnosis
router.patch('/:id/diagnosis', async (req, res) => {
  const { ai_diagnosis } = req.body;
  const { rows } = await pool.query(
    'UPDATE breakdowns SET ai_diagnosis=$1 WHERE id=$2 AND company_id=$3 RETURNING *',
    [ai_diagnosis, req.params.id, req.user.company_id]
  );
  res.json(rows[0]);
});

module.exports = router;
