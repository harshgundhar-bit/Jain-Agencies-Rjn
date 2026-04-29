(function(){
  var _q = [];
  window.showToast = function(msg, type) { _q.push([msg, type || "success"]); };
  // Called once the real showToast loads â€” drains queue via _showToastImpl
  window._flushToastQueue = function() {
    _q.forEach(function(a){
      if (typeof _showToastImpl === "function") _showToastImpl(a[0], a[1]);
    });
    _q = [];
  };
})();

(function() {
  var s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js";
  s.onerror = function() {
    // Primary CDN failed â€” try unpkg fallback
    var f = document.createElement("script");
    f.src = "https://unpkg.com/fuse.js@7.0.0/dist/fuse.min.js";
    document.head.appendChild(f);
  };
  document.head.appendChild(s);
})();

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PRODUCT DATABASE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CATEGORY COLORS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const CAT_COLORS = {
  Tablet:"#2D7DD2",Capsule:"#7B2FBE",Syrup:"#F18F01",Injection:"#E63946",
  Cream:"#52B788",Ointment:"#6B705C",Gel:"#4CC9F0",Drops:"#F77F00",
  Inhaler:"#0EA5E9",Suspension:"#A8DADC",Powder:"#E9C46A",Solution:"#06D6A0",
  Liquid:"#118AB2",Soap:"#FFD166",Rotacap:"#3D405B",Device:"#8D99AE"
};
const CAT_ICONS = {
  Tablet:"ðŸ’Š",Capsule:"ðŸ’Š",Syrup:"ðŸ§ª",Injection:"ðŸ’‰",Cream:"ðŸ§´",Ointment:"ðŸ§´",
  Gel:"ðŸ§´",Drops:"ðŸ’§",Inhaler:"ðŸŒ¬ï¸",Suspension:"ðŸ§ª",Powder:"âš—ï¸",Solution:"ðŸ§ª",
  Liquid:"ðŸ§ª",Soap:"ðŸ§¼",Rotacap:"ðŸŒ¬ï¸",Device:"âš•ï¸"
};
const CATS = ["All","Tablet","Capsule","Syrup","Injection","Cream","Ointment","Gel","Drops","Inhaler","Suspension","Powder","Solution","Liquid","Soap","Rotacap","Device"];

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// STATE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
let products = [];
let isAdmin = false;
let srMode = false;           // SR mode active
let currentSR = null;         // { name, code, mobile, area, shops[] }
let srActiveShop = null;      // shop name currently selected by SR
let filterCat = "All";
let currentDetailId = null;
let editingId = null;
let deleteTargetId = null;
let formStockValue = true;
let _adminCompanyFilter = "";

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// DARK MODE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function initDarkMode() {
  const saved = localStorage.getItem("ja_theme");
  if (saved) {
    document.documentElement.setAttribute("data-theme", saved);
    updateDarkBtn(saved);
  } else {
    // Follow system
    const sys = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", sys);
    updateDarkBtn(sys);
  }
  // Listen for system changes
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => {
    if (!localStorage.getItem("ja_theme")) {
      const t = e.matches ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", t);
      updateDarkBtn(t);
    }
  });
}

function toggleDarkMode() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("ja_theme", next);
  updateDarkBtn(next);
  // Hide tooltip permanently once user interacts
  localStorage.setItem("ja_dark_tip_seen", "1");
  const tip = document.getElementById("darkToggleTip");
  if (tip) { tip.classList.remove("show"); }
}

function updateDarkBtn(theme) {
  const btn = document.getElementById("darkToggleBtn");
  if (!btn) return;
  // Update only the emoji text node, preserve tooltip span
  const tip = document.getElementById("darkToggleTip");
  btn.textContent = theme === "dark" ? "â˜€ï¸" : "ðŸŒ™";
  if (tip) btn.appendChild(tip);
}

function showDarkTooltipOnce() {
  if (localStorage.getItem("ja_dark_tip_seen")) return;
  const tip = document.getElementById("darkToggleTip");
  if (!tip) return;
  setTimeout(() => tip.classList.add("show"), 1800);
  setTimeout(() => {
    tip.classList.remove("show");
    localStorage.setItem("ja_dark_tip_seen", "1");
  }, 5500);
}

function loadData() {
  try {
    const s = localStorage.getItem("ja_products");
    products = s ? JSON.parse(s) : JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
  } catch { products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS)); }
  isAdmin = localStorage.getItem("ja_admin") === "true";
}
function saveData() {
  _searchIndex = null; // invalidate index on data change
  try { localStorage.setItem("ja_products", JSON.stringify(products)); } catch {}
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TOAST
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
let toastTimer;
function showToast(msg, type="success") {
  // On first real call: replace stub on window, then flush queued early messages
  if (window._flushToastQueue) {
    const flush = window._flushToastQueue;
    window._flushToastQueue = null;
    window.showToast = showToast; // point window.showToast at the real function now
    if (msg) _showToastImpl(msg, type); // show the triggering message first
    flush(); // now replay queued messages (they'll call the real function)
    return;
  }
  _showToastImpl(msg, type);
}
function _showToastImpl(msg, type="success") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg; t.className = `toast ${type}`;
  setTimeout(() => t.classList.add("show"), 10);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2500);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// INIT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•


function enterFromGate() {
  const store = (document.getElementById("gateStoreName").value||"").trim();
  const mobile = (document.getElementById("gateMobile").value||"").trim();
  const city = (document.getElementById("gateCity").value||"").trim();
  const address = (document.getElementById("gateAddress").value||"").trim();
  if (!store || !mobile || !city) {
    document.getElementById("gateErr").textContent = "âš ï¸ Store name, mobile and city are required";
    document.getElementById("gateErr").style.display = "block";
    return;
  }
  localStorage.setItem("ja_retailer_info", JSON.stringify({store, mobile, city, address}));
  document.getElementById("retailer-gate").style.display = "none";
  // Show store name in header
  const h = document.getElementById("headerStoreName");
  if (h) h.textContent = store;
  showView("search-view");
}

function getRetailerInfo() {
  try { return JSON.parse(localStorage.getItem("ja_retailer_info")) || {}; } catch { return {}; }
}

function enterApp() {
  const splash = document.getElementById("splash");
  splash.classList.add("fade-out");
  setTimeout(() => {
    splash.style.display = "none";
    const info = getRetailerInfo();
    if (!info.store || !info.mobile) {
      document.getElementById("retailer-gate").style.display = "flex";
      document.getElementById("retailer-gate").style.flexDirection = "column";
    } else {
      document.getElementById("retailer-gate").style.display = "none";
      showView("search-view");
    }
  }, 700);
}

function init() {
  initDarkMode();
  loadData();
  loadSchemes();
  loadCart();
  loadStockAlerts();
  loadCustomCompanies();
  loadAnnouncements();
  loadWASettings();
  loadFavourites();
  loadProductRequests();
  loadRecent();
  updateOrdersNavDot();
  buildSearchIndex();
  buildCatChips();
  buildCompanySelect();
  // Always start fresh â€” no stale filters
  filterCat = "All";
  const _s = document.getElementById("companySelect"); if (_s) _s.value = "All";
  const _i = document.getElementById("searchInput");   if (_i) _i.value  = "";
  renderProductList();
  renderOrderHistory();
  renderOutstandingBanner();
  renderSchemes();
  updateSchemeTicker();
  updateCountBtn();
  if (isAdmin) {
    document.getElementById("adminNavBtn").style.display = "flex";
    document.querySelector(".admin-btn").textContent = "âš™ï¸ Admin âœ“";
  }
  // Restore SR session
  const savedSR = localStorage.getItem("ja_sr_session");
  if (savedSR) {
    try {
      const srData = JSON.parse(savedSR);
      currentSR = srData;
      srMode = true;
      updateSRBanner();
    } catch(e) { localStorage.removeItem("ja_sr_session"); }
  }
  // Show SR button if SRs exist or already in SR mode
  const srBtnEl = document.getElementById("srLoginBtn");
  if (srBtnEl) {
    const hasSRs = loadSRList().length > 0 || srMode;
    if (hasSRs) srBtnEl.style.display = "flex";
    if (srMode) srBtnEl.textContent = "ðŸ§‘â€ðŸ’¼ " + (currentSR ? currentSR.name.split(" ")[0] : "SR");
  }
  // Show Firebase sync status
  setTimeout(() => {
    const dot = document.getElementById("fbStatusDot");
    const banner = document.getElementById("fbSetupBanner");
    const ok = window._fb && window._fb.FB_OK;
    if (dot) {
      dot.style.background = ok ? "#22c55e" : "#f97316";
      dot.title = ok ? "ðŸ”¥ Live sync ON" : "âš ï¸ Offline â€” local only";
    }
    if (banner && ok) banner.style.display = "none";
  }, 1800);
  // Show retailer logout button if logged in
  if (currentRetailer && currentRetailer.status === "approved") {
    const btn = document.getElementById("retailerMenuBtn");
    if (btn) { btn.style.display = "flex"; btn.title = currentRetailer.shop; }
    // Request push permission for existing session (delayed, non-intrusive)
    if (typeof onRetailerSessionReady === "function") {
      onRetailerSessionReady(currentRetailer);
    }
  }
}

