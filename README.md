# megazonemsusmc

## 이 Repository를 내 계정으로 Fork 하는 방법

GitHub에서 Repository를 Fork하면 원본 Repository의 복사본을 내 GitHub 계정에 만들 수 있습니다.

### Fork 하는 단계

1. **GitHub 로그인**
   - [GitHub](https://github.com)에 접속하여 자신의 계정으로 로그인합니다.

2. **이 Repository 페이지로 이동**
   - 브라우저에서 `https://github.com/wietraum0301/megazonemsusmc` 주소로 이동합니다.

3. **Fork 버튼 클릭**
   - Repository 페이지 오른쪽 상단에 있는 **Fork** 버튼을 클릭합니다.

4. **Fork 대상 선택**
   - Fork할 계정(또는 조직)을 선택합니다.
   - 필요하다면 Repository 이름과 설명을 변경할 수 있습니다.
   - **Create fork** 버튼을 클릭합니다.

5. **Fork 완료**
   - 잠시 후 `https://github.com/<내-계정명>/megazonemsusmc` 주소로 내 계정에 복사된 Repository가 생성됩니다.

### Fork 후 로컬에 Clone 하기

Fork가 완료된 후, 내 컴퓨터에 코드를 내려받으려면 아래 명령어를 실행합니다.

```bash
git clone https://github.com/<내-계정명>/megazonemsusmc.git
cd megazonemsusmc
```

### 원본 Repository와 동기화 유지하기

원본(upstream) Repository의 최신 변경 사항을 내 Fork에 반영하려면:

```bash
# 원본 Repository를 upstream으로 추가 (최초 1회)
git remote add upstream https://github.com/wietraum0301/megazonemsusmc.git

# 원본의 최신 변경 사항 가져오기
git fetch upstream

# 내 로컬 main 브랜치에 반영하기
git checkout main
git merge upstream/main
```