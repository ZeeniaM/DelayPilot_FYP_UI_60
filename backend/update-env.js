// Script to add DATABASE_URL to existing .env file
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(__dirname, '.env');

console.log('🔧 Updating .env file with DATABASE_URL...\n');

// Read existing .env file
let existingContent = '';
if (fs.existsSync(envPath)) {
  existingContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ Found existing .env file\n');
}

// Check if DATABASE_URL already exists
if (existingContent.includes('DATABASE_URL=')) {
  console.log('⚠️  DATABASE_URL already exists in .env file');
  console.log('\nCurrent DATABASE_URL:');
  const match = existingContent.match(/DATABASE_URL=(.+)/);
  if (match) {
    console.log(match[1].substring(0, 60) + '...');
  }
  rl.question('\nDo you want to replace it? (y/n): ', (answer) => {
    if (answer.toLowerCase() !== 'y') {
      console.log('\n✅ Keeping existing DATABASE_URL');
      rl.close();
      return;
    }
    getDatabaseUrl();
  });
} else {
  getDatabaseUrl();
}

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function getDatabaseUrl() {
  console.log('\n📝 We need your Supabase PostgreSQL connection string');
  console.log('   (This is different from the Supabase URL you already added)\n');
  console.log('To get it:');
  console.log('1. Go to https://supabase.com');
  console.log('2. Select your project');
  console.log('3. Settings → Database → Connection string → URI tab');
  console.log('4. Copy the connection string\n');
  
  const connectionString = await question('Paste your PostgreSQL connection string here: ');
  
  if (!connectionString || connectionString.trim().length === 0) {
    console.error('\n❌ Connection string is required!');
    rl.close();
    process.exit(1);
  }

  // Build new .env content
  let newContent = existingContent;
  
  // Remove old DATABASE_URL if exists
  newContent = newContent.replace(/DATABASE_URL=.*\n/g, '');
  
  // Add new DATABASE_URL at the beginning
  newContent = 'DATABASE_URL=' + connectionString.trim() + '\n\n' + newContent;
  
  // Add other required variables if missing
  if (!newContent.includes('DB_SSL=')) {
    newContent += '\nDB_SSL=true\n';
  }
  if (!newContent.includes('PORT=')) {
    newContent += 'PORT=5000\n';
  }
  if (!newContent.includes('NODE_ENV=')) {
    newContent += 'NODE_ENV=development\n';
  }
  if (!newContent.includes('FRONTEND_URL=')) {
    newContent += 'FRONTEND_URL=http://localhost:3000\n';
  }
  if (!newContent.includes('JWT_SECRET=')) {
    newContent += 'JWT_SECRET=your-super-secret-jwt-key-change-this-in-production\n';
  }
  
  // Write to file
  try {
    fs.writeFileSync(envPath, newContent);
    console.log('\n✅ .env file updated successfully!');
    console.log(`📁 Location: ${envPath}\n`);
    console.log('✅ DATABASE_URL added');
    console.log('✅ Your existing Supabase URL and API key are preserved\n');
    console.log('Next step: Run "npm run test-connection" to test the connection');
  } catch (error) {
    console.error('\n❌ Error updating .env file:', error.message);
  }
  
  rl.close();
}


