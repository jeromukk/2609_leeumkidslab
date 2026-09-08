/* =============================================================
   소리소문 생존 - 동작
   흐름 : IDLE → TITLE(페이드 인) → VIDEO(영상+사운드) → END → IDLE
   내용/타이밍 수정은 config.js 에서 하세요.
   ============================================================= */
(function () {
  'use strict';

  var CFG    = window.SORISO_CONFIG;
  var TIMING = CFG.timing;
  var STORE_KEY = 'soriso.type';

  /* ---------- 엘리먼트 ---------- */
  var el = {
    idle:        document.getElementById('screen-idle'),
    title:       document.getElementById('screen-title'),
    video:       document.getElementById('screen-video'),
    heading:     document.getElementById('idle-heading'),
    number:      document.getElementById('idle-number'),
    btnPlay:     document.getElementById('btn-play'),
    btnPlayLbl:  document.getElementById('btn-play-label'),
    titleText:   document.getElementById('title-text'),
    videoEl:     document.getElementById('video'),
    end:         document.getElementById('end-overlay'),
    btnRestart:  document.getElementById('btn-restart'),
    btnRestartL: document.getElementById('btn-restart-label'),
    missing:     document.getElementById('video-missing'),
    hotspot:     document.getElementById('admin-hotspot'),
    admin:       document.getElementById('admin-panel'),
    adminInfo:   document.getElementById('admin-info'),
    adminClose:  document.getElementById('admin-close')
  };

  var timers = [];
  var state  = 'idle';
  var unlocked = false;

  function after(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  /* =============================================================
     1. 이 아이패드가 어떤 종류인지 결정
     - 주소에 ?type=B 를 붙여 한 번 열면 기기에 저장됩니다.
     ============================================================= */
  function resolveType() {
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
     2. 화면 맞춤 배율
     1180 x 820 무대를 잘리지 않게 화면 안에 맞춥니다.
     남는 여백은 화면 배경색과 같아서 눈에 띄지 않습니다.
     ============================================================= */
  function fit() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    var s = Math.min(w / 1180, h / 820);
    document.documentElement.style.setProperty('--s', s);
  }
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', function () { after(300, fit); });
  fit();

  /* =============================================================
     3. 초기 렌더
     ============================================================= */
  function render() {
    el.heading.textContent    = DATA.heading;
    el.number.textContent     = DATA.number;
    el.btnPlayLbl.textContent = CFG.labels.playButton;
    el.btnRestartL.textContent= CFG.labels.restartButton;

    el.titleText.innerHTML = DATA.titleLines
      .map(function (line) { return escapeHtml(line); })
      .join('<br>');

    document.documentElement.style.setProperty(
      '--title-fade', TIMING.titleFadeInMs + 'ms'
    );

    if (DATA.poster) el.videoEl.setAttribute('poster', DATA.poster);
    el.videoEl.src = DATA.video;
    el.videoEl.load();

    el.missing.querySelector('.missing__path').textContent = DATA.video;
    document.title = '소리소문 생존 ' + DATA.number.replace(/-/g, '');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* =============================================================
     4. 화면 전환
     ============================================================= */
  function show(name) {
    state = name;
    el.idle.classList.toggle('is-active',  name === 'idle');
    el.title.classList.toggle('is-active', name === 'title' || name === 'video');
    el.video.classList.toggle('is-active', name === 'video');
  }

  /* ---------- IDLE 로 복귀 ---------- */
  function goIdle() {
    clearTimers();
    el.end.classList.remove('is-active');
    el.titleText.classList.remove('is-in');
    el.missing.hidden = true;

    try {
      el.videoEl.pause();
      el.videoEl.currentTime = 0;
    } catch (e) {}

    show('idle');
    releaseWakeLock();
  }

  /* ---------- '영상 보기' → TITLE → VIDEO ---------- */
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

  /* ---------- 영상 재생 ---------- */
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
        // 브라우저가 소리 있는 자동재생을 막은 경우: 음소거로 시작 후 바로 해제
        el.videoEl.muted = true;
        el.videoEl.play().then(function () {
          after(60, function () { el.videoEl.muted = false; });
        }).catch(function () { showMissing(); });
      });
    }
  }

  function showMissing() {
    el.missing.hidden = false;
    after(4000, goIdle);
  }

  /* ---------- 영상 종료 ---------- */
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

  // 영상 재생 중 화면 터치 무시
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

    // WebAudio 컨텍스트도 함께 깨워 둡니다 (일부 iOS 버전 대응)
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        var ctx = new AC();
        if (ctx.state === 'suspended') ctx.resume();
        var b = ctx.createBuffer(1, 1, 22050);
        var src = ctx.createBufferSource();
        src.buffer = b;
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
    if (document.visibilityState === 'visible') {
      if (state === 'video') requestWakeLock();
    }
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
    if (taps >= 5) {
      taps = 0;
      openAdmin();
    }
  });

  function openAdmin() {
    el.admin.hidden = false;
    el.adminInfo.textContent =
      '현재: ' + TYPE + '  ·  ' + DATA.video + '\n' +
      '선택하면 새로고침되며, 이 기기에 저장됩니다.';
    Array.prototype.forEach.call(
      el.admin.querySelectorAll('.admin__btn'),
      function (b) { b.classList.toggle('is-on', b.dataset.type === TYPE); }
    );
  }

  Array.prototype.forEach.call(
    el.admin.querySelectorAll('.admin__btn'),
    function (b) {
      b.addEventListener('click', function () {
        try { localStorage.setItem(STORE_KEY, b.dataset.type); } catch (e) {}
        location.href = location.pathname + '?type=' + b.dataset.type;
      });
    }
  );

  el.adminClose.addEventListener('click', function () { el.admin.hidden = true; });

  /* =============================================================
     10. 서비스워커 등록 (오프라인 대비 + 빠른 로딩)
     ============================================================= */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

  /* ---------- 시작 ---------- */
  render();
  goIdle();
})();
