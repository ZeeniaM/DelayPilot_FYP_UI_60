// Test both connection string formats
require('dotenv').config();
const { Pool } = require('pg');

console.log('🔍 Testing Different Connection Formats...\n');

const currentUrl = process.env.DATABASE_URL;

if (!currentUrl) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

console.log('Current connection string:', currentUrl.replace(/:[^:@]+@/, ':****@'));
console.log('\n');

// Extract info from current connection string
const match = currentUrl.match(/postgresql:\/\/(?:postgres\.)?([^:]+):([^@]+)@(.+):(\d+)\/(.+)/);
if (!match) {
  console.error('❌ Could not parse connection string');
  process.exit(1);
}

const [_, userPart, password, host, port, database] = match;
const projectRef = userPart.replace('postgres.', '').replace('postgres', '').split('.')[0] || host.split('.')[0];

console.log('Detected:');
console.log('  Project Reference:', projectRef);
console.log('  Host:', host);
console.log('  Port:', port);
console.log('  Database:', database);
console.log('\n');

// Try different connection formats
const formats = [
  {
    name: 'Direct Connection (Current)',
    url: currentUrl
  },
  {
    name: 'Connection Pooler (Transaction)',
    url: `postgresql://postgres.${projectRef}:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
  },
  {
    name: 'Connection Pooler (Session)',
    url: `postgresql://postgres.${projectRef}:${password}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`
  }
];

async function testConnection(name, url) {
  console.log(`\n🔄 Testing: ${name}`);
  console.log(`   ${url.replace(/:[^:@]+@/, ':****@')}`);
  
  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const result = await pool.query('SELECT NOW() as time');
    console.log(`   ✅ SUCCESS!`);
    console.log(`   ✅ Connected at: ${result.rows[0].time}`);
    await pool.end();
    return { success: true, url };
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    await pool.end();
    return { success: false, error: error.message };
  }
}

(async () => {
  console.log('Testing connection formats...\n');
  
  const results = [];
  for (const format of formats) {
    const result = await testConnection(format.name, format.url);
    results.push({ ...format, ...result });
    
    if (result.success) {
      console.log('\n🎉 Found working connection!');
      console.log('\n📝 Update your .env file with:');
      console.log(`DATABASE_URL=${format.url}`);
      console.log('\nThen run: npm run test-connection');
      process.exit(0);
    }
    
    // Wait a bit between attempts
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n❌ None of the connection formats worked.');
  console.log('\n💡 Troubleshooting steps:');
  console.log('1. Verify your Supabase project is active');
  console.log('2. Check if the project reference is correct');
  console.log('3. Try getting a fresh connection string from Supabase dashboard');
  console.log('4. Verify your database password is correct');
  console.log('\nSee CONNECTION_STATUS.md for more help.');
  
  process.exit(1);
})();


