가비아 고스란체(Gabia Gosran)를 아래 이름 중 하나로 이 폴더에 넣어 주세요.

  GabiaGosran.woff2   (가장 권장 - 용량이 가장 작음)
  GabiaGosran.woff
  GabiaGosran.ttf

다운로드
  가비아 폰트 공식 페이지 또는 눈누(noonnu.cc)에서 "고스란체" 검색

ttf 를 woff2 로 바꾸려면 (터미널)
  pip install fonttools brotli
  fonttools ttLib.woff2 compress GabiaGosran.ttf

폰트 파일이 없으면 애플 산돌고딕으로 자동 대체되어 화면은 정상 동작하지만,
Figma 디자인과 글자 모양이 달라 보입니다.
