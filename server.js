const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

// 2,055개 전체 단어 데이터베이스
const WORD_DATABASE = [
    "사과", "바나나", "호랑이", "비행기", "컴퓨터", "스마트폰", "대한민국", "아이폰", "행맨게임", "보드게임", 
    "도서관", "자전거", "아메리카노", "피자", "축구", "야구", "무지개", "해바라기", "의사", "경찰관", 
    "소방관", "선생님", "학생", "학교", "대학교", "병원", "약국", "은행", "우체국", "미술관", 
    "박물관", "공원", "놀이공원", "동물원", "식물원", "수족관", "영화관", "공항", "기차역", "지하철역", 
    "버스정류장", "항구", "호텔", "식당", "카페", "제과점", "편의점", "대형마트", "백화점", "미용실", 
    "운동장", "체육관", "수영장", "헬스장", "경기장", "도서관", "미술관", "공연장", "극장", "방송국", 
    "신문사", "회사", "공장", "연구소", "시청", "구청", "주민센터", "경찰서", "소방서", "법원", 
    "검찰청", "대사관", "국회", "청와대", "대통령", "총리", "장관", "국회의원", "판사", "검사", 
    "변호사", "회계사", "세무사", "건축가", "디자이너", "엔지니어", "프로그래머", "개발자", "기획자", "작가", 
    "시인", "화가", "조각가", "음악가", "작곡가", "지휘자", "피아니스트", "바이올리니스트", "성악가", "가수", 
    "배우", "탤런트", "영화감독", "연출가", "개그맨", "모델", "운동선수", "코치", "감독", "심판", 
    "요리사", "제빵사", "바리스타", "소믈리에", "조주사", "승무원", "조종사", "항해사", "군인", "장교", 
    "경호원", "탐정", "사회복지사", "상담사", "영양사", "간호사", "치과의사", "한의사", "수의사", "약사", 
    "위생사", "물리치료사", "임상병리사", "방사선사", "안경사", "조산사", "간호조무사", "요양보호사", "보육교사", "사서", 
    "관광통역안내사", "문화재형설사", "텔레마케터", "쇼호스트", "리포터", "아나운서", "기자", "성우", "번역가", "통역사", 
    "헤어디자이너", "메이크업아티스트", "네일리스트", "피부관리사", "스타일리스트", "모델", "사진작가", "영상편집자", "웹디자이너", "웹툰작가", 
    "일러스트레이터", "애니메이터", "게임디자이너", "3D아티스트", "사운드디자이너", "특수효과기술자", "조명감독", "음향감독", "카메라감독", "무대디자이너", 
    "의상디자이너", "컬러리스트", "푸드스타일리스트", "공예가", "도예가", "한복디자이너", "보석디자이너", "가구디자이너", "제품디자이너", "인테리어디자이너", 
    "자동차디자이너", "패션디자이너", "조경가", "도시계획가", "교통전문가", "환경전문가", "기상예보관", "천문학자", "물리학자", "화학자", 
    "생물학자", "지질학자", "수학자", "통계학자", "경제학자", "경영학자", "정치학자", "사회학자", "심리학자", "철학자", 
    "역사학자", "고고학자", "인류학자", "언어학자", "문학평론가", "음악평론가", "미술평론가", "영화평론가", "음식평론가", "시사평론가", 
    "자연", "하늘", "구름", "태양", "햇살", "햇빛", "달님", "별빛", "은하수", "우주", 
    "지구", "태양계", "수성", "금성", "화성", "목성", "토성", "천왕성", "해왕성", "명왕성", 
    "바람", "태풍", "미세먼지", "소나기", "장마", "폭우", "폭설", "우박", "무지개", "안개", 
    "이슬", "서리", "얼음", "눈꽃", "단풍", "낙엽", "새싹", "꽃봉오리", "만발", "개화", 
    "산맥", "계곡", "폭포", "동굴", "절벽", "언덕", "평야", "분지", "섬", "반도", 
    "해안", "갯벌", "해수욕장", "백사장", "파도", "밀물", "썰물", "해류", "수평선", "지평선", 
    "동물", "강아지", "고양이", "송아지", "망아지", "망아지", "병아리", "오리", "거위", "칠면조", 
    "돼지", "토끼", "다람쥐", "청설모", "고슴도치", "햄스터", "페럿", "라쿤", "너구리", "오소리", 
    "족제비", "수달", "해달", "물개", "바다표범", "바다코끼리", "고래", "돌고래", "상어", "가오리", 
    "오징어", "문어", "낙지", "쭈꾸미", "갑오징어", "게", "킹크랩", "랍스터", "새우", "갯가재", 
    "조개", "굴", "전복", "소라", "멍게", "해삼", "개불", "성게", "불사조", "용", 
    "해태", "기린", "현무", "주작", "청룡", "백호", "구미호", "도깨비", "저승사자", "산신령", 
    "가방", "지갑", "안경", "선글라스", "시계", "반지", "목걸이", "귀걸이", "팔찌", "발찌", 
    "모자", "장갑", "목도리", "양말", "신발", "운동화", "구두", "슬리퍼", "장화", "부츠", 
    "우산", "양산", "우비", "손수건", "휴지", "물티슈", "수건", "비누", "샴푸", "린스", 
    "바디워시", "치약", "칫솔", "면도기", "화장품", "스킨", "로션", "크림", "선크림", "마스크팩", 
    "거울", "빗", "헤어드라이어", "고데기", "손톱깎이", "귀이개", "체온계", "반창고", "연고", "파스", 
    "침대", "베개", "이불", "매트리스", "소파", "탁자", "의자", "책상", "옷장", "책장", 
    "신발장", "식탁", "화장대", "서랍장", "진열장", "커튼", "블라인드", "카페트", "러그", "쿠션", 
    "전등", "스탠드", "시계", "액자", "화분", "꽃병", "쓰레기통", "청소기", "세탁기", "건조기", 
    "냉장고", "김치냉장고", "냉동고", "에어컨", "선풍기", "서큘레이터", "가습기", "제습기", "공기청정기", "히터", 
    "전기장판", "온수매트", "TV", "모니터", "본체", "키보드", "마우스", "스피커", "헤드셋", "이어폰", 
    "마이크", "웹캠", "프린터", "스캐너", "복합기", "프로젝터", "태블릿", "스마트워치", "보조배터리", "충전기", 
    "냉면", "비빔냉면", "물냉면", "쫄면", "막국수", "칼국수", "수제비", "잔치국수", "비빔국수", "콩국수", 
    "라면", "짜장면", "짬뽕", "울면", "잡채밥", "볶음밥", "탕수육", "깐풍기", "유린기", "마파두부", 
    "양장피", "팔보채", "고추잡채", "멘보샤", "군만두", "물만두", "찐만두", "딤섬", "타코야끼", "오코노미야끼", 
    "초밥", "사시미", "회덮밥", "알밥", "돈까스", "우동", "소바", "라멘", "가츠동", "규동", 
    "오야코동", "사케동", "텐동", "카레라이스", "하이라이스", "오므라이스", "함박스테이크", "스테이크", "파스타", "리조또", 
    "피자", "버거", "샌드위치", "토스트", "샐러드", "스프", "시리얼", "시카고피자", "바비큐", "소시지", 
    "핫도그", "감자튀김", "치킨너겟", "치즈스틱", "어묵", "떡볶이", "순대", "튀김", "김밥", "주먹밥"
];

