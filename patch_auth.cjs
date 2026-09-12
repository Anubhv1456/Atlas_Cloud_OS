const fs = require('fs');
const p = 'artifacts/study-tracker/api/_lib/auth.ts';
let c = fs.readFileSync(p, 'utf8');
c = c.replace(
  'emailVerified?: boolean;\n}',
  'emailVerified?: boolean;\n  claims?: Record<string, any>;\n}'
);
c = c.replace(
  'emailVerified: user.emailVerified,\n    };\n  } catch (error) {',
  `emailVerified: user.emailVerified,\n      claims: user.customAttributes ? (() => { try { return JSON.parse(user.customAttributes); } catch { return {}; } })() : {}\n    };\n  } catch (error) {`
);
fs.writeFileSync(p, c);
