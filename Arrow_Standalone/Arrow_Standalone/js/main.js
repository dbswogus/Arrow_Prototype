(async function () {
  try {
    const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js');
    new Gukgung.Game(THREE);
  } catch (error) {
    const overlay = document.getElementById('overlay');
    overlay.classList.remove('hidden');
    overlay.innerHTML = '<section class="panel"><h2>활터를 열 수 없어요</h2><p>인터넷 연결과 브라우저의 WebGL 지원을 확인해 주세요. 압축을 푼 폴더의 파일들이 모두 함께 있어야 합니다.</p><button id="reload">다시 불러오기</button></section>';
    document.getElementById('reload').onclick = () => location.reload();
    console.error(error);
  }
})();
