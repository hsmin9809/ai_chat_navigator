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

  // 1. 전체 컨테이너 생성
  const nav = document.createElement('div');
  nav.id = 'ai-chapter-nav';

  // 2. 헤더 (접기/펼치기 버튼 역할) 생성
  const header = document.createElement('div');
  header.id = 'ai-chapter-header';
  header.innerHTML = `
    <span>💬 질문 목차</span>
    <span id="toggle-icon">▼</span>
  `;
  
  // 3. 목록 영역 생성
  const list = document.createElement('div');
  list.id = 'ai-chapter-list';

  // 4. 조립
  nav.appendChild(header);
  nav.appendChild(list);
  document.body.appendChild(nav);

  // 5. 클릭 이벤트 (접기/펼치기 기능)
  header.onclick = () => {
    nav.classList.toggle('nav-collapsed');
    const icon = document.getElementById('toggle-icon');
    // 접혀있으면(nav-collapsed 클래스 있으면) 아이콘 변경
    icon.innerText = nav.classList.contains('nav-collapsed') ? '▲' : '▼';
  };
}

function updateChapters() {
  const selector = getSelector();
  if (!selector) return;

  // 수정된 선택자로 요소들 가져오기
  const questions = document.querySelectorAll(selector);
  const list = document.getElementById('ai-chapter-list');
  const nav = document.getElementById('ai-chapter-nav');
  
  if (!list) return;

  // 질문이 없으면 사이드바 숨김
  if (questions.length === 0) {
    nav.style.display = 'none';
    return;
  }
  nav.style.display = 'block';

 // 기존 목록 비우기 (중복 방지)
 list.innerHTML = '';

 questions.forEach((q, index) => {
   const btn = document.createElement('button');
   btn.className = 'chapter-btn';
   
   // 텍스트 정제
   const rawText = q.innerText || ""; 
   const cleanText = rawText.replace(/\s+/g, ' ').trim(); 
   
   // 30자 이상이면 ... 처리
   btn.innerText = `${index + 1}. ${cleanText.substring(0, 30)}${cleanText.length > 30 ? '...' : ''}`;
   
   btn.onclick = (e) => {
     // 이벤트 버블링 방지 (헤더 클릭과 겹치지 않게)
     e.stopPropagation();
     
     q.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
     // 강조 효과
     q.style.transition = 'background 0.5s';
     const originalBg = q.style.backgroundColor;
     q.style.backgroundColor = 'rgba(255, 235, 59, 0.3)'; 
     setTimeout(() => {
       q.style.backgroundColor = originalBg;
     }, 1000);
   };

   list.appendChild(btn);
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