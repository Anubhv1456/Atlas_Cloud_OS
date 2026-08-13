sed -i '/const handleStatusChange/i \
  const toggleHighYield = async () => {\
    await updateSystem(system.id!, { isHighYield: !system.isHighYield });\
  };\
' /app/applet/artifacts/study-tracker/src/features/subjects/SystemCard.hooks.tsx
