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
  if (document.getElementById('ai-chapter-nav')) return; // 이미 있으면 생성 안함

  const nav = document.createElement('div');
  nav.id = 'ai-chapter-nav';
  document.body.appendChild(nav);
}

function updateChapters() {
  const selector = getSelector();
  if (!selector) return;

  // 수정된 선택자로 요소들 가져오기 (이제 덩어리로 가져옵니다)
  const questions = document.querySelectorAll(selector);
  const nav = document.getElementById('ai-chapter-nav');
   
  if (!nav) return;

  nav.innerHTML = ''; // 목록 초기화

  // 질문이 없으면 사이드바 숨김
  if (questions.length === 0) {
    nav.style.display = 'none';
    return;
  }
  nav.style.display = 'block';

  questions.forEach((q, index) => {
    const btn = document.createElement('button');
    btn.className = 'chapter-btn';
    
    // [텍스트 정제 로직 강화]
    // 1. innerText로 전체 텍스트를 가져옴
    // 2. replace(/\s+/g, ' '): 줄바꿈(\n)과 여러 공백을 스페이스 하나로 통일
    const rawText = q.innerText || ""; 
    const cleanText = rawText.replace(/\s+/g, ' ').trim(); 
    
    // 30자 이상이면 ... 처리
    btn.innerText = `${index + 1}. ${cleanText.substring(0, 30)}${cleanText.length > 30 ? '...' : ''}`;
    
    btn.onclick = () => {
      // 부드럽게 스크롤 이동
      q.scrollIntoView({ behavior: 'smooth', block: 'center' });
       
      // 강조 효과 (선택 시 깜빡임)
      q.style.transition = 'background 0.5s';
      const originalBg = q.style.backgroundColor;
      // 노란색 하이라이트 효과
      q.style.backgroundColor = 'rgba(255, 235, 59, 0.3)'; 
      setTimeout(() => {
        q.style.backgroundColor = originalBg;
      }, 1000);
    };

    nav.appendChild(btn);
  });
}

// DOM 변경 감지 (채팅이 추가될 때마다 실행)
const observer = new MutationObserver(() => {
  // 너무 잦은 실행 방지 (Debounce)
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(updateChapters, 500);
});

// 초기 실행
window.onload = () => {
  createSidebar();
  updateChapters();
  // 페이지 전체 감시 시작
  observer.observe(document.body, { childList: true, subtree: true });
};