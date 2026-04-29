// import 'dotenv/config';

const ML_BASE_URL = 'https://api.mercadolibre.com';

// seller_id de Carrefour Argentina en Mercado Libre
const CARREFOUR_SELLER_ID: number = 2516198735;

// Límites de la API de ML
const ITEMS_PER_PAGE = 100;   // max para /users/{id}/items/search
const BATCH_SIZE = 20;        // max para /items?ids=...
const CONCURRENCY = 5;

export interface MLProduct {
  id: string;
  title: string;
  price: number;
  original_price: number | null;
  currency_id: string;
  available_quantity: number;
  permalink: string;
  thumbnail: string;
  category_id: string;
  seller_id: number;
}

// ─── OAuth ───────────────────────────────────────────────────────────────────

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  const clientId = process.env.ML_CLIENT_ID;
  const clientSecret = process.env.ML_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Faltan ML_CLIENT_ID y ML_CLIENT_SECRET en el .env\n' +
        '→ Creá una app gratis en https://developers.mercadolibre.com.ar',
    );
  }

  const res = await fetch(`${ML_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    throw new Error(`ML OAuth error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.value;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function mlFetch(url: string): Promise<unknown> {
  const token = await getAccessToken();
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`ML API error ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

// Paso 1: obtener IDs de items de un vendedor paginando
async function fetchSellerItemIds(sellerId: number): Promise<string[]> {
  const allIds: string[] = [];
  let offset = 0;

  while (true) {
    const url = `${ML_BASE_URL}/users/${sellerId}/items/search?limit=${ITEMS_PER_PAGE}&offset=${offset}`;
    const data = (await mlFetch(url)) as {
      results: string[];
      paging: { total: number; limit: number; offset: number };
    };

    allIds.push(...data.results);

    const { total } = data.paging;
    offset += ITEMS_PER_PAGE;

    console.log(`IDs obtenidos: ${allIds.length} / ${total}`);

    if (allIds.length >= total) break;
  }

  return allIds;
}

// Paso 2: fetchear detalles de items en batches de 20
async function fetchItemsBatch(ids: string[]): Promise<MLProduct[]> {
  const url = `${ML_BASE_URL}/items?ids=${ids.join(',')}`;
  const data = (await mlFetch(url)) as Array<{ code: number; body: MLProduct }>;

  return data
    .filter((entry) => entry.code === 200)
    .map((entry) => entry.body);
}

// ─── API pública ──────────────────────────────────────────────────────────────

export async function getCarrefourProducts(): Promise<MLProduct[]> {
  console.log('Obteniendo IDs de productos de Carrefour...');
  const ids = await fetchSellerItemIds(CARREFOUR_SELLER_ID);
  console.log(`\nTotal de IDs: ${ids.length}. Fetching detalles...`);

  const allProducts: MLProduct[] = [];

  // Partir los IDs en batches de 20
  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    batches.push(ids.slice(i, i + BATCH_SIZE));
  }

  // Procesar batches con concurrencia controlada
  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const chunk = batches.slice(i, i + CONCURRENCY);
    const results = await Promise.all(chunk.map(fetchItemsBatch));
    for (const items of results) {
      allProducts.push(...items);
    }
    console.log(`Productos con detalles: ${allProducts.length} / ${ids.length}`);
  }

  return allProducts;
}

export async function getProductById(itemId: string): Promise<MLProduct> {
  const data = (await mlFetch(`${ML_BASE_URL}/items/${itemId}`)) as MLProduct;
  return data;
}

// ─── Script standalone ────────────────────────────────────────────────────────

if (require.main === module) {
  getCarrefourProducts()
    .then((products) => {
      console.log(`\n✅ ${products.length} productos obtenidos`);
      console.log('\nEjemplos:');
      products.slice(0, 5).forEach((p) => {
        console.log(`  [${p.id}] ${p.title}`);
        console.log(`         Precio: $${p.price} ${p.currency_id}`);
        if (p.original_price) console.log(`         Precio original: $${p.original_price}`);
      });
    })
    .catch((err) => {
      console.error('❌ Error:', err.message);
      process.exit(1);
    });
}
