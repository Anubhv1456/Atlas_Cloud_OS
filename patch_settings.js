const fs = require('fs');

// 1. Remove AppearanceSection completely
try {
  fs.unlinkSync('./artifacts/study-tracker/src/features/settings/AppearanceSection.tsx');
} catch(e) {}

// 2. Remove the Dark Mode row from SystemPreferencesCard
let prefPath = './artifacts/study-tracker/src/features/settings/SystemPreferencesCard.tsx';
let pref = fs.readFileSync(prefPath, 'utf8');

// Replace the Dark Mode row
pref = pref.replace(/<SettingsRow\s+icon=\{isDark \? Moon : Sun\}[\s\S]*?\/>/, '');

// Since isDark isn't used for rendering the icon anymore, and Moon/Sun were there:
pref = pref.replace(/const \{ isDark, toggleTheme, accent, changeAccent \} = useTheme\(\);/, 'const { accent, changeAccent } = useTheme();');

fs.writeFileSync(prefPath, pref);
