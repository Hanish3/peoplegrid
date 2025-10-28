// db.js
const { Pool } = require('pg');

const pool = new Pool({
  // Example of a completed, correct connection string
  connectionString: 'postgresql://postgres.svryonjbeiwkqdczlkpr:WuvMlyjMGmOUVmJb@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;