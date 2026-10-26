
-- Transfer club ownership securely.
-- The caller must be the current owner and the recipient
-- must already be a member of the same club.

CREATE OR REPLACE FUNCTION public.transfer_club_ownership(
    p_club_id uuid,
    p_new_owner_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_current_owner_id uuid;
BEGIN
    -- Require an authenticated caller.
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required'
            USING ERRCODE = '42501';
    END IF;

    -- Prevent transferring ownership to oneself.
    IF p_new_owner_id = auth.uid() THEN
        RAISE EXCEPTION 'The new owner must be another user'
            USING ERRCODE = '22023';
    END IF;

    -- Lock the club row and read its current owner.
    SELECT c.owner_id
      INTO v_current_owner_id
      FROM public.clubs AS c
     WHERE c.id = p_club_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Club not found'
            USING ERRCODE = 'P0002';
    END IF;

    -- Only the current owner can transfer ownership.
    IF v_current_owner_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'Only the current owner can transfer this club'
            USING ERRCODE = '42501';
    END IF;

    -- The recipient must already belong to this club.
    IF NOT EXISTS (
        SELECT 1
          FROM public.club_members AS cm
         WHERE cm.club_id = p_club_id
           AND cm.profile_id = p_new_owner_id
    ) THEN
        RAISE EXCEPTION 'The new owner must already be a club member'
            USING ERRCODE = '22023';
    END IF;

    -- Ensure the current owner has the owner role.
    IF NOT EXISTS (
        SELECT 1
          FROM public.club_members AS cm
         WHERE cm.club_id = p_club_id
           AND cm.profile_id = auth.uid()
           AND cm.role = 'owner'
    ) THEN
        RAISE EXCEPTION 'Club ownership and membership role are inconsistent'
            USING ERRCODE = 'P0002';
    END IF;

    -- Promote the recipient.
    UPDATE public.club_members
       SET role = 'owner'
     WHERE club_id = p_club_id
       AND profile_id = p_new_owner_id;

    -- The previous owner becomes an administrator.
    UPDATE public.club_members
       SET role = 'admin'
     WHERE club_id = p_club_id
       AND profile_id = auth.uid();

    -- Update the authoritative club owner.
    UPDATE public.clubs
       SET owner_id = p_new_owner_id
     WHERE id = p_club_id;
END;
$$;

-- Only authenticated users may invoke this function.
REVOKE ALL ON FUNCTION public.transfer_club_ownership(uuid, uuid)
    FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.transfer_club_ownership(uuid, uuid)
    TO authenticated;