function buildCatChips() {
  const wrap = document.getElementById("catChips");
  wrap.innerHTML = CATS.map(c => `
    <button class="cat-chip" onclick="setCat('${c}')" id="chip_${c}"
      style="${c!=='All' ? `background:${CAT_COLORS[c]}22;color:${CAT_COLORS[c]}` : 'background:#1A6B5A22;color:#1A6B5A'};${filterCat===c?`background:${c!=='All'?CAT_COLORS[c]:'#1A6B5A'};color:#fff;`:''}">
      ${c}
    </button>`).join("");
}

function buildCompanySelect() {
  const sel = document.getElementById("companySelect");
  const all = [...new Set([...products.map(p => p.company), ...customCompanies])].filter(Boolean).sort((a,b) => a.localeCompare(b));
  const companies = ["All", ...all];
  sel.innerHTML = companies.map(c => `<option value="${c}">${c}</option>`).join("");
}

function populateFormDropdowns(selectedCompany, selectedFormula) {
  // Company dropdown
  const coSel = document.getElementById("fCompany");
  if (coSel) {
    const allCos = [...new Set([
      ...products.map(p => p.company),
      ...customCompanies
    ])].filter(Boolean).sort((a,b) => a.localeCompare(b));
    coSel.innerHTML = '<option value="">â€” Select Company â€”</option>' +
      allCos.map(c => `<option value="${c}"${c === selectedCompany ? ' selected' : ''}>${c}</option>`).join("");
  }
  // Formula datalist
  const dl = document.getElementById("formulaDatalist");
  if (dl) {
    const allFormulas = [...new Set(products.map(p => p.formula).filter(Boolean))].sort((a,b) => a.localeCompare(b));
    dl.innerHTML = allFormulas.map(f => `<option value="${f}"></option>`).join("");
  }
  if (selectedFormula !== undefined) {
    const fEl = document.getElementById("fFormula");
    if (fEl) fEl.value = selectedFormula;
  }
}

function setCat(c) {
  filterCat = c;
  buildCatChips();
  handleSearch();
}

function toggleSchemesOnly() {
  _schemesOnlyFilter = !_schemesOnlyFilter;
  const btn = document.getElementById("schemesOnlyBtn");
  if (btn) btn.classList.toggle("active", _schemesOnlyFilter);
  updateFilterBadge();
  renderProductList();
}

function toggleFilters() {
  const panel = document.getElementById("filtersPanel");
  panel.classList.toggle("open");
  if (panel.classList.contains("open")) buildCompanySelect();
}

function clearFilters() {
  filterCat = "All";
  _schemesOnlyFilter = false;
  document.getElementById("companySelect").value = "All";
  const btn = document.getElementById("schemesOnlyBtn");
  if (btn) btn.classList.remove("active");
  buildCatChips();
  handleSearch();
  updateFilterBadge();
}

function updateFilterBadge() {
  const compVal = document.getElementById("companySelect")?.value || "All";
  const parts = [];
  if (filterCat !== "All") parts.push(filterCat);
  if (compVal !== "All") parts.push(compVal.split(" ")[0]);
  if (_schemesOnlyFilter) parts.push("ðŸŽ Schemes");
  document.getElementById("filterBadge").textContent = parts.length ? `(${parts.join(", ")})` : "";
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SEARCH & RENDER
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function handleSearch() {
  updateFilterBadge();
  renderProductList();
}

function clearSearch() {
  document.getElementById("searchInput").value = "";
  document.getElementById("clearBtn").style.display = "none";
  renderProductList();
}

// â”€â”€ Fuse.js fuzzy search â”€â”€
let _fuse = null;
function buildSearchIndex() {
  const fuseOptions = {
    includeScore: true,
    threshold: 0.35,          // 0=exact, 1=anything â€” 0.35 is comfortably fuzzy
    ignoreLocation: true,     // search anywhere in string, not just start
    minMatchCharLength: 2,
    keys: [
      { name: "name",     weight: 0.55 },
      { name: "formula",  weight: 0.25 },
      { name: "company",  weight: 0.12 },
      { name: "category", weight: 0.05 },
      { name: "division", weight: 0.03 },
    ]
  };
  _fuse = (typeof Fuse !== "undefined")
    ? new Fuse(products, fuseOptions)
    : null;  // fallback to substring if CDN fails
}

function getFiltered() {
  const q = document.getElementById("searchInput").value.trim();
  const compVal = document.getElementById("companySelect").value;
  document.getElementById("clearBtn").style.display = q ? "block" : "none";

  // Rebuild index if stale
  if (!_fuse || _fuse._docs?.length !== products.length) buildSearchIndex();

  // Track search analytics
  if (q.length >= 2) trackSearch(q);

  let results;
  if (!q) {
    results = products;
  } else if (_fuse) {
    // Fuse.js fuzzy search â€” returns scored results
    results = _fuse.search(q).map(r => r.item);
  } else {
    // Fallback substring search if Fuse didn't load
    const lower = q.toLowerCase();
    results = products.filter(p =>
      p.name.toLowerCase().includes(lower) ||
      (p.formula||"").toLowerCase().includes(lower) ||
      p.company.toLowerCase().includes(lower)
    );
  }

  // Apply category + company + schemes filters on top
  return results.filter(p => {
    if (filterCat !== "All" && p.category !== filterCat) return false;
    if (compVal !== "All" && p.company !== compVal) return false;
    if (_schemesOnlyFilter && !getProductScheme(p)) return false;
    return true;
  });
}

// â”€â”€ Search Analytics â”€â”€
const _searchDebounceMap = {};
function trackSearch(q) {
  // Debounce per-query â€” only record after 800ms without change (user paused)
  clearTimeout(_searchDebounceMap._t);
  _searchDebounceMap._t = setTimeout(() => {
    try {
      const key = "ja_search_log";
      const today = new Date().toISOString().slice(0,10);
      let log = JSON.parse(localStorage.getItem(key) || "{}");
      if (!log[today]) log[today] = {};
      const term = q.toLowerCase().trim();
      log[today][term] = (log[today][term] || 0) + 1;
      // Keep only last 30 days
      const days = Object.keys(log).sort().reverse().slice(0,30);
      const pruned = {}; days.forEach(d => pruned[d] = log[d]);
      localStorage.setItem(key, JSON.stringify(pruned));
    } catch(e) {}
  }, 800);
}

// â”€â”€ Skeleton helper â”€â”€
function makeSkeleton(n) {
  return Array.from({length:n}, () =>
    `<div class="skel-card">
      <div class="skeleton skel-icon"></div>
      <div class="skel-body">
        <div class="skeleton skel-line w70"></div>
        <div class="skeleton skel-line w50"></div>
        <div class="skel-tags">
          <div class="skeleton skel-tag"></div>
          <div class="skeleton skel-tag"></div>
          <div class="skeleton skel-tag"></div>
        </div>
      </div>
      <div class="skeleton skel-btn"></div>
    </div>`).join("");
}

// â”€â”€ Virtual scroll state â”€â”€
const VS_ITEM_H = 90;   // estimated card height px
const VS_PAGE   = 30;   // cards rendered per chunk
let vsFiltered  = [];
let vsOffset    = 0;
let _debTimer   = null;
let _vsScrollEl = null;

function cardHTML(p) {
  const color  = CAT_COLORS[p.category] || "#64748B";
  const inCart = cart.some(c => c.id === p.id);
  const isFav  = isFavourite(p.id);

  // Expiry badge
  let expiryBadge = "";
  if (p.expiry) {
    const [mm, yy] = p.expiry.split("/").map(Number);
    const daysLeft = Math.floor((new Date(2000+yy, mm-1, 1) - new Date()) / 86400000);
    if (daysLeft < 0)       expiryBadge = `<span class="tag" style="background:#FEE2E2;color:#be123c">â›” EXPIRED</span>`;
    else if (daysLeft <= 90) expiryBadge = `<span class="tag" style="background:#FEF9C3;color:#b45309">âš ï¸ Exp ${p.expiry}</span>`;
  }

  // MOQ badge
  const moqBadge = p.moq > 1 ? `<span class="tag tag-moq">MOQ ${p.moq}</span>` : "";

  // Scheme highlight
  const schemeBar = getSchemeHTML(p, true);
  const hasScheme = !!schemeBar;

  return `<div class="pc-wrap ${hasScheme?'has-scheme':''}" id="pcw_${p.id}">
    <div class="pc-swipe-bg"><span>${CAT_ICONS[p.category]||"ðŸ’Š"}</span><span>${inCart?"ADDED":"ADD"}</span></div>
    <div class="product-card" onclick="openDetail(${p.id})" style="align-items:center" data-id="${p.id}">
      <div class="cat-icon" style="background:${color}22">${CAT_ICONS[p.category]||"ðŸ’Š"}</div>
      <div style="flex:1;min-width:0">
        <div class="prod-name" style="display:flex;align-items:center;gap:6px">${p.name}${isFav?' <span style="font-size:12px">â­</span>':'' }</div>
        <div class="prod-company">${p.company}</div>
        <div class="tags">
          <span class="tag" style="background:${color}22;color:${color}">${p.category}</span>
          <span class="tag tag-pack">${p.packing}</span>
          <span class="tag ${p.stock?"tag-stock-in":"tag-stock-out"}">${p.stock?"âœ“ In Stock":"âœ— Unavailable"}</span>
          ${expiryBadge}${moqBadge}
        </div>
        ${schemeBar}
      </div>
      ${p.stock
        ? `<button class="add-cart-btn ${inCart?"in-cart":""}" onclick="event.stopPropagation();toggleCart(${p.id})">${inCart?"âœ“ Added":"+ Cart"}</button>`
        : `<button class="notify-me-btn ${isWatching(p.id)?"watching":""}" onclick="event.stopPropagation();toggleWatch(${p.id})">${isWatching(p.id)?"ðŸ”” Watching":"ðŸ”” Notify Me"}</button>`
      }
    </div>
  </div>`;
}

function renderChunk(list, filtered, offset, count) {
  const slice = filtered.slice(offset, offset + count);
  slice.forEach((p, i) => {
    const el = document.createElement("div");
    el.innerHTML = cardHTML(p);
    const card = el.firstElementChild;
    card.querySelector(".product-card").style.animationDelay = Math.min(i * 0.035, 0.28) + "s";
    list.appendChild(card);
    attachSwipe(card);
  });
}

function renderProductList() {
  const q    = document.getElementById("searchInput").value.trim();
  const ri   = document.getElementById("resultsInfo");
  const list = document.getElementById("productList");
  const compVal = document.getElementById("companySelect")?.value || "All";
  const hasFilter = q.length > 0 || filterCat !== "All" || compVal !== "All";
  const wrap = document.getElementById("homeSectionsWrap");

  // Collapse/expand home sections smoothly
  if (wrap) {
    wrap.classList.toggle("collapsed", hasFilter);
    // Also set display:none when collapsed so it's completely out of click flow
    if (hasFilter) {
      wrap.style.pointerEvents = "none";
      wrap.style.userSelect = "none";
    } else {
      wrap.style.pointerEvents = "";
      wrap.style.userSelect = "";
    }
  }

  // If nothing typed and no filter active, hide list entirely
  if (!hasFilter) {
    list.innerHTML = "";
    ri.innerHTML = products.length ? `<span>${products.length.toLocaleString()}</span> medicines across ${[...new Set(products.map(p=>p.company))].length} companies` : "";
    return;
  }

  // Show skeletons instantly while debouncing
  if (q.length > 0) {
    list.innerHTML = makeSkeleton(5);
    ri.innerHTML   = "Searchingâ€¦";
  }
  clearTimeout(_debTimer);
  _debTimer = setTimeout(() => {
    vsFiltered = getFiltered();
    vsOffset   = 0;
    ri.style.animation = "none"; void ri.offsetHeight; ri.style.animation = "";
    ri.innerHTML = `${vsFiltered.length} product${vsFiltered.length!==1?"s":""} found${q?` for <span>"${q}"</span>`:""}`;

    list.innerHTML = "";
    if (!vsFiltered.length) {
      list.innerHTML = `<div class="empty"><div class="emoji">ðŸ”</div><h3>No medicines found</h3><p>Try a different name or formula</p></div>`;
      return;
    }
    // Render first chunk
    renderChunk(list, vsFiltered, 0, VS_PAGE);
    vsOffset = VS_PAGE;

    // Infinite scroll â€” load more as user scrolls
    if (_vsScrollEl) _vsScrollEl.removeEventListener("scroll", vsScroll);
    _vsScrollEl = document.getElementById("search-view");
    _vsScrollEl.addEventListener("scroll", vsScroll, {passive:true});
  }, q.length > 0 ? 160 : 0);
}

function vsScroll() {
  if (vsOffset >= vsFiltered.length) return;
  const list = document.getElementById("productList");
  const sv   = document.getElementById("search-view");
  // Load more when within 300px of bottom
  if (sv.scrollTop + sv.clientHeight >= sv.scrollHeight - 300) {
    renderChunk(list, vsFiltered, vsOffset, VS_PAGE);
    vsOffset += VS_PAGE;
  }
}

function updateCountBtn() {
  // Catalogue button removed â€” no-op
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// DETAIL VIEW
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function openDetail(id) {
  trackRecent(id);
  const p = products.find(x => x.id === id);
  if (!p) return;
  currentDetailId = id;
  const color = CAT_COLORS[p.category] || "#2D9D7C";
  document.getElementById("detailHeader").style.background = `linear-gradient(135deg,${color}DD,${color})`;
  document.getElementById("dCat").textContent = p.category;
  document.getElementById("dName").textContent = p.name;
  document.getElementById("dCompany").textContent = p.company;
  const sb = document.getElementById("dStock");
  sb.textContent = p.stock ? "âœ“ In Stock" : "âœ— Out of Stock";
  sb.style.background = p.stock ? "rgba(255,255,255,0.25)" : "rgba(239,68,68,0.4)";

  // Expiry status
  let expiryDisplay = "â€”";
  let expiryWarn = "";
  if (p.expiry) {
    const [mm, yy] = p.expiry.split("/").map(Number);
    const expDate = new Date(2000 + yy, mm - 1, 1);
    const now = new Date();
    const daysLeft = Math.floor((expDate - now) / 86400000);
    if (daysLeft < 0) {
      expiryDisplay = `â›” EXPIRED (${p.expiry})`;
      expiryWarn = "expired";
    } else if (daysLeft <= 90) {
      expiryDisplay = `âš ï¸ ${p.expiry} â€” ${Math.ceil(daysLeft/30)}M left`;
      expiryWarn = "short";
    } else {
      expiryDisplay = p.expiry;
    }
  }

  // Retailer margin calculation
  let marginHtml = "";
  const mrpN = parseFloat(p.mrp);
  const ptrN = parseFloat(p.ptr);
  if (mrpN && ptrN && mrpN > ptrN) {
    const marginPct = (((mrpN - ptrN) / mrpN) * 100).toFixed(1);
    const marginAmt = (mrpN - ptrN).toFixed(2);
    marginHtml = `<div class="detail-margin-pill">ðŸ“ˆ Retailer Margin: â‚¹${marginAmt} &nbsp;(${marginPct}%)</div>`;
  }

  const rows = [
    {icon:"ðŸ’Š",label:"Medicine Name",val:p.name},
    {icon:"ðŸ¢",label:"Company",val:p.company},
    {icon:"ðŸ·ï¸",label:"Division",val:p.division||"â€”"},
    {icon:"ðŸ§ª",label:"Formula / Composition",val:p.formula||"â€”"},
    {icon:"ðŸ“¦",label:"Packing",val:p.packing},
    {icon:"ðŸ”–",label:"Category",val:p.category},
    {icon:"â‚¹",label:"MRP",val:p.mrp?`â‚¹${p.mrp}`:"Contact Agency"},
    {icon:"ðŸ’°",label:"PTR / Trade Price",val:p.ptr?`â‚¹${p.ptr}`:"Contact Agency"},
    ...(p.moq > 1 ? [{icon:"ðŸ“‹",label:"Min. Order Qty (MOQ)",val:`${p.moq} strips`}] : []),
    {icon:"ðŸ·ï¸",label:"HSN Code",val:p.hsn||"â€”"},
    {icon:"ðŸ“Š",label:"GST",val:p.gst ? `${p.gst}%` : "â€”"},
    {icon:"ðŸ”¢",label:"Batch No.",val:p.batch||"â€”"},
    {icon:"ðŸ“…",label:"Expiry Date",val:expiryDisplay, warn: expiryWarn},
  ];

  // Build scheme banner separately â€” big and prominent
  const schemeBanner = getSchemeHTML(p, false);

  document.getElementById("detailCard").innerHTML =
    (schemeBanner ? schemeBanner : "") +
    marginHtml +
    rows.map((r) =>
    `<div class="detail-row ${r.warn ? "detail-row-"+r.warn : ""}">
      <span class="row-icon">${r.icon}</span>
      <div><div class="row-label">${r.label}</div><div class="row-value">${r.val}</div></div>
    </div>`
  ).join("");

  // Fav button
  const favBtn = document.getElementById("detailFavBtn");
  if (favBtn) favBtn.textContent = isFavourite(id) ? "â­" : "â˜†";

  // Cart vs Notify button based on stock
  const cartBtn = document.getElementById("detailCartBtn");
  const notifyBtn = document.getElementById("detailNotifyBtn");
  if (p.stock) {
    const inCart = cart.some(c => c.id === id);
    cartBtn.style.display = "block";
    notifyBtn.style.display = "none";
    cartBtn.textContent = inCart ? "âœ“ In Cart â€” Remove" : "+ Add to Cart";
    cartBtn.style.background = inCart ? "#00897b" : "#fff";
    cartBtn.style.color = inCart ? "#fff" : "#00897b";
  } else {
    cartBtn.style.display = "none";
    notifyBtn.style.display = "block";
    const watching = isWatching(id);
    notifyBtn.textContent = watching ? "ðŸ”” Watching â€” Unwatch" : "ðŸ”” Notify Me When In Stock";
    notifyBtn.style.background = watching ? "#fff7ed" : "#fff";
    notifyBtn.style.color = watching ? "#c2410c" : "#c2410c";
    notifyBtn.style.borderColor = watching ? "#c2410c" : "#f97316";
  }

  // Admin actions
  const da = document.getElementById("detailAdminActions");
  da.style.display = isAdmin ? "flex" : "none";
  if (isAdmin) {
    document.getElementById("detailStockBtn").textContent = p.stock ? "Mark Out of Stock" : "Mark In Stock";
  }

  showView("detail-view");
}

function closeDetail() { showView("search-view"); }

function editFromDetail() {
  const p = products.find(x => x.id === currentDetailId);
  if (p) openEditForm(p);
}

function toggleStockFromDetail() {
  const p = products.find(x => x.id === currentDetailId);
  if (!p) return;
  const wasOut = !p.stock;
  p.stock = !p.stock;
  saveData();
  if (p.stock && wasOut) fireStockAlert(p);
  showToast(p.stock ? "Marked In Stock âœ“" : "Marked Out of Stock");
  openDetail(currentDetailId);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// â”€â”€ SR MODE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function loadSRList() {
  try { return JSON.parse(localStorage.getItem("ja_sr_list") || "[]"); } catch { return []; }
}
function saveSRList(list) {
  try { localStorage.setItem("ja_sr_list", JSON.stringify(list)); } catch {}
}

function openSRLoginModal() {
  document.getElementById("srCodeInput").value = "";
  document.getElementById("srLoginError").textContent = "";
  document.getElementById("srLoginModal").style.display = "flex";
  setTimeout(() => document.getElementById("srCodeInput").focus(), 150);
}
function closeSRLoginModal() {
  document.getElementById("srLoginModal").style.display = "none";
}
function checkSRLogin() {
  const code = document.getElementById("srCodeInput").value.trim().toUpperCase();
  if (!code) { document.getElementById("srLoginError").textContent = "Enter your SR code"; return; }
  const list = loadSRList();
  const sr = list.find(s => s.code.toUpperCase() === code);
  if (!sr) {
    document.getElementById("srLoginError").textContent = "âŒ SR code not found. Contact Admin.";
    return;
  }
  currentSR = sr;
  srMode = true;
  srActiveShop = null;
  localStorage.setItem("ja_sr_session", JSON.stringify(sr));
  closeSRLoginModal();
  updateSRBanner();
  openSRShopModal();
  showToast(`Welcome, ${sr.name}! ðŸ§‘â€ðŸ’¼`);
}

function srLogout() {
  srMode = false;
  currentSR = null;
  srActiveShop = null;
  localStorage.removeItem("ja_sr_session");
  closeSRShopModal();
  updateSRBanner();
  const srBtn = document.getElementById("srLoginBtn");
  if (srBtn) {
    srBtn.textContent = "ðŸ§‘â€ðŸ’¼ SR";
    // Hide if no SRs configured
    if (!loadSRList().length) srBtn.style.display = "none";
  }
  showToast("SR logged out");
}

function openSRShopModal() {
  if (!currentSR) { openSRLoginModal(); return; }
  document.getElementById("srShopModalName").textContent = `${currentSR.name} Â· ${currentSR.code}`;
  document.getElementById("srShopSearch").value = "";
  renderSRShopList();
  const modal = document.getElementById("srShopModal");
  modal.style.display = "flex";
  modal.style.alignItems = "flex-end";
  modal.style.justifyContent = "center";
}
function closeSRShopModal() {
  document.getElementById("srShopModal").style.display = "none";
}
function renderSRShopList() {
  if (!currentSR) return;
  const shops = currentSR.shops || [];
  const q = (document.getElementById("srShopSearch").value || "").toLowerCase();
  const filtered = shops.filter(s => s.toLowerCase().includes(q));
  const el = document.getElementById("srShopList");
  if (!shops.length) {
    el.innerHTML = `<div style="text-align:center;padding:32px 20px;color:#94A3B8"><div style="font-size:36px;margin-bottom:10px">ðŸª</div><div style="font-size:14px;font-weight:700">No shops assigned yet</div><div style="font-size:12px;margin-top:4px">Ask Admin to add your route shops</div></div>`;
    return;
  }
  if (!filtered.length) {
    el.innerHTML = `<div style="text-align:center;padding:24px;color:#94A3B8;font-size:13px;font-weight:600">No shops match "${q}"</div>`;
    return;
  }
  el.innerHTML = filtered.map((shop, i) => {
    const isActive = srActiveShop === shop;
    return `<div onclick="selectSRShop('${shop.replace(/'/g,"\\'")}') " style="background:${isActive ? 'linear-gradient(135deg,#eef2ff,#e0e7ff)' : '#fff'};border:${isActive ? '2px solid #6366f1' : '1.5px solid #F1F5F9'};border-radius:14px;padding:14px 16px;margin-bottom:8px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:all 0.15s">
      <div style="width:40px;height:40px;border-radius:12px;background:${isActive ? '#6366f1' : '#F1F5F9'};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${isActive ? 'âœ…' : 'ðŸª'}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;font-weight:900;color:${isActive ? '#4338ca' : '#1E293B'};margin-bottom:2px">${shop}</div>
        <div style="font-size:11px;color:${isActive ? '#6366f1' : '#94A3B8'};font-weight:600">${isActive ? 'âœ“ Currently ordering for this shop' : 'Tap to select'}</div>
      </div>
      ${isActive ? `<div style="font-size:18px">âž¡ï¸</div>` : ''}
    </div>`;
  }).join('');
}
function selectSRShop(shop) {
  srActiveShop = shop;
  closeSRShopModal();
  updateSRBanner();
  // Log visit
  logSRVisit(shop);
  showToast(`Now ordering for: ${shop} ðŸª`);
  // Pre-fill retailer name in cart if visible
  const ri = document.getElementById("retailerName");
  if (ri) ri.value = shop;
}

function updateSRBanner() {
  // Show/hide the SR status bar below the main header
  let banner = document.getElementById("srStatusBanner");
  if (!srMode || !srActiveShop) {
    if (banner) banner.style.display = "none";
    return;
  }
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "srStatusBanner";
    banner.style.cssText = "background:linear-gradient(135deg,#4338ca,#6366f1);padding:10px 16px;display:flex;align-items:center;gap:10px;font-size:12px;color:#fff;position:sticky;top:0;z-index:99;cursor:pointer";
    banner.onclick = openSRShopModal;
    // Insert after header
    const header = document.querySelector(".header");
    if (header && header.parentNode) {
      header.parentNode.insertBefore(banner, header.nextSibling);
    }
  }
  banner.style.display = "flex";
  banner.innerHTML = `<span style="font-size:16px">ðŸ§‘â€ðŸ’¼</span><div style="flex:1;min-width:0"><div style="font-weight:900;font-size:12px">${currentSR ? currentSR.name : 'SR'} Â· ${currentSR ? currentSR.code : ''}</div><div style="color:rgba(255,255,255,0.75);font-size:11px">Ordering for: <strong>${srActiveShop}</strong> Â· Tap to switch shop</div></div><div onclick="event.stopPropagation();srLogout()" style="background:rgba(255,255,255,0.15);border:none;border-radius:8px;padding:6px 10px;color:#fff;font-size:11px;font-weight:800;cursor:pointer">Logout</div>`;
  // Update header SR button
  const srBtn = document.getElementById("srLoginBtn");
  if (srBtn) { srBtn.style.display = "flex"; srBtn.textContent = "ðŸ§‘â€ðŸ’¼ " + (currentSR ? currentSR.name.split(" ")[0] : "SR"); }
}

// â”€â”€ SR VISIT LOG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function loadSRVisits() {
  try { return JSON.parse(localStorage.getItem("ja_sr_visits") || "[]"); } catch { return []; }
}
function saveSRVisits(v) {
  try { localStorage.setItem("ja_sr_visits", JSON.stringify(v)); } catch {} 
}
function logSRVisit(shop) {
  if (!currentSR) return;
  const visits = loadSRVisits();
  visits.unshift({
    srCode: currentSR.code,
    srName: currentSR.name,
    shop,
    timestamp: new Date().toLocaleString("en-IN"),
    date: new Date().toLocaleDateString("en-IN")
  });
  saveSRVisits(visits.slice(0, 2000)); // keep last 2000
}
function getSRVisitsToday(srCode) {
  const today = new Date().toLocaleDateString("en-IN");
  return loadSRVisits().filter(v => v.srCode === srCode && v.date === today);
}
function getSROrdersForCode(srCode) {
  return getOrders().filter(o => o.srCode === srCode);
}
function getSROrdersToday(srCode) {
  const today = new Date().toLocaleDateString("en-IN");
  return getOrders().filter(o => o.srCode === srCode && o.timestamp && o.timestamp.includes(today.split("/").join("/")));
}

// â”€â”€ SR TARGETS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function loadSRTargets() {
  try { return JSON.parse(localStorage.getItem("ja_sr_targets") || "{}"); } catch { return {}; }
}
function saveSRTargets(t) {
  try { localStorage.setItem("ja_sr_targets", JSON.stringify(t)); } catch {}
}
function getSRTarget(srCode) {
  const targets = loadSRTargets();
  return targets[srCode] || { monthly: 0, unit: "orders" }; // unit: orders | qty
}
function setSRTarget(srCode, monthly, unit) {
  const targets = loadSRTargets();
  targets[srCode] = { monthly: parseInt(monthly) || 0, unit: unit || "orders" };
  saveSRTargets(targets);
}
function getSRMonthProgress(srCode) {
  const orders = getOrders().filter(o => o.srCode === srCode);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString("en-IN");
  // Filter this month's orders (rough check on timestamp containing month/year)
  const mm = String(now.getMonth()+1).padStart(2,'0');
  const yy = String(now.getFullYear());
  const monthOrders = orders.filter(o => o.timestamp && (
    o.timestamp.includes(`/${mm}/${yy}`) || o.timestamp.includes(`-${mm}-${yy}`)
  ));
  return {
    orders: monthOrders.length,
    qty: monthOrders.reduce((s,o) => s + (o.totalQty||0), 0)
  };
}

// â”€â”€ SR DASHBOARD BOTTOM SHEET â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function openSRDashboard() {
  if (!currentSR) return;
  // Build and show SR dashboard overlay
  let dash = document.getElementById("srDashOverlay");
  if (!dash) {
    dash = document.createElement("div");
    dash.id = "srDashOverlay";
    dash.style.cssText = "display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:300;align-items:flex-end;justify-content:center";
    dash.innerHTML = `
      <div style="background:#F0F4F8;border-radius:24px 24px 0 0;width:100%;max-width:480px;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 -8px 40px rgba(0,0,0,0.25);animation:slide-up 0.3s ease">
        <div id="srDashHeader" style="background:linear-gradient(135deg,#4338ca,#6366f1);padding:20px 18px 16px;border-radius:24px 24px 0 0;flex-shrink:0"></div>
        <div id="srDashBody" style="overflow-y:auto;flex:1;padding:14px 14px 24px"></div>
        <div style="padding:12px 16px 20px;border-top:1px solid #E2E8F0;flex-shrink:0;background:#fff">
          <button onclick="closeSRDashboard()" style="width:100%;padding:13px;border-radius:12px;border:2px solid #E2E8F0;background:#fff;font-family:inherit;font-size:14px;font-weight:800;color:#64748B;cursor:pointer">âœ• Close</button>
        </div>
      </div>`;
    document.body.appendChild(dash);
  }
  renderSRDashboard();
  dash.style.display = "flex";
  dash.style.alignItems = "flex-end";
  dash.style.justifyContent = "center";
}
function closeSRDashboard() {
  const d = document.getElementById("srDashOverlay");
  if (d) d.style.display = "none";
}
function renderSRDashboard() {
  if (!currentSR) return;
  const sr = currentSR;
  const today = new Date().toLocaleDateString("en-IN");
  const todayVisits = getSRVisitsToday(sr.code);
  const allOrders = getSROrdersForCode(sr.code);
  const todayOrders = allOrders.filter(o => o.timestamp && o.timestamp.includes(today.replace(/\//g,"/")));
  const todayQty = todayOrders.reduce((s,o) => s+(o.totalQty||0), 0);
  const target = getSRTarget(sr.code);
  const progress = getSRMonthProgress(sr.code);
  const progressVal = target.monthly > 0
    ? Math.min(100, Math.round((target.unit === "qty" ? progress.qty : progress.orders) / target.monthly * 100))
    : 0;
  const visitedShops = [...new Set(todayVisits.map(v => v.shop))];
  const allShops = sr.shops || [];
  const notVisited = allShops.filter(s => !visitedShops.includes(s));

  const header = document.getElementById("srDashHeader");
  header.innerHTML = `
    <div style="color:rgba(255,255,255,0.6);font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px">SR Dashboard</div>
    <div style="color:#fff;font-size:20px;font-weight:900;margin-bottom:2px">${sr.name}</div>
    <div style="color:rgba(255,255,255,0.7);font-size:12px;font-weight:600">${sr.code}${sr.area ? ' Â· '+sr.area : ''} Â· ${today}</div>`;

  const body = document.getElementById("srDashBody");
  body.innerHTML = `
    <!-- Today's stats row -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">
      ${[
        { icon:"ðŸª", val: visitedShops.length, label:"Shops\nVisited" },
        { icon:"ðŸ“¦", val: todayOrders.length, label:"Orders\nToday" },
        { icon:"ðŸ’Š", val: todayQty, label:"Units\nToday" }
      ].map(s => `
        <div style="background:#fff;border-radius:14px;padding:12px 8px;text-align:center;border:1.5px solid #E2E8F0;box-shadow:0 1px 4px rgba(0,0,0,0.04)">
          <div style="font-size:22px;margin-bottom:4px">${s.icon}</div>
          <div style="font-size:22px;font-weight:900;color:#4338ca;line-height:1">${s.val}</div>
          <div style="font-size:10px;font-weight:700;color:#94A3B8;margin-top:3px;white-space:pre-line">${s.label}</div>
        </div>`).join('')}
    </div>

    <!-- Monthly target -->
    ${target.monthly > 0 ? `
    <div style="background:#fff;border-radius:14px;padding:14px 16px;margin-bottom:12px;border:1.5px solid #E2E8F0;box-shadow:0 1px 4px rgba(0,0,0,0.04)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:13px;font-weight:900;color:#1E293B">ðŸŽ¯ Monthly Target</div>
        <div style="font-size:12px;font-weight:800;color:${progressVal>=100?'#059669':progressVal>=60?'#f97316':'#6366f1'}">
          ${target.unit === "qty" ? progress.qty : progress.orders} / ${target.monthly} ${target.unit === "qty" ? "units" : "orders"}
        </div>
      </div>
      <div style="height:10px;background:#F1F5F9;border-radius:5px;overflow:hidden;margin-bottom:6px">
        <div style="height:100%;width:${progressVal}%;background:${progressVal>=100?'linear-gradient(90deg,#059669,#10b981)':progressVal>=60?'linear-gradient(90deg,#f97316,#fb923c)':'linear-gradient(90deg,#6366f1,#8b5cf6)'};border-radius:5px;transition:width 0.8s ease"></div>
      </div>
      <div style="font-size:11px;color:#94A3B8;font-weight:700">${progressVal}% achieved this month ${progressVal>=100?'ðŸŽ‰':''}</div>
    </div>` : `
    <div style="background:#EEF2FF;border-radius:14px;padding:12px 16px;margin-bottom:12px;border:1.5px solid #C7D2FE;font-size:12px;color:#4338ca;font-weight:700">
      ðŸŽ¯ No target set yet â€” ask Admin to set your monthly target
    </div>`}

    <!-- Today's route -->
    <div style="font-size:13px;font-weight:900;color:#1E293B;margin-bottom:8px">ðŸ“ Today's Route (${allShops.length} shops)</div>
    ${allShops.length ? allShops.map(shop => {
      const visits = todayVisits.filter(v => v.shop === shop);
      const visited = visits.length > 0;
      const shopOrders = todayOrders.filter(o => o.srShop === shop || o.retailer === shop);
      return `<div style="background:#fff;border-radius:12px;padding:10px 14px;margin-bottom:6px;border:1.5px solid ${visited?'#C7D2FE':'#F1F5F9'};display:flex;align-items:center;gap:10px;cursor:pointer" onclick="selectSRShopFromDash('${shop.replace(/'/g,"\\'")}')">
        <div style="width:32px;height:32px;border-radius:8px;background:${visited?'#6366f1':'#F1F5F9'};display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">${visited?'âœ…':'ðŸª'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:800;color:${visited?'#4338ca':'#1E293B'}">${shop}</div>
          <div style="font-size:11px;font-weight:600;color:#94A3B8">${visited ? `Visited ${visits.length}x Â· ${shopOrders.length} order(s)` : 'Not yet visited'}</div>
        </div>
        <div style="font-size:10px;font-weight:800;color:${visited?'#6366f1':'#CBD5E1'}">${visited?'DONE':'PENDING'}</div>
      </div>`;
    }).join('') : `<div style="text-align:center;padding:20px;color:#94A3B8;font-size:13px;font-weight:600">No shops in route</div>`}

    <!-- Recent orders by this SR today -->
    ${todayOrders.length ? `
    <div style="font-size:13px;font-weight:900;color:#1E293B;margin:14px 0 8px">ðŸ“¦ Orders Punched Today</div>
    ${todayOrders.slice(0,10).map(o => `
      <div style="background:#fff;border-radius:12px;padding:10px 14px;margin-bottom:6px;border:1.5px solid #F1F5F9;display:flex;align-items:center;gap:10px">
        <div style="font-size:18px;flex-shrink:0">ðŸ“¦</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:800;color:#1E293B">${o.retailer || o.srShop || 'Unknown'}</div>
          <div style="font-size:11px;color:#94A3B8;font-weight:600">${o.items ? o.items.length+' items' : ''} Â· Qty: ${o.totalQty||0} Â· ${o.status}</div>
        </div>
        <div style="font-size:10px;font-weight:800;padding:4px 8px;border-radius:8px;background:${o.status==='WhatsApp Sent'?'#D1FAE5':'#DBEAFE'};color:${o.status==='WhatsApp Sent'?'#065F46':'#1e40af'}">${o.status==='WhatsApp Sent'?'WA':'DIR'}</div>
      </div>`).join('')}` : ''}
  `;
}
function selectSRShopFromDash(shop) {
  closeSRDashboard();
  selectSRShop(shop);
}

// â”€â”€ ADMIN SR PANEL (Phase 2) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function adminAddSR() {
  const name  = document.getElementById("srAddName").value.trim();
  const code  = document.getElementById("srAddCode").value.trim().toUpperCase();
  const mob   = document.getElementById("srAddMobile").value.trim();
  const area  = document.getElementById("srAddArea").value.trim();
  const shopsRaw = document.getElementById("srAddShops").value.trim();
  if (!name || !code) { showToast("Name and SR Code are required", "error"); return; }
  const list = loadSRList();
  if (list.find(s => s.code === code)) { showToast(`Code ${code} already exists!`, "error"); return; }
  const shops = shopsRaw ? shopsRaw.split("\n").map(s => s.trim()).filter(Boolean) : [];
  list.push({ id: Date.now(), name, code, mobile: mob, area, shops, createdAt: new Date().toLocaleString("en-IN") });
  saveSRList(list);
  ["srAddName","srAddCode","srAddMobile","srAddArea","srAddShops"].forEach(id => { const el = document.getElementById(id); if(el) el.value = ""; });
  showToast(`SR ${name} (${code}) added âœ“`);
  const srBtn = document.getElementById("srLoginBtn");
  if (srBtn) srBtn.style.display = "flex";
  renderSRAdminPanel();
}
function adminDeleteSR(id) {
  let list = loadSRList();
  list = list.filter(s => s.id !== id);
  saveSRList(list);
  renderSRAdminPanel();
  showToast("SR removed");
}
function adminSaveTarget(srCode) {
  const valEl = document.getElementById("srTarget_" + srCode);
  const unitEl = document.getElementById("srTargetUnit_" + srCode);
  if (!valEl) return;
  setSRTarget(srCode, valEl.value, unitEl ? unitEl.value : "orders");
  showToast("Target saved âœ“");
  renderSRAdminPanel();
}
function renderSRAdminPanel() {
  const list = loadSRList();
  const countEl = document.getElementById("srCount");
  if (countEl) countEl.textContent = `${list.length} SR${list.length !== 1 ? 's' : ''}`;
  const el = document.getElementById("srAdminList");
  if (!el) return;
  if (!list.length) {
    el.innerHTML = `<div style="text-align:center;padding:32px 20px;background:#fff;border-radius:16px;border:1.5px solid #E2E8F0"><div style="font-size:44px;margin-bottom:12px">ðŸ§‘â€ðŸ’¼</div><div style="font-size:15px;font-weight:800;color:#64748B;margin-bottom:6px">No SRs added yet</div><div style="font-size:13px;color:#94A3B8">Add your first sales representative above</div></div>`;
    return;
  }
  const today = new Date().toLocaleDateString("en-IN");
  el.innerHTML = list.map(sr => {
    const allOrders = getSROrdersForCode(sr.code);
    const todayVisits = getSRVisitsToday(sr.code);
    const visitedToday = [...new Set(todayVisits.map(v => v.shop))].length;
    const target = getSRTarget(sr.code);
    const progress = getSRMonthProgress(sr.code);
    const progressVal = target.monthly > 0
      ? Math.min(100, Math.round((target.unit === "qty" ? progress.qty : progress.orders) / target.monthly * 100))
      : 0;
    const lastOrder = allOrders[0];
    return `
    <div style="background:#fff;border-radius:16px;padding:0;margin-bottom:12px;border:1.5px solid #E2E8F0;box-shadow:0 2px 6px rgba(0,0,0,0.04);overflow:hidden">
      <!-- SR Header -->
      <div style="background:linear-gradient(135deg,#4338ca,#6366f1);padding:14px 16px;display:flex;align-items:center;gap:12px">
        <div style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">ðŸ§‘â€ðŸ’¼</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:15px;font-weight:900;color:#fff">${sr.name}</div>
          <div style="display:flex;gap:6px;margin-top:3px;flex-wrap:wrap">
            <span style="background:rgba(255,255,255,0.2);color:#fff;font-size:11px;font-weight:900;padding:2px 8px;border-radius:20px;letter-spacing:1px">${sr.code}</span>
            ${sr.area ? `<span style="background:rgba(255,255,255,0.15);color:rgba(255,255,255,0.85);font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px">ðŸ“ ${sr.area}</span>` : ''}
          </div>
        </div>
        <button onclick="adminDeleteSR(${sr.id})" style="background:rgba(239,68,68,0.25);border:1px solid rgba(239,68,68,0.4);border-radius:10px;padding:7px 10px;color:#fca5a5;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit">ðŸ—‘ï¸</button>
      </div>
      <!-- Today's activity stats -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;border-bottom:1px solid #F1F5F9">
        ${[
          { icon:"ðŸª", val: visitedToday, label:"Shops\nToday", color:"#4338ca" },
          { icon:"ðŸ“¦", val: allOrders.length, label:"Total\nOrders", color:"#059669" },
          { icon:"ðŸŽ¯", val: progressVal + "%", label:"Monthly\nTarget", color: progressVal>=100?"#059669":progressVal>=60?"#f97316":"#6366f1" },
        ].map((s,i) => `
          <div style="padding:12px 8px;text-align:center;${i<2?'border-right:1px solid #F1F5F9':''}">
            <div style="font-size:18px;margin-bottom:2px">${s.icon}</div>
            <div style="font-size:18px;font-weight:900;color:${s.color}">${s.val}</div>
            <div style="font-size:10px;font-weight:700;color:#94A3B8;white-space:pre-line">${s.label}</div>
          </div>`).join('')}
      </div>
      <!-- Target progress bar -->
      ${target.monthly > 0 ? `
      <div style="padding:10px 14px;border-bottom:1px solid #F1F5F9">
        <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:#64748B;margin-bottom:5px">
          <span>Monthly Progress</span>
          <span style="color:${progressVal>=100?'#059669':'#6366f1'}">${target.unit === "qty" ? progress.qty : progress.orders} / ${target.monthly} ${target.unit}</span>
        </div>
        <div style="height:8px;background:#F1F5F9;border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${progressVal}%;background:${progressVal>=100?'linear-gradient(90deg,#059669,#10b981)':progressVal>=60?'linear-gradient(90deg,#f97316,#fb923c)':'linear-gradient(90deg,#6366f1,#8b5cf6)'};border-radius:4px"></div>
        </div>
      </div>` : ''}
      <!-- Set Target row -->
      <div style="padding:10px 14px;background:#F8FAFC;border-bottom:1px solid #F1F5F9">
        <div style="font-size:11px;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">ðŸŽ¯ Monthly Target</div>
        <div style="display:flex;gap:8px;align-items:center">
          <input id="srTarget_${sr.code}" type="number" placeholder="e.g. 50" value="${target.monthly || ''}" style="flex:1;padding:8px 10px;border-radius:8px;border:1.5px solid #E2E8F0;font-size:13px;font-weight:700;font-family:inherit;outline:none;min-width:0;box-sizing:border-box" />
          <select id="srTargetUnit_${sr.code}" style="padding:8px 10px;border-radius:8px;border:1.5px solid #E2E8F0;font-size:13px;font-weight:700;font-family:inherit;background:#fff;outline:none;cursor:pointer">
            <option value="orders" ${target.unit==="orders"?"selected":""}>Orders</option>
            <option value="qty" ${target.unit==="qty"?"selected":""}>Units (Qty)</option>
          </select>
          <button onclick="adminSaveTarget('${sr.code}')" style="padding:8px 14px;border-radius:8px;border:none;background:#6366f1;color:#fff;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap">Save</button>
        </div>
      </div>
      <!-- Route shops + contacts -->
      <div style="padding:10px 14px">
        ${sr.mobile ? `<div style="font-size:12px;font-weight:700;color:#475569;margin-bottom:6px;display:flex;align-items:center;gap:6px"><span>ðŸ“±</span>${sr.mobile}</div>` : ''}
        <div style="font-size:11px;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Route Shops (${sr.shops ? sr.shops.length : 0})</div>
        <div style="max-height:120px;overflow-y:auto">
          ${sr.shops && sr.shops.length ? sr.shops.map(s => {
            const visited = todayVisits.some(v => v.shop === s);
            return `<div style="font-size:12px;font-weight:700;color:${visited?'#4338ca':'#475569'};padding:3px 0;border-bottom:1px solid #F8FAFC;display:flex;align-items:center;gap:6px">
              <span>${visited?'âœ…':'ðŸª'}</span>${s}${visited?` <span style="font-size:10px;color:#6366f1;font-weight:700;margin-left:auto">visited</span>`:''}
            </div>`;
          }).join('') : `<div style="font-size:12px;color:#CBD5E1;font-weight:600">No shops assigned</div>`}
        </div>
        <button onclick="openAddShopsModal(${sr.id})" style="margin-top:8px;width:100%;padding:8px;border-radius:8px;border:1.5px dashed #CBD5E1;background:transparent;font-family:inherit;font-size:12px;font-weight:700;color:#6366f1;cursor:pointer">+ Edit Route Shops</button>
        ${lastOrder ? `<div style="margin-top:8px;font-size:11px;color:#94A3B8;font-weight:600">Last order: ${lastOrder.timestamp || 'Unknown'}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}
function openAddShopsModal(srId) {
  const list = loadSRList();
  const sr = list.find(s => s.id === srId);
  if (!sr) return;
  const newShops = prompt(`Edit route shops for ${sr.name}\n(one per line, existing shown below)\n\n${(sr.shops||[]).join('\n')}`);
  if (newShops === null) return;
  sr.shops = newShops.split('\n').map(s => s.trim()).filter(Boolean);
  saveSRList(list);
  renderSRAdminPanel();
  showToast("Route updated âœ“");
}

function goToAdmin() {
  if (!isAdmin) { openAdminLogin(); return; }
  switchAdminTab("dashboard");
  showView("admin-view");
}

// â”€â”€ Special / Bulk Order Request â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let _spSelectedType = "Bulk Order";

function openSpecialOrderModal() {
  _spSelectedType = "Bulk Order";
  document.getElementById("spMedName").value = "";
  document.getElementById("spQty").value = "";
  document.getElementById("spRemarks").value = "";
  const dd = document.getElementById("spMedDropdown");
  if (dd) dd.style.display = "none";
  document.querySelectorAll(".sp-chip").forEach((c, i) => c.classList.toggle("active", i === 0));
  // Hide the label when user taps
  const lbl = document.getElementById("specialOrderLabel");
  if (lbl) lbl.style.display = "none";
  const modal = document.getElementById("specialOrderModal");
  modal.style.display = "flex";
}

function closeSpecialOrderModal() {
  document.getElementById("specialOrderModal").style.display = "none";
}

function selectSpChip(btn, type) {
  _spSelectedType = type;
  document.querySelectorAll(".sp-chip").forEach(c => c.classList.remove("active"));
  btn.classList.add("active");
}

function spMedSearch(val) {
  var dd = document.getElementById("spMedDropdown");
  if (!dd) return;
  var q = val.trim().toUpperCase();

  if (!q) { dd.style.display = "none"; return; }

  // Starts-with first, then contains â€” better ranking
  var starts = [], contains = [];
  for (var i = 0; i < products.length; i++) {
    var n = products[i].name.toUpperCase();
    if (n.startsWith(q)) starts.push(products[i]);
    else if (n.includes(q)) contains.push(products[i]);
    if (starts.length + contains.length >= 15) break;
  }
  var matches = starts.concat(contains).slice(0, 12);
  if (!matches.length) { dd.style.display = "none"; return; }

  var html = "";
  for (var j = 0; j < matches.length; j++) {
    var prod = matches[j];
    var subLine = (prod.company || prod.packing)
      ? '<div style="font-size:11px;color:#64748B;font-weight:600">' + (prod.company || "") + (prod.packing ? " Â· " + prod.packing : "") + "</div>"
      : "";
    html += '<div data-idx="' + j + '" style="padding:10px 14px;cursor:pointer;border-bottom:1px solid #f1f5f9" onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'\'">'
      + '<div style="font-size:13px;font-weight:800;color:var(--text,#0f172a)">' + prod.name + "</div>"
      + subLine + "</div>";
  }
  dd.innerHTML = html;
  dd._matches = matches;
  dd.querySelectorAll("[data-idx]").forEach(function(el) {
    el.addEventListener("click", function() {
      var idx = +this.getAttribute("data-idx");
      var p = dd._matches[idx];
      spMedSelect(p.name, p.company, p.packing);
    });
  });
  dd.style.display = "block";
}

function spMedSelect(name, company, packing) {
  document.getElementById("spMedName").value = name;
  document.getElementById("spMedDropdown").style.display = "none";
  // Pre-fill packing as hint in qty placeholder
  const qtyInp = document.getElementById("spQty");
  if (qtyInp && packing) qtyInp.placeholder = "e.g. 100";
}

// Close dropdown on outside click
document.addEventListener("click", function(e) {
  if (!e.target.closest("#spMedName") && !e.target.closest("#spMedDropdown")) {
    const dd = document.getElementById("spMedDropdown");
    if (dd) dd.style.display = "none";
  }
});

// â”€â”€ Profit Calculator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function openProfitCalc() {
  document.getElementById("calcMRP").value = "";
  document.getElementById("calcPTR").value = "";
  document.getElementById("calcResult").style.display = "none";
  document.getElementById("calcTip").style.display = "block";
  const modal = document.getElementById("profitCalcModal");
  modal.style.display = "flex";
  setTimeout(() => document.getElementById("calcMRP").focus(), 300);
  // Hide FAB label
  const lbl = document.getElementById("calcFabLabel");
  if (lbl) lbl.style.display = "none";
}

function closeProfitCalc() {
  document.getElementById("profitCalcModal").style.display = "none";
}

function calcProfit() {
  const mrp = parseFloat(document.getElementById("calcMRP").value) || 0;
  const ptr = parseFloat(document.getElementById("calcPTR").value) || 0;
  const resultEl = document.getElementById("calcResult");
  const tipEl = document.getElementById("calcTip");

  if (!mrp || !ptr || ptr <= 0 || mrp <= 0) {
    resultEl.style.display = "none";
    tipEl.style.display = "block";
    if (mrp > 0 && ptr > 0 && ptr >= mrp) {
      tipEl.textContent = "âš ï¸ PTR should be less than MRP";
      tipEl.style.color = "#ef4444";
    } else {
      tipEl.textContent = "Enter MRP and PTR above to calculate";
      tipEl.style.color = "#94A3B8";
    }
    return;
  }

  if (ptr >= mrp) {
    resultEl.style.display = "none";
    tipEl.style.display = "block";
    tipEl.textContent = "âš ï¸ PTR should be less than MRP";
    tipEl.style.color = "#ef4444";
    return;
  }

  const profit = mrp - ptr;
  const margin = (profit / mrp) * 100;
  const on1000 = Math.round((profit / mrp) * 1000);

  // Color based on margin
  let bg, label;
  if (margin >= 30) { bg = "linear-gradient(135deg,#16a34a,#15803d)"; label = "ðŸ”¥ Excellent margin!"; }
  else if (margin >= 20) { bg = "linear-gradient(135deg,#0891b2,#0e7490)"; label = "âœ… Good margin"; }
  else if (margin >= 12) { bg = "linear-gradient(135deg,#d97706,#b45309)"; label = "âš¡ Average margin"; }
  else { bg = "linear-gradient(135deg,#dc2626,#b91c1c)"; label = "âš ï¸ Low margin â€” negotiate better PTR"; }

  document.getElementById("calcResultBg").style.background = bg;
  document.getElementById("calcProfitVal").textContent = "â‚¹" + profit.toFixed(profit % 1 === 0 ? 0 : 2);
  document.getElementById("calcMarginVal").textContent = margin.toFixed(1) + "%";
  document.getElementById("calcProgressBar").style.width = Math.min(margin, 100) + "%";
  document.getElementById("calcMarginLabel").textContent = label;
  document.getElementById("calcBuyAt").textContent = "â‚¹" + ptr.toFixed(ptr % 1 === 0 ? 0 : 2);
  document.getElementById("calcSellAt").textContent = "â‚¹" + mrp.toFixed(mrp % 1 === 0 ? 0 : 2);
  document.getElementById("calcOn1000").textContent = "â‚¹" + on1000;

  resultEl.style.display = "block";
  tipEl.style.display = "none";
}

function setCalcPreset(mrp, ptr) {
  document.getElementById("calcMRP").value = mrp;
  document.getElementById("calcPTR").value = ptr;
  calcProfit();
}

function submitSpecialOrder() {
  const med = document.getElementById("spMedName").value.trim();
  const qty = document.getElementById("spQty").value.trim();
  const remarks = document.getElementById("spRemarks").value.trim();

  if (!med) { showToast("Please enter medicine name", "error"); document.getElementById("spMedName").focus(); return; }

  // Get retailer info
  const retailerName = document.getElementById("retailerName")?.value.trim() ||
    getRetailerSession()?.store || "Retailer";

  const today = new Date().toLocaleDateString("en-IN");

  let msg = `================================\n  JAIN AGENCIES - RAJNANDGAON\n================================\n`;
  msg += `*${retailerName}*\n`;
  msg += `Date: ${today}\n\n`;
  msg += `*ðŸ“‹ SPECIAL ORDER REQUEST*\n`;
  msg += `--------------------------------\n`;
  msg += `Type: *${_spSelectedType}*\n`;
  msg += `Medicine: *${med}*\n`;
  if (qty) msg += `Quantity: *${qty}*\n`;
  if (remarks) msg += `Notes: ${remarks}\n`;
  msg += `--------------------------------\n`;
  msg += `Please confirm availability & rate.\nThank you!`;

  const encoded = encodeURIComponent(msg);
  const waNum = typeof JAIN_WA_NUMBER !== "undefined" ? JAIN_WA_NUMBER : "919086291862";
  window.open(`https://wa.me/${waNum}?text=${encoded}`, "_blank");
  closeSpecialOrderModal();
  showToast("âœ… Opening WhatsAppâ€¦");
}


function openSchemeView(btn) {
  _svActiveTab = "all";
  navTo("scheme-view", btn || document.getElementById("navSchemes"));
  renderSchemeView();
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ACCOUNT VIEW
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function openAccountView(btn) {
  navTo("account-view", btn || document.getElementById("navAccount"));
  renderAccountView();
}

function renderAccountView() {
  // â”€â”€ Header profile card â”€â”€
  const r = currentRetailer;
  const nameEl   = document.getElementById("accProfileName");
  const shopEl   = document.getElementById("accProfileShop");
  const avatarEl = document.getElementById("accAvatar");
  const badge    = document.getElementById("accStatusBadge");

  if (r) {
    const initials = (r.name || "?").split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase();
    avatarEl.textContent = initials;
    nameEl.textContent   = r.name || "â€”";
    shopEl.textContent   = r.shop || r.city || "â€”";
    const statusMap = {
      approved: { text:"âœ“ APPROVED", bg:"rgba(22,163,74,0.25)", color:"#86efac" },
      pending:  { text:"â³ PENDING",  bg:"rgba(234,179,8,0.25)",  color:"#fde68a" },
      rejected: { text:"âœ— REJECTED", bg:"rgba(239,68,68,0.25)",  color:"#fca5a5" }
    };
    const s = statusMap[r.status] || { text:"GUEST", bg:"rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.7)" };
    badge.textContent = s.text;
    badge.style.background  = s.bg;
    badge.style.color       = s.color;
  } else {
    avatarEl.textContent    = "?";
    nameEl.textContent      = "Not logged in";
    shopEl.textContent      = "Tap Edit Profile to set up your account";
    badge.textContent       = "GUEST";
    badge.style.background  = "rgba(255,255,255,0.15)";
    badge.style.color       = "rgba(255,255,255,0.7)";
  }

  // â”€â”€ Profile rows â”€â”€
  const fields = [
    { icon:"ðŸª", label:"Shop Name",  val: r?.shop    || "â€”" },
    { icon:"ðŸ‘¤", label:"Your Name",  val: r?.name    || "â€”" },
    { icon:"ðŸ“±", label:"Mobile",     val: r?.mobile  || "â€”" },
    { icon:"âœ‰ï¸", label:"Email",      val: r?.email   || "â€”" },
    { icon:"ðŸ“", label:"Address",    val: r?.address || r?.city || "â€”" },
    { icon:"ðŸ’Š", label:"DL Number",  val: r?.dl      || "â€”" },
    { icon:"ðŸ“‹", label:"GST Number", val: r?.gst     || "â€”" },
  ];
  document.getElementById("accProfileRows").innerHTML = fields.map((f, i) =>
    `<div style="padding:12px 16px;display:flex;align-items:center;gap:12px;${i < fields.length-1 ? "border-bottom:1px solid var(--border,#F1F5F9)" : ""}">
      <span style="font-size:16px;width:24px;text-align:center;flex-shrink:0">${f.icon}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:10px;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:0.5px">${f.label}</div>
        <div style="font-size:13px;font-weight:700;color:var(--text,#1E293B);margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f.val}</div>
      </div>
    </div>`
  ).join("");

  // â”€â”€ Document badges â”€â”€
  const docs = JSON.parse(localStorage.getItem("ja_acc_docs") || "{}");
  _renderDocBadge("dl",  docs.dl);
  _renderDocBadge("gst", docs.gst);
  _renderDocBadge("pan", docs.pan);
}

function _renderDocBadge(type, fileInfo) {
  const statusEl = document.getElementById("acc" + type.charAt(0).toUpperCase() + type.slice(1) + "Status");
  const badgeEl  = document.getElementById("acc" + type.charAt(0).toUpperCase() + type.slice(1) + "Badge");
  if (!statusEl || !badgeEl) return;
  if (fileInfo && fileInfo.name) {
    statusEl.textContent    = "âœ“ " + fileInfo.name;
    statusEl.style.color    = "#16a34a";
    badgeEl.textContent     = "Uploaded";
    badgeEl.style.background = "#DCFCE7";
    badgeEl.style.color     = "#15803D";
  } else {
    statusEl.textContent    = "Tap to upload";
    statusEl.style.color    = "#94A3B8";
    badgeEl.textContent     = "Pending";
    badgeEl.style.background = "#FEF9C3";
    badgeEl.style.color     = "#854D0E";
  }
}

let _accDocType = null;
function handleAccDocUpload(type) {
  _accDocType = type;
  const input = document.getElementById("accDocFileInput");
  input.value = "";
  input.click();
}

function accDocFileSelected(input) {
  const file = input.files[0];
  if (!file || !_accDocType) return;
  if (file.size > 8 * 1024 * 1024) { showToast("File too large! Max 8MB", "error"); return; }
  const docs = JSON.parse(localStorage.getItem("ja_acc_docs") || "{}");
  docs[_accDocType] = { name: file.name, size: file.size, uploadedAt: new Date().toLocaleDateString("en-IN") };
  localStorage.setItem("ja_acc_docs", JSON.stringify(docs));
  // Also save to retailer record if logged in
  if (currentRetailer) {
    const retailers = getRetailers();
    const idx = retailers.findIndex(x => x.id === currentRetailer.id);
    const key = _accDocType + "Doc";
    if (idx !== -1) { retailers[idx][key] = docs[_accDocType]; saveRetailers(retailers); }
    currentRetailer[key] = docs[_accDocType];
  }
  _renderDocBadge(_accDocType, docs[_accDocType]);
  const labels = { dl:"Drug License", gst:"GST Certificate", pan:"PAN Card" };
  showToast("âœ… " + (labels[_accDocType] || "Document") + " uploaded!");
  _accDocType = null;
}

function openEditProfile() {
  const r = currentRetailer;
  document.getElementById("epName").value    = r?.name    || "";
  document.getElementById("epShop").value    = r?.shop    || "";
  document.getElementById("epMobile").value  = r?.mobile  || "";
  document.getElementById("epEmail").value   = r?.email   || "";
  document.getElementById("epAddress").value = r?.address || r?.city || "";
  document.getElementById("epDL").value      = r?.dl      || "";
  document.getElementById("epGST").value     = r?.gst     || "";
  const ov = document.getElementById("editProfileOverlay");
  ov.style.display = "flex";
  requestAnimationFrame(() => ov.style.opacity = "1");
}

function closeEditProfile() {
  document.getElementById("editProfileOverlay").style.display = "none";
}

function saveEditProfile() {
  const name   = document.getElementById("epName").value.trim();
  const shop   = document.getElementById("epShop").value.trim();
  const mobile = document.getElementById("epMobile").value.trim();
  if (!name)   { showToast("Name is required", "error"); return; }
  if (!shop)   { showToast("Shop name is required", "error"); return; }
  if (mobile && !/^\d{10}$/.test(mobile)) { showToast("Enter valid 10-digit mobile", "error"); return; }

  const updates = {
    name,
    shop,
    mobile:  mobile  || currentRetailer?.mobile  || "",
    email:   document.getElementById("epEmail").value.trim(),
    address: document.getElementById("epAddress").value.trim(),
    dl:      document.getElementById("epDL").value.trim(),
    gst:     document.getElementById("epGST").value.trim(),
  };

  if (currentRetailer) {
    // Update in retailers list
    const retailers = getRetailers();
    const idx = retailers.findIndex(x => x.id === currentRetailer.id);
    if (idx !== -1) {
      retailers[idx] = { ...retailers[idx], ...updates };
      saveRetailers(retailers);
      currentRetailer = retailers[idx];
      saveRetailerSession(currentRetailer);
    } else {
      Object.assign(currentRetailer, updates);
    }
  } else {
    // Guest â€” save locally so fields persist across sessions
    const guest = { id: "guest_" + Date.now(), status: "guest", ...updates };
    currentRetailer = guest;
    saveRetailerSession(guest);
  }

  // Update cart retailer name field
  const nameInput = document.getElementById("retailerName");
  if (nameInput && !nameInput.value) nameInput.value = updates.shop;

  closeEditProfile();
  renderAccountView();
  showToast("âœ… Profile saved!");
}

function copyToClipboard(text, label) {
  var msg = "ðŸ“‹ " + (label || "Copied") + "!";
  function fallback() {
    var el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.cssText = "position:fixed;top:0;left:0;opacity:0;width:1px;height:1px;";
    document.body.appendChild(el);
    el.focus(); el.select();
    try { document.execCommand("copy"); showToast(msg); }
    catch(e) { showToast("âš ï¸ Copy failed â€” select & copy manually"); }
    document.body.removeChild(el);
  }
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(function(){ showToast(msg); }).catch(fallback);
  } else {
    fallback();
  }
}



// â”€â”€â”€ Scheme View State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let _svActiveTab = "all";

function renderSchemeView() {
  const body = document.getElementById("schemeViewBody");
  if (!body) return;

  const allSchemes = [...DEFAULT_SCHEMES, ...schemes.filter(s => !DEFAULT_SCHEMES.find(d => d.id === s.id))];
  const today = new Date().toISOString().slice(0, 10);
  const activeSchemes = allSchemes.filter(s => !s.validity || s.validity >= today);

  if (!activeSchemes.length) {
    body.innerHTML = `<div style="text-align:center;padding:60px 20px;color:#94A3B8">
      <div style="font-size:48px;margin-bottom:12px">ðŸŽ</div>
      <div style="font-size:16px;font-weight:800">No active schemes</div>
      <div style="font-size:13px;margin-top:6px">Admin can add schemes from Admin â†’ Schemes</div>
    </div>`;
    return;
  }

  // âš¡ Improvement 1 â€” use index for O(1) scheme lookup per product
  // âš¡ Improvement 2 â€” lazy render: collect all rows but render first 15, append more on scroll
  function findProducts(medName) {
    const upper = medName.toUpperCase();
    const result = [];
    for (let i = 0; i < products.length && result.length < 50; i++) {
      if (products[i].name.toUpperCase().includes(upper)) result.push(products[i]);
    }
    return result;
  }

  // Enrich each scheme with type + matched products
  const enriched = activeSchemes.map(s => {
    const st = parseSchemeType(s.deal);
    return { ...s, _type: st ? st.type : "other", _st: st, _products: findProducts(s.med) };
  });

  // â”€â”€ Sidebar tab definitions (matching reference exactly) â”€â”€
  // In the reference: "View All", "Buy 1 Get 1 Free (28)", "Buy 2 Get 1 Free (20)" etc.
  // We auto-generate these from the actual scheme data grouped by deal text pattern

  // Group by human-readable label
  function schemeTabLabel(s) {
    const d = (s.deal || "").trim();
    // "Buy N Get M Free" pattern
    const buyGet = d.match(/buy\s*(\d+)\s*get\s*(\d+)/i);
    if (buyGet) return `Buy ${buyGet[1]} Get ${buyGet[2]} Free`;
    // "N+M Free" pattern
    const plusFree = d.match(/^(\d+)\s*\+\s*(\d+)\s*(free|bonus)/i);
    if (plusFree) return `${plusFree[1]}+${plusFree[2]} Free`;
    // percent
    if (/(\d+\.?\d*)\s*%/i.test(d)) return `% Discount`;
    // PTR
    if (/ptr/i.test(d)) return `PTR Scheme`;
    // flat
    if (/flat/i.test(d)) return `Flat Discount`;
    return "Special Offer";
  }

  // Build ordered tab list: View All first, then unique labels sorted by product count desc
  const tabMap = {}; // label â†’ [schemes]
  enriched.forEach(s => {
    const lbl = schemeTabLabel(s);
    if (!tabMap[lbl]) tabMap[lbl] = [];
    tabMap[lbl].push(s);
  });

  // Product counts per tab
  const tabProductCount = {};
  let totalProducts = 0;
  Object.entries(tabMap).forEach(([lbl, arr]) => {
    const cnt = arr.reduce((a, s) => a + s._products.length, 0);
    tabProductCount[lbl] = cnt;
    totalProducts += cnt;
  });

  // Sort tabs by product count descending
  const sortedTabs = Object.keys(tabMap).sort((a, b) => tabProductCount[b] - tabProductCount[a]);

  // â”€â”€ Get filtered schemes for current tab â”€â”€
  const filteredSchemes = _svActiveTab === "all"
    ? enriched
    : (tabMap[_svActiveTab] || []);

  // â”€â”€ SIDEBAR HTML â”€â”€
  // Sidebar tab builder â€” uses data-tab attribute to avoid quote escaping issues in onclick
  const buildSidebarItem = (label, count, isActive) => {
    const escaped = label.replace(/&/g,"&amp;").replace(/"/g,"&quot;");
    return `<div data-svtab="${escaped}" style="
      padding:12px 8px 12px 10px;
      cursor:pointer;
      border-left:3px solid ${isActive ? "#00897b" : "transparent"};
      background:${isActive ? "#e6f7f5" : "#fff"};
      border-bottom:1px solid #f1f5f9;
    ">
      <div style="font-size:12px;font-weight:${isActive ? "900" : "600"};color:${isActive ? "#00695c" : "#374151"};line-height:1.4;word-break:break-word;pointer-events:none">${label}</div>
      <div style="font-size:11px;font-weight:700;color:${isActive ? "#00897b" : "#9ca3af"};margin-top:3px;pointer-events:none">(${count})</div>
    </div>`;
  };

  let sidebarHtml = buildSidebarItem("View All", totalProducts, _svActiveTab === "all");
  sortedTabs.forEach(lbl => {
    sidebarHtml += buildSidebarItem(lbl, tabProductCount[lbl], _svActiveTab === lbl);
  });

  // â”€â”€ PRODUCT ROWS HTML â”€â”€
  // Matches reference: [icon box] | [name + company + badges + PTR/MRP] | [Add button]
  // Icon box = square rounded with medicine emoji or category letter, light colored bg

  // Generate a stable pastel bg color from product name
  function iconBg(name) {
    const colors = ["#e8f5e9","#e3f2fd","#fce4ec","#fff3e0","#f3e5f5","#e0f7fa","#fff8e1","#fbe9e7"];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
    return colors[h % colors.length];
  }
  function iconFg(bg) {
    const map = {"#e8f5e9":"#2e7d32","#e3f2fd":"#1565c0","#fce4ec":"#c2185b","#fff3e0":"#e65100","#f3e5f5":"#6a1b9a","#e0f7fa":"#006064","#fff8e1":"#f57f17","#fbe9e7":"#bf360c"};
    return map[bg] || "#374151";
  }
  function prodInitials(name) {
    return name.split(/\s+/).slice(0, 2).map(w => w[0] || "").join("").toUpperCase() || "M";
  }

  let rowsHtml = "";
  let visibleCount = 0;

  filteredSchemes.forEach(s => {
    const schemeBadgeBg = "#16a34a";
    const discMatch = (s.deal || "").match(/(\d+\.?\d*)\s*%/);
    const discBadge = discMatch ? `<span style="background:#f97316;color:#fff;font-size:11px;font-weight:800;padding:4px 10px;border-radius:6px;margin-left:5px">${discMatch[1]}% Off</span>` : "";

    s._products.forEach(p => {
      visibleCount++;
      const inCart = cart.some(ci => ci.id === p.id);
      const cartItem = cart.find(ci => ci.id === p.id);
      const mrp = p.mrp ? parseFloat(p.mrp).toFixed(2) : null;
      const ptr = p.ptr ? parseFloat(p.ptr).toFixed(2) : null;
      const bg = iconBg(p.name);
      const fg = iconFg(bg);
      const initials = prodInitials(p.name);

      rowsHtml += `
      <div style="background:#fff;border-bottom:1px solid #f1f5f9;padding:14px 12px 14px 14px;display:flex;align-items:center;gap:12px">

        <!-- Icon thumbnail (no image â€” styled box) -->
        <div style="width:70px;height:70px;min-width:70px;border-radius:10px;background:${bg};display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;border:1px solid rgba(0,0,0,0.06)">
          <div style="font-size:11px;font-weight:900;color:${fg};text-align:center;padding:4px;line-height:1.2;word-break:break-all">${initials}</div>
          <div style="font-size:18px;margin-top:2px">ðŸ’Š</div>
        </div>

        <!-- Info -->
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:800;color:#111827;line-height:1.3;margin-bottom:2px">${p.name}</div>
          <div style="font-size:12px;color:#6b7280;font-weight:500;margin-bottom:6px">${p.company}</div>

          <!-- Badges row -->
          <div style="display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin-bottom:6px">
            <span style="background:${schemeBadgeBg};color:#fff;font-size:11px;font-weight:800;padding:4px 10px;border-radius:6px;white-space:nowrap">${s.deal.toUpperCase()}</span>
            ${discBadge}
          </div>

          <!-- PTR + MRP -->
          <div style="display:flex;align-items:center;gap:8px">
            ${ptr ? `<span style="font-size:13px;font-weight:800;color:#111827">PTR : â‚¹${ptr}</span>` : ""}
            ${mrp ? `<span style="font-size:12px;color:#9ca3af;font-weight:500;text-decoration:line-through">â‚¹${mrp}</span>` : ""}
          </div>
          ${inCart ? `<div style="font-size:11px;color:#16a34a;font-weight:800;margin-top:4px">âœ“ In cart â€” Qty: ${cartItem.qty}</div>` : ""}
        </div>

        <!-- Add button â€” outlined, right side -->
        <button onclick="openQtyPicker(${p.id})" style="
          background:#fff;
          color:${inCart ? "#16a34a" : "#00897b"};
          border:1.5px solid ${inCart ? "#16a34a" : "#00897b"};
          border-radius:24px;
          padding:9px 20px;
          font-family:inherit;
          font-size:13px;
          font-weight:700;
          cursor:pointer;
          white-space:nowrap;
          flex-shrink:0;
          min-width:64px;
          text-align:center;
        ">${inCart ? "âœ“ Edit" : "Add"}</button>
      </div>`;
    });

    if (!s._products.length) {
      rowsHtml += `
      <div style="background:#fff;border-bottom:1px solid #f1f5f9;padding:14px">
        <div style="font-size:13px;font-weight:800;color:#374151;margin-bottom:4px">${s.med}</div>
        <span style="background:${schemeBadgeBg};color:#fff;font-size:11px;font-weight:800;padding:3px 8px;border-radius:6px">${s.deal}</span>
        <div style="font-size:11px;color:#9ca3af;margin-top:6px">Not found in catalogue</div>
      </div>`;
    }
  });

  if (!visibleCount && !filteredSchemes.some(s => !s._products.length)) {
    rowsHtml = `<div style="text-align:center;padding:60px 20px;color:#9ca3af">
      <div style="font-size:44px;margin-bottom:12px">ðŸŽ</div>
      <div style="font-size:14px;font-weight:800">No products in this category</div>
    </div>`;
  }

  // â”€â”€ RENDER â”€â”€
  body.style.padding = "0";
  body.style.overflow = "hidden";
  body.innerHTML = `
    <div style="display:flex;height:100%;overflow:hidden">

      <!-- LEFT SIDEBAR â€” event delegation handles tab clicks -->
      <div id="svSidebar" onclick="var t=event.target.closest('[data-svtab]');if(t){window._svSetTab(t.getAttribute('data-svtab'));}" style="
        width:95px;min-width:95px;
        background:#fff;
        border-right:1px solid #e5e7eb;
        overflow-y:auto;
        height:100%;
        flex-shrink:0;
        -webkit-overflow-scrolling:touch;
      ">${sidebarHtml}</div>

      <!-- RIGHT PRODUCT LIST -->
      <div id="svProducts" style="flex:1;overflow-y:auto;background:#fff;height:100%;-webkit-overflow-scrolling:touch;">
        ${rowsHtml}
      </div>
    </div>`;

  // Tab switcher
  window._svSetTab = function(tab) {
    _svActiveTab = tab;
    renderSchemeView();
    setTimeout(() => {
      const sb = document.getElementById("svSidebar");
      if (sb) {
        const items = sb.querySelectorAll("div[onclick]");
        items.forEach(el => { if (el.style.background.includes("eaf2ff")) el.scrollIntoView({ block: "nearest" }); });
      }
      const pr = document.getElementById("svProducts");
      if (pr) pr.scrollTop = 0;
    }, 30);
  };
}

function closeAdmin() { showView("search-view"); }

let currentAdminTab = "dashboard";

function switchAdminTab(tab) {
  currentAdminTab = tab;
  document.querySelectorAll(".admin-nav-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".admin-tab-panel").forEach(p => p.classList.remove("active"));
  const tabEl = document.getElementById("atab-" + tab);
  const panelEl = document.getElementById("apanel-" + tab);
  if (tabEl) tabEl.classList.add("active");
  if (panelEl) panelEl.classList.add("active");
  if (tab === "dashboard") renderDashboard();
  if (tab === "database") renderDatabase();
  if (tab === "products") renderAdminListV2();
  if (tab === "schemes") renderAdminSchemes();
  if (tab === "retailers") renderRetailerRequests();
  if (tab === "companies") renderCompaniesList();
  if (tab === "excel") {}
  if (tab === "orders") renderAdminOrders();
  if (tab === "requests") renderAdminRequests();
  if (tab === "announcements") { renderAdminAnnList(); renderNoticesBanner(); }
  if (tab === "broadcast") { renderBroadcastPanel(); }
  if (tab === "push") { renderFCMPushPanel(); }
  if (tab === "sr") { renderSRAdminPanel(); }
}

// â”€â”€â”€ DASHBOARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderDashboard() {
  // Time
  const now = new Date();
  const timeStr = now.toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
  const el = document.getElementById("dashTime");
  if (el) el.textContent = timeStr;

  // Stats
  const inStock = products.filter(p => p.stock).length;
  const outStock = products.length - inStock;
  const retailers = getRetailers();
  const approved = retailers.filter(r => r.status === "approved").length;
  const pending = retailers.filter(r => r.status === "pending").length;
  const orders = getOrders();
  const today = new Date().toLocaleDateString("en-IN");
  const todayOrders = orders.filter(o => o.timestamp && o.timestamp.startsWith(today.split("/").reverse().join("-").slice(0,8))).length || orders.slice(0,3).length;

  const statsGrid = document.getElementById("dashStatsGrid");
  if (statsGrid) statsGrid.innerHTML = [
    { label:"Total Products", val: products.length, sub: `${inStock} in stock`, icon:"ðŸ’Š", cls:"" },
    { label:"Total Retailers", val: approved, sub: `${pending} pending approval`, icon:"ðŸª", cls:"blue" },
    { label:"Orders Today", val: orders.length, sub: "All time total", icon:"ðŸ“¦", cls:"green" },
    { label:"Out of Stock", val: outStock, sub: "Need restocking", icon:"âš ï¸", cls: outStock > 0 ? "red" : "" },
  ].map(s => `
    <div class="dash-stat-card ${s.cls}" data-icon="${s.icon}">
      <div class="dash-stat-label">${s.label}</div>
      <div class="dash-stat-value">${s.val}</div>
      <div class="dash-stat-sub">${s.sub}</div>
    </div>`).join("");

  // Recent orders
  const ordersList = document.getElementById("dashOrdersList");
  if (ordersList) {
    if (!orders.length) {
      ordersList.innerHTML = '<div style="text-align:center;padding:20px;color:#94A3B8;font-size:13px;font-weight:600">No orders yet</div>';
    } else {
      ordersList.innerHTML = orders.slice(0,5).map(o => `
        <div class="dash-order-row">
          <span class="dash-order-icon">${o.status === "WhatsApp Sent" ? "ðŸ’¬" : "ðŸ“‹"}</span>
          <div style="flex:1">
            <div class="dash-order-shop">ðŸª ${o.retailer}</div>
            <div class="dash-order-meta">${o.items.length} items Â· ${o.totalQty} strips Â· ${o.timestamp}</div>
          </div>
          <span class="dash-order-badge ${o.status === "WhatsApp Sent" ? "wa" : "pending"}">${o.status === "WhatsApp Sent" ? "ðŸ’¬ WA" : "â³ Pending"}</span>
        </div>`).join("");
    }
  }

  // Hot products (based on order frequency)
  const hotEl = document.getElementById("dashHotProducts");
  if (hotEl) {
    const freq = {};
    orders.forEach(o => o.items.forEach(i => { freq[i.name] = (freq[i.name]||0) + i.qty; }));
    const hot = Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0,5);
    const medals = ["ðŸ¥‡","ðŸ¥ˆ","ðŸ¥‰","4ï¸âƒ£","5ï¸âƒ£"];
    if (!hot.length) {
      hotEl.innerHTML = '<div style="text-align:center;padding:20px;color:#94A3B8;font-size:13px;font-weight:600">Place some orders to see hot products!</div>';
    } else {
      hotEl.innerHTML = hot.map(([name, qty], i) => {
        const p = products.find(x => x.name === name);
        return `<div class="hot-product-row">
          <span class="hot-rank">${medals[i]||"â€¢"}</span>
          <div style="flex:1"><div class="hot-name">${name}</div><div class="hot-company">${p ? p.company : ""}</div></div>
          <span class="hot-orders">${qty} strips ordered</span>
        </div>`;
      }).join("");
    }
  }

  // Pending retailers
  const pendEl = document.getElementById("dashPendingRetailers");
  if (pendEl) {
    const pendingR = retailers.filter(r => r.status === "pending");
    if (!pendingR.length) {
      pendEl.innerHTML = '<div style="text-align:center;padding:16px;color:#94A3B8;font-size:13px;font-weight:600">âœ… No pending approvals</div>';
    } else {
      pendEl.innerHTML = pendingR.slice(0,3).map(r => `
        <div class="dash-order-row">
          <span class="dash-order-icon">ðŸª</span>
          <div style="flex:1">
            <div class="dash-order-shop">${r.name} Â· ${r.shop}</div>
            <div class="dash-order-meta">DL: ${r.dl} Â· GST: ${r.gst}</div>
          </div>
          <button style="padding:7px 12px;border:none;border-radius:8px;background:linear-gradient(135deg,#059669,#10b981);color:#fff;font-size:11px;font-weight:900;cursor:pointer;font-family:inherit" onclick="approveRetailer('${r.id}');renderDashboard()">âœ… Approve</button>
        </div>`).join("") + (pendingR.length > 3 ? `<div style="text-align:center;padding:8px;font-size:12px;color:#00897b;font-weight:800;cursor:pointer" onclick="switchAdminTab('retailers')">+ ${pendingR.length - 3} more â†’</div>` : "");
    }
  }
  // â”€â”€ Analytics: Today's Searches + Top Terms â”€â”€
  const analyticsEl = document.getElementById("dashAnalytics");
  if (analyticsEl) {
    try {
      const log = JSON.parse(localStorage.getItem("ja_search_log") || "{}");
      const today = new Date().toISOString().slice(0,10);
      const todayLog = log[today] || {};
      const todayTotal = Object.values(todayLog).reduce((a,b)=>a+b, 0);

      // Aggregate all-time top searches across last 30 days
      const allTerms = {};
      Object.values(log).forEach(day => {
        Object.entries(day).forEach(([t,c]) => { allTerms[t] = (allTerms[t]||0) + c; });
      });
      const topTerms = Object.entries(allTerms).sort((a,b)=>b[1]-a[1]).slice(0,5);

      analyticsEl.innerHTML = `
        <div class="dash-section-title">ðŸ” Search Analytics</div>
        <div class="dash-analytics-row">
          <div class="dash-analytics-card">
            <div class="dash-analytics-num">${todayTotal}</div>
            <div class="dash-analytics-lbl">Searches Today</div>
          </div>
          <div class="dash-analytics-card">
            <div class="dash-analytics-num">${Object.keys(allTerms).length}</div>
            <div class="dash-analytics-lbl">Unique Terms</div>
          </div>
          <div class="dash-analytics-card">
            <div class="dash-analytics-num">${Object.keys(log).length}</div>
            <div class="dash-analytics-lbl">Active Days</div>
          </div>
        </div>
        ${topTerms.length ? `
        <div class="dash-section-title" style="margin-top:12px">ðŸ”¥ Top Searched Medicines</div>
        ${topTerms.map(([term,count],i) => {
          const pct = Math.round((count / (topTerms[0][1]||1)) * 100);
          const medals = ["ðŸ¥‡","ðŸ¥ˆ","ðŸ¥‰","4ï¸âƒ£","5ï¸âƒ£"];
          return `<div class="dash-search-bar-row">
            <span style="font-size:14px;flex-shrink:0">${medals[i]||"â€¢"}</span>
            <div style="flex:1;min-width:0">
              <div style="display:flex;justify-content:space-between;margin-bottom:3px">
                <span style="font-size:12px;font-weight:800;color:#1E293B;text-transform:capitalize">${term}</span>
                <span style="font-size:11px;color:#64748B;font-weight:700">${count}x</span>
              </div>
              <div class="dash-search-bar-track">
                <div class="dash-search-bar-fill" style="width:${pct}%"></div>
              </div>
            </div>
          </div>`;
        }).join("")}` : `<div style="text-align:center;padding:12px;color:#94A3B8;font-size:12px;font-weight:600">Search medicines to build analytics</div>`}
      `;
    } catch(e) {
      analyticsEl.innerHTML = "";
    }
  }
}

function renderAdminListV2() {
  const q = (document.getElementById("adminSearchV2")?.value||"").toLowerCase();
  const coFilter = _adminCompanyFilter || "";
  const filtered = products.filter(p => {
    if (coFilter && p.company !== coFilter) return false;
    return !q || p.name.toLowerCase().includes(q) || p.company.toLowerCase().includes(q);
  });
  // Show active company filter banner
  const bannerEl = document.getElementById("adminCompanyFilterBanner");
  if (bannerEl) {
    if (coFilter) {
      bannerEl.style.display = "flex";
      bannerEl.innerHTML = `<span>ðŸ¢ Filtering: <strong>${coFilter}</strong> â€” ${filtered.length} products</span><button onclick="_adminCompanyFilter='';renderAdminListV2()" style="background:none;border:none;color:#dc2626;font-size:16px;cursor:pointer;font-weight:900">âœ•</button>`;
    } else {
      bannerEl.style.display = "none";
    }
  }
  const el = document.getElementById("adminListV2");
  if (!el) return;
  if (!filtered.length) { el.innerHTML = '<div style="text-align:center;padding:40px;color:#94A3B8;font-size:14px;font-weight:700">No products found</div>'; return; }
  const color = p => CAT_COLORS[p.category] || "#64748B";
  el.innerHTML = filtered.map(p => `
    <div class="admin-card-v2">
      <div class="admin-card-v2-top">
        <div class="admin-cat-dot" style="background:${color(p)}22">${CAT_ICONS[p.category]||"ðŸ’Š"}</div>
        <div style="flex:1;min-width:0">
          <div class="admin-card-name-v2">${p.name}</div>
          <div class="admin-card-co">${p.company} Â· ${p.packing}${p.mrp ? " Â· â‚¹"+p.mrp : ""}</div>
        </div>
      </div>
      <div class="admin-card-v2-foot">
        <span class="admin-tag-stock ${p.stock?"in":"out"}">${p.stock?"â— In Stock":"â—‹ Out"}</span>
        ${p.scheme ? `<span style="background:#FEF3C7;color:#92400E;font-size:11px;font-weight:800;padding:3px 8px;border-radius:20px">ðŸŽ ${p.scheme}</span>` : ""}
        <div class="admin-card-v2-actions">
          <button class="adm-btn adm-btn-stock ${p.stock?"active":""}" onclick="toggleStockAdmin(${p.id})">${p.stock?"âœ“ In":"âœ— Out"}</button>
          <button class="adm-btn adm-btn-edit" onclick="openEditFormById(${p.id})">âœï¸</button>
          <button class="adm-btn adm-btn-del" onclick="openConfirmDel(${p.id})">ðŸ—‘ï¸</button>
        </div>
      </div>
    </div>`).join("");
}

// Keep old renderAdminList for compatibility
function renderAdminList() { renderAdminListV2(); }
function renderAdminStats() { if (currentAdminTab === "dashboard") renderDashboard(); }

// â”€â”€â”€ SCHEMES (admin) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderAdminSchemes() {
  const el = document.getElementById("adminSchemesList");
  if (!el) return;
  // Show DEFAULT_SCHEMES + custom schemes (custom overrides default by id)
  const allSchemes = [...DEFAULT_SCHEMES, ...schemes.filter(s => !DEFAULT_SCHEMES.find(d => d.id === s.id))];
  if (!allSchemes.length) {
    el.innerHTML = '<div style="text-align:center;padding:40px;color:#94A3B8;font-size:14px;font-weight:700">No schemes yet. Add one above!</div>';
    return;
  }
  const today = new Date().toISOString().slice(0,10);
  el.innerHTML = allSchemes.map(s => {
    const expired = s.validity && s.validity < today;
    const isDefault = DEFAULT_SCHEMES.find(d => d.id === s.id) && !schemes.find(x => x.id === s.id);
    return `<div class="scheme-admin-card">
      <span style="font-size:24px;flex-shrink:0">${expired ? "âš ï¸" : "ðŸ”¥"}</span>
      <div class="scheme-admin-info">
        <div class="scheme-admin-name">${s.med} ${isDefault ? '<span style="font-size:10px;background:#e0f2fe;color:#0369a1;padding:2px 6px;border-radius:6px;font-weight:700">DEFAULT</span>' : ''}</div>
        <div class="scheme-admin-deal">ðŸŽ ${s.deal}</div>
        <div class="scheme-admin-meta">${s.company || "â€”"}${s.validity ? " Â· Valid till " + s.validity : " Â· No expiry"}</div>
      </div>
      <div class="scheme-admin-actions" style="display:flex;flex-direction:column;gap:6px">
        <button class="adm-btn" style="background:#e0f2fe;color:#0369a1;border:none;border-radius:8px;padding:6px 10px;font-size:12px;font-weight:800;cursor:pointer" onclick="openSchemeModal(${s.id})">âœï¸ Edit</button>
        <button class="adm-btn adm-btn-del" onclick="deleteScheme(${s.id});renderAdminSchemes();renderSchemes()">ðŸ—‘ï¸</button>
      </div>
    </div>`;
  }).join("");
}

