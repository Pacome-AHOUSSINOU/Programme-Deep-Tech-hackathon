const router = require('express').Router();
const { pool } = require('../models/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Main dashboard stats
router.get('/stats', async (req, res) => {
  const cid = req.user.company_id;
  const [equip, breakdowns, parts, equipByStatus, breakdownBySeverity, breakdownTrend, topFailing, mostRequested] = await Promise.all([
    pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status=\'operational\') as operational, COUNT(*) FILTER (WHERE status=\'breakdown\') as breakdown FROM equipment WHERE company_id=$1', [cid]),
    pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status != \'closed\') as active, COUNT(*) FILTER (WHERE status=\'closed\') as resolved FROM breakdowns WHERE company_id=$1', [cid]),
    pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status != \'closed\') as pending FROM spare_parts_requests WHERE company_id=$1', [cid]),
    pool.query('SELECT status, COUNT(*) as count FROM equipment WHERE company_id=$1 GROUP BY status', [cid]),
    pool.query('SELECT severity, COUNT(*) as count FROM breakdowns WHERE company_id=$1 GROUP BY severity', [cid]),
    pool.query(`SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as count FROM breakdowns WHERE company_id=$1 AND created_at > NOW() - INTERVAL '6 months' GROUP BY month ORDER BY month`, [cid]),
    pool.query(`SELECT e.name, COUNT(*) as breakdown_count FROM breakdowns b JOIN equipment e ON b.equipment_id = e.id WHERE b.company_id=$1 GROUP BY e.id, e.name ORDER BY breakdown_count DESC LIMIT 5`, [cid]),
    pool.query(`SELECT part_name, COUNT(*) as request_count FROM spare_parts_requests WHERE company_id=$1 GROUP BY part_name ORDER BY request_count DESC LIMIT 5`, [cid])
  ]);

  res.json({
    equipment: equip.rows[0],
    breakdowns: breakdowns.rows[0],
    spare_parts: parts.rows[0],
    equipment_by_status: equipByStatus.rows,
    breakdown_by_severity: breakdownBySeverity.rows,
    breakdown_trend: breakdownTrend.rows,
    top_failing_equipment: topFailing.rows,
    most_requested_parts: mostRequested.rows
  });
});

// Recent activity
router.get('/activity', async (req, res) => {
  const cid = req.user.company_id;
  const { rows: recent_breakdowns } = await pool.query(
    `SELECT b.id, b.title, b.status, b.severity, b.created_at, e.name as equipment_name
     FROM breakdowns b LEFT JOIN equipment e ON b.equipment_id = e.id
     WHERE b.company_id=$1 ORDER BY b.created_at DESC LIMIT 5`, [cid]
  );
  const { rows: recent_parts } = await pool.query(
    `SELECT s.id, s.part_name, s.status, s.urgency, s.created_at, e.name as equipment_name
     FROM spare_parts_requests s LEFT JOIN equipment e ON s.equipment_id = e.id
     WHERE s.company_id=$1 ORDER BY s.created_at DESC LIMIT 5`, [cid]
  );
  res.json({ recent_breakdowns, recent_parts });
});

// Admin: all companies stats
router.get('/admin', adminMiddleware, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT c.id, c.name, c.industry,
      COUNT(DISTINCT e.id) as equipment_count,
      COUNT(DISTINCT b.id) FILTER (WHERE b.status != 'closed') as active_breakdowns,
      COUNT(DISTINCT s.id) FILTER (WHERE s.status != 'closed') as pending_parts
    FROM companies c
    LEFT JOIN equipment e ON c.id = e.company_id
    LEFT JOIN breakdowns b ON c.id = b.company_id
    LEFT JOIN spare_parts_requests s ON c.id = s.company_id
    GROUP BY c.id, c.name, c.industry ORDER BY c.name
  `);
  res.json(rows);
});

module.exports = router;
