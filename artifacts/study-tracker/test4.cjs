const { chromium } = require('playwright');
(async () => {
  try {
    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));
    
    // Catch request failures
    page.on('requestfailed', request => {
      console.log('REQUEST_FAILED:', request.url(), request.failure().errorText);
    });

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(5000);
    await browser.close();
  } catch (e) {
    console.log('SCRIPT_ERROR:', e);
  }
})();
