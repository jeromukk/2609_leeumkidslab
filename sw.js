/* =============================================================
   서비스워커 (Service Worker)
   - 브라우저 안에 상주하면서 파일을 대신 내려주는 작은 프로그램입니다.
   - 앱 화면/글꼴/이미지를 기기에 저장해 두므로 접속이 빠르고,
     와이파이가 잠깐 끊겨도 화면이 유지됩니다.
   - 코드를 고쳐서 다시 배포할 때는 아래 VERSION 숫자를 올려 주세요.
   ============================================================= */

var VERSION = 'soriso-v2';

/* 미리 저장해 둘 파일 목록 (영상은 용량이 커서 제외) */
var SHELL = [
  './',
  './index.html',
  './app.css',
  './app.js',
  './config.js',
  './manifest.webmanifest',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/poster/A.png',
  './assets/poster/B.png',
  './assets/poster/C.png',
  './assets/fonts/GabiaGosran.woff2'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSION).then(function (cache) {
      // 파일 하나가 없어도 설치가 실패하지 않도록 개별 처리
      return Promise.all(SHELL.map(function (url) {
        return cache.add(url).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== VERSION) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  if (url.origin !== location.origin) return;

  /* 영상은 구간 요청(Range)을 쓰므로 캐시를 거치지 않고 그대로 통과 */
  if (/\.(mp4|m4v|mov|webm|mp3|wav|m4a)$/i.test(url.pathname)) return;

  /* HTML 은 최신 우선 (배포한 수정 사항이 바로 반영되도록) */
  if (req.mode === 'navigate' || /\.html?$/i.test(url.pathname)) {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (r) {
          return r || caches.match('./index.html');
        });
      })
    );
    return;
  }

  /* 그 외 정적 파일은 캐시 우선 + 뒤에서 조용히 갱신 */
  e.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});
