require('dotenv').config();
const { pool, initDB } = require('../models/db');
const bcrypt = require('bcryptjs');

async function seed() {
  await initDB();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Company
    const comp = await client.query(
      "INSERT INTO companies (name, industry) VALUES ('TechCorp Industries', 'Manufacturing') ON CONFLICT DO NOTHING RETURNING *"
    );
    if (comp.rows[0]) {
      const hash = await bcrypt.hash('admin123', 10);
      const user = await client.query(
        "INSERT INTO users (company_id, name, email, password, role) VALUES ($1, 'Admin User', 'admin@techcorp.com', $2, 'admin') ON CONFLICT DO NOTHING RETURNING *",
        [comp.rows[0].id, hash]
      );
      const tech = await client.query(
        "INSERT INTO users (company_id, name, email, password, role) VALUES ($1, 'Tech User', 'tech@techcorp.com', $2, 'technician') ON CONFLICT DO NOTHING RETURNING *",
        [comp.rows[0].id, hash]
      );
      if (user.rows[0]) {
        const eq = await client.query(
          "INSERT INTO equipment (company_id, name, category, serial_number, brand, model, location, status) VALUES ($1,'CNC Machine A','CNC','SN-001','Haas','VF-2','Hall A','operational') RETURNING *",
          [comp.rows[0].id]
        );
        await client.query(
          "INSERT INTO equipment (company_id, name, category, serial_number, brand, model, location, status) VALUES ($1,'Hydraulic Press B','Press','SN-002','Bosch','HP-500','Hall B','breakdown') RETURNING *",
          [comp.rows[0].id]
        );
        await client.query(
          "INSERT INTO breakdowns (equipment_id, company_id, declared_by, title, description, severity, status, category) VALUES ($1,$2,$3,'Hydraulic leak detected','Oil leaking from main cylinder','high','inspection','hydraulic')",
          [eq.rows[0].id, comp.rows[0].id, user.rows[0].id]
        );
        console.log('Seeded! Login: admin@techcorp.com / admin123');
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
  } finally {
    client.release();
    process.exit(0);
  }
}

seed();
