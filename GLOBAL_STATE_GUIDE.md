# 전역 상태 관리 시스템 (Global State Management)

## 개요

이 프로젝트는 **Zustand** 기반의 강력한 전역 상태 관리 시스템을 구현합니다. 모든 페이지에서 `header-nav.html`을 자동으로 로드하고, 전역 상태를 공유합니다.

## 아키텍처

### 1. **global-state-store.js** (상태 관리 라이브러리)
- **Zustand** (CDN)를 기본으로 사용
- Redux (CDN) 폴백 지원
- Fallback Store (라이브러리 없이 작동) 지원
- 자동 초기화 및 에러 처리

### 2. **global-header-loader.js** (헤더 로더)
- 모든 페이지에서 `header-nav.html` 자동 로드
- 헤더 상태 관리 (드롭다운, 활성 메뉴 등)
- 전역 상태 스토어와 자동 동기화
- 재시도 로직 및 에러 처리

### 3. **server.js** (백엔드)
- 모든 HTML 파일에 스크립트 자동 주입
- 마운트 포인트 자동 생성
- 캐싱 방지

## 전역 상태 구조

```javascript
{
  // 헤더 관련
  headerLoaded: boolean,           // 헤더 로드 완료 여부
  activeMenuId: string | null,     // 현재 활성 메뉴 ID
  
  // 네비게이션
  navigationItems: array,          // 네비게이션 항목 목록
  
  // 사용자 설정
  userPreferences: {
    theme: 'light' | 'dark',       // 테마 (기본값: 'light')
    language: 'ko' | 'en',         // 언어 (기본값: 'ko')
  },
  
  // 에러 처리
  error: string | null,            // 에러 메시지
  
  // 로딩 상태
  loading: boolean                 // 로딩 상태
}
```

## 사용 방법

### 기본 API

모든 페이지에서 `window.GlobalState` 객체를 통해 전역 상태에 접근할 수 있습니다.

#### 1. 상태 조회

```javascript
// 전체 상태 조회
const state = window.GlobalState.getState();
console.log(state.headerLoaded);

// 특정 상태만 조회 (Zustand 사용 시)
const headerLoaded = window.GlobalState.getState()?.headerLoaded;
```

#### 2. 상태 업데이트

```javascript
// 상태 업데이트 (Fallback Store 또는 Zustand)
window.GlobalState.setState({
  userPreferences: {
    theme: 'dark',
    language: 'en'
  }
});

// Redux 스타일 dispatch
window.GlobalState.dispatch({
  type: 'SET_THEME',
  payload: 'dark'
});
```

#### 3. 상태 구독

```javascript
// 상태 변경 감시
const unsubscribe = window.GlobalState.subscribe((state) => {
  console.log('상태 변경:', state);
  
  if (state.headerLoaded) {
    console.log('헤더 로드 완료!');
  }
});

// 구독 해제
unsubscribe();
```

### 헤더 관련 API

`window.GlobalHeader` 객체를 통해 헤더 관련 작업을 수행할 수 있습니다.

```javascript
// 헤더 현재 상태 조회
const headerState = window.GlobalHeader.getState();

// 활성 메뉴 설정
window.GlobalHeader.dispatch({
  type: 'GLOBAL_HEADER/SET_ACTIVE_MENU',
  menuId: 'menu:Products'
});

// 활성 메뉴 해제
window.GlobalHeader.dispatch({
  type: 'GLOBAL_HEADER/SET_ACTIVE_MENU',
  menuId: null
});

// 헤더 재로드
window.GlobalHeader.mount();
```

## 예제

### 예제 1: 테마 변경 감시

```html
<script>
  // 테마 변경 감시
  window.GlobalState.subscribe((state) => {
    const isDark = state.userPreferences.theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
  });
  
  // 테마 변경
  function toggleTheme() {
    const state = window.GlobalState.getState();
    const newTheme = state.userPreferences.theme === 'light' ? 'dark' : 'light';
    
    window.GlobalState.setState({
      userPreferences: {
        ...state.userPreferences,
        theme: newTheme
      }
    });
  }
</script>
```

