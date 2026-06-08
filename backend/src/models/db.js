const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        industry VARCHAR(100),
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'technician',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS equipment (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id),
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        serial_number VARCHAR(100),
        brand VARCHAR(100),
        model VARCHAR(100),
        location VARCHAR(255),
        status VARCHAR(50) DEFAULT 'operational',
        purchase_date DATE,
        last_maintenance DATE,
        photo_url TEXT,
        qr_code VARCHAR(255),
        technical_specs JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS breakdowns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        equipment_id UUID REFERENCES equipment(id),
        company_id UUID REFERENCES companies(id),
        declared_by UUID REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        severity VARCHAR(50) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'declared',
        category VARCHAR(100),
        photo_urls JSONB DEFAULT '[]',
        ai_diagnosis TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS breakdown_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        breakdown_id UUID REFERENCES breakdowns(id),
        status VARCHAR(50),
        notes TEXT,
        updated_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS spare_parts_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        breakdown_id UUID REFERENCES breakdowns(id),
        equipment_id UUID REFERENCES equipment(id),
        company_id UUID REFERENCES companies(id),
        requested_by UUID REFERENCES users(id),
        part_name VARCHAR(255) NOT NULL,
        part_reference VARCHAR(100),
        quantity INTEGER DEFAULT 1,
        urgency VARCHAR(50) DEFAULT 'normal',
        description TEXT,
        status VARCHAR(50) DEFAULT 'submitted',
        photo_urls JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        company_id UUID REFERENCES companies(id),
        title VARCHAR(255),
        message TEXT,
        type VARCHAR(50),
        reference_id UUID,
        reference_type VARCHAR(50),
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Database initialized');
  } finally {
    client.release();
  }
};

module.exports = { pool, initDB };
