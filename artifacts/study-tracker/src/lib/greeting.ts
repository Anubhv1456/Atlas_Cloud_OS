export function getMedicalGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour >= 23 || hour < 4) {
    const msgs = ['Burning the midnight oil.', 'Late night review.', 'The night shift.'];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }
  if (hour >= 4 && hour < 7) {
    const msgs = ['Early start today.', 'Pre-rounds prep.', 'Rise and grind.'];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }
  if (hour >= 7 && hour < 12) {
    const msgs = ['Good morning.', "Let's get to work.", 'Ready for the morning block?'];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }
  if (hour >= 12 && hour < 17) {
    const msgs = ['Good afternoon.', 'Keep the momentum going.', 'Afternoon push.'];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }
  
  const eveningMsgs = ['Good evening.', 'Time for evening review.', 'Closing out the day.'];
  return eveningMsgs[Math.floor(Math.random() * eveningMsgs.length)];
}
