// â”€â”€ Firebase config (free Spark plan â€” no credit card needed) â”€â”€
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, doc, setDoc, onSnapshot,
         updateDoc, serverTimestamp, query, orderBy, limit,
         deleteDoc, getDoc, getDocs, writeBatch }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getMessaging, getToken, onMessage }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ðŸ”‘  PASTE YOUR OWN CONFIG HERE (takes 2 min â€” see README)
//     1. Go to https://console.firebase.google.com
//     2. Create project â†’ Add Web App â†’ Copy config below
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FB_CONFIG = {
  apiKey:            "AIzaSyBbis6yErteIOHYWt5F6GgvrFcu6X0hcYM",
  authDomain:        "jain-agencies.firebaseapp.com",
  projectId:         "jain-agencies",
  storageBucket:     "jain-agencies.firebasestorage.app",
  messagingSenderId: "853543871550",
  appId:             "1:853543871550:web:717c1a692612daeda6dd6f",
  measurementId:     "G-SHZ3QK9P13"
};

let db = null;
let FB_OK = false;
let _messaging = null;

try {
  const app = initializeApp(FB_CONFIG);
  db = getFirestore(app);
  FB_OK = true;
  // Init FCM messaging (only works in secure context with SW)
  try {
    _messaging = getMessaging(app);
  } catch(me) {
    console.warn("FCM messaging init skipped:", me.message);
  }
  console.log("ðŸ”¥ Firebase connected â€” jain-agencies");
} catch(e) {
  console.warn("Firebase init failed â€” offline mode", e);
}

