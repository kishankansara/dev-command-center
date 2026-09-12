/**
 * DevCommandCenter Domain Types & Database Entities
 * Compliant with IEEE 830-1998 Specification
 */
export interface EncryptedPayload {
    v: number;
    kdf: 'PBKDF2-SHA256';
    iter: number;
    salt: string;
    iv: string;
    ct: string;
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
export type ServiceCategory = 'Frontend' | 'Backend' | 'Database' | 'AI Provider' | 'Storage' | 'Auth' | 'Custom';
export interface DeploymentService {
    id: string;
    category: ServiceCategory;
    customCategoryName?: string;
    provider: string;
    accountEmail: string;
    consoleUrl?: string;
    liveUrl?: string;
    notes?: string;
    linkedAccountId?: string;
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
//# sourceMappingURL=schema.d.ts.map