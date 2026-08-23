window.addEventListener('error', function(event) {
  document.body.innerHTML = '<div style="color: red; padding: 20px; font-family: monospace;"><h1>Error</h1><pre>' + event.error.stack + '</pre></div>';
});