// â”€â”€â”€ COMPANIES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let customCompanies = [];
function loadCustomCompanies() {
  try { customCompanies = JSON.parse(localStorage.getItem("ja_companies") || "[]"); } catch { customCompanies = []; }
}
function saveCustomCompanies() {
  try { localStorage.setItem("ja_companies", JSON.stringify(customCompanies)); } catch {}
}

function addCompany() {
  const input = document.getElementById("newCompanyInput");
  const name = input.value.trim();
  if (!name) { showToast("Enter company name", "error"); return; }
  if (customCompanies.includes(name) || products.some(p => p.company === name)) {
    showToast("Company already exists!", "error"); return;
  }
  customCompanies.push(name);
  saveCustomCompanies();
  input.value = "";
  renderCompaniesList();
  buildCompanySelect();
  showToast("âœ… Company added â€” " + name);
}

function renderCompaniesList() {
  const el = document.getElementById("companiesList");
  if (!el) return;
  const productCos = [...new Set(products.map(p => p.company))].sort();
  const customOnly = customCompanies.filter(c => !productCos.includes(c)).sort();
  const allCos = [...productCos, ...customOnly];
  if (!allCos.length) { el.innerHTML = '<div style="text-align:center;padding:30px;color:#94A3B8;font-size:13px">No companies yet</div>'; return; }
  el.innerHTML = allCos.map(co => {
    const count = products.filter(p => p.company === co).length;
    const isCustomOnly = customOnly.includes(co);
    return `<div class="company-card" onclick="filterAdminByCompany('${co.replace(/'/g,"\\'")}')">
      <div class="company-card-icon">ðŸ¢</div>
      <div style="flex:1">
        <div class="company-card-name">${co}</div>
        <div class="company-card-count">${count} product${count !== 1 ? "s" : ""} Â· <span style="color:#00897b;font-weight:800">Tap to view</span></div>
      </div>
      ${isCustomOnly ? `<button class="company-card-del" onclick="event.stopPropagation();deleteCustomCompany('${co.replace(/'/g,"\\'")}')">âœ•</button>` : '<span style="font-size:16px">â€º</span>'}
    </div>`;
  }).join("");
}

function filterAdminByCompany(co) {
  // Switch to products tab and filter by this company
  switchAdminTab("products");
  // Set a filter variable and re-render
  _adminCompanyFilter = co;
  renderAdminListV2();
  showToast("ðŸ“¦ Showing " + co);
}

function deleteCustomCompany(name) {
  customCompanies = customCompanies.filter(c => c !== name);
  saveCustomCompanies();
  renderCompaniesList();
  buildCompanySelect();
}

// â”€â”€â”€ EXCEL IMPORT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let excelParsedRows = [];

function handleExcelFile(input) {
  const file = input.files[0];
  if (!file) return;
  document.getElementById("excelZoneFile").textContent = "ðŸ“„ " + file.name;
  document.getElementById("excelZoneIcon").textContent = "âœ…";
  document.getElementById("excelZoneTitle").textContent = "File loaded!";
  document.getElementById("excelZone").classList.add("has-file");

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    // CSV parser (handles quoted values)
    const rows = parseCSV(text);
    if (rows.length < 2) { showToast("File seems empty or invalid", "error"); return; }
    const headers = rows[0].map(h => h.trim().toLowerCase());
    excelParsedRows = rows.slice(1).filter(r => r.some(c => c.trim())).map(r => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (r[i]||"").trim(); });
      return obj;
    });
    showExcelPreview(excelParsedRows, headers);
    document.getElementById("excelImportBtn").style.display = "flex";
  };
  if (file.name.endsWith(".csv")) {
    reader.readAsText(file);
  } else {
    // For xlsx â€” basic fallback message
    reader.readAsText(file);
    showToast("For .xlsx files, please save as .csv first for best results", "error");
  }
}

function parseCSV(text) {
  const rows = []; let row = []; let cur = ""; let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { inQ = !inQ; }
    else if (c === "," && !inQ) { row.push(cur); cur = ""; }
    else if ((c === "\n" || c === "\r") && !inQ) {
      if (c === "\r" && text[i+1] === "\n") i++;
      row.push(cur); cur = "";
      if (row.some(x => x.trim())) rows.push(row);
      row = [];
    } else { cur += c; }
  }
  if (cur || row.length) { row.push(cur); if (row.some(x=>x.trim())) rows.push(row); }
  return rows;
}

function showExcelPreview(rows, headers) {
  const el = document.getElementById("excelPreview");
  const preview = rows.slice(0,5);
  el.innerHTML = `
    <div class="excel-preview-card">
      <div class="excel-preview-title">Preview (${rows.length} products found)</div>
      ${preview.map(r => `
        <div class="excel-preview-row">
          <span style="font-weight:900;color:#1E293B">${r.name || r["medicine name"] || "?"}</span>
          <span>Â·</span>
          <span>${r.company || "?"}</span>
          <span>Â·</span>
          <span style="color:#94A3B8">${r.packing || r.pack || ""}</span>
        </div>`).join("")}
      ${rows.length > 5 ? `<div style="font-size:11px;color:#94A3B8;padding:5px 0;font-weight:700">+ ${rows.length-5} more rows...</div>` : ""}
    </div>`;
}

function importExcelData() {
  if (!excelParsedRows.length) { showToast("No data to import", "error"); return; }
  let added = 0; let skipped = 0;
  const maxId = products.length ? Math.max(...products.map(p=>p.id)) : 0;
  excelParsedRows.forEach((r, i) => {
    const name = (r.name || r["medicine name"] || r["product name"] || "").trim();
    const company = (r.company || r["company name"] || "").trim();
    if (!name || !company) { skipped++; return; }
    if (products.some(p => p.name.toLowerCase() === name.toLowerCase() && p.company.toLowerCase() === company.toLowerCase())) {
      skipped++; return;
    }
    products.push({
      id: maxId + i + 1,
      name,
      company,
      category: capitalize(r.category || "Tablet"),
      packing: r.packing || r.pack || "",
      mrp: r.mrp || "",
      ptr: r.ptr || r.pts || "",
      formula: r.formula || r.composition || "",
      scheme: r.scheme || "",
      division: r.division || "",
      stock: (r.stock || "yes").toLowerCase() !== "no"
    });
    added++;
  });
  saveData();
  buildCatChips();
  buildCompanySelect();
  renderProductList();
  updateCountBtn();
  excelParsedRows = [];
  document.getElementById("excelPreview").innerHTML = "";
  document.getElementById("excelImportBtn").style.display = "none";
  document.getElementById("excelZone").classList.remove("has-file");
  document.getElementById("excelZoneIcon").textContent = "ðŸ“Š";
  document.getElementById("excelZoneTitle").textContent = "Upload Excel / CSV File";
  document.getElementById("excelZoneFile").textContent = "";
  showToast(`âœ… Imported ${added} products${skipped ? ", " + skipped + " skipped" : ""}!`);
  switchAdminTab("products");
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s; }

function downloadTemplate() {
  // All fields quoted so commas inside values (e.g. formulas) don't break CSV parsers
  const rows = [
    ["Name","Company","Category","Packing","MRP","PTR","Formula","Scheme","Stock"],
    ["AZITHRAL 500MG","Alembic","Tablet","10T","120","98","Azithromycin 500mg","10+1 Free","Yes"],
    ["PANTOP 40","Aristo","Tablet","10T","90","72","Pantoprazole 40mg","","Yes"],
    ["CROCIN 500","GSK","Tablet","15T","45","36","Paracetamol 500mg","","Yes"],
    ["AUGMENTIN 625","GSK","Tablet","6T","280","224","Amoxicillin 500mg + Clavulanate 125mg","5% Extra","Yes"],
    ["MONTEK LC","Sun Pharma","Tablet","10T","175","140","Montelukast 10mg + Levocetirizine 5mg","","Yes"],
  ];
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(",")).join("\r\n");
  const a = document.createElement("a");
  a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  a.download = "jain_agencies_template.csv";
  a.click();
  showToast("Template downloaded!");
}

function toggleStockAdmin(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const wasOut = !p.stock;
  p.stock = !p.stock;
  saveData();
  if (p.stock && wasOut) fireStockAlert(p);
  if (currentAdminTab === "dashboard") renderDashboard();
  if (currentAdminTab === "products") renderAdminListV2();
  showToast(p.stock ? "In Stock âœ“" : "Out of Stock");
}

function openConfirmDel(id) {
  deleteTargetId = id;
  document.getElementById("confirmDel").classList.add("open");
}
function closeConfirmDel() {
  document.getElementById("confirmDel").classList.remove("open");
  deleteTargetId = null;
}
function confirmDelete() {
  products = products.filter(p => p.id !== deleteTargetId);
  saveData();
  closeConfirmDel();
  if (currentAdminTab === "dashboard") renderDashboard();
  renderAdminListV2();
  updateCountBtn();
  showToast("Product deleted");
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// FORM
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function openAddForm() {
  editingId = null;
  document.getElementById("formTitle").textContent = "Add New Product";
  document.getElementById("saveBtn").textContent = "Add Product";
  ["fName","fDivision","fPacking","fMrp","fPtr","fHsn","fBatch","fExpiry","fMoq","fScheme"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("fGst").value = "5";
  document.getElementById("fFormula").value = "";
  document.getElementById("fCategory").value = "Tablet";
  formStockValue = true;
  updateStockToggle();
  populateFormDropdowns("", "");
  showView("form-view");
}

function openEditFormById(id) {
  const p = products.find(x => x.id === id);
  if (p) openEditForm(p);
}

function openEditForm(p) {
  editingId = p.id;
  document.getElementById("formTitle").textContent = "Edit Product";
  document.getElementById("saveBtn").textContent = "Update Product";
  document.getElementById("fName").value = p.name || "";
  document.getElementById("fDivision").value = p.division || "";
  document.getElementById("fPacking").value = p.packing || "";
  document.getElementById("fMrp").value = p.mrp || "";
  document.getElementById("fPtr").value = p.ptr || "";
  document.getElementById("fHsn").value = p.hsn || "";
  document.getElementById("fGst").value = p.gst || "5";
  document.getElementById("fBatch").value = p.batch || "";
  document.getElementById("fExpiry").value = p.expiry || "";
  document.getElementById("fMoq").value = p.moq > 1 ? p.moq : "";
  document.getElementById("fScheme").value = p.scheme || "";
  document.getElementById("fCategory").value = p.category || "Tablet";
  formStockValue = p.stock !== false;
  updateStockToggle();
  populateFormDropdowns(p.company || "", p.formula || "");
  showView("form-view");
}

function toggleFormStock() {
  formStockValue = !formStockValue;
  updateStockToggle();
}

function updateStockToggle() {
  const btn = document.getElementById("fStockToggle");
  const lbl = document.getElementById("fStockLabel");
  btn.className = "toggle-switch" + (formStockValue ? " on" : "");
  lbl.textContent = formStockValue ? "In Stock" : "Out of Stock";
}

function saveProduct() {
  const name = document.getElementById("fName").value.trim();
  const company = document.getElementById("fCompany").value.trim();
  if (!name) { showToast("Medicine name required!", "error"); return; }
  if (!company) { showToast("Company name required!", "error"); return; }

  // Expiry validation â€” must be MM/YY and not already expired
  const expiryRaw = document.getElementById("fExpiry").value.trim();
  if (expiryRaw) {
    const expiryOk = /^\d{2}\/\d{2}$/.test(expiryRaw);
    if (!expiryOk) { showToast("Expiry must be MM/YY (e.g. 06/26)", "error"); return; }
    const [mm, yy] = expiryRaw.split("/").map(Number);
    const expDate = new Date(2000 + yy, mm - 1, 1);
    if (expDate < new Date()) { showToast("âš ï¸ This batch is already expired!", "error"); return; }
  }

  const prod = {
    name, company,
    division:  document.getElementById("fDivision").value.trim() || company,
    formula:   document.getElementById("fFormula").value.trim(),
    packing:   document.getElementById("fPacking").value.trim(),
    category:  document.getElementById("fCategory").value,
    mrp:       document.getElementById("fMrp").value.trim(),
    ptr:       document.getElementById("fPtr").value.trim(),
    hsn:       document.getElementById("fHsn").value.trim(),
    gst:       document.getElementById("fGst").value,
    batch:     document.getElementById("fBatch").value.trim().toUpperCase(),
    expiry:    expiryRaw,
    moq:       parseInt(document.getElementById("fMoq").value) || 1,
    scheme:    document.getElementById("fScheme").value.trim(),
    stock:     formStockValue
  };
  if (editingId) {
    const idx = products.findIndex(p => p.id === editingId);
    if (idx !== -1) products[idx] = { ...products[idx], ...prod };
    showToast("Product updated âœ“");
  } else {
    prod.id = Date.now();
    products.push(prod);
    showToast("Product added âœ“");
  }
  saveData();
  buildCompanySelect();
  updateCountBtn();
  closeForm();
}

function closeForm() {
  if (isAdmin) {
    renderAdminStats();
    renderAdminList();
    showView("admin-view");
  } else {
    showView("search-view");
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// VIEW MANAGER
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function showView(viewId) {
  document.getElementById("cart-view").classList.remove("show");
  ["search-view","detail-view","admin-view","form-view","orders-view","scheme-view","account-view"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === viewId) {
      el.style.display = (id === "scheme-view" || id === "account-view") ? "flex" : "block";
      if (id === "search-view") renderProductList();
    } else {
      el.style.display = "none";
    }
  });
  // Always keep bottom nav visible
  const nav = document.getElementById("mainBottomNav");
  if (nav) nav.style.display = "flex";
  window.scrollTo(0, 0);
  if (window.history && viewId !== "search-view") {
    window.history.pushState({ view: viewId }, "", "");
  }
}

// Handle Android hardware back button + browser back
window.addEventListener("popstate", function(e) {
  // If cart is open, close it first
  const cart = document.getElementById("cart-view");
  if (cart && cart.classList.contains("show")) {
    cart.classList.remove("show");
    return;
  }
  // If filter panel open, close it
  const fp = document.getElementById("filtersPanel");
  if (fp && fp.classList.contains("open")) {
    fp.classList.remove("open");
    window.history.pushState({ view: "search-view" }, "", "");
    return;
  }
  // If any modal open, close it
  const modals = document.querySelectorAll(".modal-overlay, .order-options-overlay, .notif-overlay");
  for (const m of modals) {
    if (m.style.display !== "none" && m.style.display !== "") {
      m.style.display = "none";
      window.history.pushState({ view: "search-view" }, "", "");
      return;
    }
  }
  // Otherwise go back to search
  const current = ["detail-view","admin-view","form-view","orders-view"]
    .find(id => document.getElementById(id)?.style.display === "block");
  if (current) {
    showView("search-view");
    window.history.pushState({ view: "search-view" }, "", "");
  }
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SCHEME HIGHLIGHT SYSTEM
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// â”€â”€ Scheme calculation helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function parseSchemeRatio(deal) {
  if (!deal) return null;
  // Format 1: "100+30 Free" or "10+2"
  const m1 = deal.match(/(\d+)\s*\+\s*(\d+)/);
  if (m1) return { base: parseInt(m1[1]), free: parseInt(m1[2]) };
  // Format 2: "Buy 5 Get 1 Free" or "Buy 10 Get 2"
  const m2 = deal.match(/buy\s*(\d+)\s*get\s*(\d+)/i);
  if (m2) return { base: parseInt(m2[1]), free: parseInt(m2[2]) };
  return null;
}

function calcScheme(deal, qty) {
  if (!deal || qty <= 0) return null;

  // Type 1: Free qty â€” "100+30 Free" or "Buy 5 Get 1 Free"
  const r = parseSchemeRatio(deal);
  if (r) {
    const freeQty = Math.floor(qty * r.free / r.base);
    if (freeQty < 1) return null;
    return `${qty}+${freeQty} Free`;
  }

  // Type 2: PTR X% â€” "PTR 15%" â†’ show saving per strip
  const ptrMatch = deal.match(/ptr\s*([\d.]+)\s*%?/i);
  if (ptrMatch) {
    const pct = parseFloat(ptrMatch[1]);
    return `PTR ${pct}% on ${qty} strips`;
  }

  // Type 3: X% Scheme / X% Extra Discount / X% off
  const pctMatch = deal.match(/([\d.]+)\s*%/);
  if (pctMatch) {
    const pct = parseFloat(pctMatch[1]);
    return `${pct}% off on ${qty} strips`;
  }

  // Type 4: Flat â‚¹X
  const flatMatch = deal.match(/flat\s*â‚¹?\s*([\d.]+)/i);
  if (flatMatch) {
    return `Flat â‚¹${flatMatch[1]} off`;
  }

  // Fallback â€” show deal text as-is
  return deal;
}

// â”€â”€ Scheme Type Parser â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function parseSchemeType(deal) {
  if (!deal) return null;
  const d = deal.trim();
  // 100+30 Free / 10+2 Free
  if (/\d+\s*\+\s*\d+\s*(free|bonus)/i.test(d)) {
    const m = d.match(/(\d+)\s*\+\s*(\d+)/);
    return { type:"free", icon:"ðŸŽ", label:"FREE with Order",
      short: `${m[1]}+${m[2]} Free`,
      css:"sh-type-free" };
  }
  // Buy X Get Y / Buy 10 Get 2
  if (/buy\s*\d+\s*get\s*\d+/i.test(d)) {
    const m = d.match(/buy\s*(\d+)\s*get\s*(\d+)/i);
    return { type:"buy", icon:"ðŸ›ï¸", label:"Buy-Get Offer",
      short: `Buy ${m[1]} Get ${m[2]} Free`,
      css:"sh-type-buy" };
  }
  // PTR 15% / PTR15
  if (/ptr\s*[\d.]+\s*%?/i.test(d)) {
    const m = d.match(/([\d.]+)/);
    return { type:"ptr", icon:"ðŸ’°", label:"PTR Scheme",
      short: `PTR ${m[1]}%`,
      css:"sh-type-ptr" };
  }
  // 20% Scheme / 15% off / Extra 10%
  if (/([\d.]+)\s*%/i.test(d)) {
    const m = d.match(/([\d.]+)\s*%/);
    return { type:"percent", icon:"ðŸ·ï¸", label:"% Discount",
      short: `${m[1]}% Off`,
      css:"sh-type-percent" };
  }
  // Flat â‚¹X off
  if (/flat\s*â‚¹?\s*[\d.]+/i.test(d)) {
    const m = d.match(/([\d.]+)/);
    return { type:"flat", icon:"âš¡", label:"Flat Discount",
      short: `Flat â‚¹${m[1]} Off`,
      css:"sh-type-flat" };
  }
  // Anything else
  return { type:"other", icon:"âœ¨", label:"Special Offer",
    short: d.length > 22 ? d.slice(0,20)+"â€¦" : d,
    css:"sh-type-other" };
}

function getSchemeHTML(p, compact=true) {
  const deal = getProductScheme(p);
  if (!deal) return "";
  const s = parseSchemeType(deal);
  if (!s) return "";
  if (compact) {
    return `<div class="scheme-highlight-bar ${s.css}">
      <span class="sh-icon">${s.icon}</span>
      <span class="sh-text">${s.short}</span>
    </div>`;
  }
  const bgMap = {
    free:"linear-gradient(90deg,#dcfce7,#bbf7d0)",
    buy:"linear-gradient(90deg,#f3e8ff,#e9d5ff)",
    ptr:"linear-gradient(90deg,#dbeafe,#bfdbfe)",
    percent:"linear-gradient(90deg,#fef3c7,#fde68a)",
    flat:"linear-gradient(90deg,#fee2e2,#fecaca)"
  };
  const bg = bgMap[s.type] || "linear-gradient(90deg,#f1f5f9,#e2e8f0)";
  return `<div class="detail-scheme-banner" style="background:${bg}">
    <div class="dsb-icon">${s.icon}</div>
    <div>
      <div class="dsb-label">${s.label}</div>
      <div class="dsb-value">${deal}</div>
    </div>
  </div>`;
}

let _schemesOnlyFilter = false;

function getProductScheme(p) {
  if (!p) return null;
  // âš¡ Improvement 1 â€” O(1) index lookup instead of O(N) .find() on every call
  const s = _schemeForProduct(p);
  return s ? s.deal : (p.scheme || null);
}
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const DEFAULT_SCHEMES = [
  {id:1, med:"VERMISOL 50", company:"Khandelwal Labs", deal:"100+30 Free", validity:""},
  {id:2, med:"CLAVAM 625", company:"Alkem Labs", deal:"10+1 Free", validity:""},
  {id:3, med:"MONTAIR LC", company:"Cipla Limited", deal:"5% Extra Discount", validity:""},
  {id:4, med:"AZITHRAL 500MG", company:"Alembic", deal:"Buy 5 Get 1 Free", validity:""},
  {id:5, med:"FLAGYL 400", company:"Abbott Healthcare", deal:"20+5 Free", validity:""},
];

let schemes = [];

function loadSchemes() {
  try {
    const s = localStorage.getItem("ja_schemes");
    schemes = s ? JSON.parse(s) : JSON.parse(JSON.stringify(DEFAULT_SCHEMES));
  } catch { schemes = JSON.parse(JSON.stringify(DEFAULT_SCHEMES)); }
  _buildSchemeIndex(); // âš¡ build index immediately after load
}

function saveSchemes() {
  try { localStorage.setItem("ja_schemes", JSON.stringify(schemes)); } catch {}
  // âš¡ Improvement 3 â€” single batch write instead of N individual writes
  if (window._fb && window._fb.FB_OK) {
    window._fb.saveSchemesBatch(schemes);
  }
  // Rebuild index whenever schemes change
  _buildSchemeIndex();
}

// â”€â”€â”€ Improvement 1: Scheme lookup index â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Built once, O(1) lookup instead of O(N) find() on every product render
let _schemeIndex = {}; // UPPERCASE_MED_NAME â†’ scheme object
let _productByName = {}; // UPPERCASE_NAME â†’ product (built alongside scheme index)

function _buildSchemeIndex() {
  _schemeIndex = {};
  const allSchemes = [...DEFAULT_SCHEMES, ...schemes.filter(s => !DEFAULT_SCHEMES.find(d => d.id === s.id))];
  allSchemes.forEach(s => {
    if (s.med) _schemeIndex[s.med.toUpperCase()] = s;
  });
  // Fix 5: Also rebuild product name map for O(1) lookup in schemeCardClick
  _productByName = {};
  products.forEach(p => { if (p.name) _productByName[p.name.toUpperCase()] = p; });
}

// Fast O(1) lookup â€” checks exact key first, then partial match fallback
function _schemeForProduct(p) {
  if (!p) return null;
  const name = p.name.toUpperCase();
  // 1. Exact match
  if (_schemeIndex[name]) return _schemeIndex[name];
  // 2. Partial match â€” check if any scheme med is contained in product name
  for (const key of Object.keys(_schemeIndex)) {
    if (name.includes(key)) return _schemeIndex[key];
  }
  return null;
}

function navTo(view, btn) {
  showView(view);
  document.querySelectorAll(".nav-btn").forEach(b => {
    b.classList.remove("active-tab");
    b.querySelectorAll(".nav-label").forEach(l => l.classList.remove("active"));
  });
  if (btn) {
    btn.classList.add("active-tab");
    const lbl = btn.querySelector(".nav-label");
    if (lbl) lbl.classList.add("active");
  }
}
function updateSchemeTicker() {
  const inner = document.getElementById("schemeTickerInner");
  if (!inner) return;
  if (!schemes.length) {
    inner.innerHTML = '<div class="scheme-ticker-item">No active deals right now</div>';
    return;
  }
  // Show up to 3 scheme names in ticker â€” duplicate only if enough items for loop to make sense
  const items = schemes.slice(0,3).map(s =>
    `<div class="scheme-ticker-item">ðŸŽ ${s.med} â€” ${s.deal}</div>`
  ).join("") + (schemes.length > 3
    ? schemes.slice(0,3).map(s => `<div class="scheme-ticker-item">ðŸŽ ${s.med} â€” ${s.deal}</div>`).join("")
    : "");
  inner.innerHTML = items;
}

function renderSchemes() {
  const wrap = document.getElementById("schemeList");

  // Merge DEFAULT_SCHEMES with admin-added schemes (admin overrides default if same id)
  const allSchemes = [...DEFAULT_SCHEMES, ...schemes.filter(s => !DEFAULT_SCHEMES.find(d => d.id === s.id))];

  const section = document.getElementById("schemeSection");
  if (!allSchemes.length) {
    if (section) section.style.display = "none";
    wrap.innerHTML = '';
    return;
  }
  if (section) section.style.display = "";

  const today = new Date().toISOString().slice(0,10);
  wrap.innerHTML = allSchemes.map(s => {
    const isExpired = s.validity && s.validity < today;
    const badgeLabel = isExpired ? "Expired" : "HOT DEAL";
    const validityText = s.validity
      ? (isExpired ? "âš ï¸ Expired" : "â³ Valid till " + formatDate(s.validity))
      : "ðŸŸ¢ Active Now";
    const isCustom = schemes.find(x => x.id === s.id);
    return `
      <div class="scheme-card" onclick="schemeCardClick(${s.id})">
        <span class="scheme-card-badge">${badgeLabel}</span>
        <button class="scheme-admin-del ${isAdmin && isCustom ? 'show' : ''}" onclick="event.stopPropagation();deleteScheme(${s.id})">âœ•</button>
        <div class="scheme-card-name">${s.med}</div>
        <div class="scheme-card-company">${s.company}</div>
        <div class="scheme-card-deal">
          <span class="scheme-deal-icon">ðŸŽ</span>
          <span class="scheme-deal-text">${s.deal}</span>
        </div>
        <div class="scheme-card-validity">${validityText}</div>
      </div>`;
  }).join("");
}

function formatDate(d) {
  const [y,m,day] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${parseInt(day)} ${months[parseInt(m)-1]} ${y}`;
}

function schemeCardClick(id) {
  const s = schemes.find(x => x.id === id) || DEFAULT_SCHEMES.find(x => x.id === id);
  if (!s) return;
  // Fix 2: Block expired schemes
  if (s.validity && s.validity < new Date().toISOString().slice(0,10)) {
    showToast("âš ï¸ Scheme expired", "error");
    return;
  }
  // Fix 1+5: Exact match via O(1) index first, then startsWith fallback
  const med = s.med.toUpperCase();
  const p = _productByName[med]
         || products.find(x => x.name.toUpperCase().startsWith(med));
  if (p) {
    const inCart = cart.some(c => c.id === p.id);
    if (inCart) {
      // Already in cart â€” go to cart
      openCart();
      showToast("Already in order â€” adjust qty in cart");
    } else {
      // Open qty picker directly
      openQtyPicker(p.id);
    }
  } else {
    // Fallback: search for it
    document.getElementById("searchInput").value = s.med;
    document.getElementById("clearBtn").style.display = "block";
    handleSearch();
    showToast("Showing " + s.med);
  }
}

function openSchemeModal(editId) {
  const titleEl = document.getElementById("schemeModalTitle");
  const saveBtn = document.getElementById("schemeSaveBtn");
  document.getElementById("sEditId").value = editId || "";
  if (editId) {
    const s = schemes.find(x => x.id === editId) || DEFAULT_SCHEMES.find(x => x.id === editId);
    if (!s) return;
    document.getElementById("sMedName").value = s.med;
    document.getElementById("sCompany").value = s.company || "";
    document.getElementById("sDeal").value = s.deal;
    document.getElementById("sValidity").value = s.validity || "";
    titleEl.textContent = "âœï¸ Edit Scheme";
    saveBtn.textContent = "ðŸ’¾ Save Changes";
  } else {
    document.getElementById("sMedName").value = "";
    document.getElementById("sCompany").value = "";
    document.getElementById("sDeal").value = "";
    document.getElementById("sValidity").value = "";
    titleEl.textContent = "ðŸ”¥ Add Hot Deal";
    saveBtn.textContent = "ðŸ”¥ Add Deal";
  }
  document.getElementById("schemeModal").classList.add("open");
  setTimeout(() => document.getElementById("sMedName").focus(), 100);
}

function sMedSearch(val) {
  var dd = document.getElementById("sMedDropdown");
  if (!dd) return;
  var q = val.trim().toUpperCase();
  if (!q) { dd.style.display = "none"; return; }

  var starts = [], contains = [];
  for (var i = 0; i < products.length; i++) {
    var n = products[i].name.toUpperCase();
    if (n.startsWith(q)) starts.push(products[i]);
    else if (n.includes(q)) contains.push(products[i]);
    if (starts.length + contains.length >= 15) break;
  }
  var matches = starts.concat(contains).slice(0, 12);
  if (!matches.length) { dd.style.display = "none"; return; }

  var html = "";
  for (var j = 0; j < matches.length; j++) {
    var prod = matches[j];
    var subLine = prod.company
      ? '<div style="font-size:11px;color:#64748B;font-weight:600">' + prod.company + (prod.packing ? " Â· " + prod.packing : "") + "</div>"
      : "";
    html += '<div data-idx="' + j + '" style="padding:10px 14px;cursor:pointer;border-bottom:1px solid #f1f5f9">'
      + '<div style="font-size:13px;font-weight:800;color:var(--text,#0f172a)">' + prod.name + "</div>"
      + subLine + "</div>";
  }
  dd.innerHTML = html;
  dd._matches = matches;
  dd.querySelectorAll("[data-idx]").forEach(function(el) {
    el.addEventListener("click", function() {
      var p = dd._matches[+this.getAttribute("data-idx")];
      document.getElementById("sMedName").value = p.name;
      if (p.company) document.getElementById("sCompany").value = p.company;
      dd.style.display = "none";
    });
  });
  dd.style.display = "block";
}

// Close sMedDropdown on outside click
document.addEventListener("click", function(e) {
  if (!e.target.closest("#sMedName") && !e.target.closest("#sMedDropdown")) {
    var dd = document.getElementById("sMedDropdown");
    if (dd) dd.style.display = "none";
  }
});

function closeSchemeModal() {
  document.getElementById("schemeModal").classList.remove("open");
}

function saveScheme() {
  if (!isAdmin) { showToast("â›” Admin only", "error"); return; }
  const med = document.getElementById("sMedName").value.trim();
  const deal = document.getElementById("sDeal").value.trim();
  if (!med) { showToast("Medicine name required!", "error"); return; }
  if (!deal) { showToast("Scheme/deal required!", "error"); return; }
  const editId = document.getElementById("sEditId").value;
  const schemeData = {
    med,
    company: document.getElementById("sCompany").value.trim(),
    deal,
    validity: document.getElementById("sValidity").value
  };
  if (editId) {
    // Edit existing
    const idx = schemes.findIndex(x => x.id == editId);
    if (idx !== -1) {
      schemes[idx] = { ...schemes[idx], ...schemeData };
    } else {
      // Was a DEFAULT_SCHEME â€” add as custom override (Fix 3: Number() to avoid type mismatch)
      schemes.push({ id: Number(editId), ...schemeData });
    }
    showToast("âœ… Scheme updated!");
  } else {
    schemes.push({ id: Date.now(), ...schemeData });
    showToast("ðŸ”¥ Deal added successfully!");
  }
  saveSchemes();
  closeSchemeModal();
  renderSchemes();
  renderAdminSchemes();
}

function deleteScheme(id) {
  schemes = schemes.filter(s => s.id !== id);
  saveSchemes();
  if (window._fb && window._fb.FB_OK) window._fb.deleteScheme(id);
  renderSchemes();
  showToast("Deal removed");
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CART & ORDER SYSTEM
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
let cart = []; // [{id, name, company, packing, qty}]
const JAIN_WA_NUMBER = "919086291862"; // 91 + 90862-91862

function loadCart() {
  try {
    const c = localStorage.getItem("ja_cart");
    cart = c ? JSON.parse(c) : [];
  } catch { cart = []; }
  updateCartUI();
}

function saveCart() {
  try { localStorage.setItem("ja_cart", JSON.stringify(cart)); } catch {}
}

function updateCartUI() {
  renderRecent();
  const count = cart.length;
  const countEl = document.getElementById("cartCount");
  const fab = document.getElementById("cartFab");
  const pill = document.getElementById("cartPillBar");
  const pillCount = document.getElementById("cartPillCount");
  const pillTotal = document.getElementById("cartPillTotal");

  // Calculate total qty for pill label
  const totalQty = cart.reduce((s, c) => s + c.qty, 0);

  // Update nav cart badge
  var navBadge = document.getElementById("navCartBadge");
  if (navBadge) {
    if (count > 0) {
      navBadge.textContent = totalQty > 99 ? "99+" : totalQty;
      navBadge.style.display = "flex";
    } else {
      navBadge.style.display = "none";
    }
  }

  if (count > 0) {
    // Update old hidden fab for compat
    countEl.textContent = count;
    countEl.classList.add("show");
    // Show pill bar
    if (pill) {
      pill.style.display = "flex";
      pillCount.textContent = `${totalQty} Item's`;
      // Try to show a â‚¹ total if PTR available
      let rupeeTotal = 0;
      cart.forEach(item => {
        const p = products.find(x => x.id === item.id);
        if (p && p.ptr) rupeeTotal += p.ptr * item.qty;
      });
      pillTotal.textContent = rupeeTotal > 0 ? `â‚¹${rupeeTotal.toFixed(2)}` : `${count} product${count !== 1 ? 's' : ''}`;
    }
  } else {
    countEl.classList.remove("show");
    if (pill) pill.style.display = "none";
  }
}

function toggleCart(productId) {
  const existing = cart.findIndex(c => c.id === productId);
  if (existing !== -1) {
    // Already in cart â€” remove it
    cart.splice(existing, 1);
    saveCart();
    updateCartUI();
    updateCardBtn(productId, false);
    showToast("Removed from order");
  } else {
    // Open qty picker
    openQtyPicker(productId);
  }
}

// â”€â”€ Qty Picker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let _qtyPickerProductId = null;

function openQtyPicker(productId) {
  const p = products.find(x => x.id === productId);
  if (!p) return;
  _qtyPickerProductId = productId;

  const isTablet = /tablet|capsule|rotacap/i.test(p.category || "");
  const deal = getProductScheme(p);
  const r = parseSchemeRatio(deal);
  const suggestedQty = r ? r.base : (p.moq > 1 ? p.moq : 1);

  let html = `
    <div style="padding:0 4px 8px">
      <div style="font-size:16px;font-weight:900;color:#1E293B;margin-bottom:2px">${p.name}</div>
      <div style="font-size:12px;color:#64748B;font-weight:600;margin-bottom:${deal ? '10px' : '16px'}">${p.company} Â· ${p.packing}</div>
      ${deal ? `<div style="background:#fef3c7;color:#92400e;font-size:13px;font-weight:800;padding:8px 12px;border-radius:10px;margin-bottom:14px;display:flex;align-items:center;gap:6px;"><span>ðŸŽ</span> Scheme: ${deal}</div>` : ""}
    </div>`;

  if (isTablet) {
    // Box grid for tablets/capsules
    const boxes = [1,2,3,4,5,6,8,10];
    html += `
      <div style="font-size:11px;font-weight:800;color:#64748B;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Quick Select (Boxes)</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">
        ${boxes.map(b => `<button onclick="confirmQtyPicker(${b}, 'box')" style="padding:12px 6px;border-radius:12px;border:1.5px solid #E2E8F0;background:#F8FAFC;font-family:inherit;font-weight:800;font-size:14px;cursor:pointer;color:#1E293B">${b}<br><span style="font-size:9px;font-weight:600;color:#94A3B8">BOX</span></button>`).join("")}
      </div>
      <div style="font-size:11px;font-weight:800;color:#64748B;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Or enter strips</div>`;
  }

  html += `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      <button onclick="adjPickerQty(-1)" style="width:44px;height:44px;border-radius:12px;border:1.5px solid #E2E8F0;background:#F8FAFC;font-size:20px;font-weight:900;color:#00897b;cursor:pointer;font-family:inherit;flex-shrink:0">âˆ’</button>
      <input id="pickerQtyInput" type="number" value="${suggestedQty}" min="1" inputmode="numeric"
        style="flex:1;padding:11px;border-radius:12px;border:2px solid #00897b;font-size:20px;font-weight:900;text-align:center;font-family:inherit;outline:none;color:#1E293B"
        oninput="updatePickerScheme()" />
      <button onclick="adjPickerQty(1)" style="width:44px;height:44px;border-radius:12px;border:1.5px solid #E2E8F0;background:#F8FAFC;font-size:20px;font-weight:900;color:#00897b;cursor:pointer;font-family:inherit;flex-shrink:0">+</button>
    </div>
    <div id="pickerSchemeInfo" style="min-height:28px;margin-bottom:14px;text-align:center"></div>
    <button onclick="confirmQtyPicker(null,'strip')" style="width:100%;padding:15px;border-radius:14px;border:none;background:linear-gradient(135deg,#00897b,#26a69a);color:#fff;font-family:inherit;font-size:15px;font-weight:900;cursor:pointer">Add to Order</button>
    <button onclick="closeQtyPicker()" style="width:100%;margin-top:8px;padding:12px;border-radius:12px;border:2px solid #E2E8F0;background:#fff;font-family:inherit;font-size:14px;font-weight:800;color:#64748B;cursor:pointer">Cancel</button>`;

  document.getElementById("qtyPickerBody").innerHTML = html;
  document.getElementById("qtyPickerModal").style.cssText = "display:flex;";
  setTimeout(() => updatePickerScheme(), 50);
}

function adjPickerQty(delta) {
  const inp = document.getElementById("pickerQtyInput");
  if (!inp) return;
  const v = Math.max(1, (parseInt(inp.value) || 1) + delta);
  inp.value = v;
  updatePickerScheme();
}

function updatePickerScheme() {
  const p = products.find(x => x.id === _qtyPickerProductId);
  if (!p) return;
  const inp = document.getElementById("pickerQtyInput");
  const infoEl = document.getElementById("pickerSchemeInfo");
  if (!inp || !infoEl) return;
  const qty = parseInt(inp.value) || 0;
  const schemeText = calcScheme(getProductScheme(p), qty);
  infoEl.innerHTML = schemeText
    ? `<span style="background:#fef3c7;color:#92400e;font-size:13px;font-weight:800;padding:5px 14px;border-radius:20px">ðŸŽ ${schemeText}</span>`
    : "";
}

function confirmQtyPicker(boxQty, unit) {
  const p = products.find(x => x.id === _qtyPickerProductId);
  if (!p) { closeQtyPicker(); return; }
  let qty, itemUnit;
  if (unit === "box") {
    qty = boxQty;
    itemUnit = "box";
  } else {
    qty = parseInt(document.getElementById("pickerQtyInput")?.value) || 1;
    itemUnit = "strip";
  }
  if (qty < 1) qty = 1;
  const schemeText = calcScheme(getProductScheme(p), qty);
  const existing = cart.find(c => c.id === p.id);
  if (existing) {
    existing.qty = qty;
    existing.unit = itemUnit;
    existing.schemeText = schemeText || "";
  } else {
    cart.push({ id: p.id, name: p.name, company: p.company, packing: p.packing, qty, unit: itemUnit, schemeText: schemeText || "" });
  }
  saveCart();
  updateCartUI();
  updateCardBtn(p.id, true);
  closeQtyPicker();
  showToast(`âœ“ ${p.name.substring(0,20)} added â€” ${qty} ${itemUnit === "box" ? (qty===1?"box":"boxes") : "strips"}${schemeText ? " Â· " + schemeText : ""}`);
  const fab = document.getElementById("cartFab");
  fab.classList.add("has-items");
  setTimeout(() => fab.classList.remove("has-items"), 500);
  // Refresh scheme view if open
  if (document.getElementById("scheme-view")?.style.display !== "none") renderSchemeView();
}

function closeQtyPicker() {
  document.getElementById("qtyPickerModal").style.display = "none";
  _qtyPickerProductId = null;
}

function updateCardBtn(id, inCart) {
  // In product list
  const wrap = document.getElementById("pcw_" + id);
  if (wrap) {
    const btn = wrap.querySelector(".add-cart-btn");
    if (btn) {
      btn.className = "add-cart-btn" + (inCart ? " in-cart" : "");
      btn.innerHTML = inCart ? "âœ“ Added" : "+ Cart";
    }
  }
  // In detail view
  if (typeof currentDetailId !== "undefined" && currentDetailId === id) {
    const db = document.getElementById("detailCartBtn");
    if (db) {
      db.textContent = inCart ? "âœ“ In Cart â€” Remove" : "+ Add to Cart";
      db.style.background = inCart ? "#00897b" : "#fff";
      db.style.color = inCart ? "#fff" : "#00897b";
    }
  }
}

function toggleCartFromDetail() {
  if (!currentDetailId) return;
  toggleCart(currentDetailId);
  // refresh detail button
  const inCart = cart.some(c => c.id === currentDetailId);
  const btn = document.getElementById("detailCartBtn");
  btn.textContent = inCart ? "âœ“ In Cart â€” Remove" : "+ Add to Cart";
  btn.style.background = inCart ? "#00897b" : "#fff";
  btn.style.color = inCart ? "#fff" : "#00897b";
}

function openCart() {
  updateReorderBanner();
  renderCartItems();
  document.getElementById("cart-view").classList.add("show");
  var nav = document.getElementById("mainBottomNav");
  if (nav) nav.style.display = "none";
  var fabs = document.getElementById("fabStack");
  if (fabs) fabs.style.display = "none";
  window.scrollTo(0,0);
}

function closeCart() {
  document.getElementById("cart-view").classList.remove("show");
  var nav = document.getElementById("mainBottomNav");
  if (nav) nav.style.display = "";
  var fabs = document.getElementById("fabStack");
  if (fabs) fabs.style.display = "";
  if (typeof positionFabStack === 'function') positionFabStack();
}

function clearCart() {
  if (!cart.length) return;
  cart = [];
  saveCart();
  updateCartUI();
  renderCartItems();
  renderProductList();
  showToast("Order cleared");
}

function renderCartItems() {
  updateReorderBanner();
  const wrap = document.getElementById("cartItems");
  const totalItemsEl = document.getElementById("cartTotalItems");
  const totalQtyEl = document.getElementById("cartTotalQty");
  const subtitleEl = document.getElementById("cartSubtitle");

  const totalQty = cart.reduce((s, c) => s + c.qty, 0);
  const boxItems = cart.filter(c => c.unit === "box").reduce((s, c) => s + c.qty, 0);
  const stripItems = totalQty - boxItems;
  let totalLabel = "";
  if (boxItems > 0 && stripItems > 0) totalLabel = `${stripItems} strips + ${boxItems} boxes`;
  else if (boxItems > 0) totalLabel = `${boxItems} ${boxItems === 1 ? "box" : "boxes"}`;
  else totalLabel = `${totalQty} strips`;
  subtitleEl.textContent = `${cart.length} item${cart.length !== 1 ? "s" : ""} Â· ${totalLabel}`;
  totalItemsEl.textContent = `${cart.length} item${cart.length !== 1 ? "s" : ""}`;
  totalQtyEl.textContent = totalLabel;

  if (!cart.length) {
    wrap.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">ðŸ›’</div>
        <div class="cart-empty-title">Order is empty</div>
        <div class="cart-empty-sub">Go back and tap "+ Cart" on any medicine</div>
      </div>`;
    return;
  }

  wrap.innerHTML = cart.map((item, idx) => {
    const p = products.find(x => x.id === item.id);
    const isBox = item.unit === "box";
    const unitLabel = isBox ? (item.qty === 1 ? "Box" : "Boxes") : "strips";
    const schemeText = (!isBox && p) ? calcScheme(getProductScheme(p), item.qty) : null;
    return `
    <div class="cart-item-card" id="cartItem_${item.id}">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">${item.company} Â· ${item.packing}</div>
        ${schemeText ? `<div style="margin-top:4px;display:inline-block;background:#fef3c7;color:#92400e;font-size:11px;font-weight:800;padding:2px 8px;border-radius:20px;">ðŸŽ ${schemeText}</div>` : ""}
      </div>
      <div class="qty-stepper">
        <button class="qty-btn" onclick="changeQty(${item.id}, -1)">âˆ’</button>
        <span class="qty-val" id="qty_${item.id}">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
      </div>
      <button class="cart-item-remove" onclick="removeCartItem(${item.id})">ðŸ—‘ï¸</button>
    </div>`;
  }).join("");
}

function changeQty(productId, delta) {
  const item = cart.find(c => c.id === productId);
  if (!item) return;
  const p   = products.find(x => x.id === productId);
  const moq = (p?.moq > 1) ? p.moq : 1;
  const newQty = item.qty + delta;
  if (newQty < moq) {
    if (moq > 1) showToast(`Minimum order is ${moq} strips`, "error");
    return;
  }
  item.qty = newQty;
  saveCart();
  // update qty display without full re-render
  const qtyEl = document.getElementById("qty_" + productId);
  if (qtyEl) qtyEl.textContent = item.qty;
  // update scheme badge live
  const cardEl = document.getElementById("cartItem_" + productId);
  if (cardEl && p && item.unit !== "box") {
    const schemeText = calcScheme(getProductScheme(p), item.qty);
    let badgeEl = cardEl.querySelector(".cart-scheme-badge");
    if (schemeText) {
      if (!badgeEl) {
        badgeEl = document.createElement("div");
        badgeEl.className = "cart-scheme-badge";
        badgeEl.style.cssText = "margin-top:4px;display:inline-block;background:#fef3c7;color:#92400e;font-size:11px;font-weight:800;padding:2px 8px;border-radius:20px;";
        cardEl.querySelector(".cart-item-info").appendChild(badgeEl);
      }
      badgeEl.textContent = "ðŸŽ " + schemeText;
    } else if (badgeEl) {
      badgeEl.remove();
    }
  }
  // update totals
  const totalQty = cart.reduce((s, c) => s + c.qty, 0);
  const boxItems = cart.filter(c => c.unit === "box").reduce((s, c) => s + c.qty, 0);
  const stripItems = totalQty - boxItems;
  let totalLabel = "";
  if (boxItems > 0 && stripItems > 0) totalLabel = `${stripItems} strips + ${boxItems} boxes`;
  else if (boxItems > 0) totalLabel = `${boxItems} ${boxItems === 1 ? "box" : "boxes"}`;
  else totalLabel = `${totalQty} strips`;
  document.getElementById("cartTotalQty").textContent = totalLabel;
  document.getElementById("cartSubtitle").textContent = `${cart.length} item${cart.length !== 1 ? "s" : ""} Â· ${totalLabel}`;
  // Update pill bar too
  const pill = document.getElementById("cartPillBar");
  const pillCount = document.getElementById("cartPillCount");
  const pillTotal = document.getElementById("cartPillTotal");
  if (pill && pillCount) {
    pillCount.textContent = `${totalQty} Item's`;
    let rupeeTotal = 0;
    cart.forEach(item => {
      const p = products.find(x => x.id === item.id);
      if (p && p.ptr) rupeeTotal += p.ptr * item.qty;
    });
    if (pillTotal) pillTotal.textContent = rupeeTotal > 0 ? `â‚¹${rupeeTotal.toFixed(2)}` : `${cart.length} product${cart.length !== 1 ? 's' : ''}`;
  }
}

function removeCartItem(productId) {
  cart = cart.filter(c => c.id !== productId);
  saveCart();
  updateCartUI();
  renderCartItems();
  renderProductList();
}

// â”€â”€â”€ ORDER SENDING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function openOrderOptions() {
  if (!cart.length) { showToast("Add items to your order first!", "error"); return; }
  document.getElementById("orderOptionsOverlay").classList.add("open");
}

function closeOrderOptions() {
  document.getElementById("orderOptionsOverlay").classList.remove("open");
}

function getRetailerName() {
  return document.getElementById("retailerName").value.trim() || "Retailer";
}

function buildOrderText() {
  const info    = getRetailerInfo();
  const store   = info.store || getRetailerName() || "Retailer";
  const mobile  = info.mobile || "";
  const address = info.address || info.city || "";
  const date    = new Date().toLocaleString("en-IN", {day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit"});

  const itemLines = cart.map((item, i) => {
    const p      = products.find(x => x.id === item.id);
    const isBox  = item.unit === "box";
    const qty    = isBox ? `${item.qty} Box` : `${item.qty}`;
    const scheme = (!isBox && p) ? calcScheme(getProductScheme(p), item.qty) : null;
    const schStr = scheme ? ` *(${scheme})*` : "";
    return `${i + 1}. *${item.name}* | ${item.packing || ""} | Qty: ${qty}${schStr}`;
  }).join("\n");

  const totalQty = cart.reduce((s, c) => s + c.qty, 0);
  const addrPart = address ? ` | Addr: ${address}` : "";
  const srPart = (srMode && currentSR && srActiveShop)
    ? `\nðŸ§‘â€ðŸ’¼ SR: ${currentSR.name} (${currentSR.code}) â€” ordering for *${srActiveShop}*`
    : "";

  const noteEl = document.getElementById("cartOrderNote");
  const notePart = noteEl && noteEl.value.trim() ? `\n\nðŸ“ *Note:* ${noteEl.value.trim()}` : "";
  return `================================\n  JAIN AGENCIES - RAJNANDGAON\n================================\n*${store}*\nMo: ${mobile}${addrPart}\nDate: ${date}${srPart}\n\n*NEW ORDER*\n--------------------------------\n${itemLines}\n--------------------------------\nItems: ${cart.length} | Total Qty: ${totalQty}${notePart}\nPlease confirm this order!`;
}

function sendWhatsApp() {
  if (!cart.length) return;
  const text = buildOrderText();
  const encoded = encodeURIComponent(text);
  const url = `https://wa.me/${JAIN_WA_NUMBER}?text=${encoded}`;
  // Save WA order to history too
  const waOrder = {
    id: "WA" + Date.now(),
    retailer: getRetailerName(),
    items: JSON.parse(JSON.stringify(cart)),
    totalQty: cart.reduce((s,c)=>s+c.qty,0),
    timestamp: new Date().toLocaleString("en-IN"),
    status: "WhatsApp Sent",
    ...(srMode && currentSR ? { srCode: currentSR.code, srName: currentSR.name, srShop: srActiveShop || "" } : {})
  };
  fbSaveOrder(waOrder).catch(()=>{});
  recordOrderHistory(JSON.parse(JSON.stringify(cart)));
  closeOrderOptions();
  window.open(url, "_blank");
  // Clear cart after WA order
  cart = [];
  saveCart();
  updateCartUI();
  // Show success after short delay
  setTimeout(() => {
    showOrderSuccess(
      "ðŸ’¬",
      "WhatsApp Opened!",
      "Your order has been prepared.\nSend the message to complete the order."
    );
  }, 500);
}

function sendDirectOrder() {
  if (!cart.length) return;
  const name = getRetailerName();
  const noteEl = document.getElementById("cartOrderNote");
  const orderNote = noteEl ? noteEl.value.trim() : "";
  const orderData = {
    id: "ORD" + Date.now(),
    retailer: name,
    items: JSON.parse(JSON.stringify(cart)),
    totalQty: cart.reduce((s,c)=>s+c.qty,0),
    timestamp: new Date().toLocaleString("en-IN"),
    status: "Pending",
    ...(orderNote ? { note: orderNote } : {}),
    ...(srMode && currentSR ? { srCode: currentSR.code, srName: currentSR.name, srShop: srActiveShop || "" } : {})
  };
  fbSaveOrder(orderData).catch(()=>{});
  recordOrderHistory(JSON.parse(JSON.stringify(cart)));
  closeOrderOptions();
  showOrderSuccess(
    "âœ…",
    "Order Placed!",
    `Order #${orderData.id}\nRecorded for ${name}\n${orderData.items.length} items Â· ${orderData.totalQty} strips\n\nJain Agencies will confirm shortly.`
  );
  // Clear cart after direct order
  cart = [];
  saveCart();
  updateCartUI();
}

function showOrderSuccess(icon, title, sub) {
  document.getElementById("successIcon").textContent = icon;
  document.getElementById("successTitle").textContent = title;
  document.getElementById("successSub").textContent = sub;
  document.getElementById("orderSuccessOverlay").classList.add("open");
}

function closeOrderSuccess() {
  document.getElementById("orderSuccessOverlay").classList.remove("open");
  renderCartItems();
  renderProductList();
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// REORDER LAST ORDER SYSTEM
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function getOrders() {
  try { return JSON.parse(localStorage.getItem("ja_orders") || "[]"); } catch { return []; }
}

function getLastOrder() {
  const orders = getOrders();
  return orders.length ? orders[0] : null;
}

function updateReorderBanner() {
  const banner = document.getElementById("reorderBanner");
  const last = getLastOrder();
  if (!last || cart.length > 0) {
    // Hide banner if cart has items or no history
    banner.classList.remove("show");
    return;
  }
  banner.classList.add("show");
  document.getElementById("reorderName").textContent = last.retailer || "Your Shop";
  document.getElementById("reorderMeta").textContent =
    `${last.items.length} items Â· ${last.totalQty} strips Â· ${last.timestamp}`;
}

function reorderLast() {
  const last = getLastOrder();
  if (!last) { showToast("No previous orders found", "error"); return; }

  // Load last order items into cart
  cart = last.items.map(item => ({ ...item }));

  // Set retailer name if blank
  const nameInput = document.getElementById("retailerName");
  if (!nameInput.value.trim()) nameInput.value = last.retailer || "";

  saveCart();
  updateCartUI();
  updateReorderBanner();
  renderCartItems();

  showToast("â†º Last order reloaded!");

  // Bounce FAB
  const fab = document.getElementById("cartFab");
  fab.classList.add("has-items");
  setTimeout(() => fab.classList.remove("has-items"), 500);
}

function openHistory() {
  renderHistoryList();
  document.getElementById("historyOverlay").classList.add("open");
}

function closeHistory() {
  document.getElementById("historyOverlay").classList.remove("open");
}

function renderHistoryList() {
  const orders = getOrders();
  const wrap = document.getElementById("historyList");

  if (!orders.length) {
    wrap.innerHTML = `
      <div class="history-empty">
        <div class="history-empty-icon">ðŸ“‹</div>
        <div class="history-empty-text">No order history yet.<br>Place your first order!</div>
      </div>`;
    return;
  }

  wrap.innerHTML = orders.map(order => {
    // Show up to 3 items, then "+ N more"
    const shown = order.items.slice(0, 3);
    const extra = order.items.length - 3;
    const itemsHtml = shown.map(i =>
      `<div class="history-item-row">
        <span class="history-item-name">${i.name}</span>
        <span class="history-item-qty">Ã—${i.qty}</span>
      </div>`
    ).join("") + (extra > 0
      ? `<div style="font-size:11px;color:#94A3B8;font-weight:700;padding:5px 0">+ ${extra} more item${extra>1?"s":""}</div>`
      : "");

    return `
      <div class="history-order-card">
        <div class="history-order-head">
          <div>
            <div class="history-order-id">${order.id}</div>
            <div class="history-order-retailer">ðŸª ${order.retailer}</div>
          </div>
          <div>
            <div class="history-order-time">${order.timestamp}</div>
            <div class="history-order-meta">${order.items.length} items Â· ${order.totalQty} strips</div>
          </div>
        </div>
        <div class="history-order-items">${itemsHtml}</div>
        <div class="history-order-foot">
          <button class="history-reorder-btn" onclick="reorderFromHistory('${order.id}')">
            â†º Reorder This
          </button>
          <div class="history-status-badge">â³ ${order.status || "Pending"}</div>
        </div>
      </div>`;
  }).join("");
}

function reorderFromHistory(orderId) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  cart = order.items.map(item => ({ ...item }));
  const nameInput = document.getElementById("retailerName");
  if (!nameInput.value.trim()) nameInput.value = order.retailer || "";

  saveCart();
  updateCartUI();
  updateReorderBanner();
  renderCartItems();

  closeHistory();
  showToast(`â†º Order from ${order.retailer} reloaded!`);

  const fab = document.getElementById("cartFab");
  fab.classList.add("has-items");
  setTimeout(() => fab.classList.remove("has-items"), 500);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// STOCK ALERT SYSTEM
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

let watchList = [];      // product ids being watched
let stockAlerts = [];    // past alert notifications
let activeNotifTab = "alerts";
let pushTimeoutId = null;
let pendingPushProductId = null;

function loadStockAlerts() {
  try {
    watchList = JSON.parse(localStorage.getItem("ja_watchlist") || "[]");
    stockAlerts = JSON.parse(localStorage.getItem("ja_stock_alerts") || "[]");
  } catch { watchList = []; stockAlerts = []; }
  updateBellDot();
}

// â”€â”€ FCM PUSH NOTIFICATIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Add a push notification into the in-app notification centre
function addInAppNotification(title, body, type) {
  const alert = {
    id: Date.now(),
    productName: title,
    company: type === "push" ? "Push Notification" : "",
    packing: body,
    time: new Date().toLocaleString("en-IN", {hour:"2-digit",minute:"2-digit",hour12:true}),
    unread: true,
    isPush: true
  };
  stockAlerts.unshift(alert);
  saveStockAlerts();
  updateBellDot();
  // Also show the floating push notification card
  showPushNotifCard(title, body);
}

// Show the existing floating push notif UI card
function showPushNotifCard(title, body) {
  const card = document.getElementById("stockPushNotif");
  if (!card) return;
  const titleEl = card.querySelector(".stock-push-title");
  const subEl   = card.querySelector(".stock-push-sub");
  if (titleEl) titleEl.textContent = title;
  if (subEl)   subEl.textContent   = body;
  card.classList.add("show");
  clearTimeout(window._pushCardTimer);
  window._pushCardTimer = setTimeout(() => card.classList.remove("show"), 6000);
}

// Request push permission and save token to Firestore
async function initFCMForRetailer(retailerId) {
  if (!window._fb || !window._fb.FB_OK) return;
  if (!("Notification" in window)) return;
  if (Notification.permission === "denied") return;
  // Don't re-request if already granted and token saved recently
  const lastReq = localStorage.getItem("ja_fcm_req");
  if (lastReq && (Date.now() - +lastReq) < 7 * 24 * 60 * 60 * 1000) return;
  // Small delay so it doesn't pop immediately on load
  setTimeout(async () => {
    const token = await window._fb.requestPushPermission(retailerId);
    if (token) {
      localStorage.setItem("ja_fcm_token", token);
      localStorage.setItem("ja_fcm_req", String(Date.now()));
      console.log("ðŸ”” Push notifications enabled");
    }
  }, 3000);
}

// Called when a retailer logs in / session is restored
function onRetailerSessionReady(retailer) {
  if (retailer && retailer.id && retailer.status === "approved") {
    initFCMForRetailer(retailer.id);
  }
}

function saveStockAlerts() {
  try {
    localStorage.setItem("ja_watchlist", JSON.stringify(watchList));
    localStorage.setItem("ja_stock_alerts", JSON.stringify(stockAlerts.slice(0, 30)));
  } catch {}
}

function isWatching(productId) {
  return watchList.includes(productId);
}

function toggleWatch(productId) {
  if (isWatching(productId)) {
    watchList = watchList.filter(id => id !== productId);
    showToast("Removed from watchlist");
  } else {
    const p = products.find(x => x.id === productId);
    if (!p) return;
    watchList.push(productId);
    showToast("ðŸ”” You'll be notified when back in stock!");
  }
  saveStockAlerts();
  renderProductList();
}

function toggleWatchFromDetail() {
  if (!currentDetailId) return;
  toggleWatch(currentDetailId);
  // Refresh detail button
  const p = products.find(x => x.id === currentDetailId);
  if (!p) return;
  const btn = document.getElementById("detailNotifyBtn");
  const watching = isWatching(currentDetailId);
  btn.textContent = watching ? "ðŸ”” Watching â€” Unwatch" : "ðŸ”” Notify Me When In Stock";
  btn.style.background = watching ? "#fff7ed" : "#fff";
}

// Called when a product is marked back in stock
function fireStockAlert(product) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const alert = {
    id: Date.now(),
    productId: product.id,
    productName: product.name,
    company: product.company,
    packing: product.packing,
    time: now.toLocaleString("en-IN"),
    timeShort: timeStr,
    unread: true
  };

  stockAlerts.unshift(alert);

  // Remove from watchlist (notified!)
  const wasWatching = isWatching(product.id);
  watchList = watchList.filter(id => id !== product.id);

  saveStockAlerts();
  updateBellDot();

  // Always show push notif when stock is restored (visible to admin + watchers)
  showPushNotif(product, timeStr);

  renderProductList();
}

// â”€â”€â”€ PUSH NOTIFICATION BANNER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function showPushNotif(product, timeStr) {
  pendingPushProductId = product.id;
  document.getElementById("pushTitle").textContent = product.name + " is back in stock! ðŸŽ‰";
  document.getElementById("pushSub").textContent =
    `${product.company} Â· ${product.packing} Â· Available now`;
  document.getElementById("pushTime").textContent = timeStr || "just now";

  const notif = document.getElementById("stockPushNotif");
  notif.classList.add("show");

  // Auto-dismiss after 6 seconds
  clearTimeout(pushTimeoutId);
  pushTimeoutId = setTimeout(closePushNotif, 6000);
}

function closePushNotif() {
  document.getElementById("stockPushNotif").classList.remove("show");
  clearTimeout(pushTimeoutId);
}

function pushAddToCart() {
  if (pendingPushProductId) {
    const p = products.find(x => x.id === pendingPushProductId);
    if (p && p.stock) {
      toggleCart(pendingPushProductId);
    }
  }
  closePushNotif();
}

// â”€â”€â”€ BELL DOT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function updateBellDot() {
  const unread = stockAlerts.filter(a => a.unread).length;
  const dot = document.getElementById("bellDot");
  if (unread > 0) dot.classList.add("show");
  else dot.classList.remove("show");
}

// â”€â”€â”€ NOTIFICATION CENTRE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function openNotifCentre() {
  stockAlerts.forEach(a => a.unread = false);
  saveStockAlerts();
  updateBellDot();
  switchNotifTab(activeNotifTab);
  const el = document.getElementById("notifCentreOverlay");
  el.style.display = "flex";
}