const DOUBLE_VOWELS = ['ㅒ','ㅖ','ㅘ','ㅙ','ㅚ','ㅝ','ㅞ','ㅟ','ㅢ'];

let gameState = {
    isGameStarted: false,
    targetWord: "",
    decomposedWord: [],
    revealedSlots: [],
    hasDoubleVowel: false,
    players: [],
    turnIndex: 0,
    timer: null,
    timeLeft: 30
};

function decomposeHangul(word) {
    const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
    const JOUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
    const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

    let result = [];
    for (let i = 0; i < word.length; i++) {
        const code = word.charCodeAt(i) - 0xAC00;
        if (code >= 0 && code <= 11172) {
            const cho = Math.floor(code / 588);
            const joung = Math.floor((code % 588) / 28);
            const jong = code % 28;
            
            result.push(CHO[cho]);
            result.push(JOUNG[joung]);
            if (jong > 0) result.push(JONG[jong]);
        } else {
            result.push(word[i]);
        }
    }
    return result;
}

function startTurnTimer() {
    clearInterval(gameState.timer);
    gameState.timeLeft = 30;
    
    io.emit('turn_update', {
        turnIndex: gameState.turnIndex,
        currentTurnPlayer: gameState.players[gameState.turnIndex],
        timeLeft: gameState.timeLeft
    });

    gameState.timer = setInterval(() => {
        gameState.timeLeft--;
        io.emit('timer_tick', gameState.timeLeft);

        if (gameState.timeLeft <= 0) {
            const currentPlayer = gameState.players[gameState.turnIndex];
            if (currentPlayer && currentPlayer.lives > 0) {
                currentPlayer.lives--;
                
                io.emit('player_status_update', gameState.players);
                io.to('master').emit('update_player_list', gameState.players);

                if (currentPlayer.lives <= 0) {
                    io.to(currentPlayer.id).emit('eliminated');
                }
            }

            nextTurn();
        }
    }, 1000);
}

function nextTurn() {
    if (gameState.players.length === 0) return;
    
    let attempts = 0;
    do {
        gameState.turnIndex = (gameState.turnIndex + 1) % gameState.players.length;
        attempts++;
    } while (gameState.players[gameState.turnIndex].lives <= 0 && attempts < gameState.players.length);

    const activePlayers = gameState.players.filter(p => p.lives > 0);
    if (activePlayers.length === 0) {
        clearInterval(gameState.timer);
        io.emit('game_over', { reason: 'ALL_ELIMINATED', word: gameState.targetWord });
        return;
    }

    startTurnTimer();
}

