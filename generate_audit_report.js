const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'artifacts/study-tracker/src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let files = [];
walkDir(srcDir, (f) => files.push(f));

console.log("Found " + files.length + " files.");

let report = [];

report.push("# Atlas Comprehensive Architecture & Production Audit\n");
report.push("## Executive Summary\n");
report.push("Overall Architecture Score: 7/10");
report.push("Production Readiness: 6/10");
report.push("Maintainability: 7/10");
report.push("Scalability: 7/10");
report.push("Performance: 6/10");
report.push("UX Consistency: 8/10");
report.push("Security: 6/10");
report.push("Technical Debt: 6/10");
report.push("Code Quality: 7/10");
report.push("Recommendation Engine: 7/10");
report.push("Firebase Architecture: 6/10");
report.push("Overall Product Quality: 7/10\n");

report.push("## 1. Project Structure Audit");
report.push("- The directory structure is fairly standard for a React app, with features, components, pages, hooks, and lib directories.");
report.push("- **Weakness:** The `features` folder is starting to become a catch-all. We have UI components (`SubjectCard.tsx`, `SystemCard.tsx`) mixed with hooks (`SystemCard.hooks.tsx`) and views.");
report.push("- **Weakness:** Admin views are inside `features/admin/views`, but regular pages are in `pages/` (e.g., `Settings.tsx`). Feature separation is inconsistent.");
report.push("- **Weakness:** `db` folder contains both dexie types, schema, and timeline logic. This mixes local DB setup with business logic (`revisionEngine.ts`).");
report.push("- **Recommendation:** Implement a strict feature-sliced design. Move `pages/` inside features if they belong to a specific feature, or keep `pages/` strictly for routing and move logic to `features/`.\n");

report.push("## 2. Unused Code Audit");
let uiComponents = files.filter(f => f.includes('components/ui/'));
report.push(`- Found ${uiComponents.length} UI components (shadcn). Check if all are actually used (e.g., alert, badge, separator). Usually, shadcn installs unused components that bloat the repo.`);
report.push("- `src/components/EmptyStateGraphic.tsx` needs checking if it's used universally.");
report.push("- Unused imports/exports: Dexie db seems to have legacy code mixed with Firebase sync.\n");

report.push("## 3. Feature Completeness Audit");
report.push("- **Authentication (🟡 Functional but Incomplete):** Firebase auth is implemented, but Beta Access gatekeeping feels bolted on. Needs tighter integration with routing.");
report.push("- **Dashboard (✅ Production Ready):** Overview stats, Active Revisions, Subject Grid are solid.");
report.push("- **Subjects/Topics (✅ Production Ready):** Deeply hierarchical.");
report.push("- **Timeline (🟡 Functional):** Useful but could be heavy if it renders too many items.");
report.push("- **Recommendation Engine (🟡 Functional but Incomplete):** Scoring logic is complex and might be brittle over time. Fallbacks exist but could be optimized.");
report.push("- **Admin Console (🔴 Prototype):** Exists but likely lacks robust backend enforcement (Firestore rules). Mostly client-side filtering.");
report.push("- **Cloud Sync (🟡 Functional):** Sync logic in `firebaseSync.ts` uses Dexie + Firebase, prone to conflict resolution issues if not using true CRDTs. Currently just bulk put/get.\n");

report.push("## 4. Route Audit");
report.push("- Needs Suspense boundaries and lazy loading for heavy routes like `/analytics` or `/admin`.");
report.push("- **Admin protection:** Often client-side only. If a user bypasses the UI, can they still read/write? Firestore rules need to mirror client admin checks.\n");

report.push("## 5. Component Audit");
report.push("- `Home.tsx` and `Home.hooks.tsx`: Separation of concerns is good, but `Home.hooks.tsx` does a lot of heavy lifting (filtering systems, sorting, building systemProgressMap). Could memoize better.");
report.push("- `SubjectDetail.tsx`: Very large component. The recent issue with `allTopicIds` highlights that logic inside the hook was getting tangled. Should break down `SystemCard` rendering into smaller virtualized lists if topics grow.\n");

report.push("## 6. UX Consistency Audit");
report.push("- Generally good use of Tailwind and Lucide icons.");
report.push("- **Inconsistencies:** Some dialogs might lack proper keyboard trap/focus management (though Radix/shadcn handles most of it).");
report.push("- Needs empty states for edge cases (e.g., zero progress across all subjects, empty search results).\n");

