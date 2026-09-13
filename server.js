const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

const WORD_DATABASE = [
    "사과", "바나나", "호랑이", "비행기", "컴퓨터", "스마트폰", 
    "대한민국", "아이폰", "행맨게임", "보드게임", "도서관", "자전거",
    "아메리카노", "피자", "축구", "야구", "무지개", "해바라기", "과의", "의사"
];

const DOUBLE_VOWELS = ['ㅒ','ㅖ','ㅘ','ㅙ','ㅚ','ㅝ','ㅞ','ㅟ','ㅢ'];

let gameState = {
    isGameStarted: false,
    targetWord: "",
    decomposedWord: [],
    revealedSlots: [],     // 맞춘 순서대로 앞에서부터 채워지는 배열
    triedChars: {},        // 시도된 글자 상태 { 'ㄱ': 'O', 'ㄴ': 'X' }
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
                slots: gameState.revealedSlots,
                decomposedCount: gameState.decomposedWord.length,
                triedChars: gameState.triedChars
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
                    triedChars: gameState.triedChars,
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
        gameState.revealedSlots = []; // 초기 빈 상태
        gameState.triedChars = {};    // 시도된 글자 초기화
        
        gameState.hasDoubleVowel = gameState.decomposedWord.some(char => DOUBLE_VOWELS.includes(char));

        gameState.players.sort(() => Math.random() - 0.5);
        gameState.turnIndex = 0;

        io.to('master').emit('word_generated', {
            hasDoubleVowel: gameState.hasDoubleVowel,
            slots: gameState.revealedSlots,
            decomposedCount: gameState.decomposedWord.length,
            triedChars: gameState.triedChars
        });

        io.to('master').emit('update_player_list', gameState.players);

        io.emit('game_started', {
            decomposedCount: gameState.decomposedWord.length,
            slots: gameState.revealedSlots,
            triedChars: gameState.triedChars,
            players: gameState.players
        });

        startTurnTimer();
    });

    socket.on('try_char', (char) => {
        const player = gameState.players[gameState.turnIndex];
        if (!player || player.id !== socket.id) return;
        if (gameState.triedChars[char]) return; // 이미 시도된 글자 무시

        const isHit = gameState.decomposedWord.includes(char);

        if (isHit) {
            gameState.triedChars[char] = 'O';
            // 정답인 경우 맞춘 순서대로 앞에서부터 추가
            gameState.revealedSlots.push(char);

            io.emit('board_update', { 
                slots: gameState.revealedSlots, 
                decomposedCount: gameState.decomposedWord.length,
                triedChars: gameState.triedChars,
                char, 
                hit: true 
            });

            // 단어의 전체 초/중/종성 개수만큼 순서대로 채워졌으면 성공 검사도 가능
        } else {
            gameState.triedChars[char] = 'X';
            player.lives--;
            io.emit('player_status_update', gameState.players);
            io.to('master').emit('update_player_list', gameState.players);
            io.emit('board_update', { 
                slots: gameState.revealedSlots, 
                decomposedCount: gameState.decomposedWord.length,
                triedChars: gameState.triedChars,
                char, 
                hit: false 
            });

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
            triedChars: {},
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
