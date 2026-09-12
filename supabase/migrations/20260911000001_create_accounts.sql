-- ACCOUNTS ENTITY MIGRATION
-- Compliant with IEEE 830-1998 DevCommandCenter Specification (FR-ACC-01, FR-ACC-02, FR-ACC-03)

CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    email TEXT NOT NULL,
    provider TEXT DEFAULT 'Gmail' NOT NULL,
    purpose TEXT,
    recovery_email TEXT,
    encrypted_password TEXT,
    encrypted_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for high-performance multi-tenant filtering
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_email ON public.accounts(email);
