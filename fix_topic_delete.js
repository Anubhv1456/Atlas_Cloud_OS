const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/subjects/TopicList.tsx', 'utf8');

// Add AlertDialog imports
if (!code.includes('AlertDialog')) {
  code = code.replace(
    /import { DropdownMenu/, 
    "import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';\nimport { DropdownMenu"
  );
}

// Add state for topic to delete
code = code.replace(
  /const \[editingTopicId, setEditingTopicId\] = React\.useState<string \| null>\(null\);/,
  "const [editingTopicId, setEditingTopicId] = React.useState<string | null>(null);\n  const [topicToDelete, setTopicToDelete] = React.useState<string | null>(null);"
);

// Replace confirm logic
code = code.replace(
  /if \(confirm\('Are you sure you want to delete this topic\?'\)\) \{\n                          onDeleteTopic\?\.([^\n]+);\n                        \}/g,
  "setTopicToDelete(topic.id);"
);

// Add AlertDialog UI at the end of the component
code = code.replace(
  /      <CurriculumSetForm/g,
  `      <AlertDialog open={!!topicToDelete} onOpenChange={(open) => !open && setTopicToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Topic</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this topic? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (topicToDelete) {
                  onDeleteTopic?.(topicToDelete);
                  setTopicToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <CurriculumSetForm`
);

fs.writeFileSync('artifacts/study-tracker/src/features/subjects/TopicList.tsx', code);
