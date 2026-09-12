export type StaffRole = 'superadmin' | 'admin' | 'clinical_lead' | 'moderator' | 'support' | 'student';

export interface StaffUserEntity {
  uid: string;
  email: string;
  name: string;
  role: StaffRole;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  updatedAt?: string;
  grantedBy?: string;
  source?: 'admins_doc' | 'users_doc' | 'claim';
}

export interface AdminAuditLogEntity {
  id: string;
  action: string;
  performedBy: string;
  targetUid?: string;
  timestamp: string;
  details?: Record<string, any>;
}
