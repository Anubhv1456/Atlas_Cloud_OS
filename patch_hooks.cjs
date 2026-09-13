const fs = require('fs');
const file = 'artifacts/study-tracker/src/db/localDb.ts';
let code = fs.readFileSync(file, 'utf8');

const targetStr = `      local_snapshots: '++id, timestamp, version'\n    });\n  }`;

const replacementStr = `      local_snapshots: '++id, timestamp, version'
    });

    this.setupHooks();
  }

  private setupHooks() {
    this.history.hook('reading', (obj) => {
      if (obj && typeof obj.completedAt === 'string') {
        obj.completedAt = new Date(obj.completedAt);
      }
      return obj;
    });

    this.scoreLogs.hook('reading', (obj) => {
      if (obj && typeof obj.timestamp === 'string') {
        obj.timestamp = new Date(obj.timestamp);
      }
      return obj;
    });

    this.topicProgress.hook('reading', (obj) => {
      if (obj && typeof obj.lastStudiedAt === 'string') {
        obj.lastStudiedAt = new Date(obj.lastStudiedAt);
      }
      return obj;
    });
  }`;

if (code.includes(targetStr)) {
  fs.writeFileSync(file, code.replace(targetStr, replacementStr));
  console.log("Patched localDb hooks");
} else {
  console.log("Not found");
}
