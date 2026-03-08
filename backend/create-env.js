// Helper script to create .env file for Supabase connection
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Supabase Connection Setup\n');
console.log('This will help you create your .env file with Supabase connection.\n');

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
  console.log('STEP 1: Get your Supabase connection string');
  console.log('1. Go to https://supabase.com and log in');
  console.log('2. Select your project');
  console.log('3. Go to Settings > Database');
  console.log('4. Copy the connection string from "Connection string" > "URI" tab\n');
  
  const connectionString = await question('Paste your Supabase connection string here: ');
  
  if (!connectionString || connectionString.trim().length === 0) {
    console.error('\n❌ Connection string is required!');
    process.exit(1);
  }

  const jwtSecret = await question('\nEnter JWT Secret (or press Enter for default): ') || 'your-super-secret-jwt-key-change-this-in-production';

  const envContent = `# Supabase Database Configuration
# Connection string from Supabase dashboard
DATABASE_URL=${connectionString.trim()}

# SSL Configuration (set to 'true' for Supabase)
DB_SSL=true

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# JWT Secret
JWT_SECRET=${jwtSecret}
`;

  const envPath = path.join(__dirname, '.env');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env file created successfully!');
    console.log(`📁 Location: ${envPath}\n`);
    
    console.log('Next steps:');
    console.log('1. Run: npm run test-connection');
    console.log('2. If successful, run: npm start');
    console.log('\n🎉 Setup complete!');
    
  } catch (error) {
    console.error('\n❌ Error creating .env file:', error.message);
    console.log('\nPlease create the .env file manually:');
    console.log('1. Create a file named .env in the backend folder');
    console.log('2. Copy the content from env.template');
    console.log('3. Update DATABASE_URL with your connection string');
  }
  
  rl.close();
}

setup();


