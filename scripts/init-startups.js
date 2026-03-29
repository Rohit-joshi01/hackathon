async function init() {
  const { Pool } = await import('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const query = `
    CREATE TABLE IF NOT EXISTS startups (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      team_size VARCHAR(50),
      product_description TEXT,
      product_stage VARCHAR(100),
      target_audience TEXT,
      revenue_model VARCHAR(100),
      goals TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    console.log('Creating startups table...');
    await pool.query(query);
    console.log('Startups table created successfully');
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    await pool.end();
  }
}

init();
