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
  if (document.getElementById('ai-widget-wrapper')) return; 

  // 1. 전체 래퍼
  const wrapper = document.createElement('div');
  wrapper.id = 'ai-widget-wrapper';

  // 2. 목차 박스
  const nav = document.createElement('div');
  nav.id = 'ai-chapter-nav';

  // 헤더
  const header = document.createElement('div');
  header.id = 'ai-chapter-header';
  header.innerHTML = `
    <span id="header-title">질문 목차</span>
    <span id="toggle-icon">▼</span>
  `;
  
  const list = document.createElement('div');
  list.id = 'ai-chapter-list';

  nav.appendChild(header);
  nav.appendChild(list);

  // 3. 맨 아래로 가기 버튼 생성
  const bottomBtn = document.createElement('button');
  bottomBtn.id = 'go-to-bottom-btn';
  bottomBtn.innerText = '▼';
  
  // [수정된 로직] "채팅 질문의 진짜 부모(스크롤 영역)"를 찾아서 내리기
  bottomBtn.onclick = () => {
    // 1. 현재 화면에 있는 질문들을 가져옴
    const selector = getSelector();
    const questions = document.querySelectorAll(selector);

    // 2. 질문이 하나라도 있다면, 그 질문을 감싸고 있는 스크롤 영역을 찾음
    if (questions.length > 0) {
      // 가장 최근 질문(마지막 질문)부터 시작
      let targetElement = questions[questions.length - 1];
      
      // 부모를 타고 올라가면서 스크롤 가능한 요소를 찾음 (최대 10단계 위까지)
      while (targetElement && targetElement !== document.body) {
        const style = window.getComputedStyle(targetElement);
        const overflowY = style.overflowY;
        
        // "스크롤이 auto거나 scroll"이고 && "실제 내용이 화면보다 길다면" -> 이게 범인이다!
        if ((overflowY === 'auto' || overflowY === 'scroll') && targetElement.scrollHeight > targetElement.clientHeight) {
          targetElement.scrollTo({ top: targetElement.scrollHeight, behavior: 'smooth' });
          return; // 찾았으니 스크롤 내리고 종료
        }
        
        // 아니면 한 단계 더 위 부모로 이동
        targetElement = targetElement.parentElement;
      }
    }

    // 3. 만약 위에서 못 찾았다면 (혹은 질문이 없다면), 최후의 수단으로 전체 창(Window)을 내림
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  wrapper.appendChild(nav);
  wrapper.appendChild(bottomBtn);
  document.body.appendChild(wrapper);

  // 토글 기능
  header.onclick = () => {
    nav.classList.toggle('nav-collapsed');
    wrapper.classList.toggle('wrapper-collapsed');
    
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

  // 최적화: 개수가 같으면 렌더링 건너뜀
  if (questions.length === list.children.length) {
    if (questions.length === 0) nav.style.display = 'none';
    return; 
  }

  const currentScroll = list.scrollTop;

  if (questions.length === 0) {
    nav.style.display = 'none';
    return;
  }
  nav.style.display = 'block';

  list.innerHTML = '';

  questions.forEach((q, index) => {
    const btn = document.createElement('button');
    btn.className = 'chapter-btn';
    
    // [수정 핵심] 텍스트 정제 로직 강화
    const rawText = q.innerText || ""; 
    
    // 1. 줄바꿈을 공백으로 변경
    let cleanText = rawText.replace(/\s+/g, ' ').trim(); 
    
    // 2. "You said", "You", "Question" 같은 불필요한 앞부분 제거 (대소문자 무시)
    // 정규식 설명: 문장 시작(^)에 있는 "You said"나 "You" 뒤에 오는 공백이나 콜론까지 삭제
    cleanText = cleanText.replace(/^(You said|You|Said|Question)[:\s]*/i, '');

    // 3. 30자 제한
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

  requestAnimationFrame(() => {
    list.scrollTop = currentScroll;
  });
}

const observer = new MutationObserver(() => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(updateChapters, 500);
});

window.onload = () => {
  createSidebar();
  updateChapters();
  observer.observe(document.body, { childList: true, subtree: true });
};