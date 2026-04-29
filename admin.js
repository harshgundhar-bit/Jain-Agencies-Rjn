/* Admin-specific handlers split from index.html. Shared admin utilities that depend on app state remain in app.js. */

// ENHANCED ORDER MANAGEMENT
// ═══════════════════════════════════════════════════
function renderAdminOrders() {
  const orders = getOrders();
  const q = (document.getElementById("orderSearch")?.value||"").toLowerCase();
  const statusF = document.getElementById("orderStatusFilter")?.value || "All";

  // Summary bar
  const sb = document.getElementById("ordersSummaryBar");
  if (sb) {
    const total = orders.length;
    const wa = orders.filter(o=>o.status==="WhatsApp Sent").length;
    const pending = orders.filter(o=>o.status==="Pending").length;
    sb.innerHTML = [["📦",total,"Total"],["💬",wa,"WhatsApp"],["⏳",pending,"Pending"]].map(([icon,val,label])=>`
      <div style="background:var(--card-bg,#fff);border-radius:12px;padding:10px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,0.06)">
        <div>${icon}</div>
        <div style="font-size:18px;font-weight:900;color:var(--text,#0f172a)">${val}</div>
        <div style="font-size:10px;color:var(--text-sub,#64748B);font-weight:700">${label}</div>
      </div>`).join("");
  }

  const el = document.getElementById("adminOrdersList");
  if (!el) return;

  let filtered = orders;
  if (statusF !== "All") filtered = filtered.filter(o => o.status === statusF);
  if (q) filtered = filtered.filter(o =>
    (o.retailer||"").toLowerCase().includes(q) ||
    (o.id||"").toLowerCase().includes(q) ||
    (o.items||[]).some(i => i.name.toLowerCase().includes(q))
  );

  if (!filtered.length) {
    el.innerHTML = '<div style="text-align:center;padding:48px;color:#94A3B8;font-size:14px;font-weight:700">No orders found</div>';
    return;
  }
  el.innerHTML = filtered.map(o => buildOrderCard(o, true)).join("");
}

function exportOrdersCSV() {
  const orders = getOrders();
  if (!orders.length) { showToast("No orders to export", "error"); return; }
  const rows = [["Order ID","Retailer","Date","Status","Items","Total Qty"]];
  orders.forEach(o => {
    const items = (o.items||[]).map(i=>i.name+"×"+i.qty).join("; ");
    const qty = (o.items||[]).reduce((s,i)=>s+i.qty,0);
    rows.push([o.id||"",o.retailer||"",o.timestamp||"",o.status||"",items,qty]);
  });
  const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv],{type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url; a.download="JainAgencies_Orders.csv"; a.click();
  URL.revokeObjectURL(url);
  showToast("✅ Orders exported!", "success");
}

// ═══════════════════════════════════════════════════
// DATABASE TAB
// ═══════════════════════════════════════════════════
function renderDatabase() {
  // Quick stats
  const inStock = products.filter(p => p.stock).length;
  const noStock = products.length - inStock;
  const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
  const qs = document.getElementById("dbQuickStats");
  if (qs) qs.innerHTML = [
    ["📦", products.length, "Products"],
    ["✅", inStock, "In Stock"],
    ["🏢", new Set(products.map(p=>p.company)).size, "Companies"]
  ].map(([icon,val,label]) => `
    <div style="background:var(--card-bg,#fff);border-radius:14px;padding:14px 10px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
      <div style="font-size:20px">${icon}</div>
      <div style="font-size:18px;font-weight:900;color:var(--text,#0f172a)">${val.toLocaleString()}</div>
      <div style="font-size:10px;color:var(--text-sub,#64748B);font-weight:700">${label}</div>
    </div>`).join("");

  renderDbCompanies();
  renderDbCategories();
  renderDbFirebase();
}

