/* ===================================================================
   StockCaisse — gestion de stock, caisse & reçus (hors-ligne)
   Données stockées localement (localStorage). Aucun serveur requis.
   =================================================================== */

'use strict';

const STORE_KEY = 'stockcaisse.v1';

/* ---------- État ---------- */
const defaultState = () => ({
  products: [],
  sales: [],
  settings: {
    business: 'Ma Boutique',
    phone: '',
    address: '',
    currency: 'FCFA',
    nextReceipt: 1,
  },
});

let state = load();
let cart = []; // [{ productId, qty }]

/* ---------- Moyens de paiement ---------- */
const PAYMENTS = [
  { id: 'especes', label: 'Espèces', icon: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9.5v5M18 9.5v5"/>' },
  { id: 'mobile', label: 'Mobile Money', icon: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M10.5 18h3"/>' },
  { id: 'carte', label: 'Carte', icon: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>' },
  { id: 'credit', label: 'Crédit', icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>' },
];
let selectedPayment = 'especes';
function paymentLabel(id) { const p = PAYMENTS.find((x) => x.id === id); return p ? p.label : 'Espèces'; }

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const d = defaultState();
    return {
      products: parsed.products || [],
      sales: parsed.sales || [],
      settings: { ...d.settings, ...(parsed.settings || {}) },
    };
  } catch (e) {
    return defaultState();
  }
}

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

/* ---------- Utilitaires ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function money(n) {
  const cur = state.settings.currency || 'FCFA';
  const val = Number(n) || 0;
  const formatted = val.toLocaleString('fr-FR', {
    minimumFractionDigits: cur === 'FCFA' ? 0 : 2,
    maximumFractionDigits: cur === 'FCFA' ? 0 : 2,
  });
  return `${formatted} ${cur}`;
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 2400);
}

/* ---------- Navigation ---------- */
function showView(name) {
  $$('.view').forEach((v) => (v.hidden = v.id !== `view-${name}`));
  $$('.tab').forEach((t) => t.classList.toggle('is-active', t.dataset.view === name));
  window.scrollTo(0, 0);
  if (name === 'accueil') renderDashboard();
  if (name === 'stock') renderProducts();
  if (name === 'vendre') renderSaleView();
  if (name === 'recus') renderReceipts();
  if (name === 'reglages') fillSettings();
}

$('#tabbar').addEventListener('click', (e) => {
  const tab = e.target.closest('.tab');
  if (tab) showView(tab.dataset.view);
});

/* ===================================================================
   TABLEAU DE BORD
   =================================================================== */
let dashPeriod = 'all';
const PERIOD_LABELS = { today: "(aujourd'hui)", week: '(7 j)', month: '(30 j)', all: '(tout)' };

function periodStart(period) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (period === 'today') return d.getTime();
  if (period === 'week') return d.getTime() - 6 * 864e5;
  if (period === 'month') return d.getTime() - 29 * 864e5;
  return 0;
}

function salesInPeriod(period) {
  const from = periodStart(period);
  return state.sales.filter((s) => new Date(s.date).getTime() >= from);
}

$('#periodSelect').addEventListener('click', (e) => {
  const b = e.target.closest('.seg');
  if (!b) return;
  dashPeriod = b.dataset.period;
  $$('#periodSelect .seg').forEach((s) => s.classList.toggle('is-active', s === b));
  renderDashboard();
});

function renderChart(period) {
  // Nombre de jours affichés selon la période
  const days = period === 'today' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 14;
  const buckets = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(base.getTime() - i * 864e5);
    buckets.push({ day, total: 0 });
  }
  const first = buckets[0].day.getTime();
  state.sales.forEach((s) => {
    const t = new Date(s.date); t.setHours(0, 0, 0, 0);
    if (t.getTime() < first) return;
    const idx = Math.round((t.getTime() - first) / 864e5);
    if (buckets[idx]) buckets[idx].total += s.total;
  });
  const max = Math.max(1, ...buckets.map((b) => b.total));
  const showEvery = days > 14 ? 5 : days > 7 ? 2 : 1;
  $('#salesChart').innerHTML = buckets
    .map((b, i) => {
      const h = Math.round((b.total / max) * 100);
      const label = i % showEvery === 0
        ? b.day.toLocaleDateString('fr-FR', { day: '2-digit', month: days > 14 ? undefined : 'short' })
        : '';
      const val = b.total > 0 ? (b.total >= 1000 ? Math.round(b.total / 1000) + 'k' : b.total) : '';
      return `<div class="chart__bar" title="${b.day.toLocaleDateString('fr-FR')} : ${money(b.total)}">
        <span class="chart__val">${val}</span>
        <div class="chart__fill" style="height:${h}%"></div>
        <span class="chart__label">${label}</span>
      </div>`;
    })
    .join('');
}

