const fs = require('fs');
const file = './artifacts/study-tracker/src/features/admin/views/UsersView.tsx';
let content = fs.readFileSync(file, 'utf8');

const modalStr = `
      {/* Delete User Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-red-500">Delete User Account</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  You are about to permanently delete <span className="text-red-400 font-medium">{deletingUser.displayName || deletingUser.email || deletingUser.id}</span>.
                </p>
              </div>
              <button 
                onClick={() => setDeletingUser(null)}
                className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-xs text-red-400 leading-relaxed">
                This action cannot be undone. All user data, progress, and settings will be permanently removed from the database.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs shadow-lg shadow-red-500/10 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Yes, Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

content = content.replace(/    <\/div>\n  \);\n}\n?$/, modalStr);
fs.writeFileSync(file, content);