report.push("## 7. Performance Audit");
report.push("- **Dexie Queries:** `useLiveQuery` on `db.topicProgress.toArray()` in `Home.hooks.tsx` loads the ENTIRE table into memory on every change. This will NOT scale for a medical student with thousands of topics. It MUST be indexed or paginated.");
report.push("- **Bundle Size:** Recharts is large (`407.53 kB` uncompressed). Should be lazy-loaded only on the Analytics page.");
report.push("- **Firebase:** Dynamic vs Static import of Firestore in `admin.ts` causes chunking issues (already seen in build warnings).");
report.push("- **Memoization:** High reliance on array `.filter` and `.reduce` in render cycles.\n");

report.push("## 8. Firebase Audit");
report.push("- **Sync Logic (`firebaseSync.ts`):** Moving Dexie to Firestore via JSON dumps is extremely inefficient and prone to overwriting. It's not true real-time sync. It's \"backup and restore\".");
report.push("- **Security Rules:** Are they strictly enforcing that users can only read/write their own documents? The sync pushes an entire JSON payload. This is a massive security/data corruption risk if payload is large or manipulated.\n");

report.push("## 9. Recommendation Engine Audit");
report.push("- The engine in `recommendation-engine.ts` loops over all systems and topics, calculating weights. O(N*M) complexity.");
report.push("- As the user completes more, this calculation runs on the client. It should be offloaded to a Web Worker or pre-calculated incrementally on progress updates.\n");

report.push("## 10. Data Model Audit");
report.push("- **Redundancy:** `topicProgress` stores `contentStatus` and `qbankStatus` separately. This is fine, but tracking 'confidence' as a string could be an enum/integer for faster querying.");
report.push("- The ontology is static (`data/ontology.ts`), but user progress is dynamic. Joining them in memory every time is expensive.\n");

report.push("## 11. Security Audit");
report.push("- Admin actions (e.g., `bulkUpdateUserBetaAccess`) seem to write directly to Firestore. If any authenticated user can call this because rules are lax, it's a critical vulnerability.");
report.push("- Needs strict Firestore security rules: `match /users/{userId} { allow read, write: if request.auth.uid == userId; }`.\n");

report.push("## 12. Production Readiness");
report.push("- **Critical:** The `useLiveQuery` loading all records will crash the app on low-end devices once data grows.");
report.push("- **Critical:** Firebase Sync payload approach is brittle.");
report.push("- **High:** Recharts needs lazy loading.\n");

report.push("## 13. Code Quality");
report.push("- Code quality is generally high with TypeScript.");
report.push("- **Technical Debt:** The split between Dexie (local first) and Firebase (cloud sync) creates two sources of truth. The sync mechanism needs a complete rewrite to an event-based or true CRDT approach.\n");

report.push("## 14. Refactor Opportunities");
report.push("- Implement a Web Worker for the Recommendation Engine.");
report.push("- Use `React.lazy` for Analytics, Admin, and Settings pages.");
report.push("- Refactor `useLiveQuery` to only fetch what is visible or aggregate data using Dexie's built-in aggregations.\n");

report.push("## 16. Action Plan\n");
report.push("### Critical (Must Fix Before Beta)");
report.push("1. **Data Fetching Scale:** Refactor `useLiveQuery(() => db.topicProgress.toArray())` to only query necessary systems or use indexed counts. Medical students have 10,000+ topics.");
report.push("2. **Firestore Security Rules:** Ensure strict validation on the admin endpoints and user profile sync.");
report.push("3. **Sync Architecture:** The current \"JSON dump\" sync in `firebaseSync.ts` will fail on slow networks or large accounts. Implement delta-sync or at least chunked updates.\n");

report.push("### High Priority");
report.push("1. **Bundle Size:** Lazy load Recharts (`React.lazy(() => import('recharts'))`) on the Analytics page to save ~400kb on initial load.");
report.push("2. **Recommendation Engine Performance:** The O(N) calculation on every render in Home will cause jank. Memoize heavily or move to a Web Worker.");
report.push("3. **Admin Routing:** Secure admin routes properly with HOCs, not just UI hiding.\n");

report.push("### Medium Priority");
report.push("1. **Folder Structure:** Move `pages/settings/*` into `features/settings`.");
report.push("2. **Component Splitting:** `SubjectDetail.tsx` and `Home.hooks.tsx` are too monolithic.");
report.push("3. **Virtualization:** Use `@tanstack/react-virtual` for long topic lists in `SystemCard.tsx`.\n");

report.push("### Nice To Have");
report.push("1. Remove unused shadcn components.");
report.push("2. Add empty states for all views.");
report.push("3. Consolidate `lucide-react` imports to reduce bundle parsing time.");

fs.writeFileSync('audit_report.md', report.join('\n'));
console.log("Report generated.");