function renderDashboard() {
  const scoped = salesInPeriod(dashPeriod);
  const revenue = scoped.reduce((s, x) => s + x.total, 0);
  const profit = scoped.reduce((s, x) => s + (x.profit || 0), 0);
  const avg = scoped.length ? revenue / scoped.length : 0;
  const stockValue = state.products.reduce((s, p) => s + p.qty * (p.cost || 0), 0);
  const stockCount = state.products.reduce((s, p) => s + p.qty, 0);

  $('#periodLabelA').textContent = PERIOD_LABELS[dashPeriod];
  $('#periodLabelB').textContent = PERIOD_LABELS[dashPeriod];
  $('#statRevenue').textContent = money(revenue);
  $('#statSales').textContent = `${scoped.length} vente${scoped.length > 1 ? 's' : ''}`;
  $('#statProfit').textContent = money(profit);
  $('#statStockValue').textContent = money(stockValue);
  $('#statStockCount').textContent = `${stockCount} article${stockCount > 1 ? 's' : ''} en stock`;
  $('#statAvg').textContent = money(avg);
  renderChart(dashPeriod);

  // Stock faible
  const low = state.products.filter((p) => p.qty <= (p.threshold ?? 5));
  const panel = $('#lowStockPanel');
  panel.hidden = low.length === 0;
  $('#lowStockList').innerHTML = low
    .map((p) => {
      const label = p.qty === 0 ? 'Rupture' : `${p.qty} restant${p.qty > 1 ? 's' : ''}`;
      return `<li><div class="ml__main"><span>${esc(p.name)}</span></div><span class="badge badge--warn">${label}</span></li>`;
    })
    .join('');

  // Encaissements par moyen de paiement
  const payTotals = {};
  scoped.forEach((s) => { const k = s.payment || 'especes'; payTotals[k] = (payTotals[k] || 0) + s.total; });
  const payRows = PAYMENTS.filter((pm) => payTotals[pm.id]);
  $('#payPanel').hidden = payRows.length === 0;
  $('#payBreakdown').innerHTML = payRows
    .map((pm) => `<li><div class="ml__main"><span>${pm.label}</span><small>${scoped.filter((s) => (s.payment || 'especes') === pm.id).length} vente(s)</small></div><span class="num" style="font-weight:700">${money(payTotals[pm.id])}</span></li>`)
    .join('');

  // Ventes récentes
  const recent = [...state.sales].reverse().slice(0, 6);
  $('#recentSales').innerHTML =
    recent.length === 0
      ? '<li class="empty" style="padding:12px">Aucune vente enregistrée.</li>'
      : recent
          .map(
            (s) =>
              `<li data-receipt="${s.id}" style="cursor:pointer"><div class="ml__main"><span>Reçu ${esc(s.number)}</span><small>${fmtDate(s.date)}${s.client ? ' · ' + esc(s.client) : ''}</small></div><span class="badge badge--ok">${money(s.total)}</span></li>`
          )
          .join('');
  $$('#recentSales li[data-receipt]').forEach((li) =>
    li.addEventListener('click', () => openReceipt(li.dataset.receipt))
  );
}

/* ===================================================================
   STOCK
   =================================================================== */
let stockCategoryFilter = 'all';