function closeNotifCentre() {
  document.getElementById("notifCentreOverlay").style.display = "none";
}

function switchNotifTab(tab) {
  activeNotifTab = tab;
  document.getElementById("tabAlerts").classList.toggle("active", tab === "alerts");
  document.getElementById("tabWatching").classList.toggle("active", tab === "watching");
  renderNotifCentre();
}

function renderNotifCentre() {
  const wrap = document.getElementById("notifCentreList");

  if (activeNotifTab === "alerts") {
    if (!stockAlerts.length) {
      wrap.innerHTML = `
        <div class="notif-empty">
          <div class="notif-empty-icon">ðŸ””</div>
          <div class="notif-empty-text">No stock alerts yet.<br>Watch out-of-stock items<br>to get notified!</div>
        </div>`;
      return;
    }
    wrap.innerHTML = stockAlerts.map(a => `
      <div class="notif-item-card ${a.unread ? "unread" : ""}">
        ${a.unread ? '<div class="notif-unread-dot"></div>' : '<div style="width:8px;flex-shrink:0"></div>'}
        <div class="notif-item-icon">âœ…</div>
        <div class="notif-item-text">
          <div class="notif-item-title">${a.productName} is back in stock!</div>
          <div class="notif-item-sub">${a.company} Â· ${a.packing}</div>
          <div class="notif-item-time">ðŸ• ${a.time}</div>
        </div>
        <button class="notif-item-remove" onclick="removeAlert(${a.id})">âœ•</button>
      </div>`).join("");

  } else {
    // Watching tab
    const watched = watchList.map(id => products.find(p => p.id === id)).filter(Boolean);
    if (!watched.length) {
      wrap.innerHTML = `
        <div class="notif-empty">
          <div class="notif-empty-icon">ðŸ‘ï¸</div>
          <div class="notif-empty-text">Not watching any products.<br>Tap ðŸ”” Notify Me on<br>out-of-stock items!</div>
        </div>`;
      return;
    }
    wrap.innerHTML = watched.map(p => `
      <div class="notif-watching-card">
        <span class="notif-watching-icon">ðŸ’Š</span>
        <div style="flex:1;min-width:0">
          <div class="notif-watching-name">${p.name}</div>
          <div class="notif-watching-company">${p.company}</div>
        </div>
        <button class="notif-unwatch-btn" onclick="removeWatch(${p.id})">âœ• Unwatch</button>
      </div>`).join("");
  }
}

