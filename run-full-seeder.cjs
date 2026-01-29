// Full database seeder - creates all demo data for 3 tenants
// Run with: node run-full-seeder.cjs

const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyDkCK8ydbZ0f-cApVCc_VZ9o0dUqgJq5hQ',
  authDomain: 'hr-system-9dfae.firebaseapp.com',
  projectId: 'hr-system-9dfae',
  storageBucket: 'hr-system-9dfae.firebasestorage.app',
  messagingSenderId: '467663318758',
  appId: '1:467663318758:web:3c74f82c5c7d3b5eb1e8e0'
};

console.log('🔧 Initializing Firebase...');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('✅ Firebase initialized');
console.log('📦 Loading seeder module...\n');

// We need to use dynamic import for ES modules from CommonJS
(async () => {
  try {
    // Import the seeder module
    const seederModule = await import('./src/services/seeder.ts');
    const { Seeder } = seederModule;

    console.log('🌱 Starting full database seed...');
    console.log('⚠️  This will create demo data for all 3 tenants:');
    console.log('   - Speccon Holdings (S)');
    console.log('   - Megro Holdings (M)');
    console.log('   - Andebe Holdings (A)\n');

    console.log('📋 Seeding will include:');
    console.log('   ✓ Companies/Tenants');
    console.log('   ✓ Departments (14 per tenant)');
    console.log('   ✓ Job Titles');
    console.log('   ✓ Employees (20 per tenant = 60 total)');
    console.log('   ✓ Users with roles');
    console.log('   ✓ Leave types and balances');
    console.log('   ✓ Sample leave requests');
    console.log('   ✓ Demo access requests\n');

    // Run the full seeder
    await Seeder.clearAndReseed();

    console.log('\n✅ Full seeding completed successfully!');
    console.log('📊 Your database now has:');
    console.log('   - 3 companies');
    console.log('   - 42 departments (14 per company)');
    console.log('   - 60 employees (20 per company)');
    console.log('   - Multiple users with various roles');
    console.log('   - Leave data and requests');
    console.log('\n🎉 You can now log in with test credentials!');
    console.log('   Email: tumetse@speccon.co.za');
    console.log('   Password: #Kei2metsi');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
})();
