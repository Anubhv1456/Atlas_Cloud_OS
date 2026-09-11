try {
  eval(`
    const keyToSave = 'test';
    if (keyToSave && !/^AIza[a-zA-Z0-9_\\-]{35}$/.test(keyToSave)) {
      console.log('Regex works');
    }
  `);
  console.log('No syntax error');
} catch (e) {
  console.log('Error:', e);
}
