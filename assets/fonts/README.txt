GabiaGosran.woff2  (527KB)

가비아 고스란체를 웹용 woff2 형식으로 변환해 넣어 둔 파일입니다.
한글 11,172자 + 라틴/숫자/기호 전부 들어 있어서,
config.js 의 문구를 어떻게 바꿔도 글자가 깨지지 않습니다.

원본
  ~/Desktop/yukyung/02.자료/FONT/GabiaGosran/GabiaGosran.otf

woff2 란
  웹 전용 폰트 압축 형식입니다. 원본 otf(977KB) 대비 절반 크기이고
  브라우저가 바로 읽을 수 있습니다. 사파리 10 이상에서 모두 지원됩니다.

다시 만들어야 한다면
  pip install fonttools brotli
  fonttools ttLib.woff2 compress -o GabiaGosran.woff2 GabiaGosran.otf

app.css 에서는 font-display: block 으로 설정해 두었습니다.
폰트가 준비된 뒤에 글자를 그리므로, 전시 중에 글꼴이 바뀌어 보이는 일이 없습니다.
