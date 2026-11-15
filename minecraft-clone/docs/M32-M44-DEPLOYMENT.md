# M32~M44 공개 배포 확인

2026-11-15 (Asia/Seoul). 13종 맵 개선·동물 추가·단차 카메라 보정 및 검증 기록을 함께 배포했다.

- 소스 커밋: `8273788` — main 푸시 완료.
- 배포 브랜치: `gh-pages`, 커밋 `c7a08afab690dd15b7fb1ac5307ebcde40ac0855`.
- `npm run deploy` 성공. [GitHub Pages 실행](https://github.com/yooseongc/react-three/actions/runs/43713555328) completed / success 확인.
- 공개 번들 `index-98eS_47I.js`가 로컬 배포 빌드와 일치한다.
- 배포 직전 최종 검증: 전체 테스트 306개(47파일), 빌드, diff 검사 통과.
- 공개 사이트에서 크기 100·willow·생성기 4로 13종 모두 로딩, viewport 채움, 동물 활성 확인. 페이지 오류 0. 기존 Three.Clock 경고는 유지된다.
- 사용자 요청대로 추가 보행 검증은 생략했다. 모든 시드·크기·모바일 실기기의 동작을 검증했다는 의미는 아니다.

| 맵 | 확인 당시 활성 동물 |
| --- | ---: |
| 수상 도시 | 14 |
| 가을 계곡 | 27 |
| 벚꽃 신사 | 24 |
| 월영 원림 | 19 |
| 솔바람 별서 | 22 |
| 대나무 온천 마을 | 19 |
| 사막 오아시스 | 16 |
| 열대 산호섬 | 20 |
| 구름 위 정원 | 14 |
| 물빛 숲 | 30 |
| 넓은 초원 | 31 |
| 작은 군도 | 25 |
| 고요한 설원 | 17 |

활성 개체 수는 유효한 서식 공간에 실제 배치된 수로, 설정된 전체 개체 수와 다를 수 있다.

[공개 사이트](https://yooseongc.github.io/react-three/) · [산호섬](https://yooseongc.github.io/react-three/?world=willow&map=coral&gen=4) · [설원](https://yooseongc.github.io/react-three/?world=willow&map=snow&gen=4)
