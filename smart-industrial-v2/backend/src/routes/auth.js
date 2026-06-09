const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../models/db');

// Register company + admin user
router.post('/register', async (req, res) => {
  const { companyName, industry, name, email, password } = req.body;
  if (!companyName || !name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const comp = await client.query(
      'INSERT INTO companies (name, industry) VALUES ($1, $2) RETURNING *',
      [companyName, industry]
    );
    const hash = await bcrypt.hash(password, 10);
    const user = await client.query(
      'INSERT INTO users (company_id, name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, company_id',
      [comp.rows[0].id, name, email, hash, 'admin']
    );
    await client.query('COMMIT');
    const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: user.rows[0], company: comp.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(400).json({ error: 'Email already used' });
    throw err;
  } finally { client.release(); }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query(
    `SELECT u.*, c.name as company_name FROM users u LEFT JOIN companies c ON u.company_id = c.id WHERE u.email = $1`,
    [email]
  );
  if (!rows[0]) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, rows[0].password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const { password: _, ...user } = rows[0];
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user });
});

module.exports = router;
