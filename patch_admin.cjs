const fs = require('fs');
const p = 'artifacts/study-tracker/api/_lib/firebaseAdmin.ts';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(
  "import { getFirestore, type Firestore } from 'firebase-admin/firestore';",
  "import { getFirestore, type Firestore } from 'firebase-admin/firestore';\nimport { getAuth, type Auth } from 'firebase-admin/auth';"
);

c = c.replace(
  "let adminDb: Firestore | undefined;",
  "let adminDb: Firestore | undefined;\nlet adminAuth: Auth | undefined;"
);

c = c.replace(
  "export function initFirebaseAdmin(): { db: Firestore } {",
  "export function initFirebaseAdmin(): { db: Firestore; auth: Auth } {"
);

c = c.replace(
  "if (!adminDb) {\n    adminDb = getFirestore(adminApp);\n  }\n\n  return { db: adminDb };",
  "if (!adminDb) {\n    adminDb = getFirestore(adminApp);\n  }\n  if (!adminAuth) {\n    adminAuth = getAuth(adminApp!);\n  }\n\n  return { db: adminDb, auth: adminAuth };"
);

fs.writeFileSync(p, c);
