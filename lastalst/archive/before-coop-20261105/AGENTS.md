# AGENTS.md — 각궁 공방 대소동

## 프로젝트 목표

`GAME_DESIGN.md`를 기준으로 박물관 태블릿용 1인 탑다운 3D 공방 게임 프로토타입을 구현한다. 첫 목표는 작업대·운반·주문 중첩이 재미있는지 검증하는 것이다.

## 절대 제약 (컴퓨터그래픽스 수업)

- 화면에 표시하는 DOM 요소는 **WebGL canvas 하나**뿐이다. `index.html`에 `<canvas>` 하나를 둔다.
- CSS는 캔버스의 전체 화면 크기와 기본 여백 제거만 처리한다.
- HTML 버튼, div HUD, 폼, DOM 텍스트, 별도 화면 페이지를 사용하지 않는다.
- 모든 게임 화면과 UI는 Three.js `WebGLRenderer`로 같은 캔버스에 그린다.
- UI 텍스트는 오프스크린 2D canvas → `THREE.CanvasTexture` → Plane/Sprite로 표현한다.
- 버튼은 캔버스 좌표 또는 Raycaster로 클릭/터치 판정한다.
- 화면 전환은 `TITLE`, `TUTORIAL`, `PLAYING`, `RESULT` 상태로 처리한다.
- Three.js는 WebGL을 사용하며 WebGPU 렌더러로 바꾸지 않는다.

## 기술 선택

- Vanilla JavaScript ES modules + Three.js
- 설치 최소화를 위해 CDN import map 허용. Node.js, Vite, npm을 필수 전제로 삼지 않는다.
- ES modules 및 3D 자산 로딩을 위해 HTTP 로컬 서버에서 테스트한다. `file://` 직접 실행을 전제하지 않는다.
- 모든 입력은 canvas에 연결한 Pointer Events 기반. 개발용 WASD 추가 가능.

## 교수자 요구 저장소 구조

```text
README.md
TEAM.md
CREDITS.md
index.html
src/main.js
src/scene.js
src/ui.js
src/text.js
src/player.js
src/workstations.js
src/orders.js
src/input.js
assets/
spike/
docs/proposal.md
docs/research.md
docs/flow.md
docs/interfaces.md
docs/feedback.md
docs/performance.md
docs/user-test.md
docs/issues.md
docs/reflection/
```

이 문서의 파일 목록은 목표 구조다. 개발 초기부터 불필요한 빈 문서를 임의로 완성 처리하지 않는다.

## 구현 원칙

1. 항상 실행 가능한 최소 기능을 유지한다.
2. `TASKS.md` 순서대로 작은 단위로 구현하고 완료한 항목만 체크한다.
3. 모델이 없어도 기본 메시로 플레이 가능해야 한다.
4. 게임 로직과 3D 표현을 분리한다. 작업대 상태는 `idle/processing/ready`로 명시한다.
5. `requestAnimationFrame`과 delta time으로 시간 기반 동작을 구현한다.
6. 고증이 불확실한 사실을 실제 각궁 제작법으로 단정하지 않는다. 축약 규칙을 명시한다.
7. 외부 이미지·모델·사운드 사용 시 `CREDITS.md`에 출처·라이선스를 기록한다.
8. 태블릿 가독성을 우선하고 텍스트/버튼은 충분히 크게 만든다.
9. 새 의존성을 추가하기 전에 필요성을 설명한다.
10. 제출용 문서는 교수자가 지정한 `docs/` 경로를 따른다.

## 최소 완료 기준

한 화면에서 이동, 집기, 3개 작업대 처리, 주문 2개 중첩, 납품, 점수, 180초 종료, 재시작이 가능하고 모든 UI가 WebGL 캔버스 안에 있어야 한다.
