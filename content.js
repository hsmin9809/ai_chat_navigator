// 사이트별 설정: 내 질문을 찾는 CSS 선택자(Selector)
// ⚠️ 사이트 업데이트 시 이 부분이 가장 먼저 변경될 수 있음
const SITE_CONFIG = {
  'chatgpt.com': {
    // ChatGPT: data-message-author-role 속성이 "user"인 요소
    selector: '.whitespace-pre-wrap' 
  },
  'gemini.google.com': {
    // Gemini: 사용자 아이콘이나 특정 클래스 구조에 의존 (가변적임)
    // 현재 예시: user-query 관련 클래스 혹은 텍스트 컨테이너
    selector: '.query-text'
    // 참고: Gemini는 구조가 복잡하여 정확한 선택자를 찾기 위해 개발자 도구 확인 필요
  },
  'claude.ai': {
    // Claude: 사용자 메시지 폰트 클래스
    selector: '.whitespace-pre-wrap.break-words'
  },
  'www.perplexity.ai': {
    // Perplexity: 질문 제목 클래스
    selector: '.select-text' 
  }
};

let debounceTimer = null;

function getSelector() {
  const host = window.location.hostname;
  if (host.includes('chatgpt')) return SITE_CONFIG['chatgpt.com'].selector;
  if (host.includes('gemini')) return SITE_CONFIG['gemini.google.com'].selector;
  if (host.includes('claude')) return SITE_CONFIG['claude.ai'].selector;
  if (host.includes('perplexity')) return SITE_CONFIG['www.perplexity.ai'].selector;
  return null;
}
function createSidebar() {
  if (document.getElementById('ai-chapter-nav')) return; 

  const nav = document.createElement('div');
  nav.id = 'ai-chapter-nav';

  // 헤더 생성
  const header = document.createElement('div');
  header.id = 'ai-chapter-header';
  
  // HTML 구조: 제목과 아이콘
  header.innerHTML = `
    <span id="header-title">질문 목차</span>
    <span id="toggle-icon">▼</span>
  `;
  
  const list = document.createElement('div');
  list.id = 'ai-chapter-list';

  nav.appendChild(header);
  nav.appendChild(list);
  document.body.appendChild(nav);

  // 토글 기능
  header.onclick = () => {
    // 클래스 토글 (CSS가 알아서 모양을 바꿈)
    nav.classList.toggle('nav-collapsed');
    
    // (선택 사항) 펼쳐질 때 화살표 방향 확실하게 리셋
    const icon = document.getElementById('toggle-icon');
    if (!nav.classList.contains('nav-collapsed')) {
      icon.innerText = '▼'; 
    }
  };
}

function updateChapters() {
  const selector = getSelector();
  if (!selector) return;

  const questions = document.querySelectorAll(selector);
  const list = document.getElementById('ai-chapter-list');
  const nav = document.getElementById('ai-chapter-nav');
  
  if (!list) return;

  // [핵심 최적화]
  // 현재 화면에 표시된 버튼 개수와, 실제 질문 개수가 같다면
  // 아무것도 하지 않고 함수를 종료합니다. (여기서 99%의 부하가 사라짐)
  if (questions.length === list.children.length) {
    // 단, 질문이 하나도 없는데 사이드바가 켜져있으면 숨김 처리
    if (questions.length === 0) nav.style.display = 'none';
    return; 
  }

  // 개수가 다를 때만 아래 로직(렌더링)을 실행합니다.
  
  // 스크롤 위치 저장
  const currentScroll = list.scrollTop;

  if (questions.length === 0) {
    nav.style.display = 'none';
    return;
  }
  nav.style.display = 'block';

  list.innerHTML = ''; // 목록 초기화

  questions.forEach((q, index) => {
    const btn = document.createElement('button');
    btn.className = 'chapter-btn';
    
    const rawText = q.innerText || ""; 
    const cleanText = rawText.replace(/\s+/g, ' ').trim(); 
    
    btn.innerText = `${index + 1}. ${cleanText.substring(0, 30)}${cleanText.length > 30 ? '...' : ''}`;
    
    btn.onclick = (e) => {
      e.stopPropagation();
      q.scrollIntoView({ behavior: 'smooth', block: 'center' });
       
      q.style.transition = 'background 0.5s';
      const originalBg = q.style.backgroundColor;
      q.style.backgroundColor = 'rgba(255, 235, 59, 0.3)'; 
      setTimeout(() => {
        q.style.backgroundColor = originalBg;
      }, 1000);
    };

    list.appendChild(btn);
  });

  // 스크롤 복구
  requestAnimationFrame(() => {
    list.scrollTop = currentScroll;
  });
}

// DOM 변경 감지
const observer = new MutationObserver(() => {
 clearTimeout(debounceTimer);
 debounceTimer = setTimeout(updateChapters, 500);
});

window.onload = () => {
 createSidebar();
 updateChapters();
 observer.observe(document.body, { childList: true, subtree: true });
};