function removeAlert(alertId) {
  stockAlerts = stockAlerts.filter(a => a.id !== alertId);
  saveStockAlerts();
  renderNotifCentre();
}

function removeWatch(productId) {
  watchList = watchList.filter(id => id !== productId);
  saveStockAlerts();
  renderNotifCentre();
  renderProductList();
  showToast("Removed from watchlist");
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// RETAILER VERIFICATION & AUTH SYSTEM
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

let currentRetailer = null;   // logged-in retailer object
let dlUploaded = false;
let gstUploaded = false;

// â”€â”€â”€ Storage helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getRetailers() {
  try { return JSON.parse(localStorage.getItem("ja_retailers") || "[]"); } catch { return []; }
}
function saveRetailers(list) {
  try { localStorage.setItem("ja_retailers", JSON.stringify(list)); } catch {}
  // Firebase sync â€” write each changed retailer
  if (window._fb && window._fb.FB_OK) {
    list.forEach(r => window._fb.saveRetailer(r));
  }
}
function getRetailerSession() {
  try { return JSON.parse(localStorage.getItem("ja_retailer_session") || "null"); } catch { return null; }
}
function saveRetailerSession(r) {
  try { localStorage.setItem("ja_retailer_session", r ? JSON.stringify(r) : "null"); } catch {}
  // Trigger push permission request when a valid approved retailer logs in
  if (r && r.status === "approved" && typeof onRetailerSessionReady === "function") {
    onRetailerSessionReady(r);
  }
}

// â”€â”€â”€ Boot: check if retailer is already logged in â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function checkRetailerAuth() {
  // TRIAL MODE: no login required â€” always allow access
  document.getElementById("retailer-gate").style.display = "none";
  return true;
}

// â”€â”€â”€ Gate tab switcher â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function switchGateTab(tab) {
  document.getElementById("gateTabLogin").classList.toggle("active", tab === "login");
  document.getElementById("gateTabRegister").classList.toggle("active", tab === "register");
  document.getElementById("gatePanelLogin").style.display = tab === "login" ? "block" : "none";
  document.getElementById("gatePanelRegister").style.display = tab === "register" ? "block" : "none";
  document.getElementById("gatePendingScreen").classList.remove("show");
}

function showGateLoginPanel() {
  document.getElementById("gatePanelLogin").style.display = "block";
  document.getElementById("gatePanelRegister").style.display = "none";
  document.getElementById("gatePendingScreen").classList.remove("show");
  document.getElementById("gateTabLogin").classList.add("active");
  document.getElementById("gateTabRegister").classList.remove("active");
}

// â”€â”€â”€ FILE UPLOAD HANDLER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function handleFileUpload(type, input) {
  const file = input.files[0];
  if (!file) return;
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) { showToast("File too large! Max 5MB", "error"); input.value = ""; return; }
  if (type === "dl") {
    dlUploaded = true;
    document.getElementById("dlFileName").textContent = "âœ“ " + file.name;
    document.getElementById("dlUploadBox").classList.add("uploaded");
    document.getElementById("dlUploadBox").querySelector(".gate-upload-icon").textContent = "âœ…";
  } else {
    gstUploaded = true;
    document.getElementById("gstFileName").textContent = "âœ“ " + file.name;
    document.getElementById("gstUploadBox").classList.add("uploaded");
    document.getElementById("gstUploadBox").querySelector(".gate-upload-icon").textContent = "âœ…";
  }
}

// â”€â”€â”€ REGISTER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function doRetailerRegister() {
  const errEl = document.getElementById("regError");
  errEl.classList.remove("show");

  const name    = document.getElementById("regName").value.trim();
  const mobile  = document.getElementById("regMobile").value.trim();
  const email   = document.getElementById("regEmail").value.trim();
  const pwd     = document.getElementById("regPwd").value;
  const shop    = document.getElementById("regShop").value.trim();
  const addr1   = document.getElementById("regAddr1").value.trim();
  const addr2   = document.getElementById("regAddr2").value.trim();
  const city    = document.getElementById("regCity").value.trim();
  const state   = document.getElementById("regState").value.trim();
  const pin     = document.getElementById("regPin").value.trim();
  const dl      = document.getElementById("regDL").value.trim();
  const gst     = document.getElementById("regGST").value.trim().toUpperCase();
  const consent = document.getElementById("regConsent").checked;

  // No mandatory fields â€” only need a name to identify the retailer
  if (!name) {
    errEl.textContent = "âš ï¸ Please enter your name to continue.";
    errEl.classList.add("show"); return;
  }

  const retailers = getRetailers();
  // Only block duplicate mobile if user actually filled it in
  if (mobile && retailers.find(r => r.mobile === mobile)) {
    errEl.textContent = "âš ï¸ This mobile is already registered â€” please login instead.";
    errEl.classList.add("show"); return;
  }

  const retailer = {
    id: "RET" + Date.now(),
    name, mobile, email, pwd,
    shop,
    address: [addr1, addr2, city, state, pin].filter(Boolean).join(", "),
    city, state, pin,
    dl,
    dlUploaded,
    gst,
    gstUploaded,
    status: "pending",
    submittedAt: new Date().toLocaleString("en-IN"),
    approvedAt: null,
    rejectedAt: null,
    rejectionReason: ""
  };

  retailers.push(retailer);
  // Save locally first (instant)
  try { localStorage.setItem("ja_retailers", JSON.stringify(retailers)); } catch {}
  // Push to Firestore â€” admin sees it immediately on their device
  if (window._fb && window._fb.FB_OK) {
    window._fb.saveRetailer(retailer).then(() => {
      // Signal pending screen to switch to Firebase polling
      window._pendingPoller = "FB";
    });
  } else {
    saveRetailers(retailers); // offline fallback
  }
  saveRetailerSession(retailer);
  currentRetailer = retailer;

  // Trigger bell dot for admin
  try {
    const alerts = JSON.parse(localStorage.getItem("ja_stock_alerts") || "[]");
    alerts.unshift({ id: Date.now(), type: "newRetailer", productName: `New retailer: ${retailer.shop||retailer.name}`, unread: true, time: new Date().toLocaleString("en-IN") });
    localStorage.setItem("ja_stock_alerts", JSON.stringify(alerts.slice(0,30)));
  } catch {}

  showGatePending(retailer);
  showToast("Registration submitted! Awaiting approval.");
}

// â”€â”€â”€ LOGIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function doRetailerLogin() {
  const errEl = document.getElementById("loginError");
  errEl.classList.remove("show");
  const id  = document.getElementById("loginId").value.trim();
  const pwd = document.getElementById("loginPwd").value.trim();

  // â”€â”€ Field validation â”€â”€
  if (!id) {
    errEl.textContent = "âš ï¸ Please enter your mobile number or email.";
    errEl.classList.add("show");
    document.getElementById("loginId").focus();
    return;
  }
  // Basic format check â€” must be 10-digit number or contain @
  const isMobile = /^\d{10}$/.test(id);
  const isEmail  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id);
  if (!isMobile && !isEmail) {
    errEl.textContent = "âš ï¸ Enter a valid 10-digit mobile or email address.";
    errEl.classList.add("show");
    document.getElementById("loginId").focus();
    return;
  }
  if (!pwd) {
    errEl.textContent = "âš ï¸ Please enter your password.";
    errEl.classList.add("show");
    document.getElementById("loginPwd").focus();
    return;
  }

  const retailers = getRetailers();
  const r = retailers.find(x => (x.mobile === id || x.email === id) && x.pwd === pwd);

  if (!r) {
    errEl.textContent = "âŒ Invalid mobile/email or password.";
    errEl.classList.add("show"); return;
  }

  saveRetailerSession(r);
  currentRetailer = r;

  if (r.status === "approved") {
    document.getElementById("retailer-gate").style.display = "none";
    document.getElementById("retailer-gate").classList.remove("show");
    const nameInput = document.getElementById("retailerName");
    if (nameInput && !nameInput.value) nameInput.value = r.shop;
    renderOutstandingBanner();
    showView("search-view");
    showToast("Welcome back, " + r.name.split(" ")[0] + "! ðŸ‘‹");
  } else if (r.status === "rejected") {
    showGateRejected(r);
  } else {
    showGatePending(r);
  }
}

// â”€â”€â”€ LOGOUT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function doRetailerLogout() {
  saveRetailerSession(null);
  currentRetailer = null;
  document.getElementById("retailer-gate").classList.add("show");
  switchGateTab("login");
  document.getElementById("loginId").value = "";
  document.getElementById("loginPwd").value = "";
}

// â”€â”€â”€ PENDING SCREEN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function showGatePending(r) {
  document.getElementById("retailer-gate").classList.add("show");
  document.getElementById("gatePanelLogin").style.display = "none";
  document.getElementById("gatePanelRegister").style.display = "none";
  document.getElementById("gatePendingScreen").classList.add("show");

  document.getElementById("pendingDetailsCard").innerHTML = `
    <div class="gate-pending-row"><span class="gate-pending-key">Name</span><span class="gate-pending-val">${r.name}</span></div>
    <div class="gate-pending-row"><span class="gate-pending-key">Shop</span><span class="gate-pending-val">${r.shop||"â€”"}</span></div>
    <div class="gate-pending-row"><span class="gate-pending-key">Mobile</span><span class="gate-pending-val">${r.mobile||"â€”"}</span></div>
    <div class="gate-pending-row"><span class="gate-pending-key">Submitted</span><span class="gate-pending-val">${r.submittedAt}</span></div>
  `;

  // Auto-poll every 3s â€” dismiss immediately when admin approves
  clearInterval(window._pendingPoller);
  window._pendingPoller = setInterval(() => {
    const list  = getRetailers();
    const fresh = list.find(x => x.id === r.id) ||
                  (r.mobile ? list.find(x => x.mobile === r.mobile) : null);
    if (!fresh) return;
    if (fresh.status === "approved") {
      clearInterval(window._pendingPoller);
      saveRetailerSession(fresh);
      currentRetailer = fresh;
      document.getElementById("retailer-gate").classList.remove("show");
      showToast("âœ… Approved! Welcome to Jain Agencies.");
    } else if (fresh.status === "rejected") {
      clearInterval(window._pendingPoller);
      showGateRejected(fresh);
    }
  }, 3000);
}

function showGateRejected(r) {
  document.getElementById("retailer-gate").classList.add("show");
  document.getElementById("gatePanelLogin").style.display = "none";
  document.getElementById("gatePanelRegister").style.display = "none";
  document.getElementById("gatePendingScreen").classList.add("show");
  document.getElementById("gatePendingScreen").querySelector(".gate-pending-icon").textContent = "âŒ";
  document.getElementById("gatePendingScreen").querySelector(".gate-pending-title").textContent = "Application Rejected";
  document.getElementById("gatePendingScreen").querySelector(".gate-pending-sub").textContent =
    (r.rejectionReason || "Your application was not approved.") + " Please contact Jain Agencies.";
  document.querySelector(".gate-pending-badge").style.background = "rgba(239,68,68,0.2)";
  document.querySelector(".gate-pending-badge").style.borderColor = "rgba(239,68,68,0.4)";
  document.querySelector(".gate-pending-badge").style.color = "#fca5a5";
  document.querySelector(".gate-pending-badge").textContent = "âŒ Application Rejected";
}

// â”€â”€â”€ ADMIN: Retailer Requests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderRetailerRequests() {
  const section = document.getElementById("retailerRequestsSection");
  const listEl = document.getElementById("rrList");
  const badge = document.getElementById("rrPendingBadge");
  if (!isAdmin) { section.style.display = "none"; return; }
  section.style.display = "block";

  const retailers = getRetailers();
  const pending = retailers.filter(r => r.status === "pending").length;
  badge.textContent = pending;
  badge.style.display = pending > 0 ? "inline" : "none";
  const navBadge = document.getElementById("rrNavBadge");
  if (navBadge) { navBadge.textContent = pending; navBadge.style.display = pending > 0 ? "inline" : "none"; }

  if (!retailers.length) {
    listEl.innerHTML = '<div class="rr-empty">No retailer applications yet.</div>';
    return;
  }

  // Sort: pending first, then by date desc
  const sorted = [...retailers].sort((a,b) => {
    const order = {pending:0, approved:1, rejected:2};
    return (order[a.status]||1) - (order[b.status]||1);
  });

  listEl.innerHTML = sorted.map(r => `
    <div class="rr-card">
      <div class="rr-card-head">
        <div>
          <div class="rr-name">ðŸ‘¤ ${r.name}</div>
          <div class="rr-shop">ðŸª ${r.shop}</div>
        </div>
        <span class="rr-status-pill ${r.status}">${
          r.status === "pending" ? "â³ Pending" :
          r.status === "approved" ? "âœ… Approved" : "âŒ Rejected"
        }</span>
      </div>
      <div class="rr-card-body">
        <div class="rr-detail-row"><span class="rr-detail-key">Mobile</span><span class="rr-detail-val">${r.mobile}${r.email ? ' Â· ' + r.email : ''}</span></div>
        <div class="rr-detail-row"><span class="rr-detail-key">Address</span><span class="rr-detail-val">${r.address}</span></div>
        <div class="rr-detail-row"><span class="rr-detail-key">Drug Lic.</span><span class="rr-detail-val">${r.dl}</span></div>
        <div class="rr-detail-row"><span class="rr-detail-key">GST No.</span><span class="rr-detail-val">${r.gst}</span></div>
        <div class="rr-detail-row"><span class="rr-detail-key">Submitted</span><span class="rr-detail-val">${r.submittedAt}</span></div>
        ${r.approvedAt ? `<div class="rr-detail-row"><span class="rr-detail-key">Approved</span><span class="rr-detail-val">${r.approvedAt}</span></div>` : ""}
        <div class="rr-docs">
          <span class="rr-doc-chip ${r.dlUploaded ? 'uploaded' : ''}">ðŸ“‘ Drug License ${r.dlUploaded ? 'âœ“ Uploaded' : 'â€” Not uploaded'}</span>
          <span class="rr-doc-chip ${r.gstUploaded ? 'uploaded' : ''}">ðŸ§¾ GST Cert ${r.gstUploaded ? 'âœ“ Uploaded' : 'â€” Not uploaded'}</span>
        </div>
        
        <div class="rr-b2b-row">
          <div class="rr-b2b-field">
            <div class="rr-b2b-label">ðŸ’¸ Outstanding (â‚¹)</div>
            <input class="rr-b2b-input ${(r.outstanding||0) > 0 ? 'has-balance' : ''}" type="number" min="0" step="0.01"
              value="${r.outstanding || ''}" placeholder="0.00"
              onchange="setRetailerField('${r.id}','outstanding',parseFloat(this.value)||0);this.className='rr-b2b-input'+(this.value>0?' has-balance':'')"
              title="Current outstanding dues for this retailer" />
          </div>
          <div class="rr-b2b-field">
            <div class="rr-b2b-label">ðŸ—ºï¸ Beat / Route</div>
            <input class="rr-b2b-input" type="text" value="${r.beat || ''}" placeholder="e.g. Gandhi Nagar"
              onchange="setRetailerField('${r.id}','beat',this.value.trim())" />
          </div>
          <div class="rr-b2b-field">
            <div class="rr-b2b-label">ðŸ‘¤ Salesman</div>
            <input class="rr-b2b-input" type="text" value="${r.salesman || ''}" placeholder="e.g. Rahul"
              onchange="setRetailerField('${r.id}','salesman',this.value.trim())" />
          </div>
        </div>
      </div>
      <div class="rr-card-foot">
        ${r.status !== "approved" ? `<button class="rr-approve-btn" onclick="approveRetailer('${r.id}')">âœ… Approve</button>` : ""}
        ${r.status !== "rejected" ? `<button class="rr-reject-btn" onclick="rejectRetailer('${r.id}')">âŒ Reject</button>` : ""}
        ${r.status !== "pending" ? `<button class="rr-revoke-btn" onclick="revokeRetailer('${r.id}')">â†© Reset</button>` : ""}
      </div>
    </div>`).join("");
}

// â”€â”€â”€ Set a single field on a retailer (outstanding, beat, salesman) â”€â”€â”€â”€â”€â”€â”€
function setRetailerField(id, field, value) {
  const retailers = getRetailers();
  const r = retailers.find(x => x.id === id);
  if (!r) return;
  r[field] = value;
  try { localStorage.setItem("ja_retailers", JSON.stringify(retailers)); } catch {}
  if (window._fb && window._fb.FB_OK) {
    window._fb.updateRetailer(id, { [field]: value });
  }
  // If the logged-in retailer is viewing their own data, refresh session
  const sess = getRetailerSession();
  if (sess && sess.id === id) { saveRetailerSession(r); renderOutstandingBanner(); }
  showToast(`Retailer ${field} updated`);
}

// â”€â”€â”€ Outstanding banner shown to logged-in retailer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderOutstandingBanner() {
  const sess = getRetailerSession();
  const banner = document.getElementById("outstandingBanner");
  if (!banner) return;
  if (!sess) { banner.style.display = "none"; return; }
  const retailers = getRetailers();
  const r = retailers.find(x => x.id === sess.id);
  const amt = parseFloat(r?.outstanding || 0);
  if (amt > 0) {
    banner.style.display = "flex";
    document.getElementById("outstandingAmt").textContent = `â‚¹${amt.toLocaleString("en-IN")}`;
  } else {
    banner.style.display = "none";
  }
}

function approveRetailer(id) {
  const retailers = getRetailers();
  const r = retailers.find(x => x.id === id);
  if (!r) return;
  r.status = "approved";
  r.approvedAt = new Date().toLocaleString("en-IN");
  // Save locally
  try { localStorage.setItem("ja_retailers", JSON.stringify(retailers)); } catch {}
  // Firebase â€” direct field update (fast, triggers onSnapshot on all devices)
  if (window._fb && window._fb.FB_OK) {
    window._fb.updateRetailer(id, { status: "approved", approvedAt: r.approvedAt });
  } else {
    saveRetailers(retailers); // fallback localStorage-only
  }
  // Update session if same browser
  const session = getRetailerSession();
  if (session && (session.id === id || session.mobile === r.mobile)) {
    saveRetailerSession(r);
  }
  try { localStorage.setItem("ja_approval_ping", id + "_" + Date.now()); } catch {}
  renderRetailerRequests();
  if (typeof renderDashboard === "function") renderDashboard();
  showToast("âœ… Retailer approved â€” " + r.name);
  triggerApprovalWA(r);
}

function rejectRetailer(id) {
  const reason = prompt("Reason for rejection (will be shown to retailer):", "Documents are unclear. Please re-submit.");
  if (reason === null) return;
  const retailers = getRetailers();
  const r = retailers.find(x => x.id === id);
  if (!r) return;
  r.status = "rejected";
  r.rejectedAt = new Date().toLocaleString("en-IN");
  r.rejectionReason = reason || "Application not approved.";
  try { localStorage.setItem("ja_retailers", JSON.stringify(retailers)); } catch {}
  if (window._fb && window._fb.FB_OK) {
    window._fb.updateRetailer(id, { status: "rejected", rejectedAt: r.rejectedAt, rejectionReason: r.rejectionReason });
  } else {
    saveRetailers(retailers);
  }
  renderRetailerRequests();
  showToast("Retailer rejected â€” " + r.name);
}

function revokeRetailer(id) {
  const retailers = getRetailers();
  const r = retailers.find(x => x.id === id);
  if (!r) return;
  r.status = "pending";
  r.approvedAt = null;
  r.rejectedAt = null;
  r.rejectionReason = "";
  saveRetailers(retailers);
  renderRetailerRequests();
  showToast("Reset to pending â€” " + r.name);
}

function showRetailerMenu() {
  if (!currentRetailer) return;
  const choice = confirm(`Logged in as: ${currentRetailer.name}\n${currentRetailer.shop}\n\nClick OK to logout from retailer portal.`);
  if (choice) doRetailerLogout();
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ORDER STATUS TRACKER
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const ORDER_STATUSES = ["Pending","Confirmed","Packed","Dispatched","Delivered"];
const STATUS_EMOJIS  = { Pending:"â³", Confirmed:"âœ…", Packed:"ðŸ“¦", Dispatched:"ðŸšš", Delivered:"ðŸŽ‰", "WhatsApp Sent":"ðŸ’¬" };
const STATUS_CSS     = { Pending:"pending", Confirmed:"confirmed", Packed:"packed", Dispatched:"dispatched", Delivered:"delivered", "WhatsApp Sent":"wa" };

function saveOrders(orders) {
  try { localStorage.setItem("ja_orders", JSON.stringify(orders.slice(0,50))); } catch {}
  // Firebase â€” sync all orders (individual writes handled in send functions)
}

async function fbSaveOrder(order) {
  try { localStorage.setItem("ja_orders", JSON.stringify(
    [order, ...(JSON.parse(localStorage.getItem("ja_orders")||"[]")).filter(o=>o.id!==order.id)].slice(0,50)
  )); } catch {}
  if (window._fb && window._fb.FB_OK) {
    await window._fb.saveOrder(order);
  }
}

function handleAdminStatusChange(orderId, newStatus) {
  if (newStatus === "Dispatched") {
    // Show dispatch modal instead of directly updating
    openDispatchModal(orderId);
    // Reset select to current status (will update after modal confirm)
    const orders = getOrders();
    const o = orders.find(x => x.id === orderId);
    if (o) {
      setTimeout(() => {
        const selects = document.querySelectorAll(".admin-status-select");
        selects.forEach(s => { if (s.closest("[data-oid='" + orderId + "']") || true) { /* re-render will handle */ } });
      }, 100);
    }
    return;
  }
  updateOrderStatus(orderId, newStatus);
}

function updateOrderStatus(orderId, newStatus) {
  const orders = getOrders();
  const o = orders.find(x => x.id === orderId);
  if (!o) return;
  o.status = newStatus;
  o.statusUpdatedAt = new Date().toLocaleString("en-IN");
  saveOrders(orders); // localStorage cache
  // Firebase live update â€” retailer sees status change instantly
  if (window._fb && window._fb.FB_OK) {
    window._fb.updateOrder(orderId, { status: newStatus, statusUpdatedAt: o.statusUpdatedAt });
  }
  showToast(`Order ${orderId} â†’ ${newStatus}`);
  if (currentAdminTab === "orders") renderAdminOrders();
  renderMyOrders();
  updateOrdersNavDot();
  triggerOrderStatusWA(o, newStatus);
}

function updateOrdersNavDot() {
  const orders = getOrders();
  const dot = document.getElementById("ordersNavDot");
  if (!dot) return;
  // Show dot if any order changed status recently (not pending)
  const hasUpdated = orders.some(o => o.status && o.status !== "Pending" && o.status !== "WhatsApp Sent");
  if (hasUpdated) dot.classList.add("show"); else dot.classList.remove("show");
}

function openMyOrders() {
  document.getElementById("ordersNavDot").classList.remove("show");
  renderMyOrders();
  showView("orders-view");
  // Highlight Orders tab in bottom nav
  document.querySelectorAll(".nav-btn").forEach(b => {
    b.classList.remove("active-tab");
    const lbl = b.querySelector(".nav-label");
    if (lbl) lbl.classList.remove("active");
  });
  const ordBtn = document.getElementById("navOrders");
  if (ordBtn) {
    ordBtn.classList.add("active-tab");
    const lbl = ordBtn.querySelector(".nav-label");
    if (lbl) lbl.classList.add("active");
  }
}

function renderMyOrders() {
  const orders = getOrders();
  const wrap = document.getElementById("ordersViewList");
  if (!wrap) return;
  if (!orders.length) {
    wrap.innerHTML = `<div style="text-align:center;padding:60px 20px;color:#94A3B8"><div style="font-size:52px;margin-bottom:12px">ðŸ“¦</div><div style="font-size:16px;font-weight:800;color:#64748B;margin-bottom:6px">No orders yet</div><div style="font-size:13px">Place your first order from the cart!</div></div>`;
    return;
  }
  wrap.innerHTML = orders.map(o => buildOrderCard(o, false)).join("");
}

function buildOrderCard(o, adminMode) {
  const statusIdx = ORDER_STATUSES.indexOf(o.status);
  const isWA = o.status === "WhatsApp Sent";
  const stepsHtml = isWA ? "" : ORDER_STATUSES.map((s, i) => {
    const done   = statusIdx > i;
    const active = statusIdx === i;
    return `<div class="step-item ${done?"done":""} ${active?"active":""}">
      <div class="step-circle">${done ? "âœ“" : (i+1)}</div>
      <div class="step-label">${s}</div>
    </div>`;
  }).join("");

  const adminStatusHtml = adminMode ? `
    <div style="padding:10px 16px;border-top:1px solid #F1F5F9;display:flex;gap:8px;align-items:center">
      <select class="admin-status-select" style="flex:1" onchange="handleAdminStatusChange('${o.id}', this.value)">
        ${[...ORDER_STATUSES, "WhatsApp Sent"].map(s => `<option value="${s}" ${o.status===s?"selected":""}>${STATUS_EMOJIS[s]||""} ${s}</option>`).join("")}
      </select>
      ${o.status !== "Dispatched" && o.status !== "Delivered" ? `<button onclick="openDispatchModal('${o.id}')" style="padding:10px 14px;border:none;border-radius:10px;background:linear-gradient(135deg,#f97316,#fb923c);color:#fff;font-family:inherit;font-size:12px;font-weight:900;cursor:pointer;white-space:nowrap;flex-shrink:0">ðŸšš Dispatch</button>` : ""}
    </div>` : "";

  const itemsId = "oi_" + o.id.replace(/[^a-z0-9]/gi,"");
  return `
    <div class="order-status-card">
      <div class="order-status-head">
        <div>
          <div class="order-status-id">${o.id}</div>
          <div class="order-status-shop">ðŸª ${o.retailer}</div>
          <div class="order-status-meta">${o.items.length} items Â· ${o.totalQty} strips Â· ${o.timestamp}</div>
        </div>
        <span class="status-pill ${STATUS_CSS[o.status]||"pending"}">${STATUS_EMOJIS[o.status]||"â³"} ${o.status}</span>
      </div>
      ${isWA ? "" : `<div class="order-stepper">${stepsHtml}</div>`}
      ${o.dispatch ? `
      <div class="dispatch-info-badge">
        <span class="dispatch-info-icon">${o.dispatch.icon}</span>
        <div style="flex:1">
          <div class="dispatch-info-text">Dispatched via ${o.dispatch.label}</div>
          ${o.dispatch.details ? `<div class="dispatch-info-detail">ðŸ“‹ ${o.dispatch.details}</div>` : ""}
          ${o.dispatch.eta ? `<div class="dispatch-info-detail">â° ETA: ${o.dispatch.eta}</div>` : ""}
          <div class="dispatch-info-detail">ðŸ• ${o.dispatch.dispatchedAt}</div>
        </div>
      </div>` : ""}
      <div class="order-items-toggle" onclick="toggleOrderItems('${itemsId}')">
        ðŸ“‹ ${o.items.length} items <span id="arr_${itemsId}" style="font-size:14px">â–¼</span>
      </div>
      <div class="order-items-list" id="${itemsId}">
        ${o.items.map(i => `<div class="order-item-row"><span class="order-item-name">${i.name}</span><span class="order-item-qty">Ã—${i.qty}</span></div>`).join("")}
      </div>
      ${adminStatusHtml}
      <div class="order-card-foot">
        <button class="order-invoice-btn" onclick="openInvoice('${o.id}')">ðŸ§¾ Invoice</button>
        <button class="order-reorder-mini" onclick="reorderFromHistory('${o.id}');${!adminMode?"showView('search-view')":""}">â†º Reorder</button>
      </div>
    </div>`;
}

function toggleOrderItems(id) {
  const el = document.getElementById(id);
  const arr = document.getElementById("arr_" + id);
  if (!el) return;
  const open = el.classList.toggle("open");
  if (arr) arr.textContent = open ? "â–²" : "â–¼";
}

// Admin orders tab


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PDF INVOICE GENERATOR
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

let currentInvoiceOrderId = null;

function openInvoice(orderId) {
  const orders = getOrders();
  const o = orders.find(x => x.id === orderId);
  if (!o) return;
  currentInvoiceOrderId = orderId;

  const invNum  = "INV-" + o.id.slice(-8).toUpperCase();
  const date    = o.timestamp || new Date().toLocaleString("en-IN");

  // Detect if inter-state (simplification: IGST if retailer state != CG)
  // Default: intra-state CG â†’ CGST + SGST split
  const isIGST = false; // extend later with retailer state detection

  // Build table rows with HSN + GST breakup per line
  let subtotal = 0;
  let totalGST = 0;
  const rows = o.items.map((item, i) => {
    const p      = products.find(x => x.id === item.id) || {};
    const ptr    = parseFloat(p.ptr) || 0;
    const gstPct = parseFloat(p.gst || 5);
    const lineAmt = ptr * item.qty;
    const lineGST = ptr ? (lineAmt * gstPct / 100) : 0;
    if (ptr) { subtotal += lineAmt; totalGST += lineGST; }
    const half   = (lineGST / 2).toFixed(2);
    return `<tr>
      <td style="font-weight:700">${i+1}. ${item.name}${p.batch ? `<br><span style="font-size:9px;color:#94A3B8;font-weight:600">Batch: ${p.batch} Â· Exp: ${p.expiry||"â€”"}</span>` : ""}</td>
      <td>${item.qty}</td>
      <td>${p.packing || item.packing || "â€”"}</td>
      <td style="font-size:10px">${p.hsn || "â€”"}</td>
      <td>${ptr ? "â‚¹" + ptr.toFixed(2) : "â€”"}</td>
      <td style="font-weight:800">${ptr ? "â‚¹" + lineAmt.toFixed(2) : "â€”"}</td>
    </tr>`;
  }).join("");

  const grand = subtotal + totalGST;

  // Get retailer GST from session
  const sess = getRetailerSession();
  const buyerGST = sess?.gst || "â€”";
  const buyerName = o.retailer;

  const invoiceHTML = `
    <div class="invoice-paper">
      <div class="inv-letterhead">
        <div>
          <div class="inv-brand-name">Jain Agencies</div>
          <div class="inv-brand-tagline">Pharmaceutical Distributors Â· Rajnandgaon (C.G.)</div>
          <div style="font-size:10px;color:#64748B;font-weight:700;margin-top:3px">GST: 22XXXXX0000X1ZX &nbsp;Â·&nbsp; DL No.: CG/DL/2024/XXXX</div>
          <div style="font-size:9px;color:#94A3B8;margin-top:2px">ðŸ“ Kila Para, Near Digvijay College, Rajnandgaon (C.G.) &nbsp;Â·&nbsp; ðŸ“ž 90862-91862</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:9px;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:0.5px">Tax Invoice</div>
          <div style="font-size:14px;font-weight:900;color:#00897b">${invNum}</div>
          <div style="font-size:10px;color:#64748B">${date}</div>
        </div>
      </div>

      <div style="display:flex;gap:12px;margin-bottom:14px;background:#F8FAFC;border-radius:10px;padding:10px 12px;border:1px solid #E2E8F0">
        <div style="flex:1">
          <div style="font-size:9px;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">Bill To</div>
          <div style="font-size:13px;font-weight:800;color:#1E293B">${buyerName}</div>
          <div style="font-size:10px;color:#64748B;font-weight:600">GST: ${buyerGST}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:9px;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">Status</div>
          <div class="inv-status-stamp" style="display:inline-block;font-size:10px;padding:4px 10px">${o.status.toUpperCase()}</div>
        </div>
      </div>

      <table class="inv-table" style="font-size:10px">
        <thead><tr>
          <th>Medicine</th><th>Qty</th><th>Pack</th><th>HSN</th><th>PTR</th><th>Total</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>

      ${subtotal ? `
      <div class="inv-totals">
        <div class="inv-total-row grand"><span>Grand Total</span><span>â‚¹${subtotal.toFixed(2)}</span></div>
      </div>` : `
      <div style="text-align:center;font-size:12px;color:#94A3B8;padding:12px">
        (Add PTR prices in Admin â†’ Products for invoice totals)
      </div>`}

      <div class="inv-footer">
        E. &amp; O.E. Â· Subject to Rajnandgaon jurisdiction Â· Payment due within 15 days<br>
        Goods once sold will not be taken back except for genuine quality complaints<br>
        <strong>Jain Agencies Â· Rajnandgaon Â· 90862-91862</strong>
      </div>
    </div>`;

  document.getElementById("invoicePreview").innerHTML = invoiceHTML;
  document.getElementById("invoiceOverlay").classList.add("open");
}

function closeInvoice() {
  document.getElementById("invoiceOverlay").classList.remove("open");
}

function shareInvoiceWA() {
  if (!currentInvoiceOrderId) return;
  const orders = getOrders();
  const o = orders.find(x => x.id === currentInvoiceOrderId);
  if (!o) return;
  const lines = o.items.map(i => `${i.name} Ã— ${i.qty}`).join("\n");
  const text = `ðŸ§¾ Invoice from Jain Agencies\n\nBill To: ${o.retailer}\nOrder: ${o.id}\nDate: ${o.timestamp}\n\n${lines}\n\nTotal: ${o.items.length} items Â· ${o.totalQty} strips\n\nðŸ“ž Jain Agencies: 90862-91862\nðŸ“ Kila Para, Rajnandgaon`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ANNOUNCEMENTS / NOTICE BOARD
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const ANN_COLORS  = { info:"#3b82f6", warning:"#f59e0b", success:"#059669", urgent:"#ef4444" };
const ANN_EMOJIS  = { info:"â„¹ï¸", warning:"âš ï¸", success:"âœ…", urgent:"ðŸ”´" };
let selectedAnnType = "info";
let announcements = [];

function loadAnnouncements() {
  try { announcements = JSON.parse(localStorage.getItem("ja_announcements") || "[]"); } catch { announcements = []; }
  renderNoticesBanner();
}
function saveAnnouncements() {
  try { localStorage.setItem("ja_announcements", JSON.stringify(announcements)); } catch {}
  // Firebase sync
  if (window._fb && window._fb.FB_OK) {
    announcements.forEach(a => window._fb.saveAnnouncement(a));
  }
}

function selectAnnType(type) {
  selectedAnnType = type;
  ["info","warning","success","urgent"].forEach(t => {
    const btn = document.getElementById("annType" + t.charAt(0).toUpperCase() + t.slice(1));
    if (btn) btn.classList.toggle("selected", t === type);
  });
}

function postAnnouncement() {
  const title = document.getElementById("annTitle").value.trim();
  const body  = document.getElementById("annBody").value.trim();
  if (!title) { showToast("Enter announcement title", "error"); return; }
  const ann = {
    id: Date.now(),
    type: selectedAnnType,
    title, body,
    date: new Date().toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }),
    timestamp: new Date().toLocaleString("en-IN")
  };
  announcements.unshift(ann);
  saveAnnouncements();
  document.getElementById("annTitle").value = "";
  document.getElementById("annBody").value  = "";
  renderNoticesBanner();
  renderAdminAnnList();
  showToast("ðŸ“¢ Announcement posted!");
  triggerAnnouncementWA(ann);
}

