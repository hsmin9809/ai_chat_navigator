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

  // 질문 요소들 가져오기
  const questions = document.querySelectorAll(selector);
  const list = document.getElementById('ai-chapter-list');
  const nav = document.getElementById('ai-chapter-nav');
  
  if (!list) return;

  // [핵심 해결책 1] 목록을 지우기 전에 현재 스크롤 위치를 저장합니다.
  const currentScroll = list.scrollTop;

  if (questions.length === 0) {
    nav.style.display = 'none';
    return;
  }
  nav.style.display = 'block';

  // 목록 초기화 (여기서 스크롤이 0이 되어버림)
  list.innerHTML = '';

  questions.forEach((q, index) => {
    const btn = document.createElement('button');
    btn.className = 'chapter-btn';
    
    // 텍스트 정제
    const rawText = q.innerText || ""; 
    const cleanText = rawText.replace(/\s+/g, ' ').trim(); 
    
    // 30자 제한
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

  // [핵심 해결책 2] 목록을 다 그린 뒤, 아까 저장한 스크롤 위치로 복구합니다.
  // requestAnimationFrame을 사용하면 화면 깜빡임 없이 더 부드럽게 복구됩니다.
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