function categories() {
  return [...new Set(state.products.map((p) => (p.category || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function refreshCategoryDatalist() {
  $('#categoryList').innerHTML = categories().map((c) => `<option value="${esc(c)}">`).join('');
}

function renderCategoryChips() {
  const cats = categories();
  const box = $('#stockChips');
  if (cats.length === 0) { box.innerHTML = ''; stockCategoryFilter = 'all'; return; }
  if (stockCategoryFilter !== 'all' && !cats.includes(stockCategoryFilter)) stockCategoryFilter = 'all';
  box.innerHTML =
    `<button class="chip ${stockCategoryFilter === 'all' ? 'is-active' : ''}" data-cat="all">Tout</button>` +
    cats.map((c) => `<button class="chip ${stockCategoryFilter === c ? 'is-active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
  $$('#stockChips .chip').forEach((b) =>
    b.addEventListener('click', () => { stockCategoryFilter = b.dataset.cat; renderProducts($('#stockSearch').value); })
  );
}

function renderProducts(filter = '') {
  const q = filter.trim().toLowerCase();
  refreshCategoryDatalist();
  renderCategoryChips();
  const list = state.products
    .filter((p) => p.name.toLowerCase().includes(q))
    .filter((p) => stockCategoryFilter === 'all' || (p.category || '') === stockCategoryFilter)
    .sort((a, b) => a.name.localeCompare(b.name));

  $('#stockEmpty').hidden = state.products.length !== 0;
  $('#productList').innerHTML = list
    .map((p) => {
      const th = p.threshold ?? 5;
      let cls = '', tag = '';
      if (p.qty === 0) { cls = 'qty-out'; tag = 'Rupture'; }
      else if (p.qty <= th) { cls = 'qty-low'; tag = 'Faible'; }
      const cat = p.category ? `<span class="badge">${esc(p.category)}</span> ` : '';
      return `<li class="product" data-id="${p.id}">
        <div class="product__info">
          <div class="product__name">${esc(p.name)}</div>
          <div class="product__meta">${cat}${money(p.price)}${p.cost ? ' · achat ' + money(p.cost) : ''}</div>
        </div>
        <div class="product__qty ${cls}">${p.qty}<small>${tag || 'en stock'}</small></div>
      </li>`;
    })
    .join('');
  $$('#productList .product').forEach((li) =>
    li.addEventListener('click', () => openProductModal(li.dataset.id))
  );
}

$('#stockSearch').addEventListener('input', (e) => renderProducts(e.target.value));
$('#addProductBtn').addEventListener('click', () => openProductModal());

/* ---------- Modale produit ---------- */
function openProductModal(id) {
  const modal = $('#productModal');
  const p = id ? state.products.find((x) => x.id === id) : null;
  $('#productModalTitle').textContent = p ? 'Modifier le produit' : 'Nouveau produit';
  $('#prodId').value = p ? p.id : '';
  $('#prodName').value = p ? p.name : '';
  $('#prodCategory').value = p && p.category ? p.category : '';
  refreshCategoryDatalist();
  $('#prodPrice').value = p ? p.price : '';
  $('#prodCost').value = p && p.cost ? p.cost : '';
  $('#prodQty').value = p ? p.qty : '';
  $('#prodThreshold').value = p ? (p.threshold ?? 5) : 5;
  $('#deleteProduct').hidden = !p;
  modal.hidden = false;
}
function closeProductModal() { $('#productModal').hidden = true; }

$('#cancelProduct').addEventListener('click', closeProductModal);
$('#productModal').addEventListener('click', (e) => {
  if (e.target === $('#productModal')) closeProductModal();
});

$('#productForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const id = $('#prodId').value;
  const data = {
    name: $('#prodName').value.trim(),
    category: $('#prodCategory').value.trim(),
    price: Math.max(0, Number($('#prodPrice').value) || 0),
    cost: Math.max(0, Number($('#prodCost').value) || 0),
    qty: Math.max(0, Math.floor(Number($('#prodQty').value) || 0)),
    threshold: Math.max(0, Math.floor(Number($('#prodThreshold').value) || 0)),
  };
  if (!data.name) return;

  if (id) {
    const p = state.products.find((x) => x.id === id);
    Object.assign(p, data);
    toast('Produit mis à jour');
  } else {
    state.products.push({ id: uid(), createdAt: new Date().toISOString(), ...data });
    toast('Produit ajouté');
  }
  save();
  closeProductModal();
  renderProducts($('#stockSearch').value);
});

$('#deleteProduct').addEventListener('click', () => {
  const id = $('#prodId').value;
  if (!id) return;
  if (!confirm('Supprimer ce produit ?')) return;
  state.products = state.products.filter((x) => x.id !== id);
  save();
  closeProductModal();
  renderProducts($('#stockSearch').value);
  toast('Produit supprimé');
});

/* ===================================================================
   VENDRE (caisse)
   =================================================================== */
function renderSaleView(filter = '') {
  const q = filter.trim().toLowerCase();
  const list = state.products
    .filter((p) => p.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));

  $('#pickList').innerHTML =
    state.products.length === 0
      ? '<li class="empty">Ajoutez d\'abord des produits dans l\'onglet Stock.</li>'
      : list
          .map((p) => {
            const inCart = cart.find((c) => c.productId === p.id);
            const remaining = p.qty - (inCart ? inCart.qty : 0);
            const disabled = remaining <= 0 ? 'disabled' : '';
            return `<li><button class="pick" data-id="${p.id}" ${disabled}>
              <div class="pick__name">${esc(p.name)}</div>
              <div class="pick__price">${money(p.price)}</div>
              <div class="pick__stock">${remaining > 0 ? remaining + ' dispo' : 'épuisé'}</div>
            </button></li>`;
          })
          .join('');
  $$('#pickList .pick').forEach((b) =>
    b.addEventListener('click', () => addToCart(b.dataset.id))
  );
  renderPayGrid();
  renderCart();
}

function renderPayGrid() {
  $('#payGrid').innerHTML = PAYMENTS
    .map((pm) => `<button type="button" class="pay__opt ${pm.id === selectedPayment ? 'is-active' : ''}" data-pay="${pm.id}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${pm.icon}</svg>
      ${pm.label}
    </button>`)
    .join('');
  $$('#payGrid .pay__opt').forEach((b) =>
    b.addEventListener('click', () => {
      selectedPayment = b.dataset.pay;
      $$('#payGrid .pay__opt').forEach((o) => o.classList.toggle('is-active', o === b));
    })
  );
}

$('#saleSearch').addEventListener('input', (e) => renderSaleView(e.target.value));

function addToCart(productId) {
  const p = state.products.find((x) => x.id === productId);
  if (!p) return;
  const item = cart.find((c) => c.productId === productId);
  const current = item ? item.qty : 0;
  if (current + 1 > p.qty) { toast('Stock insuffisant'); return; }
  if (item) item.qty += 1;
  else cart.push({ productId, qty: 1 });
  renderSaleView($('#saleSearch').value);
}

function changeQty(productId, delta) {
  const item = cart.find((c) => c.productId === productId);
  if (!item) return;
  const p = state.products.find((x) => x.id === productId);
  const next = item.qty + delta;
  if (next <= 0) cart = cart.filter((c) => c.productId !== productId);
  else if (p && next > p.qty) { toast('Stock insuffisant'); return; }
  else item.qty = next;
  renderSaleView($('#saleSearch').value);
}

function cartTotal() {
  return cart.reduce((s, c) => {
    const p = state.products.find((x) => x.id === c.productId);
    return s + (p ? p.price * c.qty : 0);
  }, 0);
}

function renderCart() {
  const box = $('#cartItems');
  $('#cartEmpty').hidden = cart.length !== 0;
  box.innerHTML = cart
    .map((c) => {
      const p = state.products.find((x) => x.id === c.productId);
      if (!p) return '';
      return `<li class="cart__item" data-id="${p.id}">
        <div class="cart__item-info">
          <div class="cart__item-name">${esc(p.name)}</div>
          <div class="cart__item-sub">${money(p.price)} × ${c.qty} = ${money(p.price * c.qty)}</div>
        </div>
        <div class="stepper">
          <button data-act="minus">−</button>
          <span>${c.qty}</span>
          <button data-act="plus">＋</button>
        </div>
      </li>`;
    })
    .join('');
  box.querySelectorAll('.cart__item').forEach((li) => {
    li.querySelector('[data-act="minus"]').addEventListener('click', () => changeQty(li.dataset.id, -1));
    li.querySelector('[data-act="plus"]').addEventListener('click', () => changeQty(li.dataset.id, 1));
  });
  $('#cartTotal').textContent = money(cartTotal());
  $('#checkoutBtn').disabled = cart.length === 0;
}

$('#checkoutBtn').addEventListener('click', checkout);

function checkout() {
  if (cart.length === 0) return;
  const items = cart.map((c) => {
    const p = state.products.find((x) => x.id === c.productId);
    return { name: p.name, price: p.price, cost: p.cost || 0, qty: c.qty };
  });
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const profit = items.reduce((s, i) => s + (i.price - i.cost) * i.qty, 0);

  // Décrémenter le stock
  cart.forEach((c) => {
    const p = state.products.find((x) => x.id === c.productId);
    if (p) p.qty = Math.max(0, p.qty - c.qty);
  });

  const number = 'R' + String(state.settings.nextReceipt).padStart(4, '0');
  const sale = {
    id: uid(),
    number,
    date: new Date().toISOString(),
    client: $('#clientName').value.trim(),
    payment: selectedPayment,
    items,
    total,
    profit,
  };
  state.sales.push(sale);
  state.settings.nextReceipt += 1;
  save();

  cart = [];
  selectedPayment = 'especes';
  $('#clientName').value = '';
  renderSaleView('');
  toast('Vente enregistrée ✓');
  openReceipt(sale.id);
}

/* ===================================================================
   REÇUS
   =================================================================== */
function renderReceipts() {
  const list = [...state.sales].reverse();
  $('#receiptsEmpty').hidden = list.length !== 0;
  $('#receiptList').innerHTML = list
    .map(
      (s) => `<li class="receipt-item" data-id="${s.id}">
        <div>
          <div class="receipt-item__no">Reçu ${esc(s.number)}</div>
          <div class="receipt-item__date">${fmtDate(s.date)} · ${paymentLabel(s.payment)}${s.client ? ' · ' + esc(s.client) : ''}</div>
        </div>
        <div class="receipt-item__total num">${money(s.total)}</div>
      </li>`
    )
    .join('');
  $$('#receiptList .receipt-item').forEach((li) =>
    li.addEventListener('click', () => openReceipt(li.dataset.id))
  );
}

function receiptHTML(sale) {
  const s = state.settings;
  const rows = sale.items
    .map(
      (i) =>
        `<tr><td>${esc(i.name)}</td><td class="num">${i.qty}</td><td class="num">${money(i.price)}</td><td class="num">${money(i.price * i.qty)}</td></tr>`
    )
    .join('');
  return `
    <h3>${esc(s.business || 'Ma Boutique')}</h3>
    <div class="r-sub">
      ${s.address ? esc(s.address) + '<br>' : ''}
      ${s.phone ? 'Tél : ' + esc(s.phone) : ''}
    </div>
    <div class="r-line"></div>
    <div class="r-meta">
      <div>Reçu N° <strong>${esc(sale.number)}</strong></div>
      <div>Date : ${fmtDate(sale.date)}</div>
      ${sale.client ? '<div>Client : ' + esc(sale.client) + '</div>' : ''}
    </div>
    <div class="r-line"></div>
    <table>
      <thead><tr><th>Article</th><th class="num">Qté</th><th class="num">P.U.</th><th class="num">Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="r-line"></div>
    <div class="r-total"><span>TOTAL</span><span>${money(sale.total)}</span></div>
    <div class="r-pay">Règlement : ${paymentLabel(sale.payment)}</div>
    <div class="r-foot">Merci de votre confiance !<br>— ${esc(s.business || 'Ma Boutique')} —</div>
  `;
}

let currentReceiptId = null;
function openReceipt(id) {
  const sale = state.sales.find((s) => s.id === id);
  if (!sale) return;
  currentReceiptId = id;
  $('#receiptPaper').innerHTML = receiptHTML(sale);
  $('#receiptModal').hidden = false;
}
function closeReceipt() { $('#receiptModal').hidden = true; }

$('#closeReceipt').addEventListener('click', closeReceipt);
$('#receiptModal').addEventListener('click', (e) => {
  if (e.target === $('#receiptModal')) closeReceipt();
});
$('#printReceipt').addEventListener('click', () => window.print());

$('#shareReceipt').addEventListener('click', async () => {
  const sale = state.sales.find((s) => s.id === currentReceiptId);
  if (!sale) return;
  const s = state.settings;
  const lines = [
    `*${s.business || 'Ma Boutique'}*`,
    `Reçu N° ${sale.number} — ${fmtDate(sale.date)}`,
    sale.client ? `Client : ${sale.client}` : '',
    '------------------------------',
    ...sale.items.map((i) => `${i.name}  ${i.qty} x ${money(i.price)} = ${money(i.price * i.qty)}`),
    '------------------------------',
    `TOTAL : ${money(sale.total)}`,
    `Règlement : ${paymentLabel(sale.payment)}`,
    'Merci de votre confiance !',
  ].filter(Boolean);
  const text = lines.join('\n');
  try {
    if (navigator.share) {
      await navigator.share({ title: `Reçu ${sale.number}`, text });
    } else {
      await navigator.clipboard.writeText(text);
      toast('Reçu copié dans le presse-papiers');
    }
  } catch (e) { /* annulé */ }
});

/* ===================================================================
   RÉGLAGES
   =================================================================== */
function fillSettings() {
  const s = state.settings;
  $('#setBusiness').value = s.business || '';
  $('#setPhone').value = s.phone || '';
  $('#setAddress').value = s.address || '';
  $('#setCurrency').value = s.currency || 'FCFA';
}

$('#saveSettings').addEventListener('click', () => {
  state.settings.business = $('#setBusiness').value.trim() || 'Ma Boutique';
  state.settings.phone = $('#setPhone').value.trim();
  state.settings.address = $('#setAddress').value.trim();
  state.settings.currency = $('#setCurrency').value;
  save();
  applyBranding();
  toast('Réglages enregistrés');
});

function applyBranding() {
  $('#topName').textContent = state.settings.business || 'StockCaisse';
}

/* ---------- Export / Import / Reset ---------- */
$('#exportData').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `stockcaisse-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Sauvegarde exportée');
});

$('#importData').addEventListener('click', () => $('#importFile').click());
$('#importFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!parsed.products || !parsed.sales) throw new Error('format');
      const d = defaultState();
      state = {
        products: parsed.products,
        sales: parsed.sales,
        settings: { ...d.settings, ...(parsed.settings || {}) },
      };
      save();
      applyBranding();
      showView('accueil');
      toast('Données importées ✓');
    } catch (err) {
      toast('Fichier invalide');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

$('#resetData').addEventListener('click', () => {
  if (!confirm('Effacer TOUTES les données (produits, ventes, reçus) ? Cette action est irréversible.')) return;
  state = defaultState();
  cart = [];
  save();
  applyBranding();
  showView('accueil');
  toast('Toutes les données ont été effacées');
});

/* ===================================================================
   Démarrage
   =================================================================== */
function seedIfEmpty() {
  // Petit exemple au tout premier lancement pour illustrer l'usage.
  if (state.products.length === 0 && state.sales.length === 0 && !localStorage.getItem('stockcaisse.seeded')) {
    state.products = [
      { id: uid(), name: 'Savon', category: 'Hygiène', price: 500, cost: 350, qty: 24, threshold: 5, createdAt: new Date().toISOString() },
      { id: uid(), name: 'Sucre (1 kg)', category: 'Alimentation', price: 700, cost: 550, qty: 12, threshold: 4, createdAt: new Date().toISOString() },
      { id: uid(), name: 'Eau minérale', category: 'Boissons', price: 300, cost: 200, qty: 3, threshold: 6, createdAt: new Date().toISOString() },
    ];
    localStorage.setItem('stockcaisse.seeded', '1');
    save();
  }
}

seedIfEmpty();
applyBranding();
showView('accueil');

/* ---------- Service worker (hors-ligne) ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