function deleteAnnouncement(id) {
  announcements = announcements.filter(a => a.id !== id);
  if (window._fb && window._fb.FB_OK) window._fb.deleteAnnouncement(id);
  saveAnnouncements();
  renderNoticesBanner();
  renderAdminAnnList();
  showToast("Announcement removed");
}

function renderNoticesBanner() {
  const banner = document.getElementById("noticeBanner");
  const scroll = document.getElementById("noticeScroll");
  if (!banner || !scroll) return;
  if (!announcements.length) { banner.classList.remove("show"); return; }
  banner.classList.add("show");
  scroll.innerHTML = announcements.slice(0,5).map(a => `
    <div class="notice-card ${a.type}" data-emoji="${ANN_EMOJIS[a.type]||"ðŸ“¢"}">
      <div class="notice-type-label">${ANN_EMOJIS[a.type]} ${a.type.toUpperCase()}</div>
      <div class="notice-title">${a.title}</div>
      ${a.body ? `<div class="notice-body">${a.body}</div>` : ""}
      <div class="notice-date">ðŸ“… ${a.date}</div>
    </div>`).join("");
}

function openAllNotices() {
  const wrap = document.getElementById("allNoticesList");
  if (!wrap) return;
  if (!announcements.length) {
    wrap.innerHTML = '<div style="text-align:center;padding:48px;color:#94A3B8;font-size:14px;font-weight:700">No announcements yet</div>';
  } else {
    wrap.innerHTML = announcements.map(a => `
      <div style="background:#fff;border-radius:14px;padding:14px 16px;margin-bottom:10px;border-left:4px solid ${ANN_COLORS[a.type]||"#94A3B8"}">
        <div style="font-size:13px;font-weight:900;color:#1E293B;margin-bottom:4px">${ANN_EMOJIS[a.type]} ${a.title}</div>
        ${a.body ? `<div style="font-size:12px;color:#475569;font-weight:600;line-height:1.5;margin-bottom:6px">${a.body}</div>` : ""}
        <div style="font-size:10px;color:#94A3B8;font-weight:700">${a.timestamp}</div>
      </div>`).join("");
  }
  document.getElementById("allNoticesOverlay").classList.add("open");
}
function closeAllNotices() {
  document.getElementById("allNoticesOverlay").classList.remove("open");
}

function renderAdminAnnList() {
  const el = document.getElementById("adminAnnList");
  if (!el) return;
  if (!announcements.length) {
    el.innerHTML = '<div style="text-align:center;padding:32px;color:#94A3B8;font-size:13px;font-weight:600">No announcements yet. Post one above!</div>';
    return;
  }
  el.innerHTML = announcements.map(a => `
    <div class="ann-existing-card">
      <div class="ann-color-dot" style="background:${ANN_COLORS[a.type]||"#94A3B8"}"></div>
      <div style="flex:1;min-width:0">
        <div class="ann-existing-title">${ANN_EMOJIS[a.type]} ${a.title}</div>
        ${a.body ? `<div class="ann-existing-body">${a.body}</div>` : ""}
        <div class="ann-existing-meta">${a.timestamp}</div>
      </div>
      <button class="ann-del-btn" onclick="deleteAnnouncement(${a.id})">ðŸ—‘ï¸</button>
    </div>`).join("");
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// WHATSAPP AUTO-NOTIFICATION SYSTEM
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

let waSettings = { approve: true, order: true, ann: false };
let waPendingAction = null; // { type, phone, name, message }

function loadWASettings() {
  try {
    const s = localStorage.getItem("ja_wa_settings");
    if (s) waSettings = { ...waSettings, ...JSON.parse(s) };
  } catch {}
  syncWAToggleUI();
}
function saveWASettings() {
  try { localStorage.setItem("ja_wa_settings", JSON.stringify(waSettings)); } catch {}
}

function syncWAToggleUI() {
  ["approve","order","ann"].forEach(k => {
    const btn = document.getElementById("waToggle" + k.charAt(0).toUpperCase() + k.slice(1));
    if (btn) { btn.classList.toggle("on", !!waSettings[k]); btn.classList.toggle("off", !waSettings[k]); }
  });
}

function toggleWASetting(key) {
  waSettings[key] = !waSettings[key];
  saveWASettings();
  syncWAToggleUI();
  showToast(waSettings[key] ? `ðŸ’¬ WA ${key} notifications ON` : `WA ${key} notifications OFF`);
}

// â”€â”€â”€ Core WA preview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function showWAPreview({ sub, recipientName, recipientPhone, message, onConfirm }) {
  const now = new Date().toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });
  document.getElementById("waPreviewSub").textContent   = sub || "Preview before sending";
  document.getElementById("waRecipientName").textContent = recipientName || "Retailer";
  document.getElementById("waRecipientNum").textContent  = recipientPhone ? "ðŸ“ž " + recipientPhone : "No number on file";
  document.getElementById("waBubbleText").textContent    = message;
  document.getElementById("waBubbleTime").textContent    = now + " âœ“âœ“";
  waPendingAction = { phone: recipientPhone, message, onConfirm };
  document.getElementById("waPreviewOverlay").classList.add("open");
}

function closeWAPreview() {
  document.getElementById("waPreviewOverlay").classList.remove("open");
  waPendingAction = null;
}

function confirmSendWA() {
  if (!waPendingAction) return;
  const { phone, message, onConfirm } = waPendingAction;
  closeWAPreview();
  const num = phone ? phone.replace(/\D/g,"") : JAIN_WA_NUMBER;
  const fullNum = num.length === 10 ? "91" + num : num;
  window.open(`https://wa.me/${fullNum}?text=${encodeURIComponent(message)}`, "_blank");
  if (onConfirm) onConfirm();
}

// â”€â”€â”€ BUILD MESSAGES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildApprovalMessage(retailer) {
  return `âœ… *Jain Agencies - Account Approved!*

Dear ${retailer.name},

Your retailer account for *${retailer.shop}* has been verified and approved! ðŸŽ‰

You now have full access to:
â€¢ Wholesale pricing & PTR rates
â€¢ Hot deals & schemes
â€¢ Direct ordering system

ðŸ“± Login with your mobile: *${retailer.mobile}*

ðŸ“ Jain Agencies
Kila Para, Near Digvijay College
Rajnandgaon (C.G.)
ðŸ“ž 90862-91862`;
}

function buildOrderStatusMessage(order, newStatus) {
  const statusMsg = {
    Confirmed:  `âœ… *Order Confirmed!*\nYour order *${order.id}* has been confirmed. We are processing it.`,
    Packed:     `ðŸ“¦ *Order Packed!*\nYour order *${order.id}* is packed and ready for dispatch.`,
    Dispatched: `ðŸšš *Order Dispatched!*\nYour order *${order.id}* is on the way! Expect delivery soon.`,
    Delivered:  `ðŸŽ‰ *Order Delivered!*\nYour order *${order.id}* has been delivered. Thank you for your business!`
  };
  const base = statusMsg[newStatus] || `ðŸ“‹ Order *${order.id}* status: *${newStatus}*`;
  return `${base}

ðŸª *${order.retailer}*
ðŸ“¦ ${order.items.length} items Â· ${order.totalQty} strips
ðŸ“… ${order.timestamp}

ðŸ“ž Jain Agencies: 90862-91862
_Thank you for choosing Jain Agencies!_`;
}

function buildAnnouncementMessage(ann) {
  const emoji = { info:"â„¹ï¸", warning:"âš ï¸", success:"âœ…", urgent:"ðŸ”´" }[ann.type] || "ðŸ“¢";
  return `${emoji} *Jain Agencies - ${ann.title}*

${ann.body || ""}

ðŸ“… ${ann.date}
ðŸ“ž 90862-91862 | Rajnandgaon`;
}

// â”€â”€â”€ TRIGGER POINTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Called when admin approves a retailer
function triggerApprovalWA(retailer) {
  if (!waSettings.approve) return;
  const msg = buildApprovalMessage(retailer);
  showWAPreview({
    sub: "Sending approval confirmation to retailer",
    recipientName: retailer.name + " Â· " + retailer.shop,
    recipientPhone: retailer.mobile,
    message: msg
  });
}

// Called when admin updates order status (only meaningful statuses)
function triggerOrderStatusWA(order, newStatus) {
  if (!waSettings.order) return;
  if (!["Confirmed","Dispatched","Delivered"].includes(newStatus)) return;
  // Try to find retailer phone from retailers list
  const retailers = getRetailers();
  const r = retailers.find(x => x.shop === order.retailer || x.name === order.retailer);
  const phone = r ? r.mobile : null;
  const msg = buildOrderStatusMessage(order, newStatus);
  showWAPreview({
    sub: `Notifying ${order.retailer} about order status`,
    recipientName: order.retailer,
    recipientPhone: phone,
    message: msg
  });
}

