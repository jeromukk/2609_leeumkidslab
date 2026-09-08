이 폴더에 완성된 영상을 아래 이름으로 넣어 주세요.

  A.mp4   01 - 풀벌레 소리 대신 들리는 사라짐의 소리
  B.mp4   02 - 짝을 부르는 소리에 다가오는 건 사냥꾼
  C.mp4   03 - 차 소리에 묻히는 새소리


★★ 파일 하나당 25MB 미만 ★★
Cloudflare Pages 는 파일 하나가 25MiB 를 넘으면 배포를 거부합니다.
30초 영상이므로 평균 6Mbps 이하로 맞추면 약 22MB 가 됩니다.
소재가 검정 배경 + 흰 선화라 압축이 잘 먹어서 실제로는 더 작게 나옵니다.


권장 사양
  코덱      H.264 (High profile) + AAC 오디오
  해상도    2360 x 1640  (아이패드 화면의 2배 해상도)
  프레임    30fps
  비트레이트 평균 5~6Mbps, 최대 8Mbps
  오디오    AAC 128~160kbps
  용량      30초 기준 20MB 안쪽


Media Encoder 설정
  형식        H.264
  프리셋      "Match Source - High bitrate" 선택 후 아래를 직접 수정
  비트레이트  VBR 2회 / 대상 5 / 최대 8
  오디오      AAC, 128kbps
  ☑ Fast Start 체크  (없으면 재생 시작이 몇 초씩 늦습니다)


터미널(ffmpeg)로 내보낼 때
  ffmpeg -i 원본.mov \
    -c:v libx264 -profile:v high -pix_fmt yuv420p \
    -crf 22 -maxrate 8M -bufsize 16M \
    -c:a aac -b:a 128k \
    -movflags +faststart A.mp4

  파일 크기 확인
  ls -lh A.mp4


25MB 를 못 맞추겠다면
  Cloudflare R2 (같은 계정의 파일 저장소, 무료 10GB) 에 영상만 올리고
  config.js 의 video 값을 R2 주소로 바꾸면 됩니다.
  예)  video: 'https://pub-xxxx.r2.dev/A.mp4'
