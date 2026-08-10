const fs = require('fs');
const file = './artifacts/study-tracker/src/components/ui/dialog.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /className, children, \.\.\.props \}, ref\) => \(\s*<DialogPortal>/g,
    `className, children, hideCloseButton, ...props }, ref) => (
  <DialogPortal>`
);

content = content.replace(
    /\{children\}\s*<DialogPrimitive\.Close className="absolute right-4 top-4/g,
    `{children}
      {!hideCloseButton && (
      <DialogPrimitive.Close className="absolute right-4 top-4`
);

content = content.replace(
    /<span className="sr-only">Close<\/span>\s*<\/DialogPrimitive\.Close>\s*<\/DialogPrimitive\.Content>/g,
    `<span className="sr-only">Close</span>
      </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>`
);

// add hideCloseButton to type
content = content.replace(
    /React\.ComponentPropsWithoutRef<typeof DialogPrimitive\.Content>\s*>\(/g,
    `React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { hideCloseButton?: boolean }
>(`
);

fs.writeFileSync(file, content);
console.log('patched dialog');