// â”€â”€ Expose to global scope for non-module code â”€â”€
window._fb = {
  db, FB_OK,

  // â”€â”€ RETAILERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async saveRetailer(r) {
    if (!FB_OK) return;
    try { await setDoc(doc(db, "retailers", r.id), { ...r, _ts: serverTimestamp() }); }
    catch(e) { console.warn("FB saveRetailer", e); }
  },

  async updateRetailer(id, fields) {
    if (!FB_OK) return;
    try { await updateDoc(doc(db, "retailers", id), { ...fields, _ts: serverTimestamp() }); }
    catch(e) { console.warn("FB updateRetailer", e); }
  },

  watchRetailers(cb) {
    if (!FB_OK) return () => {};
    const unsub = onSnapshot(
      query(collection(db, "retailers"), orderBy("_ts", "desc")),
      snap => {
        const list = snap.docs.map(d => d.data());
        // Sync to localStorage as cache
        try { localStorage.setItem("ja_retailers", JSON.stringify(list)); } catch {}
        cb(list);
      },
      err => console.warn("watchRetailers error", err)
    );
    return unsub;
  },

  // â”€â”€ ORDERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async saveOrder(order) {
    if (!FB_OK) return;
    try { await setDoc(doc(db, "orders", order.id), { ...order, _ts: serverTimestamp() }); }
    catch(e) { console.warn("FB saveOrder", e); }
  },

  async updateOrder(id, fields) {
    if (!FB_OK) return;
    try { await updateDoc(doc(db, "orders", id), { ...fields, _ts: serverTimestamp() }); }
    catch(e) { console.warn("FB updateOrder", e); }
  },

  watchOrders(cb) {
    if (!FB_OK) return () => {};
    const unsub = onSnapshot(
      query(collection(db, "orders"), orderBy("_ts", "desc"), limit(100)),
      snap => {
        const list = snap.docs.map(d => d.data());
        try { localStorage.setItem("ja_orders", JSON.stringify(list)); } catch {}
        cb(list);
      },
      err => console.warn("watchOrders error", err)
    );
    return unsub;
  },


  // STOCK - owner CSV upload, SR live availability
  async saveStockBatch(stockList) {
    if (!FB_OK) return;
    try {
      const CHUNK = 490;
      for (let i = 0; i < stockList.length; i += CHUNK) {
        const batch = writeBatch(db);
        stockList.slice(i, i + CHUNK).forEach(item => {
          const id = String(item.productId || item.stockKey || item.name || Date.now());
          batch.set(doc(db, "stock", id), { ...item, _ts: serverTimestamp() });
        });
        await batch.commit();
      }
    } catch(e) { console.warn("FB saveStockBatch", e); }
  },

  watchStock(cb) {
    if (!FB_OK) return () => {};
    const unsub = onSnapshot(
      query(collection(db, "stock"), orderBy("_ts", "desc"), limit(5000)),
      snap => {
        const list = snap.docs.map(d => d.data());
        try { localStorage.setItem("ja_live_stock", JSON.stringify(list)); } catch {}
        cb(list);
      },
      err => console.warn("watchStock error", err)
    );
    return unsub;
  },
  // SCHEMES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async saveScheme(scheme) {
    if (!FB_OK) return;
    try { await setDoc(doc(db, "schemes", String(scheme.id)), { ...scheme, _ts: serverTimestamp() }); }
    catch(e) { console.warn("FB saveScheme", e); }
  },

  async saveSchemesBatch(schemeList) {
    if (!FB_OK) return;
    try {
      // Firestore batch limit = 500 writes; schemes will never be that large but chunk anyway
      const CHUNK = 490;
      for (let i = 0; i < schemeList.length; i += CHUNK) {
        const batch = writeBatch(db);
        schemeList.slice(i, i + CHUNK).forEach(s => {
          batch.set(doc(db, "schemes", String(s.id)), { ...s, _ts: serverTimestamp() });
        });
        await batch.commit();
      }
    } catch(e) { console.warn("FB saveSchemesBatch", e); }
  },

  async deleteScheme(id) {
    if (!FB_OK) return;
    try { await deleteDoc(doc(db, "schemes", String(id))); }
    catch(e) { console.warn("FB deleteScheme", e); }
  },

  watchSchemes(cb) {
    if (!FB_OK) return () => {};
    const unsub = onSnapshot(
      query(collection(db, "schemes"), orderBy("_ts", "desc")),
      snap => {
        const list = snap.docs.map(d => d.data());
        try { localStorage.setItem("ja_schemes", JSON.stringify(list)); } catch {}
        cb(list);
      },
      err => console.warn("watchSchemes error", err)
    );
    return unsub;
  },

  // â”€â”€ ANNOUNCEMENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async saveAnnouncement(ann) {
    if (!FB_OK) return;
    try { await setDoc(doc(db, "announcements", String(ann.id)), { ...ann, _ts: serverTimestamp() }); }
    catch(e) { console.warn("FB saveAnnouncement", e); }
  },

  async deleteAnnouncement(id) {
    if (!FB_OK) return;
    try { await deleteDoc(doc(db, "announcements", String(id))); }
    catch(e) { console.warn("FB deleteAnnouncement", e); }
  },

  watchAnnouncements(cb) {
    if (!FB_OK) return () => {};
    const unsub = onSnapshot(
      query(collection(db, "announcements"), orderBy("_ts", "desc")),
      snap => {
        const list = snap.docs.map(d => d.data());
        try { localStorage.setItem("ja_announcements", JSON.stringify(list)); } catch {}
        cb(list);
      },
      err => console.warn("watchAnnouncements error", err)
    );
    return unsub;
  },

  // â”€â”€ FCM PUSH TOKENS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // VAPID key from Firebase Console â†’ Project Settings â†’ Cloud Messaging â†’ Web Push certificates
  // Replace the placeholder below with your actual VAPID key
  VAPID_KEY: "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDkBWAVArdpr6mvBY3VKYt5R4bLZk6BKEK_JRMY4yjAY",

  async requestPushPermission(retailerId) {
    if (!_messaging || !FB_OK) return null;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return null;
      const token = await getToken(_messaging, { vapidKey: this.VAPID_KEY });
      if (token && retailerId) {
        await setDoc(doc(db, "fcmTokens", retailerId), {
          token,
          retailerId,
          updatedAt: serverTimestamp(),
          ua: navigator.userAgent.substring(0, 120)
        });
        console.log("âœ… FCM token saved for", retailerId);
      }
      return token;
    } catch(e) {
      console.warn("FCM token error:", e.message);
      return null;
    }
  },

  async deletePushToken(retailerId) {
    if (!FB_OK) return;
    try { await deleteDoc(doc(db, "fcmTokens", retailerId)); }
    catch(e) { console.warn("FB deletePushToken", e); }
  },

  async getAllFCMTokens() {
    if (!FB_OK) return [];
    try {
      const snap = await getDocs(collection(db, "fcmTokens"));
      return snap.docs.map(d => d.data());
    } catch(e) { console.warn("FB getAllFCMTokens", e); return []; }
  },

  // Listen for foreground messages (app is open)
  listenForegroundMessages(cb) {
    if (!_messaging) return;
    onMessage(_messaging, payload => {
      console.log("ðŸ“¬ FCM foreground message:", payload);
      cb(payload);
    });
  }
};

