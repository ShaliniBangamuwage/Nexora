require('dotenv').config();

const { cert, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const EXPECTED_PROJECT_ID = 'nexora-ecommerce-2975e';
const categories = [
  'Smartphones',
  'Laptops',
  'Tablets',
  'Monitors',
  'Audio',
  'Keyboards & Mice',
  'Networking',
  'Accessories',
];

const brands = [
  { name: 'Apple', country: 'United States', established: 1976 },
  { name: 'Samsung', country: 'South Korea', established: 1938 },
  { name: 'ASUS', country: 'Taiwan', established: 1989 },
  { name: 'Lenovo', country: 'China', established: 1984 },
  { name: 'HP', country: 'United States', established: 1939 },
  { name: 'Dell', country: 'United States', established: 1984 },
  { name: 'Logitech', country: 'Switzerland', established: 1981 },
  { name: 'Anker', country: 'China', established: 2011 },
];

const image = (photoId) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1000&q=80`;

const products = [
  { code: 'NXR-DEV-PHN-001', name: 'iPhone 16 128GB', brand: 'Apple', category: 'Smartphones', price: 329900, stock: 12, warranty: '1 year', image: image('photo-1592899677977-9c10ca588bbd'), specifications: { Display: '6.1-inch Super Retina XDR', Chip: 'A18', Storage: '128GB', Connectivity: '5G' } },
  { code: 'NXR-DEV-PHN-002', name: 'Galaxy S25 256GB', brand: 'Samsung', category: 'Smartphones', price: 299900, stock: 10, warranty: '1 year', image: image('photo-1511707171634-5f897ff02aa9'), specifications: { Display: '6.2-inch Dynamic AMOLED 2X', Processor: 'Snapdragon 8 Elite', Storage: '256GB', Connectivity: '5G' } },
  { code: 'NXR-DEV-LAP-001', name: 'Zenbook 14 OLED', brand: 'ASUS', category: 'Laptops', price: 429900, stock: 6, warranty: '2 years', image: image('photo-1496181133206-80ce9b88a853'), specifications: { Display: '14-inch 2.8K OLED', Processor: 'Intel Core Ultra 7', Memory: '16GB', Storage: '1TB SSD' } },
  { code: 'NXR-DEV-LAP-002', name: 'ThinkPad E14 Gen 6', brand: 'Lenovo', category: 'Laptops', price: 389900, stock: 8, warranty: '2 years', image: image('photo-1588872657578-7efd1f1555ed'), specifications: { Display: '14-inch WUXGA IPS', Processor: 'Intel Core Ultra 5', Memory: '16GB', Storage: '512GB SSD' } },
  { code: 'NXR-DEV-LAP-003', name: 'Pavilion 15 Ryzen 7', brand: 'HP', category: 'Laptops', price: 319900, stock: 5, warranty: '1 year', image: image('photo-1517336714731-489689fd1ca8'), specifications: { Display: '15.6-inch Full HD IPS', Processor: 'AMD Ryzen 7', Memory: '16GB', Storage: '512GB SSD' } },
  { code: 'NXR-DEV-LAP-004', name: 'XPS 13 Core Ultra 7', brand: 'Dell', category: 'Laptops', price: 649900, stock: 3, warranty: '1 year', image: image('photo-1496181133206-80ce9b88a853'), specifications: { Display: '13.4-inch FHD+', Processor: 'Intel Core Ultra 7', Memory: '16GB', Storage: '1TB SSD' } },
  { code: 'NXR-DEV-TAB-001', name: 'iPad Air 11-inch 128GB', brand: 'Apple', category: 'Tablets', price: 329900, stock: 7, warranty: '1 year', image: image('photo-1544244015-0df4b3ffc6b0'), specifications: { Display: '11-inch Liquid Retina', Chip: 'M2', Storage: '128GB', Connectivity: 'Wi-Fi' } },
  { code: 'NXR-DEV-TAB-002', name: 'Galaxy Tab S10 FE 128GB', brand: 'Samsung', category: 'Tablets', price: 249900, stock: 9, warranty: '1 year', image: image('photo-1561154464-82e9adf32764'), specifications: { Display: '10.9-inch LCD', Processor: 'Exynos 1580', Storage: '128GB', Connectivity: 'Wi-Fi' } },
  { code: 'NXR-DEV-MON-001', name: 'TUF Gaming VG27AQ 27-inch', brand: 'ASUS', category: 'Monitors', price: 169900, stock: 4, warranty: '3 years', image: image('photo-1527443224154-c4a3942d3acf'), specifications: { Display: '27-inch QHD IPS', RefreshRate: '165Hz', ResponseTime: '1ms', AdaptiveSync: 'G-SYNC Compatible' } },
  { code: 'NXR-DEV-AUD-001', name: 'Soundcore Space Q45', brand: 'Anker', category: 'Audio', price: 38900, stock: 18, warranty: '18 months', image: image('photo-1505740420928-5e560c06d30e'), specifications: { Type: 'Wireless over-ear', NoiseCancellation: 'Adaptive ANC', Battery: 'Up to 50 hours', Connectivity: 'Bluetooth 5.3' } },
  { code: 'NXR-DEV-AUD-002', name: 'AirPods 4', brand: 'Apple', category: 'Audio', price: 68900, stock: 14, warranty: '1 year', image: image('photo-1606220945770-b5b6c2c55bf1'), specifications: { Type: 'Wireless earbuds', Chip: 'H2', Audio: 'Spatial Audio', Charging: 'USB-C case' } },
  { code: 'NXR-DEV-KBM-001', name: 'MX Keys S Wireless Keyboard', brand: 'Logitech', category: 'Keyboards & Mice', price: 58900, stock: 11, warranty: '1 year', image: image('photo-1587829741301-dc798b83add3'), specifications: { Layout: 'Full-size US', Switches: 'Low-profile scissor', Connectivity: 'Bluetooth / Logi Bolt', Backlight: 'Smart illumination' } },
  { code: 'NXR-DEV-KBM-002', name: 'MX Master 3S Wireless Mouse', brand: 'Logitech', category: 'Keyboards & Mice', price: 39900, stock: 16, warranty: '1 year', image: image('photo-1527814050087-3793815479db'), specifications: { Sensor: '8000 DPI', Buttons: '7 programmable', Connectivity: 'Bluetooth / Logi Bolt', Charging: 'USB-C' } },
  { code: 'NXR-DEV-NET-001', name: 'RT-BE88U Wi-Fi 7 Router', brand: 'ASUS', category: 'Networking', price: 149900, stock: 5, warranty: '3 years', image: image('photo-1558494949-ef010cbdcc31'), specifications: { Standard: 'Wi-Fi 7', Bands: 'Dual-band', Ethernet: '10GbE / 2.5GbE', Security: 'AiProtection Pro' } },
  { code: 'NXR-DEV-ACC-001', name: '737 Power Bank 24000mAh', brand: 'Anker', category: 'Accessories', price: 45900, stock: 20, warranty: '18 months', image: image('photo-1609091839311-d5365f9ff1c5'), specifications: { Capacity: '24000mAh', Output: '140W USB-C', Ports: '2 USB-C, 1 USB-A', Display: 'Digital power display' } },
  { code: 'NXR-DEV-ACC-002', name: '7-in-1 USB-C Multiport Hub', brand: 'Lenovo', category: 'Accessories', price: 24900, stock: 22, warranty: '1 year', image: image('photo-1625842268584-8f3296236761'), specifications: { Ports: 'HDMI, 2x USB-A, USB-C, SD, microSD', Video: 'Up to 4K at 60Hz', PowerDelivery: 'Up to 100W', Connector: 'USB-C' } },
];

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function main() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (projectId !== EXPECTED_PROJECT_ID) {
    throw new Error(`Refusing to seed unexpected Firebase project: ${projectId || '(unset)'}`);
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
    throw new Error('Firebase Admin credentials are incomplete');
  }

  const app = initializeApp({
    projectId,
    credential: cert({
      projectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
  const db = getFirestore(app);
  const now = new Date().toISOString();
  const batch = db.batch();
  const taxonomyRefs = { categories: [], brands: [] };

  for (const [collectionName, entries] of [
    ['categories', categories.map((name) => ({ name }))],
    ['brands', brands],
  ]) {
    const snapshot = await db.collection(collectionName).get();
    for (const entry of entries) {
      const existing = snapshot.docs.find(
        (doc) =>
          doc.data().domain === 'electronics' &&
          String(doc.data().name).trim().toLowerCase() === entry.name.toLowerCase(),
      );
      const ref = existing
        ? existing.ref
        : db.collection(collectionName).doc(`nexora-dev-${slug(entry.name)}`);
      const previous = existing?.data() ?? {};
      const base = {
        name: entry.name,
        slug: slug(entry.name),
        domain: 'electronics',
        status: 'active',
        createdAt: previous.createdAt ?? now,
        updatedAt: now,
      };
      batch.set(
        ref,
        collectionName === 'brands'
          ? {
              ...base,
              country: entry.country,
              established: entry.established,
              tagline: previous.tagline ?? `${entry.name} technology`,
              description: previous.description ?? `${entry.name} electronics and accessories.`,
              category: previous.category ?? 'Electronics',
              imageUrl: previous.imageUrl ?? '',
              rating: previous.rating ?? 0,
              products: previous.products ?? 0,
            }
          : base,
        { merge: true },
      );
      taxonomyRefs[collectionName].push(ref);
    }
  }

  const productRefs = [];
  for (const product of products) {
    const existing = await db
      .collection('products')
      .where('productCode', '==', product.code)
      .limit(1)
      .get();
    const previous = existing.empty ? {} : existing.docs[0].data();
    const ref = existing.empty
      ? db.collection('products').doc(`nexora-dev-${slug(product.code)}`)
      : existing.docs[0].ref;
    batch.set(
      ref,
      {
        name: product.name,
        productName: product.name,
        productCode: product.code,
        nameLowercase: product.name.toLowerCase(),
        brand: product.brand,
        manufacturer: product.brand,
        category: product.category,
        domain: 'electronics',
        description: `${product.name} from ${product.brand}. Demo inventory for the NEXORA electronics storefront.`,
        price: product.price,
        retailPrice: product.price,
        stock: product.stock,
        images: [product.image],
        imageUrl: product.image,
        specifications: product.specifications,
        warranty: product.warranty,
        status: 'active',
        visibility: 'customer',
        seedSource: 'nexora-development',
        createdAt: previous.createdAt ?? now,
        updatedAt: now,
      },
      { merge: true },
    );
    productRefs.push(ref);
  }

  await batch.commit();

  const [categoryCount, brandCount, productCount] = await Promise.all([
    Promise.all(taxonomyRefs.categories.map((ref) => ref.get())).then(
      (docs) => docs.filter((doc) => doc.exists && doc.data()?.domain === 'electronics').length,
    ),
    Promise.all(taxonomyRefs.brands.map((ref) => ref.get())).then(
      (docs) => docs.filter((doc) => doc.exists && doc.data()?.domain === 'electronics').length,
    ),
    Promise.all(productRefs.map((ref) => ref.get())).then(
      (docs) => docs.filter((doc) => doc.exists && doc.data()?.seedSource === 'nexora-development').length,
    ),
  ]);

  console.log(`NEXORA_PROJECT_ID=${app.options.projectId}`);
  console.log(`CATEGORIES_SEEDED=${categoryCount}`);
  console.log(`BRANDS_SEEDED=${brandCount}`);
  console.log(`PRODUCTS_SEEDED=${productCount}`);
  if (categoryCount !== categories.length || brandCount !== brands.length || productCount !== products.length) {
    throw new Error('Post-seed document verification did not match expected counts');
  }
}

main().catch((error) => {
  console.error(`Seed failed: ${error instanceof Error ? error.message : 'unknown error'}`);
  process.exitCode = 1;
});