import sys

path = 'artifacts/study-tracker/src/features/dashboard/Home.tsx'
with open(path, 'r') as f:
    content = f.read()

target = """        <header className="mb-5 sm:mb-8 flex items-center justify-between gap-2.5 sm:gap-4 w-full min-w-0">"""

replacement = """        <header className="sticky top-0 z-50 mb-5 sm:mb-8 flex items-center justify-between gap-2.5 sm:gap-4 w-full min-w-0 bg-background/80 backdrop-blur-xl border-b border-border/20 py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">"""

if target in content:
    content = content.replace(target, replacement)
    with open(path, 'w') as f:
        f.write(content)
    print("done patching Home")
else:
    print("target not found")