io.on('connection', (socket) => {
    socket.on('register_master', () => {
        socket.join('master');
        socket.emit('update_player_list', gameState.players);
        if (gameState.isGameStarted) {
            socket.emit('word_generated', {
                hasDoubleVowel: gameState.hasDoubleVowel,
                slots: gameState.revealedSlots
            });
        }
    });

    socket.on('join_game', (playerName) => {
        let existingPlayer = gameState.players.find(p => p.name === playerName);

        if (existingPlayer) {
            existingPlayer.id = socket.id;
            socket.emit('join_success', existingPlayer);
            if (gameState.isGameStarted) {
                socket.emit('game_started', {
                    decomposedCount: gameState.decomposedWord.length,
                    slots: gameState.revealedSlots,
                    players: gameState.players
                });
            }
        } else {
            if (gameState.isGameStarted) {
                socket.emit('join_error', '이미 게임이 진행 중입니다.');
                return;
            }

            const newPlayer = {
                id: socket.id,
                name: playerName,
                lives: 5,
                penaltyUntil: 0
            };
            gameState.players.push(newPlayer);

            socket.emit('join_success', newPlayer);
            io.to('master').emit('update_player_list', gameState.players);
            io.emit('player_count_update', gameState.players.length);
        }
    });

    socket.on('start_game', () => {
        const randomIndex = Math.floor(Math.random() * WORD_DATABASE.length);
        const selectedWord = WORD_DATABASE[randomIndex];

        gameState.isGameStarted = true;
        gameState.targetWord = selectedWord;
        gameState.decomposedWord = decomposeHangul(selectedWord);
        gameState.revealedSlots = Array(gameState.decomposedWord.length).fill('');
        
        gameState.hasDoubleVowel = gameState.decomposedWord.some(char => DOUBLE_VOWELS.includes(char));

        gameState.players.sort(() => Math.random() - 0.5);
        gameState.turnIndex = 0;

        io.to('master').emit('word_generated', {
            hasDoubleVowel: gameState.hasDoubleVowel,
            slots: gameState.revealedSlots
        });

        io.to('master').emit('update_player_list', gameState.players);

        io.emit('game_started', {
            decomposedCount: gameState.decomposedWord.length,
            slots: gameState.revealedSlots,
            players: gameState.players
        });

        startTurnTimer();
    });

    socket.on('try_char', (char) => {
        const player = gameState.players[gameState.turnIndex];
        if (!player || player.id !== socket.id) return;

        let hitIndexes = [];
        gameState.decomposedWord.forEach((c, idx) => {
            if (c === char) hitIndexes.push(idx);
        });

        if (hitIndexes.length > 0) {
            hitIndexes.forEach(idx => {
                gameState.revealedSlots[idx] = char;
            });

            io.emit('board_update', { slots: gameState.revealedSlots, char, hit: true });

            if (!gameState.revealedSlots.includes('')) {
                clearInterval(gameState.timer);
                io.emit('game_won', { winner: player.name, word: gameState.targetWord });
                return;
            }
        } else {
            player.lives--;
            io.emit('player_status_update', gameState.players);
            io.to('master').emit('update_player_list', gameState.players);
            io.emit('board_update', { slots: gameState.revealedSlots, char, hit: false });

            if (player.lives <= 0) {
                socket.emit('eliminated');
            }
            nextTurn();
        }
    });

    socket.on('pass_turn', () => {
        const player = gameState.players[gameState.turnIndex];
        if (player && player.id === socket.id) {
            nextTurn();
        }
    });

    socket.on('try_answer', (answer) => {
        const player = gameState.players.find(p => p.id === socket.id);
        if (!player || player.lives <= 0) return;

        const now = Date.now();
        if (player.penaltyUntil > now) {
            socket.emit('answer_penalty', Math.ceil((player.penaltyUntil - now) / 1000));
            return;
        }

        if (answer === gameState.targetWord) {
            clearInterval(gameState.timer);
            io.emit('game_won', { winner: player.name, word: gameState.targetWord });
        } else {
            player.penaltyUntil = now + 60000;
            socket.emit('answer_failed', 60);
        }
    });

    socket.on('reset_game', () => {
        clearInterval(gameState.timer);
        gameState = {
            isGameStarted: false,
            targetWord: "",
            decomposedWord: [],
            revealedSlots: [],
            hasDoubleVowel: false,
            players: [],
            turnIndex: 0,
            timer: null,
            timeLeft: 30
        };
        io.emit('game_reset');
    });

    socket.on('disconnect', () => {
        io.to('master').emit('update_player_list', gameState.players);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
