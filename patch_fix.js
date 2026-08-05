const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/features/subjects/SystemCard.hooks.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "  const [showRenameDialog, setShowRenameDialog] = useState(false);\n  const [renameValue, setRenameValue]             = useState(system.name);",
  "  const [showRenameDialog, setShowRenameDialog] = useState(false);\n  const [renameValue, setRenameValue]             = useState(system.name);\n\n  const [showInsightDialog, setShowInsightDialog] = useState(false);\n  const [insightContent, setInsightContent] = useState('');\n  const [insightLink, setInsightLink] = useState('');\n  const [isSubmittingInsight, setIsSubmittingInsight] = useState(false);\n  const { user } = useAuth();"
);

content = content.replace(
  "    setShowRenameDialog(false);\n  };",
  "    setShowRenameDialog(false);\n  };\n\n  const handleInsightSubmit = async () => {\n    const content = insightContent.trim();\n    if (!content) return;\n    setIsSubmittingInsight(true);\n    try {\n      await submitInsight({\n        subjectId: system.subjectId,\n        systemId: system.id!,\n        subjectName,\n        systemName: system.name,\n        content,\n        youtubeLink: insightLink.trim() || undefined,\n        userId: user?.uid || null,\n      });\n      toast.success('Marker Left', {\n        description: 'Thanks! Your marker has been submitted for review.',\n      });\n      setShowInsightDialog(false);\n      setInsightContent('');\n      setInsightLink('');\n    } catch (e) {\n      console.error(e);\n      toast.error('Failed to submit marker', {\n        description: 'Please try again later.',\n      });\n    } finally {\n      setIsSubmittingInsight(false);\n    }\n  };"
);

fs.writeFileSync(file, content);
