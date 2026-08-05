import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon } from 'lucide-react';

export function AccountSection() {
  const { user, logout } = useAuth();

  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</h2>
      </div>
      <div className="bg-card rounded-2xl border shadow-sm p-4 space-y-4">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border bg-muted" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border">
                  <UserIcon className="w-5 h-5" />
                </div>
              )}
              <div className="overflow-hidden">
                <div className="font-semibold text-foreground truncate">{user.displayName || 'User'}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="text-destructive hover:bg-destructive/10">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Not logged in.
          </div>
        )}
      </div>
    </section>
  );
}
