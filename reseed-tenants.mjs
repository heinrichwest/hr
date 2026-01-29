#!/usr/bin/env node

/**
 * Quick script to reseed the 3 tenants (Speccon, Megro, Andebe)
 * Run with: node reseed-tenants.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase config from your environment
const firebaseConfig = {
  apiKey: 'AIzaSyDkCK8ydbZ0f-cApVCc_VZ9o0dUqgJq5hQ',
  authDomain: 'hr-system-9dfae.firebaseapp.com',
  projectId: 'hr-system-9dfae',
  storageBucket: 'hr-system-9dfae.firebasestorage.app',
  messagingSenderId: '467663318758',
  appId: '1:467663318758:web:3c74f82c5c7d3b5eb1e8e0'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log('🔄 Importing seeder...');

// Dynamic import of seeder
import('./src/services/seeder.ts').then(async (module) => {
  const { Seeder } = module;

  console.log('✅ Seeder imported successfully');
  console.log('🌱 Starting to reseed database with 3 tenants...');

  try {
    await Seeder.clearAndReseed();
    console.log('✅ Successfully restored 3 tenants (Speccon, Megro, Andebe)!');
    console.log('✅ Demo data has been created');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to reseed:', error);
    process.exit(1);
  }
}).catch(err => {
  console.error('❌ Failed to import seeder:', err);
  process.exit(1);
});
