-- 1. Jadikan wallet_address boleh kosong (karena login email/google nggak punya wallet)
ALTER TABLE profiles ALTER COLUMN wallet_address DROP NOT NULL;

-- 2. Tambahkan kolom auth_id untuk connect dengan sistem Auth bawaan Supabase
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Bikin fungsi otomatis buatin profil (tersimpan di tabel profiles) pas user baru daftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (auth_id, username, avatar_url)
  VALUES (
    new.id, 
    -- Ambil dari form 'Data Username' atau potong bagian depan email buat fallback
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), 
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Bikin trigger biar fungsi otomatis jalan setiap ada yang Sign Up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
