const fs = require('fs');

// 1. Delete dead view files that were migrated into SystemControlView.tsx
try { fs.unlinkSync('./artifacts/study-tracker/src/features/admin/views/FeatureFlagsView.tsx'); } catch(e) {}
try { fs.unlinkSync('./artifacts/study-tracker/src/features/admin/views/AnnouncementsView.tsx'); } catch(e) {}
try { fs.unlinkSync('./artifacts/study-tracker/src/features/admin/views/SocialLinksView.tsx'); } catch(e) {}
try { fs.unlinkSync('./artifacts/study-tracker/src/features/admin/views/DashboardOverview.tsx'); } catch(e) {}
try { fs.unlinkSync('./artifacts/study-tracker/src/features/admin/views/CommunityView.tsx'); } catch(e) {}
try { fs.unlinkSync('./artifacts/study-tracker/src/features/admin/views/SupportMessagesView.tsx'); } catch(e) {}

