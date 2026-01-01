-- 1. User Type
CREATE TABLE ns_user_type (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

-- 2. User Status
CREATE TABLE ns_user_status (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

-- 3. User Profile (linked to Supabase auth.users)
CREATE TABLE ns_user_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    user_type_id INT REFERENCES ns_user_type(id),
    user_status_id INT REFERENCES ns_user_status(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. SK Type
CREATE TABLE ns_sk_type (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

-- 5. SK Number Temp
-- Added year column for yearly reset for sk_type_id = 1
CREATE TABLE ns_sk_number_temp (
    id SERIAL PRIMARY KEY,
    sk_type_id INT REFERENCES ns_sk_type(id) UNIQUE NOT NULL,
    last_number INT DEFAULT 0 NOT NULL,
    year INT  -- optional, for yearly reset
);

-- 6. Fungsi Type
CREATE TABLE ns_fungsi_type (
    id SERIAL PRIMARY KEY,
    fungsi_name TEXT NOT NULL,
    fungsi_code TEXT UNIQUE NOT NULL
);

-- 7. Nomor Surat
CREATE TABLE ns_nomor_surat (
    id SERIAL PRIMARY KEY,
    file TEXT,  -- could be a URL or file path
    user_id UUID REFERENCES ns_user_profile(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    generated_nomor_surat TEXT UNIQUE NOT NULL,
    fungsi_type_id INT REFERENCES ns_fungsi_type(id),
    sk_type_id INT REFERENCES ns_sk_type(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION increment_ns_sk_number(p_sk_type_id INT)
RETURNS INT AS $$
DECLARE
    current_last INT;
    last_year INT;
    current_year INT := EXTRACT(YEAR FROM NOW());
BEGIN
    -- Lock the row to prevent race conditions
    SELECT last_number, "year" INTO current_last, last_year
    FROM ns_sk_number_temp
    WHERE sk_type_id = p_sk_type_id
    FOR UPDATE;

    IF p_sk_type_id = 1 THEN
        -- Reset yearly
        IF last_year IS NULL OR last_year <> current_year THEN
            current_last := 1;
        ELSE
            current_last := current_last + 1;
        END IF;

        -- Update last_number and year
        UPDATE ns_sk_number_temp
        SET last_number = current_last,
            "year" = current_year
        WHERE sk_type_id = p_sk_type_id;
    ELSE
        -- Continuous increment
        current_last := COALESCE(current_last, 0) + 1;

        UPDATE ns_sk_number_temp
        SET last_number = current_last
        WHERE sk_type_id = p_sk_type_id;
    END IF;

    RETURN current_last;
END;
$$ LANGUAGE plpgsql;

