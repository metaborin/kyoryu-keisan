// きょうりゅう けいさん Service Worker
// 更新したら VERSION を上げる
const VERSION = "v12c-nocache";
const CACHE = "kyoryu-keisan-" + VERSION;
const CORE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png",
  "./assets/art/adult.webp",
  "./assets/art/anky.webp",
  "./assets/art/baby.webp",
  "./assets/art/brachio.webp",
  "./assets/art/child.webp",
  "./assets/art/egg-cracked.webp",
  "./assets/art/egg.webp",
  "./assets/art/ice.webp",
  "./assets/art/journal.webp",
  "./assets/art/jungle.webp",
  "./assets/art/nest.webp",
  "./assets/art/para.webp",
  "./assets/art/ptera.webp",
  "./assets/art/rex.webp",
  "./assets/art/sea.webp",
  "./assets/art/spino.webp",
  "./assets/art/steg.webp",
  "./assets/art/treasure.webp",
  "./assets/art/tri.webp",
  "./assets/art/volcano.webp",
  "./assets/art/fossil-steg.webp",
  "./assets/art/fossil-tri.webp",
  "./assets/art/fossil-anky.webp",
  "./assets/art/fossil-para.webp",
  "./assets/art/fossil-brachio.webp",
  "./assets/art/fossil-ptera.webp",
  "./assets/art/fossil-spino.webp",
  "./assets/art/fossil-rex.webp",
  "./assets/art/gold-egg.webp",
  "./assets/art/medal-bronze.webp",
  "./assets/art/medal-silver.webp",
  "./assets/art/medal-gold.webp",
  "./assets/art/chest-open.webp",
  "./assets/art/stopwatch.webp",
  "./assets/art/flag.webp",
  "./assets/art/map.webp",
  "./assets/art/pose/baby-walk-a.webp",
  "./assets/art/pose/baby-walk-b.webp",
  "./assets/art/pose/baby-eat-a.webp",
  "./assets/art/pose/baby-eat-b.webp",
  "./assets/art/pose/baby-sleep.webp",
  "./assets/art/pose/baby-roar.webp",
  "./assets/art/pose/baby-dig.webp",
  "./assets/art/pose/baby-look.webp",
  "./assets/art/pose/child-walk-a.webp",
  "./assets/art/pose/child-walk-b.webp",
  "./assets/art/pose/child-eat-a.webp",
  "./assets/art/pose/child-eat-b.webp",
  "./assets/art/pose/child-sleep.webp",
  "./assets/art/pose/child-roar.webp",
  "./assets/art/pose/child-dig.webp",
  "./assets/art/pose/child-look.webp",
  "./assets/art/pose/adult-walk-a.webp",
  "./assets/art/pose/adult-walk-b.webp",
  "./assets/art/pose/adult-eat-a.webp",
  "./assets/art/pose/adult-eat-b.webp",
  "./assets/art/pose/adult-sleep.webp",
  "./assets/art/pose/adult-roar.webp",
  "./assets/art/pose/adult-dig.webp",
  "./assets/art/pose/adult-look.webp",
  "./assets/art/meat.webp",
  "./assets/art/fern.webp",
  "./assets/art/dragonfly.webp",
  "./assets/art/dirt.webp"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("kyoryu-keisan-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // ページ本体: ネット優先(更新をすぐ反映)、つながらなければキャッシュ
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req, { cache: "no-cache" })
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy)); return res; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // 同じサイトのファイル(app.js・style.css・画像): ネット優先、つながらなければキャッシュ
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req, { cache: "no-cache" })
        .then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }))
    );
    return;
  }

  // フォント(Google Fonts): キャッシュ優先、裏で更新
  if (url.host === "fonts.googleapis.com" || url.host === "fonts.gstatic.com") {
    e.respondWith(
      caches.open(CACHE).then(async c => {
        const hit = await c.match(req);
        const net = fetch(req).then(res => { if (res && (res.ok || res.type === "opaque")) c.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || net;
      })
    );
  }
});