function renderDbCompanies() {
  const q = (document.getElementById("dbCompanySearch")?.value||"").toLowerCase();
  const byCompany = {};
  products.forEach(p => { byCompany[p.company] = (byCompany[p.company]||0)+1; });
  const el = document.getElementById("dbCompanyList");
  if (!el) return;
  const sorted = Object.entries(byCompany)
    .filter(([c]) => c.toLowerCase().includes(q))
    .sort((a,b) => b[1]-a[1]);
  const max = sorted[0]?.[1] || 1;
  el.innerHTML = sorted.map(([company, count]) => `
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;margin-bottom:3px">
        <span style="font-size:12px;font-weight:700;color:var(--text,#0f172a)">${company}</span>
        <span style="font-size:12px;font-weight:800;color:#00897b">${count}</span>
      </div>
      <div style="height:6px;background:var(--border,#E2E8F0);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${Math.round(count/max*100)}%;background:linear-gradient(90deg,#00897b,#26a69a);border-radius:3px"></div>
      </div>
    </div>`).join("");
}

function renderDbCategories() {
  const byCat = {};
  products.forEach(p => { byCat[p.category||"Other"] = (byCat[p.category||"Other"]||0)+1; });
  const el = document.getElementById("dbCategoryList");
  if (!el) return;
  const sorted = Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
  const max = sorted[0]?.[1]||1;
  const colors = {"Tablet":"#3b82f6","Capsule":"#8b5cf6","Syrup":"#f59e0b","Injection":"#ef4444","Cream":"#ec4899","Ointment":"#14b8a6","Gel":"#06b6d4","Drops":"#f97316","Inhaler":"#6366f1","Suspension":"#84cc16","Powder":"#a78bfa","Solution":"#0ea5e9","Liquid":"#22c55e","Soap":"#d97706","Rotacap":"#64748b"};
  el.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">` + sorted.map(([cat,count]) => `
    <div style="background:${(colors[cat]||"#00897b")}15;border-radius:10px;padding:10px 12px;display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:12px;font-weight:700;color:${colors[cat]||"#00897b"}">${cat}</span>
      <span style="font-size:13px;font-weight:900;color:${colors[cat]||"#00897b"}">${count}</span>
    </div>`).join("") + `</div>`;
}

function renderDbFirebase() {
  const el = document.getElementById("dbFirebaseStatus");
  if (!el) return;
  const fbOk = typeof firebase !== "undefined" && firebase.apps?.length;
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;padding:10px;background:${fbOk?"#00897b15":"#ef444415"};border-radius:10px">
      <div style="width:10px;height:10px;border-radius:50%;background:${fbOk?"#00897b":"#ef4444"}"></div>
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--text,#0f172a)">${fbOk?"Firebase Connected":"Firebase Offline"}</div>
        <div style="font-size:11px;color:var(--text-sub,#64748B)">${fbOk?"Real-time sync active · Project: jain-agencies":"Orders saved locally only"}</div>
      </div>
    </div>`;
}

function dbExportCSV() {
  const rows = [["ID","Name","Company","Division","Formula","Packing","Category","MRP","PTR","Scheme","Stock"]];
  products.forEach(p => rows.push([p.id,p.name,p.company,p.division||"",p.formula||"",p.packing||"",p.category||"",p.mrp||"",p.ptr||"",p.scheme||"",p.stock?"Yes":"No"]));
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], {type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "JainAgencies_Products.csv"; a.click();
  URL.revokeObjectURL(url);
  showToast("✅ CSV exported!", "success");
}

function dbResetCache() {
  if (!confirm("Reset product cache? App will reload fresh catalog.")) return;
  localStorage.removeItem("ja_products");
  localStorage.removeItem("ja_catalog_ver");
  showToast("🔄 Cache cleared! Reloading...", "info");
  setTimeout(() => location.reload(), 1200);
}

function dbClearOrders() {
  if (!confirm("Delete ALL order history? This cannot be undone.")) return;
  localStorage.removeItem("ja_orders");
  showToast("🗑️ Orders cleared!", "success");
  renderDatabase();
}

// ═══════════════════════════════════════════════════

