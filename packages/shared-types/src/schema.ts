/**
 * DevCommandCenter Domain Types & Database Entities
 * Compliant with IEEE 830-1998 Specification
 */

export interface EncryptedPayload {
  v: number;
  kdf: 'PBKDF2-SHA256';
  iter: number;
  salt: string; // Base64 encoded 16-byte salt
  iv: string;   // Base64 encoded 12-byte IV/nonce
  ct: string;   // Base64 encoded ciphertext + 128-bit authentication tag
}

export interface UserVaultSettings {
  user_id: string;
  vault_salt: string;   // Hex encoded random 16-byte salt for PBKDF2
  vault_canary: string; // Ciphertext envelope of the string "VAULT_CANARY_VALID"
  created_at?: string;
  updated_at?: string;
}

export type ServiceProvider = 'Gmail' | 'Outlook' | 'ProtonMail' | 'Zoho' | 'Custom' | string;

export interface Account {
  id: string;
  user_id: string;
  email: string;
  provider: ServiceProvider;
  purpose: string | null;
  recovery_email: string | null;
  encrypted_password: string | null;
  encrypted_notes: string | null;
  created_at: string;
}

export interface AccountInput {
  email: string;
  provider?: ServiceProvider;
  purpose?: string | null;
  recovery_email?: string | null;
  password?: string;
  notes?: string;
}

export interface TestCredentialItem {
  id: string;
  label: string;
  value: string;
  notes?: string;
}

export type ServiceCategory = 
  | 'Frontend' 
  | 'Backend' 
  | 'Database' 
  | 'AI Provider' 
  | 'Storage' 
  | 'Auth' 
  | 'Custom';

export interface DeploymentService {
  id: string;
  category: ServiceCategory;
  customCategoryName?: string;
  provider: string;           // e.g., "Supabase", "Firebase", "Google AI Studio", "OpenAI", "Neon"
  accountEmail: string;       // e.g., "dev.db@gmail.com"
  consoleUrl?: string;        // e.g., "https://aistudio.google.com" or Supabase console
  liveUrl?: string;           // e.g., production endpoint
  notes?: string;
  linkedAccountId?: string;   // Optional reference to public.accounts(id)
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  tags: string[];
  git_repo_url: string | null;
  git_account_email: string | null;
  services: DeploymentService[];
  frontend_platform?: string | null;
  frontend_account_email?: string | null;
  frontend_url?: string | null;
  backend_platform?: string | null;
  backend_account_email?: string | null;
  backend_url?: string | null;
  local_runbook: string | null;
  encrypted_test_credentials: string | null;
  linked_account_id: string | null;
  created_at: string;
  updated_at: string;
  // Optional join field
  linked_account?: Pick<Account, 'id' | 'email' | 'provider'> | null;
}

export interface ProjectInput {
  name: string;
  description?: string | null;
  tags?: string[];
  git_repo_url?: string | null;
  git_account_email?: string | null;
  services?: DeploymentService[];
  frontend_platform?: string | null;
  frontend_account_email?: string | null;
  frontend_url?: string | null;
  backend_platform?: string | null;
  backend_account_email?: string | null;
  backend_url?: string | null;
  local_runbook?: string | null;
  test_credentials?: TestCredentialItem[];
  linked_account_id?: string | null;
}

export interface ExportBackupData {
  version: '1.0.0';
  exported_at: string;
  app: 'DevCommandCenter';
  user_id: string;
  accounts: Account[];
  projects: Project[];
}
