-- 1. Create table for storing per-user zero-knowledge verification parameters
CREATE TABLE IF NOT EXISTS public.user_vault_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    vault_salt TEXT NOT NULL,         -- Hex/base64 encoded random 16-byte salt for PBKDF2
    vault_canary TEXT NOT NULL,       -- Ciphertext envelope of the string "VAULT_CANARY_VALID"
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.user_vault_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vault_settings FORCE ROW LEVEL SECURITY;

-- 3. Strict Multi-Tenant Policy
DROP POLICY IF EXISTS "Users can only access own vault settings" ON public.user_vault_settings;
CREATE POLICY "Users can only access own vault settings"
    ON public.user_vault_settings
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Supabase Realtime Publication (optional if realtime is enabled)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_vault_settings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_vault_settings;
    END IF;
END $$;
