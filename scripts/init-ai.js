async function init() {
  const { Pool } = await import('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    console.log('Creating product_reports table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        startup_id UUID REFERENCES startups(id) ON DELETE CASCADE,
        report_json JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('product_reports table created successfully');

    console.log('Creating feature_requests table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feature_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        startup_id UUID REFERENCES startups(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        requested_by VARCHAR(255),
        department VARCHAR(255),
        status VARCHAR(50) NOT NULL
      );
    `);
    console.log('feature_requests table created successfully');

    console.log('Creating feature_decisions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feature_decisions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        feature_id UUID UNIQUE REFERENCES feature_requests(id) ON DELETE CASCADE,
        decision_json JSONB NOT NULL
      );
    `);
    console.log('feature_decisions table created successfully');
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    await pool.end();
  }
}

init();
