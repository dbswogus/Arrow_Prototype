# a/b 캐릭터 교체 기록

제공된 GLB v2의 scene/node TRS를 적용하고 indexed triangle POSITION/TEXCOORD_0 데이터를 읽었다. 캐릭터별 72삼각형을 높이 1.65로 정규화했다. 원본 idle/walk animation track을 보간하여 초당 약 16회 포즈를 저장했다. 회전 보간은 정규화한 quaternion 선형 보간을 사용한다. 전체 27개 애니메이션 중 대기/걷기만 포함하며 넘어짐은 모델 전체 회전으로 표현한다.

PNG 두 개를 atlas로 합쳐 data URI로 내장했다. 원본 UV는 0~1을 벗어나는 repeat 좌표를 사용하므로 셰이더에서 fract를 적용한 뒤 각 캐릭터의 atlas 구역에 배치한다. UV를 단순 clamp하지 않는다. 순수 WebGL color pass의 vertex stride를 32바이트(position 2 / color 4 / UV 2)로 확장했다. 공방 도형은 UV -1로 비텍스처 경로를 사용한다. UI texture pass는 별도 sampler를 사용한다.

오프라인 소프트웨어 미리보기에서 모델과 텍스처를 확인했고, 실제 렌더러의 메시 배치 코드를 모의 GL 환경에서 검사했다. 실제 GPU 셰이더 컴파일·브라우저 화면·태블릿 성능은 확인하지 못했다.

외부 자산 출처는 사용자가 제공한 로컬 GLB format 폴더다. 제작자/배포처/라이선스 문서는 확인되지 않았으므로 배포 전 원본 이용 조건을 확인해야 한다. 기존 CREDITS의 외부 자산 미사용 설명은 이번 a/b 캐릭터에는 적용되지 않는다.