// â”€â”€ Start live listeners as soon as Firebase is ready â”€â”€
if (FB_OK) {

  // SCHEMES â€” all devices get live scheme updates when admin adds/removes
  window._fb.watchSchemes(list => {
    if (typeof schemes !== "undefined") {
      schemes = list;
      try { localStorage.setItem("ja_schemes", JSON.stringify(list)); } catch {}
      if (typeof _buildSchemeIndex === "function") _buildSchemeIndex(); // âš¡ keep index in sync
      if (typeof renderSchemes === "function") renderSchemes();
      if (typeof updateSchemeTicker === "function") updateSchemeTicker();
    }
  });

  // Announcements â€” all devices get live announcement updates
  window._fb.watchAnnouncements(list => {
    if (typeof announcements !== "undefined") {
      announcements = list;
      try { localStorage.setItem("ja_announcements", JSON.stringify(list)); } catch {}
      if (typeof renderOutstandingBanner === "function") renderOutstandingBanner();
    }
  });

  // Retailers â€” updates admin panel + pending screen in real time
  window._fb.watchRetailers(list => {
    // Update local state if app is initialized
    if (typeof renderRetailerRequests === "function") {
      renderRetailerRequests();
    }
    if (typeof renderDashboard === "function" && isAdmin) {
      renderDashboard();
    }
    // Check if current pending retailer was approved
    if (window._pendingPoller === "FB") {
      const session = typeof getRetailerSession === "function" ? getRetailerSession() : null;
      if (session) {
        const fresh = list.find(r => r.id === session.id);
        if (fresh && fresh.status === "approved") {
          if (typeof saveRetailerSession === "function") saveRetailerSession(fresh);
          window.currentRetailer = fresh;
          const gate = document.getElementById("retailer-gate");
          if (gate) gate.style.display = "none";
          if (typeof showToast === "function") showToast("âœ… Approved! Welcome to Jain Agencies.");
          // Request push permission now that retailer is approved
          if (typeof onRetailerSessionReady === "function") onRetailerSessionReady(fresh);
        } else if (fresh && fresh.status === "rejected") {
          if (typeof showGateRejected === "function") showGateRejected(fresh);
        }
      }
    }
  });

  // Orders â€” updates admin orders + retailer my-orders in real time
  window._fb.watchOrders(list => {
    if (typeof renderAdminOrders === "function" && isAdmin) {
      renderAdminOrders();
    }
    if (typeof renderMyOrders === "function") {
      renderMyOrders();
    }
    if (typeof updateOrdersNavDot === "function") {
      updateOrdersNavDot();
    }
    if (typeof renderDashboard === "function" && isAdmin) {
      renderDashboard();
    }
  });


  // Live stock - all devices get owner CSV stock updates immediately
  window._fb.watchStock(list => {
    try { localStorage.setItem("ja_live_stock", JSON.stringify(list)); } catch {}
    if (typeof mergeLiveStock === "function") mergeLiveStock(list, { fromFirebase: true });
  });
  // FCM â€” listen for foreground push messages (app is open)
  window._fb.listenForegroundMessages(payload => {
    const n = payload.notification || {};
    const title = n.title || "Jain Agencies";
    const body  = n.body  || "";
    // Show in-app toast + add to notification centre
    if (typeof showToast === "function") showToast("ðŸ”” " + title + (body ? ": " + body : ""));
    if (typeof addInAppNotification === "function") addInAppNotification(title, body, "push");
  });
}



