import { v4 as uuidv4 } from 'uuid';

export interface Env {
  DB: D1Database;
  TELEGRAM_TOKEN: string;
  ASSETS: Fetcher;
}

interface Item {
  id: string;
  name: string;
  expiry: string;
  price_cents: number;
  cycle_unit: 'day' | 'month' | 'year';
  cycle_len: number;
  chat_id: number;
}

interface CreateItemRequest {
  name: string;
  expiry: string;
  price: number;
  cycle_unit: 'day' | 'month' | 'year';
  cycle_len: number;
  chat_id: number;
}

const STATIC_ASSETS_PREFIX = '/static/';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env);
    }

    // 交给静态资产绑定；未命中时会按 not_found_handling 回退到 index.html
    return env.ASSETS.fetch(request);
  },

  async scheduled(event, env, ctx) {
    await ensureTableExists(env.DB);
    await checkExpiringItems(env);
  }
};

async function ensureTableExists(db: D1Database): Promise<void> {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      expiry TIMESTAMP NOT NULL,
      price_cents INTEGER NOT NULL,
      cycle_unit TEXT NOT NULL CHECK (cycle_unit IN ('day', 'month', 'year')),
      cycle_len INTEGER NOT NULL,
      chat_id BIGINT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // 确保索引和触发器也存在
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_items_expiry ON items(expiry);`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_items_chat_id ON items(chat_id);`).run();
  await db.prepare(`
    CREATE TRIGGER IF NOT EXISTS update_items_updated_at
    AFTER UPDATE ON items
    FOR EACH ROW
    BEGIN
        UPDATE items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `).run();
}

async function handleAPI(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (url.pathname === '/api/items') {
      if (method === 'GET') {
        return await getItems(env, corsHeaders);
      } else if (method === 'POST') {
        return await createItem(request, env, corsHeaders);
      }
    }

    const itemIdMatch = url.pathname.match(/^\/api\/items\/(.+)$/);
    if (itemIdMatch) {
      const itemId = itemIdMatch[1];
      if (method === 'PUT') {
        return await updateItem(request, env, itemId, corsHeaders);
      } else if (method === 'DELETE') {
        return await deleteItem(env, itemId, corsHeaders);
      }
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function getItems(env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  const { results } = await env.DB.prepare('SELECT * FROM items ORDER BY expiry ASC').all();

  return new Response(JSON.stringify(results), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function createItem(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  const data: CreateItemRequest = await request.json();

  const item: Item = {
    id: uuidv4(),
    name: data.name,
    expiry: data.expiry,
    price_cents: Math.round(data.price * 100),
    cycle_unit: data.cycle_unit,
    cycle_len: data.cycle_len,
    chat_id: data.chat_id,
  };

  await env.DB.prepare(`
    INSERT INTO items (id, name, expiry, price_cents, cycle_unit, cycle_len, chat_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    item.id,
    item.name,
    item.expiry,
    item.price_cents,
    item.cycle_unit,
    item.cycle_len,
    item.chat_id
  ).run();

  return new Response(JSON.stringify(item), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function updateItem(request: Request, env: Env, itemId: string, corsHeaders: Record<string, string>): Promise<Response> {
  const data: CreateItemRequest = await request.json();

  const result = await env.DB.prepare(`
    UPDATE items 
    SET name = ?, expiry = ?, price_cents = ?, cycle_unit = ?, cycle_len = ?, chat_id = ?
    WHERE id = ?
  `).bind(
    data.name,
    data.expiry,
    Math.round(data.price * 100),
    data.cycle_unit,
    data.cycle_len,
    data.chat_id,
    itemId
  ).run();

  if (result.changes === 0) {
    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function deleteItem(env: Env, itemId: string, corsHeaders: Record<string, string>): Promise<Response> {
  const result = await env.DB.prepare('DELETE FROM items WHERE id = ?').bind(itemId).run();

  if (result.changes === 0) {
    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function checkExpiringItems(env: Env): Promise<void> {
  const { results } = await env.DB.prepare(`
    SELECT * FROM items 
    WHERE expiry BETWEEN datetime('now') AND datetime('now', '+7 days')
  `).all();

  for (const item of results as Item[]) {
    const expiryDate = new Date(item.expiry);
    const formattedDate = new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(expiryDate);

    const price = (item.price_cents / 100).toFixed(2);
    const message = `🔔 ${item.name} 将于 ${formattedDate} 到期，价格 ${price} 元`;

    await sendTelegramMessage(env.TELEGRAM_TOKEN, item.chat_id, message);
  }
}

async function sendTelegramMessage(token: string, chatId: number, message: string): Promise<void> {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
    }),
  });
}

// 移除内嵌的前端文件内容，改为通过 ASSETS 绑定服务
// async function getIndexHTML(): Promise<string> { /* ... */ }
// async function getStyleCSS(): Promise<string> { /* ... */ }
// async function getAppJS(): Promise<string> { /* ... */ }

