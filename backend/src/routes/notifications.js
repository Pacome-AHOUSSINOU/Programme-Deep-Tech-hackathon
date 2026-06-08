const router = require('express').Router();
const { pool } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM notifications WHERE company_id=$1 ORDER BY created_at DESC LIMIT 50',
    [req.user.company_id]
  );
  res.json(rows);
});

router.patch('/:id/read', async (req, res) => {
  await pool.query('UPDATE notifications SET read=true WHERE id=$1 AND company_id=$2', [req.params.id, req.user.company_id]);
  res.json({ success: true });
});

router.patch('/read-all', async (req, res) => {
  await pool.query('UPDATE notifications SET read=true WHERE company_id=$1', [req.user.company_id]);
  res.json({ success: true });
});

router.get('/unread-count', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT COUNT(*) as count FROM notifications WHERE company_id=$1 AND read=false',
    [req.user.company_id]
  );
  res.json({ count: parseInt(rows[0].count) });
});

module.exports = router;
