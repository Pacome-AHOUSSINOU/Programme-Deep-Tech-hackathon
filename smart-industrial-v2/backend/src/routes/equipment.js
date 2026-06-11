const router = require('express').Router();
const { pool } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { v4: uuidv4 } = require('uuid');

router.use(authMiddleware);

// List equipment
router.get('/', async (req, res) => {
  const { category, status, search } = req.query;
  let query = 'SELECT * FROM equipment WHERE company_id = $1';
  const params = [req.user.company_id];
  if (category) { params.push(category); query += ` AND category = $${params.length}`; }
  if (status) { params.push(status); query += ` AND status = $${params.length}`; }
  if (search) { params.push(`%${search}%`); query += ` AND (name ILIKE $${params.length} OR serial_number ILIKE $${params.length})`; }
  query += ' ORDER BY created_at DESC';
  const { rows } = await pool.query(query, params);
  res.json(rows);
});

// Get one
router.get('/:id', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM equipment WHERE id = $1 AND company_id = $2',
    [req.params.id, req.user.company_id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });

  // Get breakdown history
  const { rows: breakdowns } = await pool.query(
    'SELECT b.*, u.name as declared_by_name FROM breakdowns b LEFT JOIN users u ON b.declared_by = u.id WHERE b.equipment_id = $1 ORDER BY b.created_at DESC LIMIT 10',
    [req.params.id]
  );
  res.json({ ...rows[0], breakdowns });
});

// Create equipment
router.post('/', upload.single('photo'), async (req, res) => {
  const { name, category, serial_number, brand, model, location, purchase_date, technical_specs } = req.body;
  const qr_code = uuidv4();
  const photo_url = req.file ? `/uploads/${req.file.filename}` : null;
  const { rows } = await pool.query(
    `INSERT INTO equipment (company_id, name, category, serial_number, brand, model, location, purchase_date, photo_url, qr_code, technical_specs)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [req.user.company_id, name, category, serial_number, brand, model, location, purchase_date || null, photo_url, qr_code, technical_specs ? JSON.parse(technical_specs) : {}]
  );
  res.json(rows[0]);
});

// Update equipment
router.put('/:id', upload.single('photo'), async (req, res) => {
  const { name, category, serial_number, brand, model, location, status, last_maintenance, technical_specs } = req.body;
  const existing = await pool.query('SELECT * FROM equipment WHERE id = $1 AND company_id = $2', [req.params.id, req.user.company_id]);
  if (!existing.rows[0]) return res.status(404).json({ error: 'Not found' });
  const photo_url = req.file ? `/uploads/${req.file.filename}` : existing.rows[0].photo_url;
  const { rows } = await pool.query(
    `UPDATE equipment SET name=$1,category=$2,serial_number=$3,brand=$4,model=$5,location=$6,status=$7,last_maintenance=$8,photo_url=$9,technical_specs=$10 WHERE id=$11 AND company_id=$12 RETURNING *`,
    [name, category, serial_number, brand, model, location, status, last_maintenance || null, photo_url, technical_specs ? JSON.parse(technical_specs) : {}, req.params.id, req.user.company_id]
  );
  res.json(rows[0]);
});

// Delete
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM equipment WHERE id = $1 AND company_id = $2', [req.params.id, req.user.company_id]);
  res.json({ success: true });
});

// Get by QR code
router.get('/qr/:qrCode', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM equipment WHERE qr_code = $1', [req.params.qrCode]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

module.exports = router;
