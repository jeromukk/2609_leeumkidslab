/* =============================================================
   소리소문 생존 - 콘텐츠 & 연출 설정
   여기 값만 고치면 문구 / 타이밍 / 영상 파일이 바뀝니다.
   코드(app.js)는 건드릴 필요 없습니다.
   ============================================================= */

window.SORISO_CONFIG = {

  /* ---------- 연출 타이밍 (단위: ms, 1000 = 1초) ---------- */
  timing: {
    // '영상 보기'를 누르고 → 검은 화면에서 타이틀이 서서히 나타나는 시간
    titleFadeInMs: 1200,

    // 타이틀이 다 나타난 뒤 → 영상이 시작되기까지 머무는 시간
    // (titleFadeInMs + titleHoldMs = 실제 체감 대기 시간. 지금은 약 2.6초)
    titleHoldMs: 1200,

    // 타이틀 화면 → 영상 화면으로 넘어갈 때 겹치며 사라지는 시간
    titleFadeOutMs: 600,

    // 영상이 끝난 뒤 '처음으로' 버튼이 떠 있는 시간.
    // 이 시간 안에 아무도 안 누르면 자동으로 IDLE(기본 모드)로 돌아갑니다.
    // ※ 기획서 원문은 2초(2000)지만, 관람객이 버튼을 누를 여유가 없어 6초를 기본값으로 둠
    endHoldMs: 6000,

    // 영상 재생 중 화면을 눌렀을 때 무시할지 여부
    lockDuringVideo: true
  },

  /* ---------- 3종 콘텐츠 ----------
     각 종류에 아래 항목을 더 넣을 수 있습니다.
       skipTitle: true    영상에 제목이 이미 있을 때, 앱의 제목 화면을 건너뜁니다
       fit: 'contain'     영상이 잘리지 않게 전체를 보여줍니다 (기본값은 'cover')
  */
  // key(A/B/C)는 URL의 ?type= 값과 같습니다.
  types: {
    A: {
      number: '-02-',                     // IDLE 화면의 회차 표기 (비우면 표기 없이 배치가 조정됩니다)
      heading: '일상 속 사라짐',            // IDLE 화면의 큰 제목 (3종 공통)
      titleLines: [                       // TITLE 화면에서 페이드 인 되는 소제목
        '풀벌레 소리 대신 들리는',
        '사라짐의 소리'
      ],
      video: 'assets/video/A.mp4',
      poster: 'assets/poster/A.png',
      skipTitle: true
    },
    B: {
      number: '-03-',
      heading: '일상 속 사라짐',
      titleLines: [
        '짝을 부르는 소리에',
        '다가오는 건 사냥꾼'
      ],
      video: 'assets/video/B.mp4',
      poster: 'assets/poster/B.png',
      skipTitle: true
    },
    C: {
      number: '-01-',
      heading: '일상 속 사라짐',
      titleLines: [
        '차 소리에 묻히는',
        '새소리'
      ],
      video: 'assets/video/C.mp4',
      poster: 'assets/poster/C.png',
      skipTitle: true
    }
  },

  /* ---------- 이 아이패드의 기본 종류 ---------- */
  // URL에 ?type=B 를 한 번 붙여서 열면 그 값이 기기에 저장되고,
  // 다음부터는 주소만 열어도 계속 B로 뜹니다.
  defaultType: 'A',

  /* ---------- UI 문구 ---------- */
  labels: {
    playButton: '영상 보기',
    loadingButton: '준비 중',   // 영상을 받는 동안 버튼에 표시
    restartButton: '처음으로'
  }
};
