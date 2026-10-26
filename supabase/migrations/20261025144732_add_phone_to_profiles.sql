-- Add phone number to user profiles
ALTER TABLE public.profiles
ADD COLUMN phone text;

-- Update profile creation to save the phone number
CREATE OR REPLACE FUNCTION private.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    phone
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'display_name'), ''),
      NEW.email
    ),
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'phone'), '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
