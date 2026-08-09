# Atlas Comprehensive Architecture & Production Audit

## Executive Summary

Overall Architecture Score: 7/10
Production Readiness: 6/10
Maintainability: 7/10
Scalability: 7/10
Performance: 6/10
UX Consistency: 8/10
Security: 6/10
Technical Debt: 6/10
Code Quality: 7/10
Recommendation Engine: 7/10
Firebase Architecture: 6/10
Overall Product Quality: 7/10

## 1. Project Structure Audit
- The directory structure is fairly standard for a React app, with features, components, pages, hooks, and lib directories.
- **Weakness:** The `features` folder is starting to become a catch-all. We have UI components (`SubjectCard.tsx`, `SystemCard.tsx`) mixed with hooks (`SystemCard.hooks.tsx`) and views.
- **Weakness:** Admin views are inside `features/admin/views`, but regular pages are in `pages/` (e.g., `Settings.tsx`). Feature separation is inconsistent.
- **Weakness:** `db` folder contains both dexie types, schema, and timeline logic. This mixes local DB setup with business logic (`revisionEngine.ts`).
- **Recommendation:** Implement a strict feature-sliced design. Move `pages/` inside features if they belong to a specific feature, or keep `pages/` strictly for routing and move logic to `features/`.

## 2. Unused Code Audit
- Found 19 UI components (shadcn). Check if all are actually used (e.g., alert, badge, separator). Usually, shadcn installs unused components that bloat the repo.
- `src/components/EmptyStateGraphic.tsx` needs checking if it's used universally.
- Unused imports/exports: Dexie db seems to have legacy code mixed with Firebase sync.

## 3. Feature Completeness Audit
- **Authentication (🟡 Functional but Incomplete):** Firebase auth is implemented, but Beta Access gatekeeping feels bolted on. Needs tighter integration with routing.
- **Dashboard (✅ Production Ready):** Overview stats, Active Revisions, Subject Grid are solid.
- **Subjects/Topics (✅ Production Ready):** Deeply hierarchical.
- **Timeline (🟡 Functional):** Useful but could be heavy if it renders too many items.
- **Recommendation Engine (🟡 Functional but Incomplete):** Scoring logic is complex and might be brittle over time. Fallbacks exist but could be optimized.
- **Admin Console (🔴 Prototype):** Exists but likely lacks robust backend enforcement (Firestore rules). Mostly client-side filtering.
- **Cloud Sync (🟡 Functional):** Sync logic in `firebaseSync.ts` uses Dexie + Firebase, prone to conflict resolution issues if not using true CRDTs. Currently just bulk put/get.

## 4. Route Audit
- Needs Suspense boundaries and lazy loading for heavy routes like `/analytics` or `/admin`.
- **Admin protection:** Often client-side only. If a user bypasses the UI, can they still read/write? Firestore rules need to mirror client admin checks.

## 5. Component Audit
- `Home.tsx` and `Home.hooks.tsx`: Separation of concerns is good, but `Home.hooks.tsx` does a lot of heavy lifting (filtering systems, sorting, building systemProgressMap). Could memoize better.
- `SubjectDetail.tsx`: Very large component. The recent issue with `allTopicIds` highlights that logic inside the hook was getting tangled. Should break down `SystemCard` rendering into smaller virtualized lists if topics grow.

## 6. UX Consistency Audit
- Generally good use of Tailwind and Lucide icons.
- **Inconsistencies:** Some dialogs might lack proper keyboard trap/focus management (though Radix/shadcn handles most of it).
- Needs empty states for edge cases (e.g., zero progress across all subjects, empty search results).

## 7. Performance Audit
- **Dexie Queries:** `useLiveQuery` on `db.topicProgress.toArray()` in `Home.hooks.tsx` loads the ENTIRE table into memory on every change. This will NOT scale for a medical student with thousands of topics. It MUST be indexed or paginated.
- **Bundle Size:** Recharts is large (`407.53 kB` uncompressed). Should be lazy-loaded only on the Analytics page.
- **Firebase:** Dynamic vs Static import of Firestore in `admin.ts` causes chunking issues (already seen in build warnings).
- **Memoization:** High reliance on array `.filter` and `.reduce` in render cycles.

## 8. Firebase Audit
- **Sync Logic (`firebaseSync.ts`):** Moving Dexie to Firestore via JSON dumps is extremely inefficient and prone to overwriting. It's not true real-time sync. It's "backup and restore".
- **Security Rules:** Are they strictly enforcing that users can only read/write their own documents? The sync pushes an entire JSON payload. This is a massive security/data corruption risk if payload is large or manipulated.

## 9. Recommendation Engine Audit
- The engine in `recommendation-engine.ts` loops over all systems and topics, calculating weights. O(N*M) complexity.
- As the user completes more, this calculation runs on the client. It should be offloaded to a Web Worker or pre-calculated incrementally on progress updates.

## 10. Data Model Audit
- **Redundancy:** `topicProgress` stores `contentStatus` and `qbankStatus` separately. This is fine, but tracking 'confidence' as a string could be an enum/integer for faster querying.
- The ontology is static (`data/ontology.ts`), but user progress is dynamic. Joining them in memory every time is expensive.

## 11. Security Audit
- Admin actions (e.g., `bulkUpdateUserBetaAccess`) seem to write directly to Firestore. If any authenticated user can call this because rules are lax, it's a critical vulnerability.
- Needs strict Firestore security rules: `match /users/{userId} { allow read, write: if request.auth.uid == userId; }`.

## 12. Production Readiness
- **Critical:** The `useLiveQuery` loading all records will crash the app on low-end devices once data grows.
- **Critical:** Firebase Sync payload approach is brittle.
- **High:** Recharts needs lazy loading.

## 13. Code Quality
- Code quality is generally high with TypeScript.
- **Technical Debt:** The split between Dexie (local first) and Firebase (cloud sync) creates two sources of truth. The sync mechanism needs a complete rewrite to an event-based or true CRDT approach.

## 14. Refactor Opportunities
- Implement a Web Worker for the Recommendation Engine.
- Use `React.lazy` for Analytics, Admin, and Settings pages.
- Refactor `useLiveQuery` to only fetch what is visible or aggregate data using Dexie's built-in aggregations.

## 16. Action Plan

### Critical (Must Fix Before Beta)
1. **Data Fetching Scale:** Refactor `useLiveQuery(() => db.topicProgress.toArray())` to only query necessary systems or use indexed counts. Medical students have 10,000+ topics.
2. **Firestore Security Rules:** Ensure strict validation on the admin endpoints and user profile sync.
3. **Sync Architecture:** The current "JSON dump" sync in `firebaseSync.ts` will fail on slow networks or large accounts. Implement delta-sync or at least chunked updates.

### High Priority
1. **Bundle Size:** Lazy load Recharts (`React.lazy(() => import('recharts'))`) on the Analytics page to save ~400kb on initial load.
2. **Recommendation Engine Performance:** The O(N) calculation on every render in Home will cause jank. Memoize heavily or move to a Web Worker.
3. **Admin Routing:** Secure admin routes properly with HOCs, not just UI hiding.

### Medium Priority
1. **Folder Structure:** Move `pages/settings/*` into `features/settings`.
2. **Component Splitting:** `SubjectDetail.tsx` and `Home.hooks.tsx` are too monolithic.
3. **Virtualization:** Use `@tanstack/react-virtual` for long topic lists in `SystemCard.tsx`.

### Nice To Have
1. Remove unused shadcn components.
2. Add empty states for all views.
3. Consolidate `lucide-react` imports to reduce bundle parsing time.