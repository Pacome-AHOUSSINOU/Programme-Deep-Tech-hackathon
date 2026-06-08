const router = require('express').Router();
const { pool } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authMiddleware);

const SPARE_STATUSES = ['submitted', 'analysis', 'validation', 'sourcing', 'fabrication', 'delivery', 'closed'];

router.get('/', async (req, res) => {
  const { status, urgency } = req.query;
  let q = `SELECT s.*, e.name as equipment_name, u.name as requested_by_name
    FROM spare_parts_requests s
    LEFT JOIN equipment e ON s.equipment_id = e.id
    LEFT JOIN users u ON s.requested_by = u.id
    WHERE s.company_id = $1`;
  const p = [req.user.company_id];
  if (status) { p.push(status); q += ` AND s.status = $${p.length}`; }
  if (urgency) { p.push(urgency); q += ` AND s.urgency = $${p.length}`; }
  q += ' ORDER BY s.created_at DESC';
  const { rows } = await pool.query(q, p);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT s.*, e.name as equipment_name, u.name as requested_by_name
     FROM spare_parts_requests s LEFT JOIN equipment e ON s.equipment_id = e.id LEFT JOIN users u ON s.requested_by = u.id
     WHERE s.id = $1 AND s.company_id = $2`,
    [req.params.id, req.user.company_id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

router.post('/', upload.array('photos', 5), async (req, res) => {
  const { breakdown_id, equipment_id, part_name, part_reference, quantity, urgency, description } = req.body;
  const photo_urls = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
  const { rows } = await pool.query(
    `INSERT INTO spare_parts_requests (breakdown_id, equipment_id, company_id, requested_by, part_name, part_reference, quantity, urgency, description, photo_urls)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [breakdown_id || null, equipment_id, req.user.company_id, req.user.id, part_name, part_reference, quantity || 1, urgency || 'normal', description, JSON.stringify(photo_urls)]
  );
  // Notification
  await pool.query(
    `INSERT INTO notifications (company_id, title, message, type, reference_id, reference_type) VALUES ($1,$2,$3,$4,$5,$6)`,
    [req.user.company_id, 'Spare Part Requested', `Request for ${part_name}`, 'spare_part', rows[0].id, 'spare_part']
  );
  res.json(rows[0]);
});

router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!SPARE_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const { rows } = await pool.query(
    'UPDATE spare_parts_requests SET status=$1, updated_at=NOW() WHERE id=$2 AND company_id=$3 RETURNING *',
    [status, req.params.id, req.user.company_id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  await pool.query(
    `INSERT INTO notifications (company_id, title, message, type, reference_id, reference_type) VALUES ($1,$2,$3,$4,$5,$6)`,
    [req.user.company_id, 'Spare Part Status Updated', `${rows[0].part_name} status: ${status}`, 'status_change', req.params.id, 'spare_part']
  );
  res.json(rows[0]);
});

module.exports = router;
