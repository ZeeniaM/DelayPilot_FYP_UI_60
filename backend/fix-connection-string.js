// Script to help fix the connection string
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(__dirname, '.env');

console.log('🔧 Connection String Issue Detected\n');
console.log('The hostname cannot be resolved. This usually means:');
console.log('1. You need to use Connection Pooler format (port 6543)');
console.log('2. Your project might be paused');
console.log('3. Wrong connection string format\n');

console.log('Your project reference: sktinyoalzasqsuscpsb\n');

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function fixConnection() {
  console.log('Let\'s try the Connection Pooler format:\n');
  console.log('Go to Supabase Dashboard:');
  console.log('1. Settings → Database → Connection string');
  console.log('2. Click "Connection pooling" tab');
  console.log('3. Select "Transaction" mode');
  console.log('4. Copy the connection string\n');
  
  const poolerUrl = await question('Paste the Connection Pooler string (or press Enter to try default format): ');
  
  let connectionString = poolerUrl.trim();
  
  if (!connectionString) {
    // Try to construct from known format
    console.log('\nTrying default pooler format...');
    const password = await question('Enter your database password: ');
    connectionString = `postgresql://postgres.sktinyoalzasqsuscpsb:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
  }
  
  // Read existing .env
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Replace DATABASE_URL
  envContent = envContent.replace(/DATABASE_URL=.*/g, `DATABASE_URL=${connectionString}`);
  
  // Ensure DB_SSL is true
  if (!envContent.includes('DB_SSL=')) {
    envContent += '\nDB_SSL=true\n';
  } else {
    envContent = envContent.replace(/DB_SSL=.*/g, 'DB_SSL=true');
  }
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env file updated with Connection Pooler format!');
    console.log('\nNow test the connection: npm run test-connection\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  rl.close();
}

fixConnection();


