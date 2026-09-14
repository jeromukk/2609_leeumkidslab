/* =============================================================
   소리소문 생존 - 동작
   흐름 : IDLE → TITLE(페이드 인) → VIDEO(영상+사운드) → END → IDLE

   화면 마크업도 이 파일이 직접 만듭니다.
   덕분에 a / b / c 폴더의 index.html 은 몇 줄짜리 껍데기이고,
   화면을 고칠 일이 생겨도 이 파일 하나만 고치면 3종에 모두 반영됩니다.

   내용/타이밍 수정은 config.js 에서 하세요.
   ============================================================= */
(function () {
  'use strict';

  var CFG    = window.SORISO_CONFIG;
  var TIMING = CFG.timing;
  var BASE   = window.SORISO_BASE || '';     // a/b/c 폴더에서는 '../'
  var FIXED  = window.SORISO_TYPE || '';     // 폴더에 고정된 종류
  var STORE_KEY = 'soriso.type';

  var timers = [];
  var state  = 'idle';
  var unlocked = false;

  function after(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  /* =============================================================
     1. 이 화면이 어떤 종류인지 결정
     우선순위 : 폴더 고정값 → 주소의 ?type= → 기기에 저장된 값 → 기본값
     ============================================================= */
  function resolveType() {
    if (CFG.types[FIXED]) return FIXED;

    var q = new URLSearchParams(location.search).get('type');
    var h = (location.hash || '').replace('#', '');
    var picked = (q || h || '').toUpperCase();

    if (CFG.types[picked]) {
      try { localStorage.setItem(STORE_KEY, picked); } catch (e) {}
      return picked;
    }
    try {
      var saved = localStorage.getItem(STORE_KEY);
      if (saved && CFG.types[saved]) return saved;
    } catch (e) {}
    return CFG.defaultType;
  }

  var TYPE = resolveType();
  var DATA = CFG.types[TYPE];

  /* =============================================================
     2. 화면 만들기
     ============================================================= */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  document.body.insertAdjacentHTML('afterbegin', [
    '<section id="screen-idle" class="screen screen--idle is-active">',
    '  <div class="frame">',
    '    <h1 class="idle__heading">' + esc(DATA.heading) + '</h1>',
    '    <p class="idle__number">' + esc(DATA.number) + '</p>',
    '    <button id="btn-play" class="pill" type="button">' + esc(CFG.labels.playButton) + '</button>',
    '  </div>',
    '</section>',

    '<section id="screen-title" class="screen screen--title">',
    '  <div class="frame">',
    '    <h2 id="title-text" class="title__text">' +
         DATA.titleLines.map(esc).join('<br>') + '</h2>',
    '  </div>',
    '</section>',

    '<section id="screen-video" class="screen screen--video">',
    '  <video id="video" class="video" playsinline webkit-playsinline',
    '         preload="auto" disablepictureinpicture',
    '         controlslist="nodownload noplaybackrate noremoteplayback"></video>',
    '  <div id="end-overlay" class="end">',
    '    <button id="btn-restart" class="pill pill--dark" type="button">' +
           esc(CFG.labels.restartButton) + '</button>',
    '  </div>',
    '  <div id="video-missing" class="missing" hidden>',
    '    <p class="missing__title">영상 파일이 없습니다</p>',
    '    <p class="missing__path">' + esc(BASE + DATA.video) + '</p>',
    '    <p class="missing__hint">assets/video/ 폴더에 A.mp4 / B.mp4 / C.mp4 를 넣어 주세요.</p>',
    '  </div>',
    '</section>',

    '<button id="admin-hotspot" class="hotspot" type="button" aria-label="관리자"></button>',
    '<div id="admin-panel" class="admin" hidden>',
    '  <p class="admin__title">이 아이패드의 종류</p>',
    '  <div class="admin__row">',
    '    <button class="admin__btn" data-type="A">A · 01</button>',
    '    <button class="admin__btn" data-type="B">B · 02</button>',
    '    <button class="admin__btn" data-type="C">C · 03</button>',
    '  </div>',
    '  <p id="admin-info" class="admin__info"></p>',
    '  <button id="admin-close" class="admin__close" type="button">닫기</button>',
    '</div>'
  ].join('\n'));

  var el = {
    idle:       document.getElementById('screen-idle'),
    title:      document.getElementById('screen-title'),
    video:      document.getElementById('screen-video'),
    btnPlay:    document.getElementById('btn-play'),
    titleText:  document.getElementById('title-text'),
    videoEl:    document.getElementById('video'),
    end:        document.getElementById('end-overlay'),
    btnRestart: document.getElementById('btn-restart'),
    missing:    document.getElementById('video-missing'),
    hotspot:    document.getElementById('admin-hotspot'),
    admin:      document.getElementById('admin-panel'),
    adminInfo:  document.getElementById('admin-info'),
    adminClose: document.getElementById('admin-close')
  };

  document.documentElement.style.setProperty('--title-fade', TIMING.titleFadeInMs + 'ms');
  if (DATA.poster) el.videoEl.setAttribute('poster', BASE + DATA.poster);
  el.videoEl.src = BASE + DATA.video;
  el.videoEl.load();

  /* =============================================================
     3. 화면 맞춤 배율
     1180 x 820 무대를 잘리지 않게 화면 안에 맞춥니다.
     남는 여백은 화면 배경색과 같아서 눈에 띄지 않습니다.
     ============================================================= */
  function fit() {
    var s = Math.min(window.innerWidth / 1180, window.innerHeight / 820);
    document.documentElement.style.setProperty('--s', s);
  }
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', function () { after(300, fit); });
  fit();

  /* =============================================================
     4. 화면 전환
     ============================================================= */
  function show(name) {
    state = name;
    el.idle.classList.toggle('is-active',  name === 'idle');
    el.title.classList.toggle('is-active', name === 'title' || name === 'video');
    el.video.classList.toggle('is-active', name === 'video');
  }

  function goIdle() {
    clearTimers();
    el.end.classList.remove('is-active');
    el.titleText.classList.remove('is-in');
    el.missing.hidden = true;
    try { el.videoEl.pause(); el.videoEl.currentTime = 0; } catch (e) {}
    show('idle');
    releaseWakeLock();
  }

  function start() {
    if (state !== 'idle') return;
    clearTimers();

    unlockAudio();      // iOS 사운드 재생 권한 확보 (반드시 탭 안에서)
    requestWakeLock();

    show('title');

    // 화면이 검은색으로 넘어간 뒤(약 0.4초) 타이틀 글자가 서서히 나타납니다.
    var SETTLE = 400;
    after(SETTLE, function () { el.titleText.classList.add('is-in'); });

    // 글자가 다 나타난 뒤 잠시 머물렀다가 영상 시작 (기본 약 2.8초)
    after(SETTLE + TIMING.titleFadeInMs + TIMING.titleHoldMs, playVideo);
  }

  function playVideo() {
    show('video');
    el.missing.hidden = true;
    el.end.classList.remove('is-active');

    el.videoEl.muted = false;
    el.videoEl.volume = 1;
    try { el.videoEl.currentTime = 0; } catch (e) {}

    var p = el.videoEl.play();
    if (p && p.catch) {
      p.catch(function () {
        // 소리 있는 재생이 막힌 경우: 음소거로 시작한 뒤 바로 해제
        el.videoEl.muted = true;
        el.videoEl.play().then(function () {
          after(60, function () { el.videoEl.muted = false; });
        }).catch(showMissing);
      });
    }
  }

  function showMissing() {
    el.missing.hidden = false;
    after(4000, goIdle);
  }

  el.videoEl.addEventListener('ended', function () {
    el.end.classList.add('is-active');
    after(TIMING.endHoldMs, goIdle);
  });
  el.videoEl.addEventListener('error', function () {
    if (state === 'video') showMissing();
  });

  /* =============================================================
     5. 입력
     ============================================================= */
  el.btnPlay.addEventListener('click', start);

  el.btnRestart.addEventListener('click', function (e) {
    e.stopPropagation();
    clearTimers();
    el.end.classList.remove('is-active');
    el.titleText.classList.remove('is-in');
    try { el.videoEl.pause(); el.videoEl.currentTime = 0; } catch (err) {}
    state = 'idle';
    start();                      // 소제목 화면부터 다시 감상
  });

  el.video.addEventListener('click', function (e) {
    if (TIMING.lockDuringVideo && state === 'video' &&
        !el.end.classList.contains('is-active')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  /* =============================================================
     6. iOS 사운드 잠금 해제
     사용자가 버튼을 누른 그 순간에 한 번 재생을 걸었다 멈춰 두면
     이후 코드에서 소리와 함께 재생할 수 있습니다.
     ============================================================= */
  function unlockAudio() {
    if (unlocked) return;
    unlocked = true;
    try {
      el.videoEl.muted = true;
      var p = el.videoEl.play();
      if (p && p.then) {
        p.then(function () {
          el.videoEl.pause();
          try { el.videoEl.currentTime = 0; } catch (e) {}
          el.videoEl.muted = false;
        }).catch(function () { el.videoEl.muted = false; });
      } else {
        el.videoEl.pause();
        el.videoEl.muted = false;
      }
    } catch (e) {
      el.videoEl.muted = false;
    }

    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        var ctx = new AC();
        if (ctx.state === 'suspended') ctx.resume();
        var src = ctx.createBufferSource();
        src.buffer = ctx.createBuffer(1, 1, 22050);
        src.connect(ctx.destination);
        src.start(0);
      }
    } catch (e) {}
  }

  /* =============================================================
     7. 화면 꺼짐 방지 (Wake Lock)
     ============================================================= */
  var wakeLock = null;

  function requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    navigator.wakeLock.request('screen')
      .then(function (lock) { wakeLock = lock; })
      .catch(function () {});
  }
  function releaseWakeLock() {
    if (wakeLock) { try { wakeLock.release(); } catch (e) {} wakeLock = null; }
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && state === 'video') requestWakeLock();
  });

  /* =============================================================
     8. 전시용 조작 차단
     ============================================================= */
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  document.addEventListener('dblclick', function (e) { e.preventDefault(); });
  document.addEventListener('touchmove', function (e) {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });

  /* =============================================================
     9. 관리자 패널 (왼쪽 위 모서리 5회 탭)
     ============================================================= */
  var taps = 0, tapTimer = null;

  el.hotspot.addEventListener('click', function () {
    taps++;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(function () { taps = 0; }, 1200);
    if (taps >= 5) { taps = 0; openAdmin(); }
  });

  function openAdmin() {
    el.admin.hidden = false;
    el.adminInfo.textContent = FIXED
      ? '현재: ' + TYPE + '  ·  이 주소는 ' + TYPE + ' 전용입니다.\n다른 종류는 해당 주소로 접속하세요.'
      : '현재: ' + TYPE + '\n선택하면 새로고침되며 이 기기에 저장됩니다.';
    Array.prototype.forEach.call(el.admin.querySelectorAll('.admin__btn'), function (b) {
      b.classList.toggle('is-on', b.dataset.type === TYPE);
      b.disabled = !!FIXED;
      b.style.opacity = FIXED ? 0.35 : 1;
    });
  }

  Array.prototype.forEach.call(el.admin.querySelectorAll('.admin__btn'), function (b) {
    b.addEventListener('click', function () {
      if (FIXED) return;
      try { localStorage.setItem(STORE_KEY, b.dataset.type); } catch (e) {}
      location.href = location.pathname + '?type=' + b.dataset.type;
    });
  });

  el.adminClose.addEventListener('click', function () { el.admin.hidden = true; });

  /* =============================================================
     10. 서비스워커 등록 (빠른 로딩 + 접속 끊김 대비)
     ============================================================= */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register(BASE + 'sw.js').catch(function () {});
    });
  }

  goIdle();
})();
