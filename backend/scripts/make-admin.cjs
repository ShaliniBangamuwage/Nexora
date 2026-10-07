require('dotenv').config();

const { cert, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');

const EXPECTED_PROJECT_ID = 'nexora-ecommerce-2975e';

async function main() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (projectId !== EXPECTED_PROJECT_ID) {
    throw new Error(`Refusing to modify unexpected Firebase project: ${projectId || '(unset)'}`);
  }

  const identifier = process.argv[2]?.trim();
  if (!identifier) {
    throw new Error('Usage: npm run make-admin -- <firebase-uid-or-email>');
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
    throw new Error('Firebase Admin credentials are incomplete');
  }

  const app = initializeApp({
    projectId,
    credential: cert({
      projectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
  const auth = getAuth(app);
  const db = getFirestore(app);
  const user = identifier.includes('@')
    ? await auth.getUserByEmail(identifier)
    : await auth.getUser(identifier);

  if (user.disabled) throw new Error('Cannot assign admin to a disabled account');

  const admins = await db.collection('admins').get();
  const otherAdmins = admins.docs.filter((doc) => doc.id !== user.uid);
  if (otherAdmins.length) {
    throw new Error('An admin already exists; first-admin setup is closed');
  }

  const userProfile = await db.collection('users').doc(user.uid).get();
  const adminRef = db.collection('admins').doc(user.uid);
  const now = FieldValue.serverTimestamp();
  await db.runTransaction(async (transaction) => {
    const currentAdmins = await transaction.get(db.collection('admins'));
    if (currentAdmins.docs.some((doc) => doc.id !== user.uid)) {
      throw new Error('An admin already exists; first-admin setup is closed');
    }
    const currentAdmin = await transaction.get(adminRef);
    transaction.set(
      adminRef,
      {
        userId: user.uid,
        email: user.email ?? '',
        fullName: user.displayName ?? userProfile.data()?.fullName ?? '',
        role: 'admin',
        status: 'active',
        createdAt: currentAdmin.exists ? currentAdmin.data()?.createdAt ?? now : now,
        updatedAt: now,
      },
      { merge: true },
    );
  });
  await auth.setCustomUserClaims(user.uid, {
    ...(user.customClaims ?? {}),
    role: 'admin',
  });

  console.log(`First admin assigned in ${app.options.projectId}. Sign in again to refresh the Firebase ID token.`);
}

main().catch((error) => {
  console.error(`Admin setup failed: ${error instanceof Error ? error.message : 'unknown error'}`);
  process.exitCode = 1;
});