// ADMIN
// ═══════════════════════════════════════════════════════════
function openAdminLogin() {
  if (isAdmin) { goToAdmin(); return; }
  const m = document.getElementById("adminLoginModal");
  m.style.display = "flex";
  setTimeout(() => document.getElementById("adminPwdInput").focus(), 100);
}
function closeAdminLogin() {
  document.getElementById("adminLoginModal").style.display = "none";
  document.getElementById("adminPwdInput").value = "";
}
function checkAdminLogin() {
  const pwd = document.getElementById("adminPwdInput").value;
  if (pwd === "jain@admin" || pwd === "admin123") {
    isAdmin = true;
    localStorage.setItem("ja_admin", "true");
    closeAdminLogin();
    document.getElementById("adminNavBtn").style.display = "flex";
    document.querySelector(".admin-btn").textContent = "⚙️ Admin ✓";
    showToast("Admin access granted ✓");
    renderSchemes();
    goToAdmin();
  } else {
    showToast("Wrong password!", "error");
    document.getElementById("adminPwdInput").value = "";
  }
}
function adminLogout() {
  isAdmin = false;
  localStorage.setItem("ja_admin", "false");
  // After admin logout, re-check retailer auth (don't auto-show gate if retailer session exists)
  checkRetailerAuth();
  document.getElementById("adminNavBtn").style.display = "none";
  document.querySelector(".admin-btn").textContent = "⚙️ Admin";
  showToast("Logged out");
  renderSchemes();
  showView("search-view");
}
/* === JAIN AGENCIES ADMIN USEFUL CHANGES === */
function renderAdminOrders() {
  const orders = getOrders().map(o => jaEnsureOrderHistory(o, o.status || 'Pending'));
  const q = (document.getElementById('orderSearch')?.value || '').toLowerCase();
  const statusF = document.getElementById('orderStatusFilter')?.value || 'All';
  const sb = document.getElementById('ordersSummaryBar');
  if (sb) {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'Pending').length;
    const active = orders.filter(o => !['Delivered','WhatsApp Sent'].includes(o.status)).length;
    sb.innerHTML = [['📦', total, 'Total'], ['⏳', pending, 'Pending'], ['🚚', active, 'Active']].map(([icon,val,label]) => `
      <div class="admin-summary-card"><div>${icon}</div><strong>${val}</strong><span>${label}</span></div>`).join('');
  }
  const el = document.getElementById('adminOrdersList');
  if (!el) return;
  let filtered = orders;
  if (statusF !== 'All') filtered = filtered.filter(o => o.status === statusF);
  if (q) filtered = filtered.filter(o =>
    (o.retailer || '').toLowerCase().includes(q) ||
    (o.id || '').toLowerCase().includes(q) ||
    (o.items || []).some(i => (i.name || '').toLowerCase().includes(q))
  );
  if (!filtered.length) {
    el.innerHTML = '<div class="empty enhanced-empty"><div class="emoji">📦</div><h3>No orders found</h3><p>Try another status, retailer, order ID, or product name.</p></div>';
    return;
  }
  el.innerHTML = filtered.map(o => buildOrderCard(o, true)).join('');
}

function exportOrdersCSV() {
  const orders = getOrders();
  if (!orders.length) { showToast('No orders to export', 'error'); return; }
  const rows = [['Order ID','Retailer','Date','Status','Status History','Items','Total Qty','Note']];
  orders.forEach(o => {
    const items = (o.items || []).map(i => `${i.name} x ${i.qty}`).join('; ');
    const history = (o.statusHistory || []).map(h => `${h.status} @ ${h.at || ''}`).join(' | ');
    rows.push([o.id || '', o.retailer || '', o.timestamp || '', o.status || '', history, items, o.totalQty || '', o.note || '']);
  });
  const csv = rows.map(r => r.map(jaCsvCell).join(',')).join('\r\n');
  jaDownloadText('JainAgencies_Orders_' + new Date().toISOString().slice(0,10) + '.csv', csv, 'text/csv;charset=utf-8');
  showToast('Orders exported', 'success');
}

function renderDbFirebase() {
  const el = document.getElementById('dbFirebaseStatus');
  if (!el) return;
  const fbOk = !!(window._fb && window._fb.FB_OK);
  const online = navigator.onLine;
  const mode = !online ? ['Offline', 'Changes stay on this device until internet returns', '#dc2626'] : fbOk ? ['Firebase Connected', 'Real-time sync active across configured devices', '#0f766e'] : ['Local-only Mode', 'Configure Firebase to sync orders and retailers across devices', '#b45309'];
  el.innerHTML = `
    <div class="sync-status-card" style="--sync-color:${mode[2]}">
      <span></span>
      <div><strong>${mode[0]}</strong><small>${mode[1]}</small></div>
    </div>`;
}

const jaOriginalRenderDatabase = renderDatabase;
function renderDatabase() {
  jaOriginalRenderDatabase();
  jaInstallBackupPanel();
}
/* === END JAIN AGENCIES ADMIN USEFUL CHANGES === */