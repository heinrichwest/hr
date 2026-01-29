// Quick script to restore the 3 tenants
// Run with: node restore-tenants.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, setDoc, doc, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyDkCK8ydbZ0f-cApVCc_VZ9o0dUqgJq5hQ',
  authDomain: 'hr-system-9dfae.firebaseapp.com',
  projectId: 'hr-system-9dfae',
  storageBucket: 'hr-system-9dfae.firebasestorage.app',
  messagingSenderId: '467663318758',
  appId: '1:467663318758:web:3c74f82c5c7d3b5eb1e8e0'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TENANTS = [
  { name: 'Speccon', suffix: '(S)', domain: 'speccon.co.za' },
  { name: 'Megro', suffix: '(M)', domain: 'megro.co.za' },
  { name: 'Andebe', suffix: '(A)', domain: 'andebe.co.za' }
];

async function restoreTenants() {
  console.log('🔄 Checking current companies...');
  const companiesSnapshot = await getDocs(collection(db, 'companies'));
  console.log(`Found ${companiesSnapshot.size} companies`);

  console.log('🌱 Creating 3 tenants...\n');

  for (const tenant of TENANTS) {
    const legalName = `${tenant.name} Holdings ${tenant.suffix}`;
    const companyId = tenant.name.toLowerCase();

    const company = {
      id: companyId,
      legalName,
      tradingName: tenant.name,
      registrationNumber: `REG-${companyId.toUpperCase()}-001`,
      payeReference: `7${Math.floor(Math.random() * 1000000000)}`,
      uifReference: `U${Math.floor(Math.random() * 1000000000)}`,
      physicalAddress: {
        line1: '123 Business Street',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2001',
        country: 'South Africa'
      },
      email: `info@${tenant.domain}`,
      phone: '+27 11 123 4567',
      createdAt: new Date().toISOString(),
      isActive: true
    };

    await setDoc(doc(db, 'companies', companyId), company);
    console.log(`✅ Created: ${legalName}`);
  }

  console.log('\n✅ All 3 tenants restored successfully!');
  console.log('📊 Verifying...');

  const finalSnapshot = await getDocs(collection(db, 'companies'));
  console.log(`✅ Total companies now: ${finalSnapshot.size}`);

  process.exit(0);
}

restoreTenants().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
