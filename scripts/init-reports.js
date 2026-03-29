async function init() {
  const { Pool } = await import('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const query = `
    CREATE TABLE IF NOT EXISTS reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      startup_id UUID REFERENCES startups(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      file_url TEXT NOT NULL,
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    console.log('Creating reports table...');
    await pool.query(query);
    console.log('Reports table created successfully');
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    await pool.end();
  }
}

init();
