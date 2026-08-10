const fs = require('fs');
const file = './artifacts/study-tracker/src/features/dashboard/ActiveRevisions.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find the last </div> before the end.
const split = content.split('          </div>');
// It should just end at '          </div>\n        </div>\n      </section>\n    </>\n  );\n}\n'
const cutIndex = content.lastIndexOf('            </div>\n          </div>');

const newEnding = `            </div>
          </div>
        </div>
      </section>
    </>
  );
}`;

content = content.substring(0, cutIndex) + newEnding;

fs.writeFileSync(file, content);
