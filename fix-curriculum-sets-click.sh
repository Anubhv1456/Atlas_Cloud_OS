sed -i "s/onClick={() => {/onClick={(e) => { e.stopPropagation(); e.preventDefault();/g" /app/applet/artifacts/study-tracker/src/features/subjects/CurriculumSets.tsx
