import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabaseAdmin(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getSupabasePublic(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

interface AuthenticatedRequest extends Request {
  callerUser?: {
    id: string;
    email: string;
    role: string;
  };
}

async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    res.status(503).json({
      error: 'SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di server.',
    });
    return;
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'Token autentikasi tidak ditemukan.' });
    return;
  }

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData?.user) {
    res.status(401).json({ error: 'Sesi tidak valid atau telah berakhir.' });
    return;
  }

  const { data: profile, error: profErr } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role, is_active')
    .eq('id', userData.user.id)
    .single();

  if (profErr || !profile || profile.role !== 'admin' || !profile.is_active) {
    res.status(403).json({ error: 'Akses ditolak. Hanya Admin aktif yang diizinkan.' });
    return;
  }

  req.callerUser = {
    id: profile.id,
    email: profile.email,
    role: profile.role,
  };
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Public Supabase runtime config (never exposes service role key)
  app.get('/api/config', (_req, res) => {
    res.json({
      configured: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
      hasServiceRole: Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY),
      supabaseUrl: SUPABASE_URL,
      supabaseAnonKey: SUPABASE_ANON_KEY,
    });
  });

  // Check whether any user exists yet (used on /login to offer first-user Admin setup)
  app.get('/api/auth/first-user-status', async (_req, res) => {
    const supabaseAdmin = getSupabaseAdmin();
    const supabasePublic = getSupabasePublic();

    if (!supabaseAdmin && !supabasePublic) {
      res.json({ configured: false, hasUsers: true });
      return;
    }

    try {
      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
        if (error) {
          res.json({ configured: true, hasUsers: false, checkError: error.message });
          return;
        }
        res.json({ configured: true, hasUsers: (data?.users?.length ?? 0) > 0 });
        return;
      }

      // Without service role key, count profiles if readable or assume client signup handles trigger
      const { count } = await supabasePublic!
        .from('profiles')
        .select('id', { count: 'exact', head: true });
      res.json({ configured: true, hasUsers: (count ?? 0) > 0 });
    } catch {
      res.json({ configured: true, hasUsers: false });
    }
  });

  // Register the very first user in Supabase Auth and enforce role = 'admin'
  app.post('/api/auth/register-first-admin', async (req, res) => {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      res.status(503).json({
        error: 'SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi. Gunakan tab Daftar atau konfigurasi Secrets terlebih dahulu.',
      });
      return;
    }

    const { email, password, full_name, nip } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string' || typeof full_name !== 'string') {
      res.status(400).json({ error: 'Email, password, dan nama lengkap wajib diisi.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password minimal 6 karakter.' });
      return;
    }

    const { data: existingUsers, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });
    if (listErr) {
      res.status(500).json({ error: listErr.message });
      return;
    }

    if ((existingUsers?.users?.length ?? 0) > 0) {
      res.status(403).json({
        error: 'User pertama sudah terdaftar. Penambahan pengguna baru hanya dapat dilakukan oleh Admin.',
      });
      return;
    }

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name.trim(),
        role: 'admin',
        nip: typeof nip === 'string' ? nip.trim() : '',
        jabatan: 'Administrator Utama',
      },
    });

    if (createErr || !created.user) {
      res.status(400).json({ error: createErr?.message || 'Gagal membuat akun admin pertama.' });
      return;
    }

    // Ensure profile row exists with admin role even if trigger wasn't installed yet
    const { error: upsertErr } = await supabaseAdmin.from('profiles').upsert({
      id: created.user.id,
      email: created.user.email,
      full_name: full_name.trim(),
      nip: typeof nip === 'string' ? nip.trim() : '',
      role: 'admin',
      jabatan: 'Administrator Utama',
      is_active: true,
    });

    if (upsertErr) {
      res.status(500).json({
        error: `User Auth dibuat, tetapi gagal menyimpan profil (pastikan schema SQL sudah dijalankan): ${upsertErr.message}`,
      });
      return;
    }

    res.status(201).json({
      user: {
        id: created.user.id,
        email: created.user.email,
        role: 'admin',
      },
    });
  });

  // Ensure signed-in user has a profile (first user automatically becomes admin)
  app.post('/api/auth/ensure-profile', async (req, res) => {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      res.status(503).json({ error: 'Service role belum tersedia.' });
      return;
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
      res.status(401).json({ error: 'Token tidak ditemukan.' });
      return;
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      res.status(401).json({ error: 'Sesi tidak valid.' });
      return;
    }

    const user = userData.user;
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfile) {
      res.json({ profile: existingProfile });
      return;
    }

    const { count } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    const isFirstUser = (count ?? 0) === 0;
    const metaRole = user.user_metadata?.role;
    const validMetaRole =
      metaRole === 'admin' || metaRole === 'guru' || metaRole === 'tenaga_kependidikan'
        ? metaRole
        : 'tenaga_kependidikan';

    const newProfile = {
      id: user.id,
      email: user.email || '',
      full_name:
        user.user_metadata?.full_name ||
        (user.email ? user.email.split('@')[0] : 'Pengguna'),
      nip: user.user_metadata?.nip || '',
      role: isFirstUser ? 'admin' : validMetaRole,
      jabatan: user.user_metadata?.jabatan || (isFirstUser ? 'Administrator' : ''),
      is_active: true,
    };

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('profiles')
      .insert(newProfile)
      .select('*')
      .single();

    if (insertErr) {
      res.status(500).json({ error: insertErr.message });
      return;
    }

    res.json({ profile: inserted });
  });

  // ============================================================================
  // ADMIN USER MANAGEMENT API (Synced 100% with Supabase Authentication)
  // ============================================================================

  app.get('/api/admin/users', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
    const supabaseAdmin = getSupabaseAdmin()!;
    const { data: authList, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 500,
    });

    if (authErr) {
      res.status(500).json({ error: authErr.message });
      return;
    }

    const { data: profiles, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (profErr) {
      res.status(500).json({ error: profErr.message });
      return;
    }

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    const users = (authList?.users || []).map((authUser) => {
      const prof = profileMap.get(authUser.id);
      return {
        id: authUser.id,
        email: authUser.email || prof?.email || '',
        full_name: prof?.full_name || authUser.user_metadata?.full_name || authUser.email || '',
        nip: prof?.nip || authUser.user_metadata?.nip || '',
        role: prof?.role || authUser.user_metadata?.role || 'tenaga_kependidikan',
        jabatan: prof?.jabatan || authUser.user_metadata?.jabatan || '',
        is_active: prof?.is_active ?? true,
        created_at: prof?.created_at || authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at || null,
        email_confirmed_at: authUser.email_confirmed_at || null,
      };
    });

    res.json({ users });
  });

  app.post('/api/admin/users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const supabaseAdmin = getSupabaseAdmin()!;
    const { email, password, full_name, role, nip, jabatan } = req.body ?? {};

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof full_name !== 'string' ||
      !['admin', 'guru', 'tenaga_kependidikan'].includes(role)
    ) {
      res.status(400).json({ error: 'Data pengguna tidak valid. Periksa email, password, nama, dan role.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password minimal 6 karakter.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = full_name.trim();
    const cleanNip = typeof nip === 'string' ? nip.trim() : '';
    const cleanJabatan = typeof jabatan === 'string' ? jabatan.trim() : '';

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: cleanName,
        role,
        nip: cleanNip,
        jabatan: cleanJabatan,
      },
    });

    if (createErr || !created.user) {
      res.status(400).json({ error: createErr?.message || 'Gagal menambahkan user ke Supabase Auth.' });
      return;
    }

    const { data: profile, error: profErr } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: created.user.id,
        email: cleanEmail,
        full_name: cleanName,
        nip: cleanNip,
        role,
        jabatan: cleanJabatan,
        is_active: true,
      })
      .select('*')
      .single();

    if (profErr) {
      // Rollback auth user if profile insert fails
      await supabaseAdmin.auth.admin.deleteUser(created.user.id, false);
      res.status(500).json({ error: `Gagal menyimpan profil user: ${profErr.message}` });
      return;
    }

    res.status(201).json({
      user: {
        ...profile,
        last_sign_in_at: null,
        email_confirmed_at: created.user.email_confirmed_at || null,
      },
    });
  });

  app.patch('/api/admin/users/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const supabaseAdmin = getSupabaseAdmin()!;
    const targetId = String(req.params.id);
    const { email, password, full_name, role, nip, jabatan, is_active } = req.body ?? {};

    if (
      typeof full_name !== 'string' ||
      !full_name.trim() ||
      !['admin', 'guru', 'tenaga_kependidikan'].includes(role)
    ) {
      res.status(400).json({ error: 'Nama lengkap dan role wajib diisi dengan benar.' });
      return;
    }

    if (targetId === req.callerUser?.id && (role !== 'admin' || is_active === false)) {
      res.status(400).json({ error: 'Anda tidak dapat menurunkan role atau menonaktifkan akun Anda sendiri.' });
      return;
    }

    const authUpdatePayload: {
      email?: string;
      password?: string;
      user_metadata: Record<string, unknown>;
    } = {
      user_metadata: {
        full_name: full_name.trim(),
        role,
        nip: typeof nip === 'string' ? nip.trim() : '',
        jabatan: typeof jabatan === 'string' ? jabatan.trim() : '',
      },
    };

    if (typeof email === 'string' && email.trim()) {
      authUpdatePayload.email = email.trim().toLowerCase();
    }

    if (typeof password === 'string' && password.length > 0) {
      if (password.length < 6) {
        res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
        return;
      }
      authUpdatePayload.password = password;
    }

    const { data: updatedAuth, error: authErr } = await supabaseAdmin.auth.admin.updateUserById(
      targetId,
      authUpdatePayload
    );

    if (authErr || !updatedAuth.user) {
      res.status(400).json({ error: authErr?.message || 'Gagal memperbarui user di Supabase Auth.' });
      return;
    }

    const { data: updatedProfile, error: profErr } = await supabaseAdmin
      .from('profiles')
      .update({
        email: updatedAuth.user.email || (typeof email === 'string' ? email.trim().toLowerCase() : ''),
        full_name: full_name.trim(),
        nip: typeof nip === 'string' ? nip.trim() : '',
        role,
        jabatan: typeof jabatan === 'string' ? jabatan.trim() : '',
        is_active: typeof is_active === 'boolean' ? is_active : true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetId)
      .select('*')
      .single();

    if (profErr) {
      res.status(500).json({ error: profErr.message });
      return;
    }

    res.json({
      user: {
        ...updatedProfile,
        last_sign_in_at: updatedAuth.user.last_sign_in_at || null,
        email_confirmed_at: updatedAuth.user.email_confirmed_at || null,
      },
    });
  });

  app.delete('/api/admin/users/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const supabaseAdmin = getSupabaseAdmin()!;
    const targetId = String(req.params.id);

    if (targetId === req.callerUser?.id) {
      res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri.' });
      return;
    }

    // Hard delete from Supabase Authentication (shouldSoftDelete = false)
    const { error: delAuthErr } = await supabaseAdmin.auth.admin.deleteUser(targetId, false);
    if (delAuthErr) {
      res.status(400).json({ error: `Gagal hard delete dari Supabase Auth: ${delAuthErr.message}` });
      return;
    }

    // Ensure profile row is also removed if not already cascaded
    await supabaseAdmin.from('profiles').delete().eq('id', targetId);

    res.json({ deleted: true, id: targetId });
  });

  // Vite dev middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
