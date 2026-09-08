const fs = require('fs');
let html = fs.readFileSync('./artifacts/study-tracker/index.html', 'utf8');

// Force dark mode
html = html.replace('<html lang="en">', '<html lang="en" class="dark">');

// Remove the theme-color for light
html = html.replace('<meta name="theme-color" content="#FBFBFD" media="(prefers-color-scheme: light)">', '');

// Remove the inline script that toggles the dark class
html = html.replace(/<script>\s*\(\s*function\s*\(\)\s*\{[\s\S]*?\}\s*\)\s*\(\)\s*;\s*<\/script>/, `
    <script>
      (function() {
        try {
          var savedMode = localStorage.getItem('atlas_theme_mode') || 'atlas';
          document.documentElement.setAttribute('data-theme', savedMode);
        } catch (e) {}
      })();
    </script>
`);

fs.writeFileSync('./artifacts/study-tracker/index.html', html);
