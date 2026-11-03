import http from 'http';
import prisma from '../server/services/prisma.js';
import { createSessionToken } from '../server/services/tokenService.js';
import app from '../server/app.js';

async function runTests() {
  console.log('=== STARTING TANICO VERIFICATION SUITE ===\n');

  // Start ephemeral server
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running at ${baseUrl}`);

  // 1. Find or verify Admin and User accounts in DB
  const adminUser = await prisma.user.findFirst({
    where: { role: { name: { in: ['ADMIN', 'SUPER_ADMIN'] } } },
    include: { role: true }
  });

  const customerUser = await prisma.user.findFirst({
    where: { role: { name: 'CUSTOMER' } },
    include: { role: true }
  });

  console.log('1. User Accounts Found:');
  console.log(`- Admin: ${adminUser ? `${adminUser.email} (ID: ${adminUser.id}, Role: ${adminUser.role?.name})` : 'None found'}`);
  console.log(`- Customer: ${customerUser ? `${customerUser.email} (ID: ${customerUser.id}, Role: ${customerUser.role?.name})` : 'None found'}`);

  const adminToken = adminUser ? await createSessionToken({
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role?.name || 'ADMIN'
  }) : null;

  const customerToken = customerUser ? await createSessionToken({
    id: customerUser.id,
    email: customerUser.email,
    role: customerUser.role?.name || 'CUSTOMER'
  }) : null;

  async function api(path, options = {}) {
    const url = `${baseUrl}${path}`;
    const t0 = performance.now();
    const res = await fetch(url, options);
    const lat = (performance.now() - t0).toFixed(2);
    let body = null;
    try {
      body = await res.json();
    } catch (_) {
      body = null;
    }
    return { status: res.status, body, latency: lat };
  }

  // ==================== SECURITY TESTS ====================
  console.log('\n2. Testing Authentication & Security Isolation:');

  // Test 2.1: Access /api/admin/products without token
  let r = await api('/api/admin/products');
  console.log(`- GET /api/admin/products without token: Status ${r.status} [${r.latency}ms] -> ${r.status === 401 ? 'PASS (401 Unauthorized)' : 'FAIL'}`);

  // Test 2.2: Access /api/admin/products with Customer Token
  r = await api('/api/admin/products', {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  console.log(`- GET /api/admin/products with Customer Token: Status ${r.status} [${r.latency}ms] -> ${r.status === 403 ? 'PASS (403 Forbidden)' : 'FAIL'}`);

  // Test 2.3: Access /api/admin/articles with Customer Token
  r = await api('/api/admin/articles', {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  console.log(`- GET /api/admin/articles with Customer Token: Status ${r.status} [${r.latency}ms] -> ${r.status === 403 ? 'PASS (403 Forbidden)' : 'FAIL'}`);

  // Test 2.4: Access /api/admin/faq with Customer Token
  r = await api('/api/admin/faq', {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  console.log(`- GET /api/admin/faq with Customer Token: Status ${r.status} [${r.latency}ms] -> ${r.status === 403 ? 'PASS (403 Forbidden)' : 'FAIL'}`);

  // Test 2.5: Access /api/admin/products with Admin Token
  r = await api('/api/admin/products', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`- GET /api/admin/products with Admin Token: Status ${r.status} [${r.latency}ms] -> ${r.status === 200 ? 'PASS (200 OK)' : 'FAIL'}`);

  // ==================== CRUD & PERFORMANCE TESTS ====================
  console.log('\n3. Testing Articles CRUD & Performance:');

  // Create article
  const testArticleData = {
    title: 'Uji Coba Pertanian Organik Tanico ' + Date.now(),
    category: 'Edukasi Petani',
    content: 'Artikel panduan praktis bercocok tanam organik ramah lingkungan tanpa pestisida kimia sintetis.',
    excerpt: 'Panduan praktis bercocok tanam organik ramah lingkungan.',
    status: 'DRAFT',
    author: 'Tim Agronomi Tanico',
    readTime: '3 Menit',
    subtitle: 'Menjaga Kesuburan Tanah Bangka'
  };

  const createArt = await api('/api/admin/articles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify(testArticleData)
  });
  const createdArticleId = createArt.body?.id;
  console.log(`- POST /api/admin/articles (Create): Status ${createArt.status} [${createArt.latency}ms] -> ID: ${createdArticleId}`);

  // Read articles list
  const listArt = await api('/api/admin/articles', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const foundArticle = listArt.body?.find(a => a.id === createdArticleId);
  console.log(`- GET /api/admin/articles (List): Status ${listArt.status} [${listArt.latency}ms] -> Data Immediately Reflected: ${foundArticle ? 'YES' : 'NO'}`);

  // Update article
  const updateArt = await api(`/api/admin/articles/${createdArticleId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ title: 'Uji Coba Pertanian Organik Tanico Updated', status: 'PUBLISHED' })
  });
  console.log(`- PUT /api/admin/articles/${createdArticleId} (Update): Status ${updateArt.status} [${updateArt.latency}ms] -> Updated Title: "${updateArt.body?.title}"`);

  // Delete article
  const deleteArt = await api(`/api/admin/articles/${createdArticleId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`- DELETE /api/admin/articles/${createdArticleId} (Delete): Status ${deleteArt.status} [${deleteArt.latency}ms] -> Removed: ${deleteArt.body?.success ? 'YES' : 'NO'}`);

  // Verify deletion immediately reflected
  const verifyArt = await api('/api/admin/articles', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const verifyDeleted = !verifyArt.body?.some(a => a.id === createdArticleId);
  console.log(`- GET /api/admin/articles after delete: [${verifyArt.latency}ms] -> Deletion Reflected Instantly: ${verifyDeleted ? 'YES' : 'NO'}`);

  console.log('\n4. Testing FAQ CRUD & Public Synchronization:');

  // List public FAQs
  const publicFaqsRes = await api('/api/faqs');
  console.log(`- GET /api/faqs (Public): Status ${publicFaqsRes.status} [${publicFaqsRes.latency}ms] -> Count: ${publicFaqsRes.body?.faqs?.length || 0}`);

  // Create FAQ in Admin
  const testFaq = {
    question: 'Bagaimana standar panen segar sayuran TaniCo?',
    answer: 'Sayuran dipanen pada fajar hari pengiriman dan diseleksi ketat bebas pestisida.',
    category: 'Kualitas & Panen',
    isActive: true
  };

  const createFaqRes = await api('/api/admin/faq', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify(testFaq)
  });
  const createdFaqId = createFaqRes.body?.faq?.id;
  console.log(`- POST /api/admin/faq (Create): Status ${createFaqRes.status} [${createFaqRes.latency}ms] -> Created ID: ${createdFaqId}`);

  // Verify FAQ appears in public API
  const publicFaqsAfter = await api('/api/faqs');
  const foundInPublic = publicFaqsAfter.body?.faqs?.some(f => f.id === createdFaqId);
  console.log(`- GET /api/faqs after create: [${publicFaqsAfter.latency}ms] -> Synced to Public Instantly: ${foundInPublic ? 'YES' : 'NO'}`);

  // Update FAQ in Admin
  const updateFaqRes = await api(`/api/admin/faq/${createdFaqId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ question: 'Bagaimana standar panen segar sayuran TaniCo? (Terupdate)' })
  });
  console.log(`- PUT /api/admin/faq/${createdFaqId} (Update): Status ${updateFaqRes.status} [${updateFaqRes.latency}ms]`);

  // Delete FAQ in Admin
  const deleteFaqRes = await api(`/api/admin/faq/${createdFaqId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`- DELETE /api/admin/faq/${createdFaqId} (Delete): Status ${deleteFaqRes.status} [${deleteFaqRes.latency}ms]`);

  // Verify deleted from public API
  const publicFaqsFinal = await api('/api/faqs');
  const isDeletedFromPublic = !publicFaqsFinal.body?.faqs?.some(f => f.id === createdFaqId);
  console.log(`- GET /api/faqs after delete: [${publicFaqsFinal.latency}ms] -> Deleted from Public Instantly: ${isDeletedFromPublic ? 'YES' : 'NO'}`);

  console.log('\n5. Performance Benchmarks of Core Endpoints:');
  const endpoints = [
    { name: 'Products Catalog (Public)', path: '/api/products' },
    { name: 'Categories (Public)', path: '/api/categories' },
    { name: 'Articles Knowledge Base (Public)', path: '/api/articles' },
    { name: 'FAQs (Public)', path: '/api/faqs' },
    { name: 'Admin Dashboard Stats', path: '/api/admin/dashboard', admin: true },
    { name: 'Admin Products', path: '/api/admin/products', admin: true },
    { name: 'Admin Orders', path: '/api/admin/orders', admin: true }
  ];

  for (const ep of endpoints) {
    const opts = {};
    if (ep.admin) {
      opts.headers = { Authorization: `Bearer ${adminToken}` };
    }
    const r = await api(ep.path, opts);
    console.log(`- ${ep.name} [${ep.path}]: Status ${r.status} | Latency: ${r.latency}ms`);
  }

  server.close();
  console.log('\n=== VERIFICATION SUITE FINISHED SUCCESSFULLY ===');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
