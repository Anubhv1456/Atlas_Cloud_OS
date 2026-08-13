s/if (sets.some(rs => rs.contentCompleted && rs.qbankCompleted)) status = 'checked';/if (sets.some(rs => (rs.revisionCount || 0) > 0)) status = 'checked';/g
s/else if (sets.some(rs => rs.contentCompleted || rs.qbankCompleted)) status = 'half';//g