// Called when admin posts an announcement (broadcasts to all approved retailers)
function triggerAnnouncementWA(ann) {
  if (!waSettings.ann) return;
  const retailers = getRetailers().filter(r => r.status === "approved" && r.mobile);
  if (!retailers.length) {
    showToast("No approved retailers with phone numbers yet", "error");
    return;
  }
  // Show WA for first retailer â€” admin can repeat for others
  const r = retailers[0];
  const msg = buildAnnouncementMessage(ann);
  showWAPreview({
    sub: `Sending to ${retailers.length} approved retailer${retailers.length>1?"s":""} (1 at a time)`,
    recipientName: r.name + " Â· " + r.shop,
    recipientPhone: r.mobile,
    message: msg,
    onConfirm: () => {
      // Queue remaining retailers one by one
      if (retailers.length > 1) {
        showToast(`ðŸ’¬ ${retailers.length - 1} more retailer(s) to notify`);
      }
    }
  });
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// FAVOURITE PRODUCTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

let favourites = []; // array of product ids

function loadFavourites() {
  try { favourites = JSON.parse(localStorage.getItem("ja_favourites") || "[]"); } catch { favourites = []; }
  renderFavourites();
}
function saveFavourites() {
  try { localStorage.setItem("ja_favourites", JSON.stringify(favourites)); } catch {}
}
function isFavourite(id) { return favourites.includes(id); }

function toggleFavourite(productId) {
  if (isFavourite(productId)) {
    favourites = favourites.filter(id => id !== productId);
    showToast("Removed from favourites");
  } else {
    favourites.push(productId);
    showToast("â­ Added to favourites!");
  }
  saveFavourites();
  renderFavourites();
  renderProductList();
  // Refresh detail page star if open
  if (currentDetailId === productId) {
    const starBtn = document.getElementById("detailFavBtn");
    if (starBtn) starBtn.textContent = isFavourite(productId) ? "â­ Favourited" : "â˜† Add to Favourites";
  }
}

function renderFavourites() {
  const section = document.getElementById("favsSection");
  const scroll  = document.getElementById("favsScroll");
  if (!section || !scroll) return;

  const favProds = favourites.map(id => products.find(p => p.id === id)).filter(Boolean);
  if (!favProds.length) { section.classList.remove("show"); return; }
  section.classList.add("show");

  scroll.innerHTML = favProds.map(p => {
    const color = CAT_COLORS[p.category] || "#64748B";
    const inCart = cart.some(c => c.id === p.id);
    return `<div class="fav-chip" onclick="openDetail(${p.id})">
      <span class="fav-chip-icon" style="background:${color}22;border-radius:8px;padding:4px">${CAT_ICONS[p.category]||"ðŸ’Š"}</span>
      <div style="min-width:0">
        <div class="fav-chip-name">${p.name}</div>
        <div class="fav-chip-co">${p.company}</div>
      </div>
      ${p.stock
        ? `<button class="fav-chip-add" onclick="event.stopPropagation();toggleCart(${p.id})">${inCart?"âœ“":"+ Cart"}</button>`
        : `<span style="font-size:10px;color:#ef4444;font-weight:700;flex-shrink:0">Out</span>`
      }
    </div>`;
  }).join("");
}

function clearFavourites() {
  favourites = [];
  saveFavourites();
  renderFavourites();
  renderProductList();
  showToast("Favourites cleared");
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PRODUCT REQUEST SYSTEM
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

let productRequests = [];

function loadProductRequests() {
  try { productRequests = JSON.parse(localStorage.getItem("ja_prod_requests") || "[]"); } catch { productRequests = []; }
  updateRequestsBadge();
}
function saveProductRequests() {
  try { localStorage.setItem("ja_prod_requests", JSON.stringify(productRequests.slice(0,100))); } catch {}
}

function updateRequestsBadge() {
  const newReqs = productRequests.filter(r => r.status === "new").length;
  const badge = document.getElementById("reqNavBadge");
  if (badge) { badge.textContent = newReqs; badge.style.display = newReqs > 0 ? "inline" : "none"; }
}


function renderAdminRequests() {
  const el = document.getElementById("adminRequestsList");
  if (!el) return;
  updateRequestsBadge();

  if (!productRequests.length) {
    el.innerHTML = '<div style="text-align:center;padding:48px 20px;color:#94A3B8"><div style="font-size:44px;margin-bottom:10px">ðŸ”</div><div style="font-size:14px;font-weight:700">No product requests yet</div></div>';
    return;
  }

  el.innerHTML = productRequests.map(r => `
    <div class="prod-req-card">
      <div class="prod-req-head">
        <div>
          <div class="prod-req-name">ðŸ’Š ${r.medName}${r.company ? " Â· " + r.company : ""}</div>
          <div class="prod-req-retailer">ðŸª ${r.retailer} Â· ${r.retailerName} Â· ðŸ“ž ${r.retailerMobile}</div>
        </div>
        <span class="prod-req-badge ${r.status}">${r.status === "new" ? "ðŸ†• New" : "âœ“ Reviewed"}</span>
      </div>
      ${r.qty ? `<div class="prod-req-note">ðŸ“¦ Qty needed: ${r.qty}</div>` : ""}
      ${r.notes ? `<div class="prod-req-note">ðŸ“ ${r.notes}</div>` : ""}
      <div class="prod-req-date" style="margin-bottom:10px">ðŸ“… ${r.timestamp}</div>
      <div class="prod-req-actions">
        ${r.status === "new" ? `<button class="prod-req-add-btn" onclick="markRequestReviewed('${r.id}')">âœ“ Mark Reviewed</button>` : ""}
        <button class="prod-req-add-btn" style="background:linear-gradient(135deg,#7c3aed,#a855f7)" onclick="openAddFormFromRequest('${r.id}')">+ Add to Products</button>
        <button class="prod-req-dismiss-btn" onclick="dismissRequest('${r.id}')">ðŸ—‘ï¸</button>
      </div>
    </div>`).join("");
}

function markRequestReviewed(id) {
  const r = productRequests.find(x => x.id === id);
  if (r) { r.status = "reviewed"; saveProductRequests(); renderAdminRequests(); }
}

function dismissRequest(id) {
  productRequests = productRequests.filter(r => r.id !== id);
  saveProductRequests();
  renderAdminRequests();
  showToast("Request dismissed");
}

function openAddFormFromRequest(id) {
  const r = productRequests.find(x => x.id === id);
  if (!r) return;
  markRequestReviewed(id);
  // Pre-fill add product form
  openAddForm();
  setTimeout(() => {
    const nameEl = document.getElementById("fName");
    const coEl   = document.getElementById("fCompany");
    if (nameEl) nameEl.value = r.medName;
    if (coEl && r.company) coEl.value = r.company;
  }, 100);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// DISPATCH MEDIUM
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const DISPATCH_LABELS = {
  bus:       { icon:"ðŸšŒ", label:"Bus",         sub:"State/private bus" },
  auto:      { icon:"ðŸ›º", label:"Auto / Taxi", sub:"Local auto or cab" },
  transport: { icon:"ðŸš›", label:"Transport",   sub:"Courier / logistics" },
  own:       { icon:"ðŸï¸", label:"Own Delivery", sub:"Our staff delivers" }
};

let selectedDispatchMedium = null;
let pendingDispatchOrderId = null;

function openDispatchModal(orderId) {
  pendingDispatchOrderId = orderId;
  selectedDispatchMedium = null;
  document.getElementById("dispatchOrderId").textContent = orderId;
  document.getElementById("dispatchDetails").value = "";
  document.getElementById("dispatchETA").value = "";
  // Reset selection
  Object.keys(DISPATCH_LABELS).forEach(k => {
    const btn = document.getElementById("dm-" + k);
    if (btn) btn.classList.remove("selected");
  });
  document.getElementById("dispatchModal").classList.add("open");
}

function selectDispatchMedium(medium) {
  selectedDispatchMedium = medium;
  Object.keys(DISPATCH_LABELS).forEach(k => {
    const btn = document.getElementById("dm-" + k);
    if (btn) btn.classList.toggle("selected", k === medium);
  });
  // Auto-focus details
  setTimeout(() => document.getElementById("dispatchDetails").focus(), 100);
}

function confirmDispatch() {
  if (!selectedDispatchMedium) { showToast("Please select a dispatch medium", "error"); return; }
  if (!pendingDispatchOrderId) return;

  const details = document.getElementById("dispatchDetails").value.trim();
  const eta     = document.getElementById("dispatchETA").value.trim();
  const dm = DISPATCH_LABELS[selectedDispatchMedium];

  // Save dispatch info to order
  const orders = getOrders();
  const o = orders.find(x => x.id === pendingDispatchOrderId);
  if (o) {
    o.status = "Dispatched";
    o.dispatch = {
      medium: selectedDispatchMedium,
      icon: dm.icon,
      label: dm.label,
      details: details || "",
      eta: eta || "",
      dispatchedAt: new Date().toLocaleString("en-IN")
    };
    saveOrders(orders);
  }

  document.getElementById("dispatchModal").classList.remove("open");
  pendingDispatchOrderId = null;

  if (currentAdminTab === "orders") renderAdminOrders();
  renderMyOrders();
  updateOrdersNavDot();

  // WA notification with dispatch details
  if (o) {
    showToast(`ðŸšš Dispatched via ${dm.label}!`);
    // Trigger WA with dispatch info
    const retailers = getRetailers();
    const r = retailers.find(x => x.shop === o.retailer || x.name === o.retailer);
    const phone = r ? r.mobile : null;
    const msg = `ðŸšš *Order Dispatched!*\n\nOrder *${o.id}* for *${o.retailer}* is on its way!\n\n${dm.icon} *Via: ${dm.label}*${details ? "\nðŸ“‹ Details: " + details : ""}${eta ? "\nâ° ETA: " + eta : ""}\n\nðŸ“¦ ${o.items.length} items Â· ${o.totalQty} strips\n\nðŸ“ž Jain Agencies: 90862-91862`;
    if (waSettings.order) {
      showWAPreview({
        sub: `Notifying ${o.retailer} about dispatch`,
        recipientName: o.retailer,
        recipientPhone: phone,
        message: msg
      });
    }
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// RECENTLY VIEWED
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const RECENT_MAX = 8;
let recentIds = []; // newest first

function loadRecent() {
  try { recentIds = JSON.parse(localStorage.getItem("ja_recent") || "[]"); } catch { recentIds = []; }
  renderRecent();
}
function saveRecent() {
  try { localStorage.setItem("ja_recent", JSON.stringify(recentIds)); } catch {}
}
function trackRecent(id) {
  recentIds = [id, ...recentIds.filter(x => x !== id)].slice(0, RECENT_MAX);
  saveRecent();
  renderRecent();
}
function clearRecent() {
  recentIds = [];
  saveRecent();
  renderRecent();
  showToast("Recent history cleared");
}
function renderRecent() {
  const sec    = document.getElementById("recentSection");
  const scroll = document.getElementById("recentScroll");
  if (!sec || !scroll) return;
  const list = recentIds.map(id => products.find(p => p.id === id)).filter(Boolean);
  if (!list.length) { sec.classList.remove("show"); return; }
  sec.classList.add("show");
  scroll.innerHTML = list.map(p => {
    const color  = CAT_COLORS[p.category] || "#64748B";
    const inCart = cart.some(c => c.id === p.id);
    return `<div class="recent-chip" onclick="openDetail(${p.id})">
      <span class="recent-chip-icon">${CAT_ICONS[p.category]||"ðŸ’Š"}</span>
      <div class="recent-chip-body">
        <div class="recent-chip-name">${p.name}</div>
        <div class="recent-chip-co">${p.company}</div>
      </div>
      ${p.stock
        ? `<button class="recent-chip-add ${inCart?"added":""}" onclick="event.stopPropagation();toggleCart(${p.id})">${inCart?"âœ“":"+ Cart"}</button>`
        : `<span class="recent-chip-out">Out</span>`}
    </div>`;
  }).join("");
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ðŸ§¾ ORDER HISTORY (customer side â€” localStorage)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const ORDER_HISTORY_KEY = "ja_order_history";
const ORDER_HISTORY_MAX = 20; // keep last 20 items

function recordOrderHistory(cartItems) {
  if (!cartItems || !cartItems.length) return;
  try {
    let hist = JSON.parse(localStorage.getItem(ORDER_HISTORY_KEY) || "[]");
    const now = new Date().toLocaleString("en-IN", {day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
    // Add each cart item as a history entry (merge same product, latest on top)
    cartItems.forEach(item => {
      // Remove any older entry for same product
      hist = hist.filter(h => h.id !== item.id);
      hist.unshift({
        id: item.id,
        name: item.name,
        company: item.company,
        packing: item.packing,
        qty: item.qty,
        time: now
      });
    });
    hist = hist.slice(0, ORDER_HISTORY_MAX);
    localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(hist));
    renderOrderHistory();
  } catch(e) {}
}

function clearOrderHistory() {
  localStorage.removeItem(ORDER_HISTORY_KEY);
  renderOrderHistory();
}

function renderOrderHistory() {
  const sec  = document.getElementById("orderHistorySection");
  const list = document.getElementById("orderHistoryList");
  if (!sec || !list) return;
  try {
    const hist = JSON.parse(localStorage.getItem(ORDER_HISTORY_KEY) || "[]");
    if (!hist.length) { sec.classList.remove("show"); return; }
    sec.classList.add("show");
    list.innerHTML = hist.slice(0, 6).map(h => {
      const p = products.find(x => x.id === h.id);
      const icon = p ? (CAT_ICONS[p.category] || "ðŸ’Š") : "ðŸ’Š";
      return `<div class="order-history-card" onclick="${p ? `openDetail(${h.id})` : ""}">
        <div class="order-history-icon">${icon}</div>
        <div style="flex:1;min-width:0">
          <div class="order-history-name">${h.name}</div>
          <div class="order-history-meta">${h.company || ""} Â· ${h.time}</div>
        </div>
        <div class="order-history-qty">${h.qty} ${h.packing || "strip"}${h.qty > 1 ? "s" : ""}</div>
      </div>`;
    }).join("");
  } catch(e) { sec.classList.remove("show"); }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SWIPE-TO-CART (#7)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const SWIPE_THRESHOLD = 72;

function attachSwipe(wrapEl) {
  const card = wrapEl.querySelector(".product-card");
  if (!card) return;
  const id = parseInt(card.dataset.id);
  let startX = 0, startY = 0, curX = 0, swiping = false, confirmed = false;

  function onStart(e) {
    const t = e.touches ? e.touches[0] : e;
    startX = t.clientX; startY = t.clientY; curX = 0; swiping = false; confirmed = false;
    card.style.transition = "none";
  }
  function onMove(e) {
    const t = e.touches ? e.touches[0] : e;
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    if (!swiping && Math.abs(dy) > Math.abs(dx)) return; // vertical scroll wins
    if (dx > 0) return; // only swipe left
    swiping = true;
    curX = Math.max(dx, -SWIPE_THRESHOLD - 16); // rubber-band limit
    card.style.transform = `translateX(${curX}px)`;
    if (curX <= -SWIPE_THRESHOLD && !confirmed) {
      confirmed = true;
      const p = products.find(x => x.id === id);
      if (p && p.stock) {
        navigator.vibrate && navigator.vibrate(40);
        card.style.transform = `translateX(-${SWIPE_THRESHOLD}px)`;
      }
    }
  }
  function onEnd() {
    card.style.transition = "";
    if (confirmed) {
      const p = products.find(x => x.id === id);
      if (p && p.stock && !cart.some(c => c.id === id)) {
        toggleCart(id);
        showToast(`${p.name.substring(0,22)}â€¦ added to cart ðŸ›’`);
      }
    }
    card.style.transform = "";
    swiping = false; confirmed = false;
  }

  card.addEventListener("touchstart", onStart, {passive:true});
  card.addEventListener("touchmove",  onMove,  {passive:true});
  card.addEventListener("touchend",   onEnd,   {passive:true});
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BARCODE / NAME SCANNER (#6)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// â”€â”€ jsQR for barcode scanning â”€â”€
let _jsQRLoaded = false;
function loadJsQR(cb) {
  if (window.jsQR) { cb(); return; }
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
  s.onload = () => { _jsQRLoaded = true; cb(); };
  s.onerror = () => cb(); // proceed even if CDN fails
  document.head.appendChild(s);
}

let _scanStream = null;
let _scanRAF = null;

function isInAppBrowser() {
  const ua = navigator.userAgent || "";
  return /FBAN|FBAV|Instagram|WhatsApp|Snapchat|Twitter|Line\/|wv\b/.test(ua)
      || (ua.includes("Android") && ua.includes("wv"))
      || window.location.protocol === "content:";
}

async function openScanner() {
  const overlay = document.getElementById("scannerOverlay");
  overlay.classList.add("open");
  document.getElementById("scannerInput").value = "";

  // Detect in-app browser â€” camera will be blocked
  if (isInAppBrowser() || window.location.protocol === "content:") {
    showScannerInAppMsg();
    return;
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showScannerInAppMsg();
    return;
  }

  loadJsQR(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width:{ideal:1280}, height:{ideal:720} }
      });
      _scanStream = stream;
      const video = document.getElementById("scannerVideo");
      video.style.display = "";
      video.srcObject = stream;
      video.onloadedmetadata = () => { video.play(); startQRScan(video); };
      document.querySelector(".scanner-tip").textContent = "Point camera at medicine barcode";
      document.querySelector(".scanner-sub").textContent = "Auto-detects QR / barcode";
    } catch(e) {
      showScannerInAppMsg();
    }
  });
}

function showScannerInAppMsg() {
  document.getElementById("scannerVideo").style.display = "none";
  document.querySelector(".scanner-tip").textContent = "ðŸ“µ Camera blocked in WhatsApp";
  document.querySelector(".scanner-sub").innerHTML =
    `<span style="color:#00e5cc;font-weight:800">Save file to phone â†’ Open with Chrome</span>`;
  // Show instructions inside scanner frame
  const frame = document.getElementById("scannerFrame");
  if (!document.getElementById("scanOpenBrowserBtn")) {
    const instr = document.createElement("div");
    instr.id = "scanOpenBrowserBtn";
    instr.style.cssText = "position:absolute;bottom:8px;left:8px;right:8px;" +
      "background:rgba(0,0,0,0.75);border:1.5px solid #00e5cc;border-radius:10px;" +
      "padding:10px 14px;text-align:center;z-index:10;";
    instr.innerHTML =
      `<div style="color:#00e5cc;font-size:12px;font-weight:900;margin-bottom:6px">HOW TO USE CAMERA</div>` +
      `<div style="color:#fff;font-size:11px;line-height:1.6">` +
      `1ï¸âƒ£ Tap <b style="color:#fff">â‹® Menu</b> â†’ <b style="color:#fff">Open in Chrome</b><br>` +
      `2ï¸âƒ£ Or save the HTML file â†’ open it from <b style="color:#fff">Files app</b><br>` +
      `3ï¸âƒ£ Camera will work in Chrome âœ…` +
      `</div>`;
    frame.appendChild(instr);
  }
}

function startQRScan(video) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  function tick() {
    if (!_scanStream) return;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      if (window.jsQR) {
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(img.data, img.width, img.height, { inversionAttempts:"dontInvert" });
        if (code && code.data) {
          document.getElementById("scannerInput").value = code.data;
          scannerSearch();
          return;
        }
      }
    }
    _scanRAF = requestAnimationFrame(tick);
  }
  _scanRAF = requestAnimationFrame(tick);
}

function closeScanner() {
  if (_scanRAF) { cancelAnimationFrame(_scanRAF); _scanRAF = null; }
  if (_scanStream) { _scanStream.getTracks().forEach(t => t.stop()); _scanStream = null; }
  document.getElementById("scannerOverlay").classList.remove("open");
  const video = document.getElementById("scannerVideo");
  video.srcObject = null;
  video.style.display = "";
  document.querySelector(".scanner-tip").textContent = "Point camera at medicine barcode";
  document.querySelector(".scanner-sub").textContent = "Or type name / barcode below";
  // Remove open-browser button if present
  const btn = document.getElementById("scanOpenBrowserBtn");
  if (btn) btn.remove();
}

function scannerLiveSearch() {
  const q = document.getElementById("scannerInput").value.trim();
  if (q.length < 2) return;
  scannerSearch();
}

function scannerSearch() {
  const q = document.getElementById("scannerInput").value.trim();
  if (!q) return;
  closeScanner();
  document.getElementById("searchInput").value = q;
  document.getElementById("clearBtn").style.display = "block";
  renderProductList();
  // Scroll to results
  setTimeout(() => {
    document.getElementById("productList").scrollIntoView({behavior:"smooth", block:"start"});
  }, 300);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// FIREBASE SETUP WIZARD
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function openFbWiz() {
  document.getElementById("fbWizOverlay").classList.add("open");
  document.getElementById("fbWizSuccess").classList.remove("show");
  document.getElementById("fbWizOverlay").querySelector(".fbwiz-body").style.display = "";
  // Pre-fill if saved
  const saved = localStorage.getItem("ja_fb_config");
  if (saved) {
    try {
      const cfg = JSON.parse(saved);
      document.getElementById("fbConfigPaste").value =
        "const firebaseConfig = " + JSON.stringify(cfg, null, 2) + ";";
      parseFbConfig();
    } catch {}
  }
}
function closeFbWiz() {
  document.getElementById("fbWizOverlay").classList.remove("open");
}

function parseFbConfig() {
  const raw   = document.getElementById("fbConfigPaste").value.trim();
  const ta    = document.getElementById("fbConfigPaste");
  const msg   = document.getElementById("fbParseMsg");
  const prev  = document.getElementById("fbPreview");
  const rows  = document.getElementById("fbPreviewRows");
  const btn   = document.getElementById("fbWizSaveBtn");

  // Reset
  ta.classList.remove("ok","err");
  msg.className = "fbwiz-parse-msg";
  prev.classList.remove("show");
  btn.disabled = true;

  if (!raw) { msg.textContent = ""; return; }

  // Extract JSON object from whatever they pasted
  // Handles:  firebaseConfig = {...}  or  const x = {...}  or just {...}
  let jsonStr = null;
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) jsonStr = match[0];

  if (!jsonStr) {
    ta.classList.add("err");
    msg.className = "fbwiz-parse-msg err";
    msg.textContent = "âš ï¸ Could not find a { } config block. Please paste the full text.";
    return;
  }

  let cfg;
  try {
    // Firebase config uses bare keys â€” parse safely
    // Convert JS object literal â†’ JSON
    const jsonReady = jsonStr
      .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":')   // quote keys
      .replace(/'/g, '"');                              // singleâ†’double quotes
    cfg = JSON.parse(jsonReady);
  } catch(e) {
    ta.classList.add("err");
    msg.className = "fbwiz-parse-msg err";
    msg.textContent = "âš ï¸ Parse error â€” make sure you copied the full config block.";
    return;
  }

  const required = ["apiKey","authDomain","projectId","appId"];
  const missing  = required.filter(k => !cfg[k]);
  if (missing.length) {
    ta.classList.add("err");
    msg.className = "fbwiz-parse-msg err";
    msg.textContent = "âš ï¸ Missing fields: " + missing.join(", ");
    return;
  }

  if (cfg.apiKey.includes("DEMO") || cfg.apiKey.includes("REPLACE")) {
    ta.classList.add("err");
    msg.className = "fbwiz-parse-msg err";
    msg.textContent = "âš ï¸ That looks like the placeholder. Please paste your real config.";
    return;
  }

  // All good
  ta.classList.add("ok");
  msg.className = "fbwiz-parse-msg ok";
  msg.textContent = "âœ… Config looks valid!";

  rows.innerHTML = [
    ["Project",  cfg.projectId],
    ["API Key",  cfg.apiKey.slice(0,12) + "â€¦"],
    ["App ID",   cfg.appId.slice(0,20) + "â€¦"],
  ].map(([k,v]) => `<div class="fbwiz-preview-row">âœ“ <b>${k}:</b> ${v}</div>`).join("");
  prev.classList.add("show");

  btn.disabled = false;
  btn._cfg = cfg;

  // Update progress
  document.getElementById("wstep1").classList.add("done");
  document.getElementById("wstep2").classList.add("active");
}

function saveFbConfig() {
  const btn = document.getElementById("fbWizSaveBtn");
  const cfg = btn._cfg;
  if (!cfg) return;

  // Save to localStorage â€” app reads this on next load
  localStorage.setItem("ja_fb_config", JSON.stringify(cfg));

  // Update progress
  document.getElementById("wstep2").classList.add("done");
  document.getElementById("wstep3").classList.add("active","done");

  // Show success screen
  document.getElementById("fbWizOverlay").querySelector(".fbwiz-body").style.display = "none";
  document.getElementById("fbWizSuccess").classList.add("show");
}

// Attach live parse to textarea
document.addEventListener("DOMContentLoaded", () => {
  // Auto-hide special order label after 4s
  setTimeout(() => {
    const lbl = document.getElementById("specialOrderLabel");
    if (lbl) { lbl.style.opacity = "0"; setTimeout(() => { if(lbl) lbl.style.display="none"; }, 500); }
  }, 4000);
  // Auto-hide calc label after 5s
  setTimeout(() => {
    const lbl = document.getElementById("calcFabLabel");
    if (lbl) { lbl.style.opacity = "0"; setTimeout(() => { if(lbl) lbl.style.display="none"; }, 500); }
  }, 5000);

  const ta = document.getElementById("fbConfigPaste");
  if (ta) ta.addEventListener("input", parseFbConfig);
});

// START
window.addEventListener("DOMContentLoaded", () => {
  init();
  showDarkTooltipOnce();
  // Offline detection
  function updateNetworkStatus() {
    const banner = document.getElementById("offlineBanner");
    const dot    = document.getElementById("offlineDot");
    const msg    = document.getElementById("offlineMsg");
    if (!navigator.onLine) {
      banner.classList.add("show");
      dot.className = "offline-dot";
      msg.textContent = "ðŸ“¡ Offline â€” showing cached data";
    } else {
      if (banner.classList.contains("show")) {
        dot.className = "offline-dot online-dot";
        msg.textContent = "âœ“ Back online";
        setTimeout(() => banner.classList.remove("show"), 2200);
      }
    }
  }
  window.addEventListener("offline", updateNetworkStatus);
  window.addEventListener("online",  updateNetworkStatus);
  updateNetworkStatus();

  // â”€â”€ Real-time admin refresh â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // 1. Cross-tab: fires instantly when SAME browser registers in another tab
  window.addEventListener("storage", (e) => {
    if (e.key === "ja_retailers" && isAdmin) {
      renderDashboard();
      if (typeof renderRetailerRequests === "function" &&
          document.getElementById("rrList")) {
        renderRetailerRequests();
      }
      showToast("ðŸ”” New retailer request!", "success");
    }
  });

  // 2. Same-tab polling every 4 seconds â€” catches registrations from
  //    the SAME tab (retailer opens same file, registers, admin was already open)
  let _lastRetailerCount = getRetailers().length;
  setInterval(() => {
    if (!isAdmin) return;
    const retailers = getRetailers();
    if (retailers.length !== _lastRetailerCount) {
      _lastRetailerCount = retailers.length;
      renderDashboard();
      if (typeof renderRetailerRequests === "function" &&
          document.getElementById("rrList")) {
        renderRetailerRequests();
      }
      // Flash the retailers tab badge
      const badge = document.getElementById("rrPendingBadge");
      if (badge) {
        badge.style.animation = "none";
        void badge.offsetWidth;
        badge.style.animation = "badge-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) both";
      }
      showToast("ðŸ”” New retailer request received!");
    }
  }, 4000);
  // Dismiss keyboard when scrolling
  document.addEventListener("scroll", () => {
    const inp = document.getElementById("searchInput");
    if (inp && document.activeElement === inp) inp.blur();
  }, {passive:true});
  // Nav button press feel
  document.querySelectorAll(".nav-btn").forEach(b => {
    b.addEventListener("touchstart", () => b.style.opacity="0.55", {passive:true});
    b.addEventListener("touchend",   () => b.style.opacity="",     {passive:true});
  });
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BROADCAST FEATURE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const BC_TEMPLATES = {
  scheme: `ðŸŽ *JAIN AGENCIES - NEW SCHEME ALERT*\n\nDear Retailer,\n\nWe have an exciting new scheme available! Contact us now to place your order.\n\nðŸ“ž 90862-91862\nðŸ“ Kila Para, Near Digvijay College, Rajnandgaon\n\n_Jain Agencies, Rajnandgaon_`,
  holiday: `ðŸ–ï¸ *JAIN AGENCIES - HOLIDAY NOTICE*\n\nDear Retailer,\n\nPlease note our office will be closed on [DATE] for [HOLIDAY].\n\nFor urgent requirements, contact:\nðŸ“ž 90862-91862\n\n_Jain Agencies, Rajnandgaon_`,
  discount: `ðŸ’° *JAIN AGENCIES - SPECIAL DISCOUNT*\n\nDear Retailer,\n\nSpecial cash discount offer available this week! Pay within 7 days and avail extra discount.\n\nHurry â€” limited period offer!\nðŸ“ž 90862-91862\n\n_Jain Agencies, Rajnandgaon_`,
  reminder: `ðŸ”” *JAIN AGENCIES - PAYMENT REMINDER*\n\nDear [SHOP NAME],\n\nKindly clear your outstanding balance at the earliest.\n\nFor any queries:\nðŸ“ž 90862-91862\nðŸ“ Kila Para, Rajnandgaon\n\nThank you for your business!\n_Jain Agencies_`,
  restock: `ðŸ“¦ *JAIN AGENCIES - RESTOCK ALERT*\n\nDear Retailer,\n\nGood news! The following products are back in stock:\n\nâ€¢ [PRODUCT NAME]\n\nPlace your order now before stock runs out!\nðŸ“ž 90862-91862\n\n_Jain Agencies, Rajnandgaon_`,
  custom: ``
};

let _bcFilter = 'all';
let _bcQueue = [];
let _bcQueueIdx = 0;

function renderBroadcastPanel() {
  updateBCPreview();
  loadBCCities();
  renderBCRecipients();
}

function setBCTemplate(type) {
  const ta = document.getElementById('bcMessage');
  if (ta) { ta.value = BC_TEMPLATES[type] || ''; updateBCPreview(); }
}

function setBCFilter(f) {
  _bcFilter = f;
  document.getElementById('bcf-all').style.cssText = f === 'all'
    ? 'flex:1;min-width:80px;padding:10px;border-radius:12px;border:2px solid #7c3aed;background:#F5F3FF;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;color:#7c3aed'
    : 'flex:1;min-width:80px;padding:10px;border-radius:12px;border:2px solid #E2E8F0;background:#F8FAFC;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;color:#475569';
  document.getElementById('bcf-city').style.cssText = f === 'city'
    ? 'flex:1;min-width:80px;padding:10px;border-radius:12px;border:2px solid #7c3aed;background:#F5F3FF;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;color:#7c3aed'
    : 'flex:1;min-width:80px;padding:10px;border-radius:12px;border:2px solid #E2E8F0;background:#F8FAFC;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;color:#475569';
  document.getElementById('bcCityFilter').style.display = f === 'city' ? 'block' : 'none';
  renderBCRecipients();
}

function loadBCCities() {
  const retailers = getRetailers().filter(r => r.status === 'approved' && r.mobile);
  const cities = [...new Set(retailers.map(r => r.city).filter(Boolean))].sort();
  const sel = document.getElementById('bcCitySelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">All Cities</option>' +
    cities.map(city => `<option value="${city}">${city}</option>`).join('');
}

function getBCRecipients() {
  const retailers = getRetailers().filter(r => r.status === 'approved' && r.mobile);
  if (_bcFilter === 'city') {
    const city = document.getElementById('bcCitySelect')?.value;
    return city ? retailers.filter(r => r.city === city) : retailers;
  }
  return retailers;
}

function renderBCRecipients() {
  const list = getBCRecipients();
  const badge = document.getElementById('bcRecipientBadge');
  const countEl = document.getElementById('bcRetailerCount');
  const listEl = document.getElementById('bcRecipientList');
  if (badge) badge.textContent = list.length;
  if (countEl) countEl.textContent = `${list.length} recipient${list.length !== 1 ? 's' : ''}`;
  if (!listEl) return;
  if (!list.length) {
    listEl.innerHTML = '<div style="text-align:center;padding:20px;color:#94A3B8;font-size:13px;font-weight:600">No approved retailers with mobile numbers</div>';
    return;
  }
  listEl.innerHTML = list.map(r => `
    <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #F1F5F9">
      <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a855f7);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:#fff;flex-shrink:0">${(r.shop||r.name||'?')[0].toUpperCase()}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:800;color:#1E293B;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.shop||r.name||'Unknown'}</div>
        <div style="font-size:11px;color:#94A3B8;font-weight:600">${r.mobile}${r.city ? ' Â· '+r.city : ''}</div>
      </div>
      <div style="font-size:10px;font-weight:800;background:#D1FAE5;color:#065F46;padding:3px 8px;border-radius:20px">âœ“</div>
    </div>`).join('');
}

function updateBCPreview() {
  const msg = document.getElementById('bcMessage')?.value || '';
  const preview = document.getElementById('bcPreviewText');
  const charCount = document.getElementById('bcCharCount');
  if (preview) {
    if (msg.trim()) {
      preview.style.cssText = 'font-size:13px;color:#1a1a1a;white-space:pre-wrap;line-height:1.5;font-weight:500;min-height:40px';
      preview.textContent = msg;
    } else {
      preview.style.cssText = 'font-size:13px;color:#888;font-style:italic;min-height:40px';
      preview.textContent = 'Your message will appear here...';
    }
  }
  if (charCount) charCount.textContent = `${msg.length} characters`;
  renderBCRecipients();
}

function startBroadcast() {
  const msg = document.getElementById('bcMessage')?.value?.trim();
  if (!msg) { showToast('Please write a message first', 'error'); return; }
  const recipients = getBCRecipients();
  if (!recipients.length) { showToast('No recipients found', 'error'); return; }
  if (!confirm(`Send broadcast to ${recipients.length} retailer${recipients.length !== 1 ? 's' : ''}?\n\nWhatsApp will open for each one â€” tap Send in WhatsApp, then come back to continue.`)) return;
  _bcQueue = recipients;
  _bcQueueIdx = 0;
  document.getElementById('bcSentLog').style.display = 'block';
  document.getElementById('bcSentLogInner').innerHTML = '';
  sendNextBroadcast(msg);
}

function sendNextBroadcast(msg) {
  if (_bcQueueIdx >= _bcQueue.length) {
    showToast(`âœ… Broadcast sent to ${_bcQueue.length} retailers!`, 'success');
    document.getElementById('bcSendBtn').textContent = 'âœ… Broadcast Complete!';
    return;
  }
  const r = _bcQueue[_bcQueueIdx];
  const phone = '91' + r.mobile.replace(/\D/g,'');
  const personalMsg = msg.replace('[SHOP NAME]', r.shop || r.name || 'Retailer');
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(personalMsg)}`;

  // Log entry
  const logEl = document.getElementById('bcSentLogInner');
  const idx = _bcQueueIdx;
  logEl.innerHTML += `<div id="bclog_${idx}" style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #BBF7D0;font-size:12px">
    <span id="bclog_icon_${idx}">â³</span>
    <span style="flex:1;font-weight:700;color:#166534">${r.shop||r.name} Â· ${r.mobile}</span>
    <span id="bclog_status_${idx}" style="font-size:10px;font-weight:800;color:#64748B">Opening...</span>
  </div>`;

  // Open WhatsApp
  window.open(url, '_blank');

  // Mark as sent after delay, then move to next
  setTimeout(() => {
    const icon = document.getElementById(`bclog_icon_${idx}`);
    const status = document.getElementById(`bclog_status_${idx}`);
    if (icon) icon.textContent = 'âœ…';
    if (status) { status.textContent = 'Sent'; status.style.color = '#059669'; }
    _bcQueueIdx++;
    // Small pause between each to avoid spam detection
    setTimeout(() => sendNextBroadcast(msg), 2000);
  }, 3000);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ðŸ”” FCM PUSH NOTIFICATION FUNCTIONS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function loadFCMKeys() {
  return {
    vapid:     localStorage.getItem("ja_fcm_vapid")  || "",
    serverKey: localStorage.getItem("ja_fcm_srvkey") || ""
  };
}

function saveFCMKeys() {
  const vapid     = (document.getElementById("fcmVapidInput")     || {}).value || "";
  const serverKey = (document.getElementById("fcmServerKeyInput") || {}).value || "";
  if (!vapid || !serverKey) { showToast("âš ï¸ Both keys are required", "error"); return; }
  localStorage.setItem("ja_fcm_vapid",  vapid.trim());
  localStorage.setItem("ja_fcm_srvkey", serverKey.trim());
  // Update VAPID key on the _fb object so next token request uses the right key
  if (window._fb) window._fb.VAPID_KEY = vapid.trim();
  const msg = document.getElementById("fcmKeysSavedMsg");
  if (msg) { msg.style.display = "block"; setTimeout(() => msg.style.display = "none", 3000); }
  showToast("âœ… FCM keys saved!");
  refreshFCMStatus();
}

function copyFCMSWCode() {
  const code = (document.getElementById("fcmSWCode") || {}).textContent || "";
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(() => showToast("ðŸ“‹ Copied to clipboard!"));
  } else {
    const ta = document.createElement("textarea");
    ta.value = code; document.body.appendChild(ta); ta.select();
    document.execCommand("copy"); document.body.removeChild(ta);
    showToast("ðŸ“‹ Copied!");
  }
}

async function refreshFCMStatus() {
  const el = document.getElementById("fcmStatusInner");
  if (!el) return;
  const keys = loadFCMKeys();
  const fbOk = window._fb && window._fb.FB_OK;
  const swOk = "serviceWorker" in navigator;
  const notifOk = "Notification" in window;

  // Pre-fill inputs if keys saved
  const vi = document.getElementById("fcmVapidInput");
  const si = document.getElementById("fcmServerKeyInput");
  if (vi && keys.vapid) vi.value = keys.vapid;
  if (si && keys.serverKey) si.value = keys.serverKey;

  // Count FCM tokens in Firestore
  let tokenCount = "â€”";
  if (fbOk) {
    try {
      const tokens = await window._fb.getAllFCMTokens();
      tokenCount = tokens.length;
      const countEl = document.getElementById("pushSubscriberCount");
      if (countEl) countEl.textContent = tokenCount;
    } catch(e) {}
  }

  const row = (icon, label, ok, note) =>
    `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #F1F5F9">
      <div style="font-size:18px">${ok ? "âœ…" : "âŒ"}</div>
      <div style="flex:1"><div style="font-size:12px;font-weight:800;color:#1E293B">${label}</div>
      ${note ? `<div style="font-size:11px;color:#64748B;font-weight:600">${note}</div>` : ""}</div>
    </div>`;

  el.innerHTML =
    row("ðŸ”¥", "Firebase connected", fbOk, fbOk ? "Firestore live" : "Check FB_CONFIG") +
    row("ðŸ”‘", "VAPID key", !!keys.vapid, keys.vapid ? "Saved âœ“" : "Paste in Keys Setup below") +
    row("ðŸ—ï¸", "Server key", !!keys.serverKey, keys.serverKey ? "Saved âœ“" : "Paste in Keys Setup below") +
    row("ðŸ“„", "Service Worker API", swOk, swOk ? "Supported" : "Requires HTTPS") +
    row("ðŸ””", "Notification API", notifOk, notifOk ? `Permission: ${Notification.permission}` : "Not supported") +
    `<div style="display:flex;align-items:center;gap:10px;padding:8px 0">
      <div style="font-size:18px">ðŸ“±</div>
      <div style="flex:1"><div style="font-size:12px;font-weight:800;color:#1E293B">Subscribed devices</div>
      <div style="font-size:11px;color:#64748B;font-weight:600">${tokenCount} retailer${tokenCount===1?"":"s"} with push enabled</div></div>
    </div>`;
}

function renderFCMPushPanel() {
  // Load saved keys into inputs
  const keys = loadFCMKeys();
  const vi = document.getElementById("fcmVapidInput");
  const si = document.getElementById("fcmServerKeyInput");
  if (vi && keys.vapid && !vi.value) vi.value = keys.vapid;
  if (si && keys.serverKey && !si.value) si.value = keys.serverKey;
  refreshFCMStatus();
}

const PUSH_TEMPLATES = {
  flash:   { title: "âš¡ Flash Sale â€” Limited Time!",    body: "Exclusive discount on select products for the next 2 hours. Open the app now to order!" },
  scheme:  { title: "ðŸ”¥ New Scheme Available",           body: "Check out the latest hot deals on Alkem, Abbott & more. Valid this week only!" },
  stock:   { title: "ðŸ“¦ Fresh Stock Arrived",            body: "Items you frequently order are back in stock. Place your order now!" },
  payment: { title: "ðŸ’° Payment Reminder",               body: "Your outstanding balance is due. Please clear it at your earliest convenience." },
  order:   { title: "ðŸ“‹ Your Order is Ready",            body: "Your latest order has been packed and is ready for dispatch. Thank you!" }
};

function setPushTemplate(key) {
  const t = PUSH_TEMPLATES[key];
  if (!t) return;
  const titleEl = document.getElementById("pushTitle");
  const bodyEl  = document.getElementById("pushBody");
  if (titleEl) titleEl.value = t.title;
  if (bodyEl)  bodyEl.value  = t.body;
  updatePushPreview();
}

function updatePushPreview() {
  const title = (document.getElementById("pushTitle") || {}).value || "Notification title appears here";
  const body  = (document.getElementById("pushBody")  || {}).value || "Message body will appear here...";
  const pt = document.getElementById("pushPreviewTitle");
  const pb = document.getElementById("pushPreviewBody");
  if (pt) pt.textContent = title;
  if (pb) pb.textContent = body;
}

async function sendFCMPush() {
  const keys = loadFCMKeys();
  if (!keys.serverKey) {
    showToast("âš ï¸ Server key not set â€” go to Keys Setup", "error");
    return;
  }
  const title = (document.getElementById("pushTitle") || {}).value.trim();
  const body  = (document.getElementById("pushBody")  || {}).value.trim();
  if (!title) { showToast("âš ï¸ Notification title is required", "error"); return; }

  const btn = document.getElementById("fcmSendBtn");
  const resultEl = document.getElementById("fcmSendResult");
  if (btn) { btn.disabled = true; btn.textContent = "â³ Sending..."; }

  try {
    // Get all FCM tokens from Firestore
    const tokenDocs = await window._fb.getAllFCMTokens();
    if (!tokenDocs.length) {
      showToast("â„¹ï¸ No subscribers yet â€” retailers need to open the app once", "error");
      if (btn) { btn.disabled = false; btn.innerHTML = "ðŸ”” Send Push to All Retailers"; }
      return;
    }

    const tokens = tokenDocs.map(d => d.token).filter(Boolean);
    let sent = 0, failed = 0;

    // Send via FCM Legacy HTTP API (batch up to 1000 tokens)
    const BATCH = 500;
    for (let i = 0; i < tokens.length; i += BATCH) {
      const batch = tokens.slice(i, i + BATCH);
      const payload = {
        registration_ids: batch,
        notification: { title, body },
        data: { click_action: "FLUTTER_NOTIFICATION_CLICK", url: window.location.href }
      };
      try {
        const res = await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "key=" + keys.serverKey
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        sent   += (data.success  || 0);
        failed += (data.failure  || 0);
        // Clean up bad tokens
        if (data.results && Array.isArray(data.results)) {
          data.results.forEach((r, idx) => {
            if (r.error === "NotRegistered" || r.error === "InvalidRegistration") {
              const badDoc = tokenDocs[i + idx];
              if (badDoc && badDoc.retailerId && window._fb) {
                window._fb.deletePushToken(badDoc.retailerId);
              }
            }
          });
        }
      } catch(fetchErr) {
        failed += batch.length;
        console.warn("FCM batch error:", fetchErr);
      }
    }

    // Show result
    const success = sent > 0;
    if (resultEl) {
      resultEl.style.display = "block";
      resultEl.style.background = success ? "#F0FDF4" : "#FEF2F2";
      resultEl.style.border = `1.5px solid ${success ? "#BBF7D0" : "#FECACA"}`;
      resultEl.style.color  = success ? "#166534" : "#991B1B";
      resultEl.textContent = success
        ? `âœ… Push sent! ${sent} delivered Â· ${failed} failed`
        : `âŒ All ${failed} sends failed â€” check server key`;
    }
    showToast(success ? `ðŸ”” Push sent to ${sent} retailers!` : "âŒ Push failed â€” check server key", success ? "success" : "error");

    // Log to Firestore announcements for audit trail
    if (window._fb && window._fb.FB_OK) {
      window._fb.saveAnnouncement({
        id: Date.now(),
        type: "info",
        title: `[PUSH] ${title}`,
        body: `${body} â€” Sent to ${sent}/${tokens.length} devices`,
        date: new Date().toLocaleDateString("en-IN")
      });
    }

  } catch(e) {
    console.error("FCM sendFCMPush error:", e);
    showToast("âŒ Error sending push: " + e.message, "error");
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = "ðŸ”” Send Push to All Retailers"; }
  }
}
let _voiceActive = false;

function startVoiceSearch() {

  if (_voiceActive) { stopVoiceSearch(); return; }

  if (isInAppBrowser() || window.location.protocol === "content:") {
    showVoiceBlocked();
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  if (!SpeechRecognition) {
    showVoiceBlocked("notSupported");
    return;
  }

  document.getElementById("voiceListeningState").style.display = "";
  document.getElementById("voiceBlockedState").style.display = "none";
  document.getElementById("voiceOverlay").classList.add("open");
  document.getElementById("voiceResult").textContent = "Say a medicine nameâ€¦";
  document.getElementById("voiceBtn").classList.add("listening");
  _voiceActive = true;

  try { _voiceRecog = new SpeechRecognition(); }
  catch(e) { stopVoiceSearch(); showVoiceBlocked(); return; }
  _voiceRecog.lang = "en-IN";
  _voiceRecog.interimResults = true;
  _voiceRecog.maxAlternatives = 1;
  _voiceRecog.continuous = false;

  _voiceRecog.onresult = (e) => {
    let interim = "", final = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) final += t;
      else interim += t;
    }
    const text = final || interim;
    document.getElementById("voiceResult").textContent = text || "Listeningâ€¦";
    if (final) {
      document.getElementById("searchInput").value = final.trim();
      document.getElementById("clearBtn").style.display = "block";
      handleSearch();
      stopVoiceSearch();
    }
  };

  _voiceRecog.onerror = (e) => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {

      stopVoiceSearch();
      showVoiceBlocked();
    } else {
      const msgs = {
        "no-speech"    : "No speech detected â€” try again",
        "network"      : "Network error â€” check connection",
        "audio-capture": "Microphone not found on this device"
      };
      showToast(msgs[e.error] || "Voice error: " + e.error, "error");
      stopVoiceSearch();
    }
  };

  _voiceRecog.onend = () => {
    if (_voiceActive) stopVoiceSearch();
  };

  try {
    _voiceRecog.start();
  } catch(e) {
    showVoiceBlocked();
  }
}

function showVoiceBlocked(reason) {
  _voiceActive = false;
  const isNotSupported = reason === "notSupported";
  document.getElementById("voiceListeningState").style.display = "none";
  const blockedEl = document.getElementById("voiceBlockedState");
  blockedEl.style.display = "";

  if (isNotSupported) {
    blockedEl.innerHTML =
      `<div style="font-size:56px;margin-bottom:16px">ðŸš«</div>` +
      `<div style="color:#fff;font-size:17px;font-weight:900;margin-bottom:8px">Voice not supported</div>` +
      `<div style="color:rgba(255,255,255,0.7);font-size:13px;line-height:1.7">` +
      `This browser doesn't support voice search.<br>Use <strong style="color:#00e5cc">Chrome on Android</strong> for voice.` +
      `</div>`;
  }
  document.getElementById("voiceOverlay").classList.add("open");
  document.getElementById("voiceBtn").classList.remove("listening");
}

function stopVoiceSearch() {
  _voiceActive = false;
  if (_voiceRecog) { try { _voiceRecog.stop(); } catch(e){} _voiceRecog = null; }
  document.getElementById("voiceOverlay").classList.remove("open");
  document.getElementById("voiceBtn").classList.remove("listening");

  document.getElementById("voiceListeningState").style.display = "";
  document.getElementById("voiceBlockedState").style.display = "none";
}

const _voiceOverlayEl = document.getElementById("voiceOverlay");
if (_voiceOverlayEl) _voiceOverlayEl.addEventListener("click", (e) => {
  if (e.target === document.getElementById("voiceOverlay")) stopVoiceSearch();
});

let _pwaPrompt = null;

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then(reg => {
      console.log('âœ… SW registered, scope:', reg.scope);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w.addEventListener('statechange', () => {
          if (w.state === 'installed' && navigator.serviceWorker.controller) {
            showToast('ðŸ”„ App updated â€” reload for latest version');
          }
        });
      });
    })
    .catch(err => console.warn('SW registration failed:', err.message));
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  _pwaPrompt = e;

  if (window.matchMedia("(display-mode: standalone)").matches) return;
  if (navigator.standalone) return; // iOS Safari
  const dismissed = localStorage.getItem("ja_pwa_dismissed");
  if (!dismissed) {
    setTimeout(() => {
      document.getElementById("pwaBanner").classList.add("show");
    }, 3000);
  }
});

window.addEventListener("appinstalled", () => {
  document.getElementById("pwaBanner").classList.remove("show");
  _pwaPrompt = null;
  showToast("âœ… App installed! Open from home screen", "success");
  localStorage.setItem("ja_pwa_dismissed", "1");
});

async function triggerPWAInstall() {
  if (_pwaPrompt) {
    _pwaPrompt.prompt();
    const { outcome } = await _pwaPrompt.userChoice;
    if (outcome === "accepted") {
      showToast("âœ… Installing Jain Agenciesâ€¦");
      _pwaPrompt = null;
    }
    document.getElementById("pwaBanner").classList.remove("show");
  } else {

    showIOSInstallGuide();
  }
}

function dismissPWA() {
  document.getElementById("pwaBanner").classList.remove("show");
  localStorage.setItem("ja_pwa_dismissed", "1");
}

function showIOSInstallGuide() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(navigator.userAgent);
  let msg = "";
  if (isIOS) {
    msg = "ðŸ“± iOS: Tap Share (â–¡â†‘) â†’ 'Add to Home Screen'";
  } else if (isAndroid) {
    msg = "ðŸ“± Tap Chrome Menu (â‹®) â†’ 'Add to Home screen'";
  } else {
    msg = "ðŸ“± Browser Menu â†’ 'Install App' or 'Add to Home Screen'";
  }
  showToast(msg, "info");
}

function showPWABanner() {

  if (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone) {
    showToast("âœ… App is already installed!", "success");
    return;
  }
  if (_pwaPrompt) {
    document.getElementById("pwaBanner").classList.add("show");
  } else {
    showIOSInstallGuide();
  }
}

/* FAB right-side positioning: anchor to #app container right edge */
function toggleHeaderMenu() {
  const dd = document.getElementById("headerMenuDropdown");
  if (!dd) return;
  const isOpen = dd.style.display !== "none";
  dd.style.display = isOpen ? "none" : "block";
  if (!isOpen) {
    // Close when clicking outside
    setTimeout(() => {
      document.addEventListener("click", function closeMenu(e) {
        if (!document.getElementById("headerMenuBtn").contains(e.target)) {
          dd.style.display = "none";
          document.removeEventListener("click", closeMenu);
        }
      });
    }, 10);
  }
}
function closeHeaderMenu() {
  const dd = document.getElementById("headerMenuDropdown");
  if (dd) dd.style.display = "none";
}

function positionFabStack() {
  var fab = document.getElementById('fabStack');
  var app = document.getElementById('app');
  if (!fab) return;
  fab.style.setProperty('position', 'fixed', 'important');
  fab.style.setProperty('left', 'auto', 'important');
  fab.style.setProperty('top', 'auto', 'important');
  fab.style.setProperty('bottom', '80px', 'important');
  if (app) {
    var rect = app.getBoundingClientRect();
    var right = window.innerWidth - rect.right + 14;
    fab.style.setProperty('right', Math.max(14, right) + 'px', 'important');
  } else {
    fab.style.setProperty('right', '14px', 'important');
  }
}
/* Run immediately, after paint, and on resize */
positionFabStack();
requestAnimationFrame(function(){ requestAnimationFrame(positionFabStack); });
window.addEventListener('resize', positionFabStack);
document.addEventListener('DOMContentLoaded', positionFabStack);
window.addEventListener('load', positionFabStack);
/* === JAIN AGENCIES USEFUL CHANGES ENHANCEMENTS === */
function jaCsvCell(v) {
  return '"' + String(v ?? '').replace(/"/g, '""') + '"';
}

function jaDownloadText(filename, text, mime) {
  const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function jaNormalizeProductName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toUpperCase();
}

function jaProductKey(name, company, packing) {
  return [name, company, packing].map(jaNormalizeProductName).join('|');
}

function jaValidateImportRows(rows) {
  const existing = new Map();
  products.forEach(p => existing.set(jaProductKey(p.name, p.company, p.packing), p));
  const seen = new Map();
  return rows.map((r, idx) => {
    const name = (r.name || r['medicine name'] || r['product name'] || '').trim();
    const company = (r.company || r['company name'] || '').trim();
    const packing = (r.packing || r.pack || '').trim();
    const mrp = (r.mrp || '').trim();
    const ptr = (r.ptr || r.pts || '').trim();
    const category = capitalize(r.category || 'Tablet');
    const key = jaProductKey(name, company, packing);
    const warnings = [];
    const errors = [];

    if (!name) errors.push('Missing name');
    if (!company) errors.push('Missing company');
    if (name.length > 90) warnings.push('Long name');
    if (mrp && isNaN(Number(mrp))) warnings.push('MRP is not numeric');
    if (ptr && isNaN(Number(ptr))) warnings.push('PTR is not numeric');
    if (existing.has(key)) errors.push('Already exists');
    if (seen.has(key)) errors.push('Duplicate in file');
    if (key !== '||') seen.set(key, true);
    if (category && !CATS.includes(category)) warnings.push('New category: ' + category);

    return { row: r, index: idx + 2, name, company, packing, category, key, errors, warnings, ok: !errors.length };
  });
}

function showExcelPreview(rows, headers) {
  const el = document.getElementById('excelPreview');
  if (!el) return;
  const report = jaValidateImportRows(rows);
  const okCount = report.filter(r => r.ok).length;
  const errorCount = report.filter(r => r.errors.length).length;
  const warningCount = report.filter(r => r.warnings.length).length;
  const preview = report.slice(0, 8);
  const importBtn = document.getElementById('excelImportBtn');
  if (importBtn) {
    importBtn.style.display = okCount ? 'flex' : 'none';
    importBtn.textContent = okCount ? `Import ${okCount} Valid Products` : 'No Valid Products';
  }
  el.innerHTML = `
    <div class="excel-preview-card import-review-card">
      <div class="excel-preview-title">Import Review</div>
      <div class="import-summary-grid">
        <div><b>${rows.length}</b><span>Rows</span></div>
        <div class="ok"><b>${okCount}</b><span>Valid</span></div>
        <div class="warn"><b>${warningCount}</b><span>Warnings</span></div>
        <div class="err"><b>${errorCount}</b><span>Skipped</span></div>
      </div>
      ${preview.map(item => `
        <div class="import-row ${item.ok ? 'ok' : 'err'}">
          <div class="import-row-main">
            <strong>${item.name || '?'}</strong>
            <span>${item.company || '?'}${item.packing ? ' Â· ' + item.packing : ''}</span>
          </div>
          <div class="import-row-flags">
            ${item.errors.map(e => `<span class="flag err">${e}</span>`).join('')}
            ${item.warnings.map(w => `<span class="flag warn">${w}</span>`).join('')}
            ${item.ok && !item.warnings.length ? '<span class="flag ok">Ready</span>' : ''}
          </div>
        </div>`).join('')}
      ${report.length > preview.length ? `<div class="import-more">+ ${report.length - preview.length} more rows checked</div>` : ''}
    </div>`;
}

function importExcelData() {
  if (!excelParsedRows.length) { showToast('No data to import', 'error'); return; }
  const report = jaValidateImportRows(excelParsedRows);
  const valid = report.filter(r => r.ok);
  if (!valid.length) {
    showToast('No valid products to import', 'error');
    showExcelPreview(excelParsedRows, []);
    return;
  }
  let nextId = products.length ? Math.max(...products.map(p => Number(p.id) || 0)) + 1 : 1;
  valid.forEach(item => {
    const r = item.row;
    products.push({
      id: nextId++,
      name: item.name,
      company: item.company,
      category: item.category || 'Tablet',
      packing: item.packing,
      mrp: r.mrp || '',
      ptr: r.ptr || r.pts || '',
      formula: r.formula || r.composition || '',
      scheme: r.scheme || '',
      division: r.division || '',
      stock: !['no','false','0','out'].includes(String(r.stock || 'yes').trim().toLowerCase())
    });
  });
  saveData();
  buildCatChips();
  buildCompanySelect();
  renderProductList();
  updateCountBtn();
  const skipped = report.length - valid.length;
  excelParsedRows = [];
  const preview = document.getElementById('excelPreview');
  if (preview) preview.innerHTML = '';
  const btn = document.getElementById('excelImportBtn');
  if (btn) btn.style.display = 'none';
  const zone = document.getElementById('excelZone');
  if (zone) zone.classList.remove('has-file');
  const icon = document.getElementById('excelZoneIcon');
  if (icon) icon.textContent = 'ðŸ“Š';
  const title = document.getElementById('excelZoneTitle');
  if (title) title.textContent = 'Upload Excel / CSV File';
  const file = document.getElementById('excelZoneFile');
  if (file) file.textContent = '';
  showToast(`Imported ${valid.length} products${skipped ? ', ' + skipped + ' skipped' : ''}`, 'success');
  switchAdminTab('products');
}

function jaOrderHistoryEntry(status, note) {
  return { status, at: new Date().toLocaleString('en-IN'), note: note || '' };
}

function jaEnsureOrderHistory(order, status, note) {
  if (!order.statusHistory) order.statusHistory = [];
  if (!order.statusHistory.length) {
    order.statusHistory.push(jaOrderHistoryEntry(order.status || status || 'Pending', 'Order created'));
  }
  if (status && order.statusHistory[order.statusHistory.length - 1]?.status !== status) {
    order.statusHistory.push(jaOrderHistoryEntry(status, note));
  }
  return order;
}

async function fbSaveOrder(order) {
  jaEnsureOrderHistory(order, order.status || 'Pending', 'Order placed');
  try {
    const existing = JSON.parse(localStorage.getItem('ja_orders') || '[]');
    localStorage.setItem('ja_orders', JSON.stringify([order, ...existing.filter(o => o.id !== order.id)].slice(0, 100)));
  } catch {}
  if (window._fb && window._fb.FB_OK) await window._fb.saveOrder(order);
}

function updateOrderStatus(orderId, newStatus) {
  const orders = getOrders();
  const o = orders.find(x => x.id === orderId);
  if (!o) return;
  const oldStatus = o.status || 'Pending';
  o.status = newStatus;
  o.statusUpdatedAt = new Date().toLocaleString('en-IN');
  jaEnsureOrderHistory(o, newStatus, oldStatus === newStatus ? 'Status refreshed' : `Changed from ${oldStatus}`);
  saveOrders(orders);
  if (window._fb && window._fb.FB_OK) {
    window._fb.updateOrder(orderId, { status: newStatus, statusUpdatedAt: o.statusUpdatedAt, statusHistory: o.statusHistory });
  }
  showToast(`Order ${orderId} â†’ ${newStatus}`);
  if (typeof currentAdminTab !== 'undefined' && currentAdminTab === 'orders') renderAdminOrders();
  renderMyOrders();
  updateOrdersNavDot();
  triggerOrderStatusWA(o, newStatus);
}

const jaOriginalBuildOrderCard = buildOrderCard;
function buildOrderCard(o, adminMode) {
  jaEnsureOrderHistory(o, o.status || 'Pending');
  const history = (o.statusHistory || []).slice(-6).map(h => `
    <div class="order-history-step">
      <span class="order-history-dot"></span>
      <div><strong>${h.status}</strong><small>${h.at || ''}${h.note ? ' Â· ' + h.note : ''}</small></div>
    </div>`).join('');
  const html = jaOriginalBuildOrderCard(o, adminMode);
  const timeline = history ? `<div class="order-history-timeline"><div class="order-history-title">Status history</div>${history}</div>` : '';
  return html.replace('<div class="order-items-toggle"', timeline + '<div class="order-items-toggle"');
}

function exportFullBackup() {
  const backup = {
    exportedAt: new Date().toISOString(),
    app: 'Jain Agencies Medicine Catalog',
    products,
    orders: getOrders(),
    retailers: (typeof getRetailers === 'function' ? getRetailers() : []),
    schemes: (typeof schemes !== 'undefined' ? schemes : []),
    announcements: (typeof getAnnouncements === 'function' ? getAnnouncements() : []),
    customCompanies: (typeof customCompanies !== 'undefined' ? customCompanies : [])
  };
  jaDownloadText('JainAgencies_Backup_' + new Date().toISOString().slice(0,10) + '.json', JSON.stringify(backup, null, 2), 'application/json;charset=utf-8');
  showToast('Backup exported', 'success');
}

function exportProductsJSON() {
  jaDownloadText('JainAgencies_Products.json', JSON.stringify(products, null, 2), 'application/json;charset=utf-8');
  showToast('Products JSON exported', 'success');
}

function jaEnhanceSyncIndicators() {
  const dot = document.getElementById('fbStatusDot');
  const banner = document.getElementById('offlineBanner');
  const msg = document.getElementById('offlineMsg');
  const fbOk = !!(window._fb && window._fb.FB_OK);
  if (dot) {
    dot.className = 'sync-dot ' + (!navigator.onLine ? 'offline' : fbOk ? 'online' : 'local');
    dot.title = !navigator.onLine ? 'Offline: cached data only' : fbOk ? 'Firebase sync active' : 'Local-only mode';
  }
  if (banner && msg) {
    if (!navigator.onLine) {
      banner.classList.add('show', 'is-offline');
      msg.textContent = 'Offline â€” orders and catalog changes are cached on this device';
    } else if (!fbOk) {
      banner.classList.add('show', 'is-local');
      msg.textContent = 'Local-only mode â€” configure Firebase for live sync across devices';
    } else {
      banner.classList.remove('show', 'is-offline', 'is-local');
    }
  }
}

function jaInstallBackupPanel() {
  const panel = document.getElementById('apanel-database');
  if (!panel || document.getElementById('jaBackupPanel')) return;
  const box = document.createElement('div');
  box.id = 'jaBackupPanel';
  box.className = 'backup-panel';
  box.innerHTML = `
    <div class="backup-panel-title">Backup & Maintenance</div>
    <div class="backup-panel-sub">Export a full JSON backup before large imports or stock updates.</div>
    <div class="backup-actions">
      <button onclick="exportFullBackup()">Export Full Backup</button>
      <button onclick="exportProductsJSON()">Export Products JSON</button>
    </div>`;
  panel.appendChild(box);
}

window.addEventListener('online', jaEnhanceSyncIndicators);
window.addEventListener('offline', jaEnhanceSyncIndicators);
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    jaEnhanceSyncIndicators();
    jaInstallBackupPanel();
  }, 600);
  setInterval(jaEnhanceSyncIndicators, 5000);
});
/* === END JAIN AGENCIES USEFUL CHANGES ENHANCEMENTS === */
/* === JAIN AGENCIES SR REALTIME IMPROVEMENTS === */
function jaSlug(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
}

