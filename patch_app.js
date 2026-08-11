const fs = require('fs');
const file = './artifacts/study-tracker/src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

const syncImports = [
  "import Home from '@/features/dashboard/Home';",
  "import Landing from '@/pages/Landing';",
  "import AcceptInvitation from '@/pages/AcceptInvitation';",
  "import PrivacyPolicy from '@/pages/PrivacyPolicy';",
  "import TermsOfService from '@/pages/TermsOfService';",
  "import Contact from '@/pages/Contact';",
  "import BetaAccess from '@/pages/BetaAccess';",
  "import AdminDashboard from '@/features/admin/AdminDashboard';",
  "import Analytics from '@/features/analytics/Analytics';",
  "import Settings from '@/features/settings/Settings';",
  "import Timeline from '@/features/timeline/Timeline';",
  "import SubjectDetail from '@/features/subjects/SubjectDetail';",
  "import MistakeRecoveryQueue from '@/features/mistakes/MistakeRecoveryQueue';"
];

const lazyImports = `
import { lazy } from 'react';
const Home = lazy(() => import('@/features/dashboard/Home'));
const Landing = lazy(() => import('@/pages/Landing'));
const AcceptInvitation = lazy(() => import('@/pages/AcceptInvitation'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));
const Contact = lazy(() => import('@/pages/Contact'));
const BetaAccess = lazy(() => import('@/pages/BetaAccess'));
const AdminDashboard = lazy(() => import('@/features/admin/AdminDashboard'));
const Analytics = lazy(() => import('@/features/analytics/Analytics'));
const Settings = lazy(() => import('@/features/settings/Settings'));
const Timeline = lazy(() => import('@/features/timeline/Timeline'));
const SubjectDetail = lazy(() => import('@/features/subjects/SubjectDetail'));
const MistakeRecoveryQueue = lazy(() => import('@/features/mistakes/MistakeRecoveryQueue'));
`;

syncImports.forEach(imp => {
  code = code.replace(imp + "\\n", "");
});

code = code.replace("import NotFound from '@/pages/not-found';", "import NotFound from '@/pages/not-found';\\n" + lazyImports);

fs.writeFileSync(file, code);
