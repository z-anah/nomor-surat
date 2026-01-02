# context
I have next tailwind functionnal initialized project
I have created tables

# supabase
```
CREATE TABLE public.ns_fungsi_type (
  id integer NOT NULL DEFAULT nextval('ns_fungsi_type_id_seq'::regclass),
  fungsi_name text NOT NULL,
  fungsi_code text NOT NULL UNIQUE,
  CONSTRAINT ns_fungsi_type_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ns_nomor_surat (
  id integer NOT NULL DEFAULT nextval('ns_nomor_surat_id_seq'::regclass),
  file text,
  user_id uuid,
  title text NOT NULL,
  generated_nomor_surat text NOT NULL UNIQUE,
  fungsi_type_id integer,
  sk_type_id integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ns_nomor_surat_pkey PRIMARY KEY (id),
  CONSTRAINT ns_nomor_surat_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.ns_user_profile(id),
  CONSTRAINT ns_nomor_surat_fungsi_type_id_fkey FOREIGN KEY (fungsi_type_id) REFERENCES public.ns_fungsi_type(id),
  CONSTRAINT ns_nomor_surat_sk_type_id_fkey FOREIGN KEY (sk_type_id) REFERENCES public.ns_sk_type(id)
);
CREATE TABLE public.ns_sk_number_temp (
  id integer NOT NULL DEFAULT nextval('ns_sk_number_temp_id_seq'::regclass),
  sk_type_id integer NOT NULL UNIQUE,
  last_number integer NOT NULL DEFAULT 0,
  year integer,
  CONSTRAINT ns_sk_number_temp_pkey PRIMARY KEY (id),
  CONSTRAINT ns_sk_number_temp_sk_type_id_fkey FOREIGN KEY (sk_type_id) REFERENCES public.ns_sk_type(id)
);
CREATE TABLE public.ns_sk_type (
  id integer NOT NULL DEFAULT nextval('ns_sk_type_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  CONSTRAINT ns_sk_type_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ns_user_profile (
  id uuid NOT NULL,
  full_name text NOT NULL,
  username text NOT NULL UNIQUE,
  user_type_id integer,
  user_status_id integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ns_user_profile_pkey PRIMARY KEY (id),
  CONSTRAINT ns_user_profile_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT ns_user_profile_user_type_id_fkey FOREIGN KEY (user_type_id) REFERENCES public.ns_user_type(id),
  CONSTRAINT ns_user_profile_user_status_id_fkey FOREIGN KEY (user_status_id) REFERENCES public.ns_user_status(id)
);
CREATE TABLE public.ns_user_status (
  id integer NOT NULL DEFAULT nextval('ns_user_status_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  CONSTRAINT ns_user_status_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ns_user_type (
  id integer NOT NULL DEFAULT nextval('ns_user_type_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  CONSTRAINT ns_user_type_pkey PRIMARY KEY (id)
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
```

# task
dev all the of this 
## admin

* login
* manage types
  * user types
  * fungsi types
  * sk types
* manage users
  * invite editors
  * forgot password
* manage nomor surat
  * create personalized nomor surat
  * create nomor surat
  * view nomor surat list
  * edit nomor surat
  * upload file for nomor surat
  * request nomor surat

## editor

* login
* manage nomor surat
  * request nomor surat
  * upload file for nomor surat
  * view nomor surat list

---

## 📌 Full Development Prompt

> **Role**
> You are a **Senior Full-Stack Developer** specialized in **Next.js (App Router)**, **Tailwind CSS**, **Supabase (PostgreSQL, Auth, Storage, RPC)**, and **RBAC**.
> You build **clean, secure, production-ready code** with clear folder structure and best practices.

---

## 🧱 Tech Stack (Fixed)

* Next.js (App Router)
* Tailwind CSS
* Supabase

  * Auth (Email + Invite)
  * PostgreSQL (schema already provided)
  * Storage (file upload)
  * RPC (`increment_ns_sk_number`)
* TypeScript
* Server Actions / API Routes
* Middleware for auth & role protection

---

## 🗄 Database Context

Use **exactly** the provided Supabase schema:

* User & role management
  `ns_user_profile`, `ns_user_type`, `ns_user_status`
