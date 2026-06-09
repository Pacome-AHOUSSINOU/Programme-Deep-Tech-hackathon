const router = require('express').Router();
const { pool } = require('../models/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', adminMiddleware, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM companies ORDER BY created_at DESC');
  res.json(rows);
});

router.get('/my', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM companies WHERE id = $1', [req.user.company_id]);
  res.json(rows[0]);
});

router.put('/my', async (req, res) => {
  const { name, industry, address, phone, email } = req.body;
  const { rows } = await pool.query(
    'UPDATE companies SET name=$1, industry=$2, address=$3, phone=$4, email=$5 WHERE id=$6 RETURNING *',
    [name, industry, address, phone, email, req.user.company_id]
  );
  res.json(rows[0]);
});

// Get users in company
router.get('/my/users', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, created_at FROM users WHERE company_id = $1 ORDER BY created_at DESC',
    [req.user.company_id]
  );
  res.json(rows);
});

// Add user to company
router.post('/my/users', adminMiddleware, async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { name, email, password, role } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    'INSERT INTO users (company_id, name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
    [req.user.company_id, name, email, hash, role || 'technician']
  );
  res.json(rows[0]);
});

module.exports = router;
