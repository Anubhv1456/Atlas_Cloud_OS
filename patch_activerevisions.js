const fs = require('fs');
const file = './artifacts/study-tracker/src/features/dashboard/ActiveRevisions.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the entire Secondary Focus div with empty string or comment out.
// Looking for `{/* Secondary Focus */}` to the end of that div.
const startMarker = `{/* Secondary Focus */}`;
const endMarker = `        </div>
      </div>
    </section>`;

if (content.includes(startMarker)) {
  const parts = content.split(startMarker);
  const part2 = parts[1].substring(parts[1].indexOf('          </div>\n        </div>\n      </div>\n    </section>') + '          </div>\n        </div>'.length);
  content = parts[0] + '          </div>\n        </div>\n      </div>\n    </section>';
  fs.writeFileSync(file, content);
}

