-- MULTI-TENANT ROW LEVEL SECURITY ISOLATION TEST SUITE (TC-RLS-01)
-- Verifies that User B cannot read, mutate, spoof, or link records belonging to User A

BEGIN;

-- 1. Create simulated auth tenants
DO $$
DECLARE
    user_a_id UUID := '11111111-1111-1111-1111-111111111111';
    user_b_id UUID := '22222222-2222-2222-2222-222222222222';
    project_a_id UUID;
    account_a_id UUID;
    queried_count INTEGER;
BEGIN
    RAISE NOTICE 'Starting Multi-Tenant RLS Test Execution...';

    -- Simulate User A session
    PERFORM set_config('request.jwt.claim.sub', user_a_id::text, true);
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

    -- User A creates an account and project
    INSERT INTO public.accounts (user_id, email, provider, purpose)
    VALUES (user_a_id, 'alpha@example.com', 'Gmail', 'Production Google Cloud')
    RETURNING id INTO account_a_id;

    INSERT INTO public.projects (user_id, name, git_repo_url, linked_account_id)
    VALUES (user_a_id, 'Alpha Project', 'https://github.com/alpha/repo', account_a_id)
    RETURNING id INTO project_a_id;

    RAISE NOTICE 'User A successfully created Project % and Account %', project_a_id, account_a_id;

    -- Switch to User B session
    PERFORM set_config('request.jwt.claim.sub', user_b_id::text, true);
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

    -- Test 1: User B tries to SELECT User A's project by UUID
    SELECT COUNT(*) INTO queried_count FROM public.projects WHERE id = project_a_id;
    IF queried_count <> 0 THEN
        RAISE EXCEPTION 'TEST FAILED: User B was able to see User A project! (Expected 0, got %)', queried_count;
    END IF;
    RAISE NOTICE 'PASS: User B queried User A project UUID -> returned 0 rows.';

    -- Test 2: User B tries to SELECT all projects
    SELECT COUNT(*) INTO queried_count FROM public.projects;
    IF queried_count <> 0 THEN
        RAISE EXCEPTION 'TEST FAILED: User B saw unowned projects in listing! (Expected 0, got %)', queried_count;
    END IF;
    RAISE NOTICE 'PASS: User B listed projects -> returned only User B projects (0 rows).';

    -- Test 3: User B attempts to UPDATE User A's project
    UPDATE public.projects SET name = 'Hacked Name' WHERE id = project_a_id;
    GET DIAGNOSTICS queried_count = ROW_COUNT;
    IF queried_count <> 0 THEN
        RAISE EXCEPTION 'TEST FAILED: User B was able to update User A project!';
    END IF;
    RAISE NOTICE 'PASS: User B attempted UPDATE on User A project -> 0 rows affected.';

    -- Test 4: User B attempts to DELETE User A's project
    DELETE FROM public.projects WHERE id = project_a_id;
    GET DIAGNOSTICS queried_count = ROW_COUNT;
    IF queried_count <> 0 THEN
        RAISE EXCEPTION 'TEST FAILED: User B was able to delete User A project!';
    END IF;
    RAISE NOTICE 'PASS: User B attempted DELETE on User A project -> 0 rows affected.';

    -- Test 5: User B attempts to INSERT a project with User A's user_id
    BEGIN
        INSERT INTO public.projects (user_id, name)
        VALUES (user_a_id, 'Spoofed Project');
        RAISE EXCEPTION 'TEST FAILED: User B spoofed User A user_id on INSERT!';
    EXCEPTION WHEN insufficient_privilege OR check_violation THEN
        RAISE NOTICE 'PASS: User B spoofed user_id on INSERT was successfully blocked by RLS.';
    END;

    -- Test 6: User B attempts to link their own project to User A's account
    BEGIN
        INSERT INTO public.projects (user_id, name, linked_account_id)
        VALUES (user_b_id, 'Project linking foreign account', account_a_id);
        RAISE EXCEPTION 'TEST FAILED: User B linked to User A account!';
    EXCEPTION WHEN insufficient_privilege OR check_violation THEN
        RAISE NOTICE 'PASS: User B cross-account linking was successfully blocked by RLS.';
    END;

    -- Switch to Unauthenticated / Anon session
    PERFORM set_config('request.jwt.claim.sub', '', true);
    PERFORM set_config('request.jwt.claim.role', 'anon', true);

    SELECT COUNT(*) INTO queried_count FROM public.projects;
    IF queried_count <> 0 THEN
        RAISE EXCEPTION 'TEST FAILED: Anon user was able to query projects!';
    END IF;
    RAISE NOTICE 'PASS: Anon user query returned 0 rows.';

    RAISE NOTICE 'ALL MULTI-TENANT ISOLATION TESTS PASSED!';
END $$;

ROLLBACK;
