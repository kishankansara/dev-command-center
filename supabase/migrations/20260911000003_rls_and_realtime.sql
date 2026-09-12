-- ROW LEVEL SECURITY & REALTIME ENFORCEMENT
-- Strict Multi-Tenant Isolation: Users can strictly access and mutate only their own records.
-- Compliant with TC-RLS-01 and IEEE 830-1998 DevCommandCenter Specification

-- 1. Enable and Force RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts FORCE ROW LEVEL SECURITY;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects FORCE ROW LEVEL SECURITY;

-- 2. Drop any existing permissive policies to prevent conflicts
DROP POLICY IF EXISTS "accounts_select_policy" ON public.accounts;
DROP POLICY IF EXISTS "accounts_insert_policy" ON public.accounts;
DROP POLICY IF EXISTS "accounts_update_policy" ON public.accounts;
DROP POLICY IF EXISTS "accounts_delete_policy" ON public.accounts;

DROP POLICY IF EXISTS "projects_select_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_update_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON public.projects;

-- 3. Granular Multi-Tenant Policies for Accounts
-- Users can only read their own accounts
CREATE POLICY "accounts_select_policy" ON public.accounts
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can only insert accounts where user_id matches their authenticated UID
CREATE POLICY "accounts_insert_policy" ON public.accounts
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own accounts
CREATE POLICY "accounts_update_policy" ON public.accounts
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own accounts
CREATE POLICY "accounts_delete_policy" ON public.accounts
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 4. Granular Multi-Tenant Policies for Projects
-- Users can only read their own projects
CREATE POLICY "projects_select_policy" ON public.projects
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can only insert projects for themselves AND linked_account_id (if provided) must belong to auth.uid()
CREATE POLICY "projects_insert_policy" ON public.projects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND (
            linked_account_id IS NULL
            OR EXISTS (
                SELECT 1 FROM public.accounts a
                WHERE a.id = linked_account_id
                AND a.user_id = auth.uid()
            )
        )
    );

-- Users can only update their own projects AND cannot link to another tenant's account
CREATE POLICY "projects_update_policy" ON public.projects
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id
        AND (
            linked_account_id IS NULL
            OR EXISTS (
                SELECT 1 FROM public.accounts a
                WHERE a.id = linked_account_id
                AND a.user_id = auth.uid()
            )
        )
    );

-- Users can only delete their own projects
CREATE POLICY "projects_delete_policy" ON public.projects
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 5. Supabase Realtime Publication
-- Ensure CDC events are broadcast for real-time synchronization (FR-SYN-01)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'accounts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'projects'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
    END IF;
END $$;
