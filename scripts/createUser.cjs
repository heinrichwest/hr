const admin = require('firebase-admin');
const serviceAccount = require('../hr-system-9dfae-firebase-adminsdk-fbsvc-d4924f9775.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createUser() {
  try {
    const userId = 'U2WQYW5dfYMXldRm6uNzSyoQHhk2';

    const userData = {
      companyId: "",
      createdAt: admin.firestore.Timestamp.fromDate(new Date('2026-01-09T10:36:25+02:00')),
      displayName: "Tumetse",
      email: "tumetse@speccon.co.za",
      isActive: true,
      lastLogin: admin.firestore.Timestamp.fromDate(new Date('2026-01-22T15:27:57+02:00')),
      role: "System Admin",
      uid: userId,
      updatedAt: admin.firestore.Timestamp.fromDate(new Date('2026-01-09T10:38:18+02:00'))
    };

    await db.collection('users').doc(userId).set(userData);

    console.log('✅ User created successfully!');
    console.log('User ID:', userId);
    console.log('Email:', userData.email);
    console.log('Role:', userData.role);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user:', error);
    process.exit(1);
  }
}

createUser();
