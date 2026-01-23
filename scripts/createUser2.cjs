const admin = require('firebase-admin');
const serviceAccount = require('../hr-system-9dfae-firebase-adminsdk-fbsvc-d4924f9775.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createUser() {
  try {
    const userId = 'Lvyyf4s2ZBQsqQw9iX3oxDhHbyi1';
    const now = admin.firestore.Timestamp.now();

    const userData = {
      companyId: "",
      createdAt: now,
      displayName: "System Admin",
      email: "",
      isActive: true,
      lastLogin: now,
      role: "System Admin",
      uid: userId,
      updatedAt: now
    };

    await db.collection('users').doc(userId).set(userData);

    console.log('✅ User created successfully!');
    console.log('User ID:', userId);
    console.log('Role:', userData.role);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user:', error);
    process.exit(1);
  }
}

createUser();
