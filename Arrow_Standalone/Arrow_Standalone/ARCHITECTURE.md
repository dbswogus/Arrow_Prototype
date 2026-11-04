# 코드 구조

Node.js·Vite 없이 일반 JavaScript 클래스를 순서대로 불러옵니다. 로컬 HTML 더블클릭 실행을 유지하기 위해 로컬 ES 모듈 import 대신 `defer` 스크립트와 `Gukgung` 네임스페이스를 사용합니다. Three.js만 원격 모듈로 불러옵니다.

| 파일 | 책임 |
| --- | --- |
| index.html | 화면의 HTML과 외부 파일 참조 |
| css/style.css | 화면 배치와 스타일 |
| js/config.js | 과녁, 기본 각도, 충전 시간, 바람 계수 |
| js/main.js | Three.js 로딩, Game 생성, 로딩 실패 안내 |
| js/game/Game.js | 상태 전환, 경기 루프, 객체 연결 |
| js/game/TurnManager.js | 2인 교대, 5발 기록, 순위·몰기 |
| js/game/WindSystem.js | 시간에 따른 바람 값과 화면 기준 횡가속도 |
| js/game/ArrowPhysics.js | 독립된 발사 각도·세기, 비행 적분, 충돌 |
| js/game/NPCArcher.js | NPC의 오차와 바람 보정 |
| js/input/AimController.js | 상하좌우 조준, 길게 누르기 충전 입력, 포인터 캡처·취소 |
| js/input/AimProjection.js | 커서의 카메라 광선 → 발사 방향, 동일 기준의 조준점 투영 |
| js/scene/ArcheryRange.js | Three.js 활터·활·화살·깃발, 궤적 수명 |
| js/scene/CameraDirector.js | 추적/고정 카메라, 조준 방향 표시 투영 |
| js/ui/HUD.js | 기록·바람·당김·시작/결과 화면 표시 |
| tests/run.cjs | 개발용 자동 검증. 게임 실행에는 필요 없음 |

상태 흐름은 `INTRO → PLAYER_AIM → PLAYER_SHOT → IMPACT → NPC_WAIT → NPC_SHOT → IMPACT`입니다. 각 5발을 마치면 `ROUND_RESULT`로 이동합니다. 연습 상태는 없습니다.

각도와 세기는 독립입니다. 화면의 x/y 위치가 yaw/pitch를 결정하고, 발사 버튼을 누르고 있는 시간만 power를 결정합니다. 약 1초에 최대치로 고정되며 손을 떼면 발사합니다. 당김 중에는 조준값을 고정하고, 발사 후 선택한 각도를 유지하므로 다음 차례에 보정할 수 있습니다.

입력과 조준점 표시가 AimProjection을 공유합니다. 커서에서 나온 카메라 광선과 발사 원점 중심의 반지름 25 방향 참조 구면을 교차해 각도를 계산하고, 같은 점을 다시 화면으로 투영합니다. 중력이나 바람을 미리 계산한 탄착점이 아닙니다. 고정 각도 범위를 화면 전체에 선형 대응하던 방식은 제거했습니다. 내 차례에 카메라를 초기화하고, 클릭·터치 종료 시 조준을 고정하여 당김 버튼으로 이동하는 동안 값이 달라지지 않습니다.

바람 양수는 화면 오른쪽입니다. 카메라가 +Z를 보므로 물리의 X 가속도는 음수이며, UI·깃발·탄착 안내도 이 기준을 따릅니다. NPC와 플레이어가 같은 WindSystem과 ArrowPhysics를 사용합니다.

충전 시간은 performance.now() 기준으로 계산하며 Game.update에서 화면에 반영합니다. 최대치에서 자동 발사하지 않습니다. 포인터 캡처로 버튼 밖에서 손을 떼어도 한 번만 발사하고, 취소·창 포커스 이탈·페이지 숨김 시 충전을 해제합니다. 키보드 Enter/Space도 누르기와 놓기를 같은 방식으로 처리합니다.