### 예제 2: 헤더 로드 완료 감시

```javascript
// 헤더 로드 완료까지 기다리기
function waitForHeader() {
  return new Promise((resolve) => {
    const state = window.GlobalState.getState();
    
    if (state?.headerLoaded) {
      resolve();
      return;
    }
    
    const unsubscribe = window.GlobalState.subscribe((newState) => {
      if (newState.headerLoaded) {
        unsubscribe();
        resolve();
      }
    });
  });
}

// 사용
await waitForHeader();
console.log('헤더 로드 완료!');
```

### 예제 3: 모든 페이지에서 일관된 네비게이션 상태 관리

```javascript
// page1.html
window.GlobalState.setState({
  navigationItems: [
    { id: 1, label: '홈', path: '/' },
    { id: 2, label: '제품', path: '/products' },
    { id: 3, label: '연락처', path: '/contact' }
  ]
});

// page2.html
window.GlobalState.subscribe((state) => {
  if (state.navigationItems.length > 0) {
    // 네비게이션 렌더링
    console.log('네비게이션 항목:', state.navigationItems);
  }
});
```

## 기술 스택

| 항목 | 버전 | 용도 |
|------|------|------|
| Zustand | 4.4.0 | 상태 관리 (기본) |
| Redux | 4.2.1 | 상태 관리 (폴백) |
| Node.js/Express | - | 서버 |

## 자동 주입 구조

모든 HTML 파일은 `server.js`를 통해 자동으로 다음이 주입됩니다:

```html
<!DOCTYPE html>
<html>
  <head>
    <!-- 기타 헤더 내용 -->
    <script defer src="global-state-store.js"></script>    <!-- 첫번째 로드 -->
    <script defer src="global-header-loader.js"></script>  <!-- 두번째 로드 -->
  </head>
  <body>
    <div data-global-header></div>  <!-- 헤더 마운트 포인트 -->
    <!-- 페이지 내용 -->
  </body>
</html>
```

## 디버깅

### 콘솔에서 상태 확인

```javascript
// 현재 상태 출력
console.log('현재 상태:', window.GlobalState.getState());

// 사용 중인 스토어 타입 확인
console.log('스토어 준비 상태:');
console.log('- Zustand:', document.body.classList.contains('zustand-store-ready'));
console.log('- Redux:', document.body.classList.contains('redux-store-ready'));
console.log('- Fallback:', document.body.classList.contains('fallback-store-ready'));

// 헤더 상태 확인
console.log('헤더 상태:', window.GlobalHeader?.getState());
```

### 자주 발생하는 문제

**문제**: `window.GlobalState` is undefined
- **해결**: `<script defer>`를 사용하고 있는지 확인. DOMContentLoaded 후에 접근하세요.

```javascript
document.addEventListener('DOMContentLoaded', () => {
  console.log(window.GlobalState.getState());
});
```

**문제**: 헤더가 로드되지 않음
- **해결**: 브라우저 콘솔에서 `window.GlobalHeader.mount()`를 실행하여 수동으로 마운트하세요.

**문제**: CORS 에러
- **해결**: Express 서버가 실행 중인지 확인하고, 로컬 파일 대신 서버를 통해 접근하세요.

## 배포 고려사항

1. **CDN 사용**: Zustand와 Redux는 CDN에서 로드되므로 인터넷 연결이 필요합니다.
2. **Fallback 지원**: CDN 로드 실패 시 Fallback Store를 사용하므로 오프라인 환경에서도 기본 기능은 작동합니다.
3. **보안**: 민감한 정보는 전역 상태에 저장하지 마세요.
4. **성능**: 대규모 상태 변경은 구독자의 성능에 영향을 줄 수 있습니다.

## 라이센스

MIT
