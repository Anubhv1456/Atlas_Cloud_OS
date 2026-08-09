import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon } from 'lucide-react';
import { SettingsRow } from './SettingsLayout';
import { Badge } from '@/components/ui/badge';
import { useBetaAccess } from '@/hooks/useBetaAccess';

export function AccountSection() {
  const { user, logout } = useAuth();
  const { hasAccess } = useBetaAccess();

  if (!user) {
    return (
      <SettingsRow
        icon={UserIcon}
        label="Not logged in"
      />
    );
  }

  return (
    <>
      <SettingsRow
        icon={UserIcon}
        label={
          <div className="flex items-center gap-2">
            <span>{user.displayName || user.email || 'User'}</span>
            {hasAccess && (
              <Badge className="bg-teal-500/10 text-teal-400 border-none text-[10px] px-1.5 py-0 rounded-full font-medium h-4">
                Beta
              </Badge>
            )}
          </div>
        }
      />
      <SettingsRow
        icon={LogOut}
        label="Log Out"
        destructive
        onClick={logout}
      />
    </>
  );
}