* Nomor Surat system
  `ns_nomor_surat`, `ns_fungsi_type`, `ns_sk_type`, `ns_sk_number_temp`
* Number generation via RPC
  `increment_ns_sk_number(p_sk_type_id)`
* Authentication linked to `auth.users`

Respect:

* Foreign keys
* Unique constraints
* Role-based access
* Transaction safety when generating nomor surat

---

## 🔐 Roles & Access Control

### Roles

* **Admin**
* **Editor**

Use `ns_user_type.name` to determine permissions.

### Access Rules

* Admin: full access
* Editor: limited to requesting & uploading nomor surat
* Protect routes using middleware + server checks

---

## 👑 ADMIN FEATURES

### Authentication

* Login
* Forgot password
* Session persistence

### Manage Types (CRUD)

* User Types (`ns_user_type`)
* Fungsi Types (`ns_fungsi_type`)
* SK Types (`ns_sk_type`)

### Manage Users

* View users
* Invite editors (Supabase invite)
* Assign user type
* User status control

### Manage Nomor Surat

* Create **personalized nomor surat**
* Create **automatic nomor surat**

  * Call `increment_ns_sk_number`
  * Generate formatted `generated_nomor_surat`
* View list (pagination + filters)
* Edit nomor surat
* Upload file (Supabase Storage)
* Handle **request nomor surat** from editors

---

## ✍️ EDITOR FEATURES

### Authentication

* Login
* Forgot password

### Nomor Surat

* Request nomor surat
* Upload file for nomor surat
* View own nomor surat list only

---

## 📁 Required App Structure

```
app/
 ├─ (auth)/
 │   ├─ login/
 │   └─ forgot-password/
 ├─ admin/
 │   ├─ dashboard/
 │   ├─ users/
 │   ├─ types/
 │   └─ nomor-surat/
 ├─ editor/
 │   ├─ dashboard/
 │   └─ nomor-surat/
 ├─ api/
 │   └─ nomor-surat/
 └─ middleware.ts
```

---

## ⚙️ Implementation Rules

* Use **Server Components by default**
* Use **Server Actions** for mutations
* Use **Supabase Row Level Security**
* Never trust client role → always verify server-side
* Handle race conditions when generating numbers
* Clean UI with Tailwind
* Proper loading & error states
* Use reusable components (Table, Modal, Form)

---

## 📄 Output Expectations

For every feature:

1. Database interaction (Supabase query or RPC)
2. API / Server Action
3. UI component (Tailwind)
4. Validation & error handling
5. Access control

Explain:

* Why each decision is made
* How security is enforced
* How nomor surat is generated step-by-step

---

## 🚀 Final Goal

Deliver a **fully functional Nomor Surat Management System** with:

* Clear admin/editor separation
* Safe number generation
* File uploads
* Scalable architecture
* Production-ready code

---


ps: use ui nuxt, inspired design by what already coded

```
## Authentication Setup Tasks

1. **Install and configure Supabase**
   - Add `@nuxtjs/supabase` to nuxt.config.ts
   - Set environment variables for Supabase

2. **Create auth pages structure**
   - `app/pages/(auth)/login.vue`
   - `app/pages/(auth)/forgot-password.vue`

3. **Build login form with UAuthForm**
   - Use existing `UAuthForm` component
   - Email/password validation
   - Loading states with existing UI patterns

4. **Create auth composables**
   - `composables/useAuth.ts`
   - Login, logout, session management

5. **Set up authentication middleware**
   - `middleware/auth.ts` - Protect routes
   - `middleware/guest.ts` - Redirect authenticated users

6. **User profile integration**
   - Fetch from `ns_user_profile` table (from prompt.md)
   - Link with Supabase auth user

7. **Role-based redirection**
   - Admin → `/admin/dashboard`
   - Editor → `/editor/dashboard`
   - Use `ns_user_type.name` for role checking

8. **Update navigation**
   - Modify default.vue
   - Add auth-specific menu items

9. **Error handling**
   - Use existing toast system
   - Invalid credentials feedback
   - Network error handling

10. **Session persistence**
    - Auto-login on refresh
    - Token refresh handling
    - Logout functionality

```