function jaTodayKey() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

function jaClientOrderId(prefix) {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix || 'JA'}-${jaTodayKey().replace(/-/g, '')}-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

function jaOrderFingerprint(order) {
  const itemSig = (order.items || []).map(i => `${i.id || i.name}:${i.qty}:${i.unit || ''}`).sort().join('|');
  return [jaSlug(order.retailer || order.srShop), itemSig, order.totalQty || 0].join('::');
}

function jaGetPendingSyncOrders() {
  try { return JSON.parse(localStorage.getItem('ja_pending_sync_orders') || '[]'); } catch { return []; }
}

function jaSavePendingSyncOrders(list) {
  try { localStorage.setItem('ja_pending_sync_orders', JSON.stringify(list.slice(0, 200))); } catch {}
}

function jaGetSyncedClientIds() {
  try { return JSON.parse(localStorage.getItem('ja_synced_client_order_ids') || '[]'); } catch { return []; }
}

function jaMarkClientSynced(clientOrderId) {
  if (!clientOrderId) return;
  const ids = jaGetSyncedClientIds().filter(id => id !== clientOrderId);
  ids.unshift(clientOrderId);
  try { localStorage.setItem('ja_synced_client_order_ids', JSON.stringify(ids.slice(0, 500))); } catch {}
}

function jaQueueOrderForSync(order, reason) {
  const pending = jaGetPendingSyncOrders().filter(o => o.clientOrderId !== order.clientOrderId);
  pending.unshift({ ...order, syncStatus: 'pending', syncReason: reason || 'Waiting for Firebase sync', queuedAt: new Date().toLocaleString('en-IN') });
  jaSavePendingSyncOrders(pending);
}

function jaResolveRetailerContext() {
  const info = typeof getRetailerInfo === 'function' ? getRetailerInfo() : {};
  const srShop = srMode && currentSR ? (srActiveShop || '') : '';
  const name = srShop || info.store || (document.getElementById('retailerName')?.value || '').trim() || 'Retailer';
  return {
    retailerId: jaSlug(name),
    retailerName: name,
    retailerMobile: info.mobile || '',
    retailerCity: info.city || '',
    retailerAddress: info.address || '',
    placedByType: srMode && currentSR ? 'sr' : 'retailer',
    placedById: srMode && currentSR ? currentSR.code : jaSlug(info.mobile || name),
    placedByName: srMode && currentSR ? currentSR.name : name,
    srCode: srMode && currentSR ? currentSR.code : '',
    srName: srMode && currentSR ? currentSR.name : '',
    srShop
  };
}

function jaValidateSRSession(showMessage) {
  if (!srMode) return true;
  const list = loadSRList();
  const fresh = currentSR && list.find(s => String(s.code).toUpperCase() === String(currentSR.code).toUpperCase());
  if (!fresh) {
    srLogout();
    if (showMessage) showToast('SR access needs to be verified again', 'error');
    return false;
  }
  currentSR = { ...fresh };
  const allowed = currentSR.shops || [];
  if (srActiveShop && allowed.length && !allowed.includes(srActiveShop)) {
    srActiveShop = null;
    updateSRBanner();
    if (showMessage) showToast('Selected shop is no longer assigned to this SR', 'error');
    openSRShopModal();
    return false;
  }
  localStorage.setItem('ja_sr_session', JSON.stringify(currentSR));
  return true;
}

function jaRequireSRShop() {
  if (!srMode) return true;
  if (!jaValidateSRSession(true)) return false;
  if (!srActiveShop) {
    showToast('Select retailer/shop before adding items', 'error');
    openSRShopModal();
    return false;
  }
  return true;
}

function jaCartContextKey() {
  const ctx = jaResolveRetailerContext();
  return `${ctx.placedByType}:${ctx.placedById}:${ctx.retailerId}`;
}

function jaCheckCartContextBeforeAdd() {
  if (!srMode) return true;
  if (!jaRequireSRShop()) return false;
  const key = jaCartContextKey();
  const saved = localStorage.getItem('ja_cart_context_key');
  if (cart.length && saved && saved !== key) {
    const ok = confirm('This cart belongs to another retailer/shop. Clear cart and start a new order for ' + srActiveShop + '?');
    if (!ok) return false;
    cart = [];
    saveCart();
    updateCartUI();
  }
  localStorage.setItem('ja_cart_context_key', key);
  return true;
}

const jaOriginalSelectSRShop = selectSRShop;
function selectSRShop(shop) {
  if (cart.length && srActiveShop && srActiveShop !== shop) {
    const ok = confirm('Switching shop will clear the current cart to avoid mixing retailer orders. Continue?');
    if (!ok) return;
    cart = [];
    saveCart();
    updateCartUI();
  }
  jaOriginalSelectSRShop(shop);
  localStorage.setItem('ja_cart_context_key', jaCartContextKey());
  const ri = document.getElementById('retailerName');
  if (ri) ri.value = shop;
}

const jaOriginalToggleCart = toggleCart;
function toggleCart(productId) {
  if (!jaCheckCartContextBeforeAdd()) return;
  jaOriginalToggleCart(productId);
}

const jaOriginalOpenQtyPicker = openQtyPicker;
function openQtyPicker(productId) {
  if (!jaCheckCartContextBeforeAdd()) return;
  jaOriginalOpenQtyPicker(productId);
}

const jaOriginalConfirmQtyPicker = confirmQtyPicker;
function confirmQtyPicker(boxQty, unit) {
  if (!jaCheckCartContextBeforeAdd()) return;
  jaOriginalConfirmQtyPicker(boxQty, unit);
}

function jaEnrichOrder(order) {
  const ctx = jaResolveRetailerContext();
  const clientOrderId = order.clientOrderId || jaClientOrderId(ctx.placedByType === 'sr' ? 'SR' : 'RT');
  const enriched = {
    ...order,
    ...ctx,
    id: order.id || clientOrderId,
    clientOrderId,
    orderDateKey: jaTodayKey(),
    createdAtIso: order.createdAtIso || new Date().toISOString(),
    updatedAtIso: new Date().toISOString(),
    deviceId: localStorage.getItem('ja_device_id') || ''
  };
  if (!enriched.deviceId) {
    enriched.deviceId = 'dev-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('ja_device_id', enriched.deviceId);
  }
  enriched.orderFingerprint = jaOrderFingerprint(enriched);
  if (ctx.placedByType === 'sr') {
    enriched.srCode = ctx.srCode;
    enriched.srName = ctx.srName;
    enriched.srShop = ctx.srShop;
    enriched.retailer = ctx.srShop || enriched.retailer;
  }
  return jaEnsureOrderHistory(enriched, enriched.status || 'Pending', 'Order placed');
}

function jaFindRecentDuplicate(order) {
  const cutoff = Date.now() - (10 * 60 * 1000);
  return getOrders().find(o => {
    const time = o.createdAtIso ? Date.parse(o.createdAtIso) : 0;
    return o.clientOrderId !== order.clientOrderId && o.orderFingerprint === order.orderFingerprint && (!time || time >= cutoff);
  });
}

async function fbSaveOrder(order) {
  const enriched = jaEnrichOrder(order);
  const duplicate = jaFindRecentDuplicate(enriched);
  if (duplicate && !enriched._skipDuplicatePrompt && !confirm('A very similar order was placed recently for this retailer. Save anyway?')) {
    showToast('Duplicate order cancelled', 'error');
    return;
  }
  try {
    const existing = JSON.parse(localStorage.getItem('ja_orders') || '[]');
    localStorage.setItem('ja_orders', JSON.stringify([enriched, ...existing.filter(o => o.id !== enriched.id && o.clientOrderId !== enriched.clientOrderId)].slice(0, 150)));
  } catch {}

  if (!navigator.onLine) {
    jaQueueOrderForSync(enriched, 'Offline');
    jaRenderPendingSyncBadge();
    showToast('Order saved offline. It will sync when online.', 'info');
    return;
  }

  if (window._fb && window._fb.FB_OK) {
    try {
      await window._fb.saveOrder({ ...enriched, syncStatus: 'synced' });
      jaMarkClientSynced(enriched.clientOrderId);
      jaSavePendingSyncOrders(jaGetPendingSyncOrders().filter(o => o.clientOrderId !== enriched.clientOrderId));
    } catch (e) {
      jaQueueOrderForSync(enriched, e.message || 'Firebase save failed');
      showToast('Order saved locally. Sync pending.', 'info');
    }
  } else {
    jaQueueOrderForSync(enriched, 'Firebase not configured');
  }
  jaRenderPendingSyncBadge();
}

async function syncPendingOrders() {
  if (!navigator.onLine || !(window._fb && window._fb.FB_OK)) {
    jaRenderPendingSyncBadge();
    return;
  }
  const syncedIds = jaGetSyncedClientIds();
  const pending = jaGetPendingSyncOrders().filter(o => !syncedIds.includes(o.clientOrderId));
  if (!pending.length) { jaRenderPendingSyncBadge(); return; }
  const remaining = [];
  for (const order of pending.reverse()) {
    try {
      await window._fb.saveOrder({ ...order, syncStatus: 'synced', syncedAt: new Date().toLocaleString('en-IN') });
      jaMarkClientSynced(order.clientOrderId);
    } catch (e) {
      remaining.unshift({ ...order, syncReason: e.message || 'Sync failed' });
    }
  }
  jaSavePendingSyncOrders(remaining);
  jaRenderPendingSyncBadge();
  if (!remaining.length) showToast('Pending SR/retailer orders synced', 'success');
}

function jaRenderPendingSyncBadge() {
  let badge = document.getElementById('pendingSyncBadge');
  const count = jaGetPendingSyncOrders().length;
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'pendingSyncBadge';
    badge.onclick = syncPendingOrders;
    document.body.appendChild(badge);
  }
  badge.textContent = count ? `${count} order${count === 1 ? '' : 's'} pending sync` : '';
  badge.style.display = count ? 'block' : 'none';
}

const jaOriginalBuildOrderText = buildOrderText;
function buildOrderText() {
  const base = jaOriginalBuildOrderText();
  const ctx = jaResolveRetailerContext();
  const contextLine = ctx.placedByType === 'sr'
    ? `\nOrder Context: SR ${ctx.srName} (${ctx.srCode}) for ${ctx.srShop}`
    : `\nOrder Context: Retailer self-order`;
  return base + contextLine;
}

const jaOriginalSendWhatsApp = sendWhatsApp;
function sendWhatsApp() {
  if (!cart.length) return;
  if (!jaRequireSRShop()) return;
  jaOriginalSendWhatsApp();
  localStorage.removeItem('ja_cart_context_key');
}

const jaOriginalSendDirectOrder = sendDirectOrder;
function sendDirectOrder() {
  if (!cart.length) return;
  if (!jaRequireSRShop()) return;
  jaOriginalSendDirectOrder();
  localStorage.removeItem('ja_cart_context_key');
}

const jaOriginalRenderSRDashboard = renderSRDashboard;
function renderSRDashboard() {
  jaOriginalRenderSRDashboard();
  if (!currentSR) return;
  const body = document.getElementById('srDashBody');
  if (!body || document.getElementById('srRealtimePanel')) return;
  const allOrders = getSROrdersForCode(currentSR.code);
  const pendingSync = jaGetPendingSyncOrders().filter(o => o.srCode === currentSR.code);
  const activeShops = new Set(allOrders.map(o => o.srShop || o.retailer).filter(Boolean));
  const delivered = allOrders.filter(o => o.status === 'Delivered').length;
  const active = allOrders.filter(o => !['Delivered','WhatsApp Sent'].includes(o.status)).length;
  const panel = document.createElement('div');
  panel.id = 'srRealtimePanel';
  panel.className = 'sr-realtime-panel';
  panel.innerHTML = `
    <div class="sr-realtime-title">Real-time Order Sync</div>
    <div class="sr-realtime-grid">
      <div><b>${activeShops.size}</b><span>Buying Shops</span></div>
      <div><b>${active}</b><span>Active Orders</span></div>
      <div><b>${delivered}</b><span>Delivered</span></div>
      <div class="${pendingSync.length ? 'warn' : 'ok'}"><b>${pendingSync.length}</b><span>Pending Sync</span></div>
    </div>
    <button onclick="syncPendingOrders()">Sync Pending Orders</button>`;
  body.prepend(panel);
}

function exportSRPerformanceCSV() {
  const rows = [['SR Code','SR Name','Shop','Order ID','Date','Status','Items','Total Qty','Sync Status']];
  getOrders().filter(o => o.srCode).forEach(o => rows.push([o.srCode, o.srName, o.srShop || o.retailer, o.id, o.timestamp, o.status, (o.items || []).length, o.totalQty || 0, o.syncStatus || 'local']));
  jaDownloadText('JainAgencies_SR_Performance_' + jaTodayKey() + '.csv', rows.map(r => r.map(jaCsvCell).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
  showToast('SR performance exported', 'success');
}

function jaInstallSRAdminExport() {
  const panel = document.getElementById('apanel-sr');
  if (!panel || document.getElementById('srPerformanceExportBtn')) return;
  const btn = document.createElement('button');
  btn.id = 'srPerformanceExportBtn';
  btn.className = 'sr-export-btn';
  btn.textContent = 'Export SR Performance CSV';
  btn.onclick = exportSRPerformanceCSV;
  panel.insertBefore(btn, panel.firstChild);
}

window.addEventListener('online', syncPendingOrders);
window.addEventListener('DOMContentLoaded', () => {
  jaValidateSRSession(false);
  jaRenderPendingSyncBadge();
  jaInstallSRAdminExport();
  setInterval(syncPendingOrders, 15000);
  setInterval(jaRenderPendingSyncBadge, 5000);
});
/* === END JAIN AGENCIES SR REALTIME IMPROVEMENTS === */
/* === JAIN AGENCIES SR WHATSAPP ORDERS === */
function buildSRWhatsAppOrderText() {
  const ctx = jaResolveRetailerContext();
  const date = new Date().toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  const noteEl = document.getElementById('cartOrderNote');
  const note = noteEl && noteEl.value.trim() ? noteEl.value.trim() : '';
  const itemLines = cart.map((item, i) => {
    const p = products.find(x => x.id === item.id);
    const isBox = item.unit === 'box';
    const qty = isBox ? `${item.qty} Box` : `${item.qty}`;
    const scheme = (!isBox && p) ? calcScheme(getProductScheme(p), item.qty) : null;
    return `${i + 1}. *${item.name}* | ${item.packing || ''} | Qty: ${qty}${scheme ? ' *(' + scheme + ')*' : ''}`;
  }).join('\n');
  const totalQty = cart.reduce((s, c) => s + c.qty, 0);
  return `================================\n  JAIN AGENCIES - SR ORDER\n================================\nRetailer: *${ctx.srShop || ctx.retailerName}*\nPlaced by: *${ctx.srName}* (${ctx.srCode})\nDate: ${date}\n\n*NEW ORDER*\n--------------------------------\n${itemLines}\n--------------------------------\nItems: ${cart.length} | Total Qty: ${totalQty}${note ? '\n\nNote: ' + note : ''}\n\nPlease confirm this SR order.`;
}

async function sendSRWhatsAppOrder() {
  if (!cart.length) { showToast('Add items to your order first!', 'error'); return; }
  if (!jaRequireSRShop()) return;
  const ctx = jaResolveRetailerContext();
  const noteEl = document.getElementById('cartOrderNote');
  const orderNote = noteEl ? noteEl.value.trim() : '';
  const srOrder = jaEnrichOrder({
    id: jaClientOrderId('SRWA'),
    clientOrderId: jaClientOrderId('SRWA'),
    retailer: ctx.srShop,
    items: JSON.parse(JSON.stringify(cart)),
    totalQty: cart.reduce((s,c)=>s+c.qty,0),
    timestamp: new Date().toLocaleString('en-IN'),
    status: 'WhatsApp Sent',
    channel: 'whatsapp',
    orderSource: 'sr_whatsapp',
    ...(orderNote ? { note: orderNote } : {})
  });
  const duplicate = jaFindRecentDuplicate(srOrder);
  if (duplicate && !confirm('A very similar SR WhatsApp order was placed recently for this retailer. Send anyway?')) {
    showToast('SR WhatsApp order cancelled', 'error');
    return;
  }
  srOrder._skipDuplicatePrompt = true;
  await fbSaveOrder(srOrder).catch(()=>{});
  recordOrderHistory(JSON.parse(JSON.stringify(cart)));
  const url = `https://wa.me/${JAIN_WA_NUMBER}?text=${encodeURIComponent(buildSRWhatsAppOrderText())}`;
  closeOrderOptions();
  window.open(url, '_blank');
  cart = [];
  saveCart();
  updateCartUI();
  localStorage.removeItem('ja_cart_context_key');
  setTimeout(() => {
    showOrderSuccess('ðŸ’¬', 'SR WhatsApp Order Ready!', `Order prepared for ${ctx.srShop}\nPlaced by ${ctx.srName} (${ctx.srCode})\nSend the WhatsApp message to complete it.`);
  }, 400);
}

const jaPreviousOpenOrderOptionsForSRWA = openOrderOptions;
function openOrderOptions() {
  if (!cart.length) { showToast('Add items to your order first!', 'error'); return; }
  if (srMode && !jaRequireSRShop()) return;
  jaPreviousOpenOrderOptionsForSRWA();
  const waBtn = document.querySelector('.order-opt-btn.whatsapp');
  if (waBtn) {
    if (srMode && currentSR && srActiveShop) {
      waBtn.classList.add('sr-whatsapp');
      waBtn.onclick = sendSRWhatsAppOrder;
      const label = waBtn.querySelector('.order-opt-label');
      const desc = waBtn.querySelector('.order-opt-desc');
      if (label) label.textContent = 'WhatsApp SR Order';
      if (desc) desc.textContent = `Send order for ${srActiveShop} with SR details`;
    } else {
      waBtn.classList.remove('sr-whatsapp');
      waBtn.onclick = sendWhatsApp;
      const label = waBtn.querySelector('.order-opt-label');
      const desc = waBtn.querySelector('.order-opt-desc');
      if (label) label.textContent = 'WhatsApp to Jain Agencies';
      if (desc) desc.textContent = 'Opens WhatsApp with pre-filled order message';
    }
  }
}

const jaPreviousSendWhatsAppForSRWA = sendWhatsApp;
function sendWhatsApp() {
  if (srMode && currentSR) return sendSRWhatsAppOrder();
  return jaPreviousSendWhatsAppForSRWA();
}
/* === END JAIN AGENCIES SR WHATSAPP ORDERS === */
/* === JAIN AGENCIES LIVE STOCK CSV SYNC === */
const JA_LIVE_STOCK_KEY = 'ja_live_stock';
let jaPendingStockReview = [];
let jaStockWatchStarted = false;

function jaStockNorm(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function jaStockKeyFromParts(name, company, packing) {
  return [jaStockNorm(name), jaStockNorm(company), jaStockNorm(packing)].join('|');
}

function jaProductStockKey(p) {
  return jaStockKeyFromParts(p.name, p.company, p.packing);
}

function jaStockNumber(value) {
  if (value === true) return 1;
  if (value === false || value == null || value === '') return 0;
  const n = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function jaStockStatus(qty, stockText) {
  const raw = jaStockNorm(stockText);
  if (['no', 'n', 'out', 'out stock', 'out of stock', 'unavailable', 'false', '0'].includes(raw)) return 'out_of_stock';
  if (qty <= 0) return 'out_of_stock';
  if (qty <= 10) return 'low_stock';
  return 'available';
}

function jaLiveStockLabel(p) {
  const qtyKnown = p.stockQty !== undefined && p.stockQty !== null && p.stockQty !== '';
  const qty = jaStockNumber(p.stockQty);
  const status = p.stockStatus || (p.stock ? 'available' : 'out_of_stock');
  return { qtyKnown, qty, status, canOrder: status !== 'out_of_stock' && (!qtyKnown || qty > 0) };
}

function jaStockFreshText(value) {
  if (!value) return 'Not updated today';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
}

function jaLoadLiveStockCache() {
  try { return JSON.parse(localStorage.getItem(JA_LIVE_STOCK_KEY) || '[]') || []; }
  catch { return []; }
}

function jaSaveLiveStockCache(list) {
  try { localStorage.setItem(JA_LIVE_STOCK_KEY, JSON.stringify(list || [])); } catch {}
}

function mergeLiveStock(stockList, options = {}) {
  if (!Array.isArray(stockList) || !stockList.length || typeof products === 'undefined') return 0;
  const byId = new Map(products.map(p => [String(p.id), p]));
  const byFull = new Map();
  products.forEach(p => byFull.set(jaProductStockKey(p), p));
  let changed = 0;

  stockList.forEach(item => {
    const product = byId.get(String(item.productId || '')) || byFull.get(item.stockKey || jaStockKeyFromParts(item.name, item.company, item.packing));
    if (!product) return;
    const qty = jaStockNumber(item.stockQty ?? item.qty ?? item.quantity ?? item.currentStock);
    const status = item.stockStatus || jaStockStatus(qty, item.stock ?? item.available ?? item.status);
    product.stockQty = qty;
    product.stockStatus = status;
    product.stock = status !== 'out_of_stock' && qty > 0;
    product.stockUpdatedAt = item.updatedAt || item.stockUpdatedAt || new Date().toISOString();
    product.stockBatchId = item.batchId || product.stockBatchId || '';
    changed++;
  });

  if (changed) {
    saveData();
    if (!options.silent && typeof showToast === 'function') showToast(`${changed} live stock items updated`, 'success');
    if (typeof renderProductList === 'function' && document.getElementById('productList') && document.getElementById('searchInput')) renderProductList();
    if (typeof renderAdminListV2 === 'function') renderAdminListV2();
    if (typeof renderDatabase === 'function') renderDatabase();
    jaRefreshLiveStockSummary();
  }
  return changed;
}

function jaCsvCell(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

function jaRowsToObjects(rows) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map(h => jaStockNorm(h));
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (row[i] || '').trim(); });
    return obj;
  }).filter(r => Object.values(r).some(Boolean));
}

function jaValue(row, names) {
  for (const name of names) {
    const key = jaStockNorm(name);
    if (row[key] !== undefined && row[key] !== '') return row[key];
  }
  return '';
}

function jaBuildStockIndexes() {
  const maps = { full:new Map(), namePack:new Map(), nameCompany:new Map(), name:new Map() };
  products.forEach(p => {
    const full = jaProductStockKey(p);
    const namePack = [jaStockNorm(p.name), jaStockNorm(p.packing)].join('|');
    const nameCompany = [jaStockNorm(p.name), jaStockNorm(p.company)].join('|');
    const name = jaStockNorm(p.name);
    maps.full.set(full, [p]);
    [[maps.namePack, namePack], [maps.nameCompany, nameCompany], [maps.name, name]].forEach(([map, key]) => {
      const list = map.get(key) || [];
      list.push(p);
      map.set(key, list);
    });
  });
  return maps;
}

function jaMatchStockRows(rows) {
  const indexes = jaBuildStockIndexes();
  return rows.map((row, index) => {
    const name = jaValue(row, ['name', 'medicine', 'medicine name', 'product name']);
    const company = jaValue(row, ['company', 'company name', 'mfg', 'manufacturer']);
    const packing = jaValue(row, ['packing', 'pack', 'size']);
    const qtyRaw = jaValue(row, ['qty', 'quantity', 'stock qty', 'stockqty', 'closing stock', 'current stock', 'live stock']);
    const stockRaw = jaValue(row, ['stock', 'available', 'status']);
    const qty = jaStockNumber(qtyRaw || (jaStockNorm(stockRaw) === 'yes' ? 1 : 0));
    const status = jaStockStatus(qty, stockRaw);
    const result = { rowNumber:index + 2, row, name, company, packing, qty, status, warnings:[] };
    if (!name) { result.error = 'Missing product name'; return result; }
    if (!qtyRaw && !stockRaw) result.warnings.push('No quantity/status column found; treated as 0');

    const attempts = [
      { type:'Name + Company + Packing', list:indexes.full.get(jaStockKeyFromParts(name, company, packing)) || [] },
      { type:'Name + Packing', list:indexes.namePack.get([jaStockNorm(name), jaStockNorm(packing)].join('|')) || [] },
      { type:'Name + Company', list:indexes.nameCompany.get([jaStockNorm(name), jaStockNorm(company)].join('|')) || [] },
      { type:'Unique Name', list:indexes.name.get(jaStockNorm(name)) || [] }
    ];
    for (const attempt of attempts) {
      if (attempt.list.length === 1) {
        result.product = attempt.list[0];
        result.matchType = attempt.type;
        return result;
      }
      if (attempt.list.length > 1) result.warnings.push(`${attempt.type} matched multiple products`);
    }
    result.error = 'No safe match found';
    return result;
  });
}

function jaRenderStockPreview(review) {
  const el = document.getElementById('stockPreview');
  if (!el) return;
  const matched = review.filter(r => r.product).length;
  const skipped = review.filter(r => !r.product).length;
  const low = review.filter(r => r.product && r.status === 'low_stock').length;
  const out = review.filter(r => r.product && r.status === 'out_of_stock').length;
  const preview = review.slice(0, 8);
  el.innerHTML = `
    <div class="stock-preview-summary">
      <div><b>${matched}</b><span>Matched</span></div>
      <div><b>${low}</b><span>Low</span></div>
      <div><b>${out}</b><span>Out</span></div>
      <div class="${skipped ? 'warn' : 'ok'}"><b>${skipped}</b><span>Skipped</span></div>
    </div>
    <div class="stock-preview-list">
      ${preview.map(item => `
        <div class="stock-preview-row ${item.product ? 'matched' : 'skipped'}">
          <div><strong>${item.product ? item.product.name : (item.name || 'Unknown')}</strong><small>${item.product ? item.product.company + ' / ' + item.product.packing : item.error}</small></div>
          <div class="stock-preview-qty"><b>${item.qty}</b><span>${item.status.replace(/_/g, ' ')}</span></div>
        </div>`).join('')}
    </div>
    ${review.length > 8 ? `<div class="stock-preview-more">+ ${review.length - 8} more rows in CSV</div>` : ''}`;
}

function handleStockFile(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const rows = parseCSV(String(e.target.result || ''));
    const objects = jaRowsToObjects(rows);
    jaPendingStockReview = jaMatchStockRows(objects);
    jaRenderStockPreview(jaPendingStockReview);
    const matched = jaPendingStockReview.filter(r => r.product).length;
    showToast(`${matched} stock rows ready to apply`, matched ? 'success' : 'error');
  };
  reader.readAsText(file);
}

async function applyLiveStockUpdate() {
  if (!jaPendingStockReview.length) { showToast('Choose a stock CSV first', 'error'); return; }
  const now = new Date().toISOString();
  const batchId = 'STK-' + Date.now().toString(36).toUpperCase();
  const updates = jaPendingStockReview.filter(r => r.product).map(r => ({
    productId: r.product.id,
    stockKey: jaProductStockKey(r.product),
    name: r.product.name,
    company: r.product.company,
    packing: r.product.packing,
    stockQty: r.qty,
    stockStatus: r.status,
    stock: r.status !== 'out_of_stock',
    updatedAt: now,
    batchId,
    updatedBy: 'owner_csv'
  }));
  if (!updates.length) { showToast('No safe product matches found', 'error'); return; }
  mergeLiveStock(updates, { silent:true });
  jaSaveLiveStockCache(updates);
  if (window._fb && window._fb.FB_OK && typeof window._fb.saveStockBatch === 'function') {
    await window._fb.saveStockBatch(updates);
    showToast(`${updates.length} live stock items synced to SR devices`, 'success');
  } else {
    showToast(`${updates.length} live stock items updated locally`, 'info');
  }
  jaRefreshLiveStockSummary();
}

function downloadStockTemplate() {
  const header = ['Name','Company','Packing','Stock','Qty','MRP','PTR','Scheme'];
  const sample = products.slice(0, 30).map(p => [p.name, p.company, p.packing, p.stock ? 'Yes' : 'No', p.stockQty ?? '', p.mrp ?? '', p.ptr ?? '', p.scheme ?? '']);
  jaDownloadText('JainAgencies_Live_Stock_Template.csv', [header, ...sample].map(r => r.map(jaCsvCell).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
}

function jaRefreshLiveStockSummary() {
  const el = document.getElementById('liveStockSummary');
  if (!el || typeof products === 'undefined') return;
  const known = products.filter(p => p.stockQty !== undefined && p.stockQty !== null && p.stockQty !== '');
  const out = products.filter(p => jaLiveStockLabel(p).status === 'out_of_stock').length;
  const low = products.filter(p => jaLiveStockLabel(p).status === 'low_stock').length;
  const last = known.map(p => Date.parse(p.stockUpdatedAt || '') || 0).sort((a,b)=>b-a)[0];
  el.innerHTML = `<b>${known.length}</b> products tracked live | <b>${low}</b> low | <b>${out}</b> out | Last update: <b>${last ? jaStockFreshText(last) : 'pending'}</b>`;
}

function installLiveStockPanel() {
  const panel = document.getElementById('apanel-excel');
  if (!panel || document.getElementById('liveStockPanel')) return;
  const box = document.createElement('div');
  box.id = 'liveStockPanel';
  box.className = 'stock-update-panel';
  box.innerHTML = `
    <div class="stock-panel-head">
      <div>
        <span class="stock-panel-kicker">Owner Live Stock</span>
        <h3>Upload current stock CSV</h3>
        <p>SR devices see live availability after the owner uploads morning/evening stock. Matching uses Name, Company and Packing only.</p>
      </div>
      <div class="stock-panel-status" id="liveStockSummary">Preparing live stock...</div>
    </div>
    <div class="stock-import-grid">
      <label class="stock-file-drop">
        <input id="stockCsvInput" type="file" accept=".csv,text/csv" onchange="handleStockFile(this)">
        <strong>Select stock CSV</strong>
        <span>Columns: Name, Company, Packing, Stock, Qty</span>
      </label>
      <div class="stock-actions">
        <button type="button" onclick="downloadStockTemplate()">Download Template</button>
        <button type="button" class="primary" onclick="applyLiveStockUpdate()">Apply Live Stock Update</button>
      </div>
    </div>
    <div id="stockPreview" class="stock-preview-empty">No stock CSV selected yet.</div>`;
  panel.insertBefore(box, panel.firstChild);
  jaRefreshLiveStockSummary();
}

function jaStartLiveStockWatch(attempt = 0) {
  if (jaStockWatchStarted) return;
  const cached = jaLoadLiveStockCache();
  if (cached.length) mergeLiveStock(cached, { silent:true });
  if (window._fb && window._fb.FB_OK && typeof window._fb.watchStock === 'function') {
    jaStockWatchStarted = true;
    window._fb.watchStock(list => mergeLiveStock(list, { fromFirebase:true, silent:true }));
    return;
  }
  if (attempt < 10) setTimeout(() => jaStartLiveStockWatch(attempt + 1), 800);
}

function cardHTML(p) {
  const color  = CAT_COLORS[p.category] || '#64748B';
  const inCart = cart.some(c => c.id === p.id);
  const isFav  = isFavourite(p.id);
  const live = jaLiveStockLabel(p);
  let expiryBadge = '';
  if (p.expiry) {
    const [mm, yy] = p.expiry.split('/').map(Number);
    const daysLeft = Math.floor((new Date(2000 + yy, mm - 1, 1) - new Date()) / 86400000);
    if (daysLeft < 0) expiryBadge = `<span class="tag" style="background:#FEE2E2;color:#be123c">EXPIRED</span>`;
    else if (daysLeft <= 90) expiryBadge = `<span class="tag" style="background:#FEF9C3;color:#b45309">Exp ${p.expiry}</span>`;
  }
  const moqBadge = p.moq > 1 ? `<span class="tag tag-moq">MOQ ${p.moq}</span>` : '';
  const schemeBar = getSchemeHTML(p, true);
  const hasScheme = !!schemeBar;
  const stockText = live.qtyKnown ? `<strong>${live.qty}</strong> LIVE STOCK` : `<strong>${live.canOrder ? 'YES' : '0'}</strong> LIVE STOCK`;
  const statusText = live.status === 'low_stock' ? 'Low stock' : (live.canOrder ? 'Available' : 'Unavailable');
  const updateText = p.stockUpdatedAt ? `Updated ${jaStockFreshText(p.stockUpdatedAt)}` : 'Awaiting owner update';

  return `<div class="pc-wrap ${hasScheme ? 'has-scheme' : ''}" id="pcw_${p.id}">
    <div class="pc-swipe-bg"><span>${CAT_ICONS[p.category] || ''}</span><span>${inCart ? 'ADDED' : 'ADD'}</span></div>
    <div class="product-card premium-stock-card" onclick="openDetail(${p.id})" style="align-items:center" data-id="${p.id}">
      <div class="cat-icon" style="background:${color}22">${CAT_ICONS[p.category] || ''}</div>
      <div style="flex:1;min-width:0">
        <div class="prod-name" style="display:flex;align-items:center;gap:6px">${p.name}${isFav ? ' <span style="font-size:12px">â˜…</span>' : ''}</div>
        <div class="prod-company">${p.company}</div>
        <div class="tags">
          <span class="tag" style="background:${color}22;color:${color}">${p.category}</span>
          <span class="tag tag-pack">${p.packing}</span>
          <span class="live-stock-pill ${live.status}">${stockText}<em>${statusText}</em></span>
          ${expiryBadge}${moqBadge}
        </div>
        <div class="stock-updated-line">${updateText}</div>
        ${schemeBar}
      </div>
      ${live.canOrder
        ? `<button class="add-cart-btn ${inCart ? 'in-cart' : ''}" onclick="event.stopPropagation();toggleCart(${p.id})">${inCart ? 'Added' : '+ Cart'}</button>`
        : `<button class="notify-me-btn ${isWatching(p.id) ? 'watching' : ''}" onclick="event.stopPropagation();toggleWatch(${p.id})">${isWatching(p.id) ? 'Watching' : 'Notify Me'}</button>`
      }
    </div>
  </div>`;
}

const jaPreviousOpenQtyPickerForLiveStock = openQtyPicker;
function openQtyPicker(productId) {
  const p = products.find(x => x.id === productId);
  if (!p) return;
  const live = jaLiveStockLabel(p);
  if (!live.canOrder) {
    showToast('This product is unavailable in live stock', 'error');
    return;
  }
  jaPreviousOpenQtyPickerForLiveStock(productId);
  const body = document.getElementById('qtyPickerBody');
  if (body) {
    body.insertAdjacentHTML('afterbegin', `<div class="qty-live-stock-banner ${live.status}"><b>${live.qtyKnown ? live.qty : 'Live'}</b><span>${live.qtyKnown ? 'available in current stock' : 'stock available'}</span></div>`);
  }
}

const jaPreviousConfirmQtyPickerForLiveStock = confirmQtyPicker;
function confirmQtyPicker(boxQty, unit) {
  const p = products.find(x => x.id === _qtyPickerProductId);
  if (p) {
    const live = jaLiveStockLabel(p);
    const qty = unit === 'box' ? boxQty : (parseInt(document.getElementById('pickerQtyInput')?.value) || 1);
    if (!live.canOrder) { showToast('This product is unavailable in live stock', 'error'); return; }
    if (live.qtyKnown && qty > live.qty) {
      const inp = document.getElementById('pickerQtyInput');
      if (inp) inp.value = live.qty;
      showToast(`Only ${live.qty} available in live stock`, 'error');
      return;
    }
  }
  jaPreviousConfirmQtyPickerForLiveStock(boxQty, unit);
}

const jaPreviousEnrichOrderForLiveStock = jaEnrichOrder;
function jaEnrichOrder(order) {
  const enriched = jaPreviousEnrichOrderForLiveStock(order);
  enriched.items = (enriched.items || []).map(item => {
    const p = products.find(x => x.id === item.id);
    return p ? { ...item, stockAtOrderTime: p.stockQty ?? null, stockStatusAtOrderTime: p.stockStatus || null, stockUpdatedAt: p.stockUpdatedAt || null } : item;
  });
  return enriched;
}

window.addEventListener('DOMContentLoaded', () => {
  installLiveStockPanel();
  jaRefreshLiveStockSummary();
  jaStartLiveStockWatch();
});
/* === END JAIN AGENCIES LIVE STOCK CSV SYNC === */

