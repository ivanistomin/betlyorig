import { supabase } from './supabaseClient';

const TABLE_MAP = {
  Bet: 'bets',
  UserProfile: 'user_profiles',
  CommunityBet: 'community_bets',
  Mission: 'missions',
  UserMission: 'user_missions',
};

function parseSort(sortStr) {
  if (!sortStr) return null;
  const desc = sortStr.startsWith('-');
  const column = desc ? sortStr.slice(1) : sortStr;
  return { column, ascending: !desc };
}

function buildEntity(entityName) {
  const table = TABLE_MAP[entityName];
  if (!table) {
    throw new Error(`Unknown entity: ${entityName}`);
  }

  const baseQuery = () => supabase.from(table);

  const applyFilter = (query, filter) => {
    if (!filter) return query;
    for (const [key, value] of Object.entries(filter)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    }
    return query;
  };

  const applySort = (query, sortStr) => {
    const sort = parseSort(sortStr);
    if (sort) query = query.order(sort.column, { ascending: sort.ascending });
    return query;
  };

  const handleResult = ({ data, error }) => {
    if (error) {
       
      console.error(`[Supabase ${table}]`, error);
      throw error;
    }
    return data;
  };

  return {
    async filter(filter, sortStr, limit) {
      let q = baseQuery().select('*');
      q = applyFilter(q, filter);
      q = applySort(q, sortStr);
      if (limit) q = q.limit(limit);
      return handleResult(await q) || [];
    },
    async list(sortStr, limit) {
      let q = baseQuery().select('*');
      q = applySort(q, sortStr);
      if (limit) q = q.limit(limit);
      return handleResult(await q) || [];
    },
    async get(id) {
      const res = await baseQuery().select('*').eq('id', id).maybeSingle();
      return handleResult(res);
    },
    async create(payload) {
      const res = await baseQuery().insert(payload).select().single();
      return handleResult(res);
    },
    async update(id, payload) {
      const res = await baseQuery().update(payload).eq('id', id).select().single();
      return handleResult(res);
    },
    async delete(id) {
      const res = await baseQuery().delete().eq('id', id);
      handleResult(res);
      return { id };
    },
  };
}

const entityCache = {};
const entities = new Proxy(
  {},
  {
    get(_, name) {
      if (typeof name !== 'string') return undefined;
      if (!entityCache[name]) entityCache[name] = buildEntity(name);
      return entityCache[name];
    },
  },
);

async function getCurrentSupabaseUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

function mapUser(supabaseUser) {
  if (!supabaseUser) return null;
  const meta = supabaseUser.user_metadata || {};
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    full_name: meta.full_name || meta.display_name || meta.name || 'Player',
    role: meta.role || 'user',
    tg_id: meta.tg_id || null,
    tg_username: meta.tg_username || null,
    tg_photo_url: meta.tg_photo_url || null,
  };
}

const auth = {
  async me() {
    const user = await getCurrentSupabaseUser();
    if (!user) {
      const err = new Error('Not authenticated');
      err.status = 401;
      throw err;
    }
    return mapUser(user);
  },
  async isAuthenticated() {
    const user = await getCurrentSupabaseUser();
    return !!user;
  },
  async logout() {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  },
  async redirectToLogin() {
    if (typeof window !== 'undefined') window.location.reload();
  },
};

const functions = {
  async invoke(name, payload) {
    const session = (await supabase.auth.getSession()).data?.session;
    const res = await fetch(`/api/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}),
      },
      body: JSON.stringify(payload || {}),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Function ${name} failed: ${res.status} ${text}`);
    }
    return res.json();
  },
};

const integrations = {
  Core: {
    async UploadFile({ file }) {
      if (!file) return { file_url: '' };
      const path = `uploads/${Date.now()}_${file.name || 'file'}`;
      const { data, error } = await supabase.storage
        .from('public')
        .upload(path, file, { upsert: false });
      if (error) {
         
        console.error('[Supabase upload]', error);
        return { file_url: '' };
      }
      const { data: pub } = supabase.storage.from('public').getPublicUrl(data.path);
      return { file_url: pub.publicUrl };
    },
  },
};

export const db = { auth, entities, functions, integrations };
export const base44 = db;
export default db;
