const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/lib/markers.ts', 'utf8');

if (!code.includes('topicId?: string')) {
  code = code.replace(
    "  systemId: number | string;\n  subjectName: string;\n  systemName: string;\n",
    "  systemId: number | string;\n  topicId?: string;\n  subjectName: string;\n  systemName: string;\n  topicName?: string;\n"
  );

  code = code.replace(
    "    systemId: marker.systemId,\n    subjectName: marker.subjectName || '',\n    systemName: marker.systemName || '',\n",
    "    systemId: marker.systemId,\n    topicId: marker.topicId || null,\n    subjectName: marker.subjectName || '',\n    systemName: marker.systemName || '',\n    topicName: marker.topicName || '',\n"
  );
}

const getTopicMarkersCode = `
export async function getMarkersForTopic(topicId: string): Promise<Marker[]> {
  if (!firestoreDb) return [];
  const markersCol = collection(firestoreDb, 'insights');
  const q = query(
    markersCol, 
    where("topicId", "==", topicId),
    limit(50)
  );
  
  const snapshot = await getDocs(q);
  
  const markers = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      helpfulBy: Array.isArray(data.helpfulBy) ? data.helpfulBy : [],
      notHelpfulBy: Array.isArray(data.notHelpfulBy) ? data.notHelpfulBy : [],
      savedBy: Array.isArray(data.savedBy) ? data.savedBy : [],
      reportedBy: Array.isArray(data.reportedBy) ? data.reportedBy : [],
    } as Marker;
  }).filter(m => {
    return m.status !== 'archived' && m.status !== 'low_quality';
  });

  markers.sort((a, b) => {
    const scoreA = a.qualityScore || 50;
    const scoreB = b.qualityScore || 50;
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    const timeA = a.createdAt?.toMillis?.() || 0;
    const timeB = b.createdAt?.toMillis?.() || 0;
    return timeB - timeA;
  });

  return markers;
}
`;

if (!code.includes('getMarkersForTopic')) {
  code = code + '\n' + getTopicMarkersCode;
}

fs.writeFileSync('artifacts/study-tracker/src/lib/markers.ts', code);
console.log('markers.ts patched');
