const dotenv = require('dotenv');
const path = require('path');
const { Client } = require('pg');

dotenv.config({ path: path.join(__dirname, '.env') });

async function verifyPostgresConnection() {
  console.log('\n=========================================');
  console.log('   FitCommit PostgreSQL Password Test   ');
  console.log('=========================================');

  const host = process.env.PG_HOST || 'localhost';
  const port = parseInt(process.env.PG_PORT, 10) || 5432;
  const user = process.env.PG_USER || 'postgres';
  const password = process.env.PG_PASSWORD;
  const targetDb = process.env.PG_DATABASE || 'fitcommit';
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!password && !databaseUrl) {
    console.log('⚠️  PG_PASSWORD is currently blank in server/.env.');
    console.log('👉 Please enter your PostgreSQL password on line 17 of server/.env and run this test again.\n');
    process.exit(1);
  }

  const clientConfig = databaseUrl
    ? { connectionString: databaseUrl, ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false } }
    : { host, port, user, password, database: 'postgres' };

  console.log(`Connecting to PostgreSQL as user '${user}' on ${host}:${port}...`);

  const client = new Client(clientConfig);

  try {
    await client.connect();
    console.log('\n✅ SUCCESS: Your PostgreSQL password is 100% CORRECT!');
    
    // Check if target database exists
    const res = await client.query('SELECT datname FROM pg_database WHERE datname = $1', [targetDb]);
    if (res.rows.length > 0) {
      console.log(`✅ Target database '${targetDb}' was found.`);
    } else {
      console.log(`ℹ️  Password works, but database '${targetDb}' does not exist yet.`);
      console.log(`   (No worries: FitCommit can automatically create it, or you can create it in pgAdmin).`);
    }

    const versionRes = await client.query('SELECT version()');
    console.log(`📦 PostgreSQL Version: ${versionRes.rows[0].version.split(',')[0]}`);
    console.log('=========================================\n');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.log('\n❌ CONNECTION FAILED:');
    if (err.code === '28P01') {
      console.log('🔒 Reason: PASSWORD AUTHENTICATION FAILED.');
      console.log('👉 The password in server/.env does NOT match the password for user \'' + user + '\'.');
      console.log('   Double-check the password you use when logging into pgAdmin 4.');
    } else if (err.code === 'ECONNREFUSED') {
      console.log('🔌 Reason: CONNECTION REFUSED.');
      console.log('👉 PostgreSQL service is not running on port ' + port + ', or is not installed.');
      console.log('   Make sure the PostgreSQL service is started in Windows Services.');
    } else {
      console.log(`⚠️  Error message: ${err.message} (Code: ${err.code || 'UNKNOWN'})`);
    }
    console.log('=========================================\n');
    process.exit(1);
  }
}

verifyPostgresConnection();
