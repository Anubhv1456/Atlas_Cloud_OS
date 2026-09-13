const fs = require('fs');
const file = 'artifacts/study-tracker/src/lib/diagnostics/DiagnosticEngine.ts';
let code = fs.readFileSync(file, 'utf8');

const v4Block = `
        // Vector 4: Unjam Sync
        for (const anomaly of this.report!.syncAnomalies) {
          if (anomaly.type === 'future_timestamp') {
            await localDb.sync_meta.put({ id: 'last_cloud_sync_timestamp', lastSyncTimestamp: Date.now() - 1000 });
          }
          if (anomaly.type === 'malformed_mutation' && anomaly.queueId) {
            await localDb.mutation_queue.delete(anomaly.queueId);
          }
        }`;

code = code.replace(v4Block, '');

const afterTxBlock = `      });

      // Vector 4: Unjam Sync (LocalDB)
      for (const anomaly of this.report!.syncAnomalies) {
        if (anomaly.type === 'future_timestamp') {
          await localDb.sync_meta.put({ id: 'last_cloud_sync_timestamp', lastSyncTimestamp: Date.now() - 1000 });
        }
        if (anomaly.type === 'malformed_mutation' && anomaly.queueId) {
          await localDb.mutation_queue.delete(anomaly.queueId);
        }
      }`;

code = code.replace('      });', afterTxBlock);

fs.writeFileSync(file, code);
console.log("Moved Vector 4 outside transaction");
