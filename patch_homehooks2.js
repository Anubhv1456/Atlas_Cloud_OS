const fs = require('fs');
let content = fs.readFileSync('artifacts/study-tracker/src/features/dashboard/Home.hooks.tsx', 'utf-8');

const toInsert = `
  const [focusDialogType, setFocusDialogType] = useState<'primary' | 'secondary' | null>(null);

  const {
    customPrimarySubject,
    customPrimarySystem,
    customSecondarySubject,
    customSecondarySystem,
    primaryFocus,
    primaryFocusSubject,
    isAutoPrimary,
    isPrimaryOverriddenByRevision,
    secondaryFocus,
    secondaryFocusSubject,
    isAutoSecondary,
    isSecondaryOverriddenByRevision,
    dueRevisions,
    secondaryDaysOverdue
  } = determineFocusSystems(subjects, systems, today());

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const aiInsight = null;

  const handleSubjectDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(subjects);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    await updateSubjectsOrder(items);
  };
`;

content = content.replace('  const insights = useMemo(() => {', toInsert + '\n  const insights = useMemo(() => {');

fs.writeFileSync('artifacts/study-tracker/src/features/dashboard/Home.hooks.tsx', content);
