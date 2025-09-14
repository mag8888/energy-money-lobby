const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage for demo (use database in production)
const rooms = new Map();
const players = new Map();

// Game cells data
const INNER_CELLS = [
  { id: 1, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 2, type: 'expenses', name: 'Всякая всячина', color: '#EC4899', icon: '🛍️' },
  { id: 3, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 4, type: 'charity', name: 'Благотворительность', color: '#F97316', icon: '❤️' },
  { id: 5, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 6, type: 'payday', name: 'PayDay', color: '#EAB308', icon: '💰' },
  { id: 7, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 8, type: 'market', name: 'Рынок', color: '#06B6D4', icon: '🏪' },
  { id: 9, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 10, type: 'expenses', name: 'Всякая всячина', color: '#EC4899', icon: '🛍️' },
  { id: 11, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 12, type: 'child', name: 'Ребенок', color: '#A855F7', icon: '👶' },
  { id: 13, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 14, type: 'payday', name: 'PayDay', color: '#EAB308', icon: '💰' },
  { id: 15, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 16, type: 'market', name: 'Рынок', color: '#06B6D4', icon: '🏪' },
  { id: 17, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 18, type: 'expenses', name: 'Всякая всячина', color: '#EC4899', icon: '🛍️' },
  { id: 19, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 20, type: 'loss', name: 'Потеря', color: '#18181B', icon: '💸' },
  { id: 21, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 22, type: 'payday', name: 'PayDay', color: '#EAB308', icon: '💰' },
  { id: 23, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 24, type: 'market', name: 'Рынок', color: '#06B6D4', icon: '🏪' }
];

const OUTER_CELLS = [
  // Верхний ряд (1-14)
  { id: 1, type: 'start', name: 'СТАРТ', color: '#FFD700', icon: '🏁' },
  { id: 2, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 3, type: 'business', name: 'Кофейня', color: '#4CAF50', icon: '☕', cost: 100000, income: 3000 },
  { id: 4, type: 'loss', name: 'Аудит', color: '#8B0000', icon: '📊', loss: '50% активов' },
  { id: 5, type: 'business', name: 'СПА-центр', color: '#4CAF50', icon: '🧘', cost: 270000, income: 5000 },
  { id: 6, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 7, type: 'business', name: 'Мобильное приложение', color: '#4CAF50', icon: '📱', cost: 420000, income: 10000 },
  { id: 8, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 9, type: 'business', name: 'Маркетинг', color: '#4CAF50', icon: '📈', cost: 160000, income: 4000 },
  { id: 10, type: 'loss', name: 'Кража', color: '#8B0000', icon: '💰', loss: '100% наличных' },
  { id: 11, type: 'business', name: 'Мини-отель', color: '#4CAF50', icon: '🏨', cost: 200000, income: 5000 },
  { id: 12, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 13, type: 'business', name: 'Франшиза ресторана', color: '#4CAF50', icon: '🍽️', cost: 320000, income: 8000 },
  { id: 14, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  
  // Правый столбец (15-26)
  { id: 15, type: 'business', name: 'Йога-центр', color: '#4CAF50', icon: '🧘‍♀️', cost: 170000, income: 4500 },
  { id: 16, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 17, type: 'business', name: 'Салон красоты', color: '#4CAF50', icon: '💄', cost: 500000, income: 15000 },
  { id: 18, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 19, type: 'business', name: 'Автомойки', color: '#4CAF50', icon: '🚗', cost: 120000, income: 3000 },
  { id: 20, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 21, type: 'business', name: 'Ретрит-центр', color: '#4CAF50', icon: '🏔️', cost: 500000, income: 0 },
  { id: 22, type: 'loss', name: 'Развод', color: '#8B0000', icon: '💔', loss: '50% активов' },
  { id: 23, type: 'business', name: 'Автомойки 2', color: '#4CAF50', icon: '🚗', cost: 120000, income: 3500 },
  { id: 24, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 25, type: 'business', name: 'Кругосветное плавание', color: '#4CAF50', icon: '⛵', cost: 300000, income: 0 },
  { id: 26, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  
  // Нижний ряд (27-40)
  { id: 27, type: 'business', name: 'Частный самолёт', color: '#4CAF50', icon: '✈️', cost: 1000000, income: 0 },
  { id: 28, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 29, type: 'business', name: 'Лидер мнений', color: '#4CAF50', icon: '👑', cost: 1000000, income: 0 },
  { id: 30, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 31, type: 'business', name: 'Биржа', color: '#4CAF50', icon: '📊', cost: 50000, income: 500000 },
  { id: 32, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 33, type: 'business', name: 'Фильм', color: '#4CAF50', icon: '🎬', cost: 500000, income: 0 },
  { id: 34, type: 'loss', name: 'Рейдерский захват', color: '#8B0000', icon: '⚔️', loss: 'Бизнес с крупным доходом' },
  { id: 35, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 36, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 37, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 38, type: 'business', name: 'Франшиза "Поток"', color: '#4CAF50', icon: '🎲', cost: 100000, income: 10000 },
  { id: 39, type: 'loss', name: 'Санкции', color: '#8B0000', icon: '🚫', loss: 'Все банковские счета' },
  { id: 40, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  
  // Левый столбец (41-52)
  { id: 41, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 42, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 43, type: 'business', name: 'Пекарня', color: '#4CAF50', icon: '🥖', cost: 300000, income: 7000 },
  { id: 44, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 45, type: 'business', name: 'Онлайн-образование', color: '#4CAF50', icon: '🎓', cost: 200000, income: 5000 },
  { id: 46, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 47, type: 'business', name: 'Фитнес-студии', color: '#4CAF50', icon: '💪', cost: 750000, income: 20000 },
  { id: 48, type: 'business', name: 'Кругосветное путешествие', color: '#4CAF50', icon: '🌍', cost: 300000, income: 0 },
  { id: 49, type: 'business', name: 'Коворкинг', color: '#4CAF50', icon: '🏢', cost: 500000, income: 10000 },
  { id: 50, type: 'charity', name: 'Благотворительность', color: '#FF69B4', icon: '❤️' },
  { id: 51, type: 'opportunity', name: 'Возможность', color: '#10B981', icon: '🎯' },
  { id: 52, type: 'payday', name: 'Зарплата', color: '#FFD700', icon: '💰' }
];

// Room management
class Room {
  constructor(id, name, maxPlayers = 4) {
    this.id = id;
    this.name = name;
    this.maxPlayers = maxPlayers;
    this.players = new Map();
    this.status = 'waiting'; // waiting, playing, finished
    this.createdAt = new Date();
    this.gameState = {
      currentPlayer: null,
      turnOrder: [],
      diceValue: null,
      gameStarted: false
    };
  }
  
  addPlayer(player) {
    if (this.players.size >= this.maxPlayers) {
      return false;
    }
    this.players.set(player.id, player);
    this.gameState.turnOrder.push(player.id);
    if (!this.gameState.currentPlayer) {
      this.gameState.currentPlayer = player.id;
    }
    return true;
  }
  
  removePlayer(playerId) {
    this.players.delete(playerId);
    this.gameState.turnOrder = this.gameState.turnOrder.filter(id => id !== playerId);
    if (this.gameState.currentPlayer === playerId) {
      this.gameState.currentPlayer = this.gameState.turnOrder[0] || null;
    }
  }
  
  getPlayerCount() {
    return this.players.size;
  }
  
  isFull() {
    return this.players.size >= this.maxPlayers;
  }
  
  isEmpty() {
    return this.players.size === 0;
  }
  
  canStartGame() {
    return this.players.size >= 2;
  }
  
  startGame() {
    if (this.canStartGame()) {
      this.status = 'playing';
      this.gameState.gameStarted = true;
      return true;
    }
    return false;
  }
}

// Routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Лобби - Energy of Money</title>
        <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            
            .container {
                max-width: 1400px;
                margin: 0 auto;
            }
            
            .header {
                text-align: center;
                color: white;
                margin-bottom: 2rem;
            }
            
            .logo {
                font-size: 3rem;
                font-weight: bold;
                margin-bottom: 0.5rem;
            }
            
            .subtitle {
                font-size: 1.2rem;
                opacity: 0.9;
            }
            
            .main-content {
                display: grid;
                grid-template-columns: 1fr 2fr 1fr;
                gap: 2rem;
                margin-bottom: 2rem;
            }
            
            .panel {
                background: white;
                border-radius: 15px;
                padding: 2rem;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            
            .panel h2 {
                color: #333;
                margin-bottom: 1.5rem;
                font-size: 1.5rem;
            }
            
            .user-section {
                margin-bottom: 1.5rem;
            }
            
            .user-section input {
                width: 100%;
                padding: 12px;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 1rem;
                margin-bottom: 10px;
            }
            
            .user-section button {
                background: #667eea;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1rem;
                margin-right: 10px;
            }
            
            .user-section button:hover {
                background: #5a6fd8;
            }
            
            .room-controls {
                display: flex;
                gap: 10px;
                margin-bottom: 1rem;
            }
            
            .room-controls input {
                flex: 1;
                padding: 12px;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 1rem;
            }
            
            .room-controls button {
                background: #10B981;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1rem;
            }
            
            .room-controls button:hover {
                background: #0d9d6b;
            }
            
            .room-list {
                max-height: 300px;
                overflow-y: auto;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 10px;
            }
            
            .room-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                border-bottom: 1px solid #eee;
                transition: background 0.3s;
            }
            
            .room-item:hover {
                background: #f8f9fa;
            }
            
            .room-item:last-child {
                border-bottom: none;
            }
            
            .room-info {
                flex: 1;
            }
            
            .room-name {
                font-weight: bold;
                color: #333;
            }
            
            .room-players {
                color: #666;
                font-size: 0.9rem;
            }
            
            .join-button {
                background: #667eea;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.9rem;
                margin-left: 10px;
            }
            
            .join-button:hover {
                background: #5a6fd8;
            }
            
            .join-button:disabled {
                background: #ccc;
                cursor: not-allowed;
            }
            
            .game-board-preview {
                background: #f8f9fa;
                border-radius: 15px;
                padding: 20px;
                text-align: center;
            }
            
            .board-container {
                position: relative;
                width: 600px;
                height: 600px;
                margin: 0 auto;
                background: #1a1a2e;
                border-radius: 20px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                border: 4px solid #333;
            }
            
            .outer-board {
                position: relative;
                width: 100%;
                height: 100%;
                border-radius: 20px;
            }
            
            .outer-cell {
                position: absolute;
                width: 40px;
                height: 40px;
                border-radius: 6px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-size: 8px;
                font-weight: bold;
                color: white;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 1px solid rgba(255,255,255,0.2);
            }
            
            .outer-cell:hover {
                transform: scale(1.1);
                z-index: 10;
            }
            
            .special-zone {
                position: absolute;
                width: 80px;
                height: 60px;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-size: 8px;
                font-weight: bold;
                color: white;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 2px solid #ff6b6b;
            }
            
            .special-zone:hover {
                transform: scale(1.05);
                z-index: 10;
            }
            
            .inner-board {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 200px;
                height: 200px;
                background: #2d2d44;
                border-radius: 50%;
                border: 3px solid #ffd700;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .center-element {
                width: 120px;
                height: 120px;
                background: linear-gradient(45deg, #ffd700, #ffed4e);
                border-radius: 50%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                font-weight: bold;
                color: #333;
                box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
                position: relative;
            }
            
            .center-element::before {
                content: '1';
                font-size: 36px;
                font-weight: bold;
            }
            
            .center-element::after {
                content: '$$$$';
                position: absolute;
                top: -10px;
                left: -10px;
                right: -10px;
                bottom: -10px;
                background: radial-gradient(circle, transparent 30%, rgba(255, 215, 0, 0.3) 70%);
                border-radius: 50%;
                pointer-events: none;
            }
            
            .inner-cell {
                background: #ddd;
                border-radius: 6px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-size: 8px;
                font-weight: bold;
                color: #333;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .inner-cell:hover {
                transform: scale(1.05);
                z-index: 10;
            }
            
            .game-info {
                margin-top: 15px;
                color: #666;
                font-size: 0.9rem;
            }
            
            .financial-panel {
                background: #2d2d44;
                border-radius: 15px;
                padding: 1.5rem;
                color: white;
            }
            
            .financial-section {
                margin-bottom: 1.5rem;
                padding: 1rem;
                background: rgba(255,255,255,0.1);
                border-radius: 8px;
            }
            
            .financial-title {
                font-size: 1.2rem;
                font-weight: bold;
                margin-bottom: 0.5rem;
                color: #ffd700;
            }
            
            .financial-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 0.5rem;
                font-size: 0.9rem;
            }
            
            .financial-value {
                font-weight: bold;
            }
            
            .income { color: #2ecc71; }
            .expenses { color: #e74c3c; }
            .assets { color: #2ecc71; }
            .credit { color: #9b59b6; }
            
            .button-group {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                margin-top: 1rem;
            }
            
            .btn {
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 6px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .btn-success {
                background: #2ecc71;
                color: white;
            }
            
            .btn-danger {
                background: #e74c3c;
                color: white;
            }
            
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            }
            
            .turn-status {
                background: #9b59b6;
                padding: 1rem;
                border-radius: 8px;
                text-align: center;
                margin-top: 1rem;
            }
            
            .turn-waiting {
                background: #95a5a6;
                padding: 0.5rem;
                border-radius: 6px;
                margin-top: 0.5rem;
                font-size: 0.8rem;
            }
            
            .chat-section {
                grid-column: 1 / -1;
            }
            
            .chat-messages {
                height: 200px;
                overflow-y: auto;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 10px;
                margin-bottom: 10px;
                background: #f8f9fa;
            }
            
            .chat-input {
                display: flex;
                gap: 10px;
            }
            
            .chat-input input {
                flex: 1;
                padding: 12px;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 1rem;
            }
            
            .chat-input button {
                background: #667eea;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1rem;
            }
            
            .chat-input button:hover {
                background: #5a6fd8;
            }
            
            .message {
                margin-bottom: 8px;
                padding: 8px;
                border-radius: 6px;
                background: white;
            }
            
            .message .username {
                font-weight: bold;
                color: #667eea;
            }
            
            .message .text {
                color: #333;
            }
            
            .message .time {
                font-size: 0.8rem;
                color: #666;
                float: right;
            }
            
            .status {
                text-align: center;
                padding: 10px;
                border-radius: 8px;
                margin: 10px 0;
                font-weight: bold;
            }
            
            .status.connected {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            
            .status.disconnected {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
            
            @media (max-width: 768px) {
                .main-content {
                    grid-template-columns: 1fr;
                }
                
                .board-container {
                    width: 400px;
                    height: 400px;
                }
                
                .outer-cell {
                    width: 30px;
                    height: 30px;
                    font-size: 6px;
                }
                
                .special-zone {
                    width: 60px;
                    height: 45px;
                    font-size: 6px;
                }
                
                .center-element {
                    width: 80px;
                    height: 80px;
                    font-size: 16px;
                }
                
                .financial-panel {
                    padding: 1rem;
                }
                
                .financial-section {
                    padding: 0.5rem;
                    margin-bottom: 1rem;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">⚡ Energy of Money</div>
                <div class="subtitle">Лобби и игровое поле</div>
            </div>
            
            <div class="main-content">
                <!-- User and Room Management Panel -->
                <div class="panel">
                    <h2>👤 Пользователь и комнаты</h2>
                    
                    <div class="user-section">
                        <input type="text" id="usernameInput" placeholder="Введите имя пользователя" />
                        <button onclick="setUsername()">Установить имя</button>
                        <p id="currentUsername">Имя не установлено</p>
                    </div>
                    
                    <div class="room-controls">
                        <input type="text" id="newRoomName" placeholder="Название комнаты" />
                        <button onclick="createRoom()">Создать комнату</button>
                    </div>
                    
                    <h3>Доступные комнаты</h3>
                    <div id="room-list" class="room-list">Нет доступных комнат</div>
                </div>
                
                <!-- Game Board Preview Panel -->
                <div class="panel">
                    <h2>🎯 Игровое поле</h2>
                    <div class="game-board-preview">
                        <div class="board-container">
                            <div class="outer-board" id="outerBoard">
                                <!-- 52 outer cells will be rendered here -->
                            </div>
                            <div class="inner-board" id="innerBoard">
                                <div class="center-element"></div>
                            </div>
                        </div>
                        <p class="game-info">Полноценное игровое поле с 52 внешними и 24 внутренними клетками</p>
                    </div>
                </div>
                
                <!-- Financial Panel -->
                <div class="financial-panel">
                    <h2>💰 Финансы</h2>
                    
                    <div class="financial-section">
                        <div class="financial-title">Доходы и расходы</div>
                        <div class="financial-item">
                            <span>Доход:</span>
                            <span class="financial-value income">$0</span>
                        </div>
                        <div class="financial-item">
                            <span>Расходы:</span>
                            <span class="financial-value expenses">$0</span>
                        </div>
                        <div class="financial-item">
                            <span>$ PAYDAY:</span>
                            <span class="financial-value income">$0/мес</span>
                        </div>
                    </div>
                    
                    <div class="financial-section">
                        <div class="financial-title">Кредиты</div>
                        <div class="financial-item">
                            <span>Кредит:</span>
                            <span class="financial-value credit">$0</span>
                        </div>
                        <div class="financial-item">
                            <span>Макс. кредит:</span>
                            <span class="financial-value credit">$0</span>
                        </div>
                        <div class="button-group">
                            <button class="btn btn-success">✔ Без кредитов</button>
                            <button class="btn btn-danger">Взять</button>
                        </div>
                        <small>Нажмите для открытия банковских операций</small>
                    </div>
                    
                    <div class="financial-section">
                        <div class="financial-title">Активы</div>
                        <div class="financial-item">
                            <span>Активы:</span>
                            <span class="financial-value assets">$0</span>
                        </div>
                        <div class="financial-item">
                            <span>Доход: $0/мес</span>
                        </div>
                    </div>
                    
                    <div class="turn-status">
                        <div>ОЖИДАНИЕ ХОДА</div>
                        <div class="turn-waiting">НЕ ВАШ ХОД</div>
                    </div>
                    
                    <div class="financial-section">
                        <div class="financial-title">⏰ Время хода</div>
                        <div class="financial-item">
                            <span>Осталось:</span>
                            <span class="financial-value">--:--</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Chat Section -->
            <div class="panel chat-section">
                <h2>💬 Чат комнаты</h2>
                <div id="messages" class="chat-messages"></div>
                <div class="chat-input">
                    <input type="text" id="messageInput" placeholder="Введите сообщение..." />
                    <button onclick="sendMessage()">Отправить</button>
                </div>
            </div>
            
            <!-- Connection Status -->
            <div id="status" class="status disconnected">Отключено</div>
        </div>
        
        <script>
            // Game cells data
            const INNER_CELLS = ${JSON.stringify(INNER_CELLS)};
            const OUTER_CELLS = ${JSON.stringify(OUTER_CELLS)};
            
            // Socket connection
            const socket = io();
            let currentUsername = 'Guest';
            let currentRoomId = null;
            
            // Connection status
            const statusDiv = document.getElementById('status');
            
            socket.on('connect', () => {
                statusDiv.textContent = 'Подключено';
                statusDiv.className = 'status connected';
                console.log('Connected to server');
            });
            
            socket.on('disconnect', () => {
                statusDiv.textContent = 'Отключено';
                statusDiv.className = 'status disconnected';
                console.log('Disconnected from server');
            });
            
            // Username management
            function setUsername() {
                const input = document.getElementById('usernameInput');
                if (input.value.trim()) {
                    currentUsername = input.value.trim();
                    document.getElementById('currentUsername').textContent = 'Имя: ' + currentUsername;
                    input.value = '';
                }
            }
            
            // Room management
            function createRoom() {
                const roomName = document.getElementById('newRoomName').value;
                if (roomName) {
                    socket.emit('createRoom', roomName);
                    document.getElementById('newRoomName').value = '';
                }
            }
            
            function joinRoom(roomId) {
                if (currentRoomId) {
                    socket.emit('leaveRoom', currentRoomId);
                }
                currentRoomId = roomId;
                socket.emit('joinRoom', { roomId, username: currentUsername });
            }
            
            function startGame(roomId) {
                socket.emit('startGame', roomId);
            }
            
            // Chat
            function sendMessage() {
                const messageInput = document.getElementById('messageInput');
                const message = messageInput.value;
                if (message && currentRoomId) {
                    socket.emit('chatMessage', { roomId: currentRoomId, username: currentUsername, message });
                    messageInput.value = '';
                }
            }
            
            // Game board rendering
            function renderGameBoard() {
                const outerBoard = document.getElementById('outerBoard');
                
                // Render outer cells (52 cells) in rectangular format
                outerBoard.innerHTML = '';
                
                // Add special zones first
                const specialZones = [
                    { name: 'Большая сделка', icon: '$', color: '#4a90e2', x: 10, y: 20, cards: '24 карт' },
                    { name: 'Малая сделка', icon: '💼', color: '#2ecc71', x: 80, y: 10, cards: '62 карт' },
                    { name: 'Расходы', icon: '🛒', color: '#e74c3c', x: 10, y: 80, cards: '24 карт' },
                    { name: 'Рынок', icon: '🏢', color: '#3498db', x: 80, y: 80, cards: '24 карт' }
                ];
                
                specialZones.forEach(zone => {
                    const zoneElement = document.createElement('div');
                    zoneElement.className = 'special-zone';
                    zoneElement.style.backgroundColor = zone.color;
                    zoneElement.style.left = \`\${zone.x}%\`;
                    zoneElement.style.top = \`\${zone.y}%\`;
                    zoneElement.innerHTML = \`
                        <div>\${zone.icon}</div>
                        <div>\${zone.name}</div>
                        <div style="font-size: 6px;">\${zone.cards}</div>
                    \`;
                    outerBoard.appendChild(zoneElement);
                });
                
                // Render outer cells in rectangular pattern
                OUTER_CELLS.forEach((cell, index) => {
                    const cellElement = document.createElement('div');
                    cellElement.className = 'outer-cell';
                    cellElement.style.backgroundColor = cell.color;
                    cellElement.innerHTML = \`
                        <div>\${cell.icon}</div>
                        <div style="font-size: 6px;">\${cell.name}</div>
                    \`;
                    
                    // Position calculation for rectangular board
                    let x, y;
                    const cellSize = 40;
                    const margin = 20;
                    const boardWidth = 600;
                    const boardHeight = 600;
                    
                    if (index < 14) {
                        // Top row
                        x = margin + (index * (boardWidth - 2 * margin - cellSize) / 13);
                        y = margin;
                    } else if (index < 26) {
                        // Right column
                        x = boardWidth - margin - cellSize;
                        y = margin + ((index - 14) * (boardHeight - 2 * margin - cellSize) / 11);
                    } else if (index < 40) {
                        // Bottom row
                        x = boardWidth - margin - cellSize - ((index - 26) * (boardWidth - 2 * margin - cellSize) / 13);
                        y = boardHeight - margin - cellSize;
                    } else {
                        // Left column
                        x = margin;
                        y = boardHeight - margin - cellSize - ((index - 40) * (boardHeight - 2 * margin - cellSize) / 11);
                    }
                    
                    cellElement.style.left = \`\${x}px\`;
                    cellElement.style.top = \`\${y}px\`;
                    
                    outerBoard.appendChild(cellElement);
                });
            }
            
            // Socket event handlers
            socket.on('updateRoomList', (rooms) => {
                const roomListDiv = document.getElementById('room-list');
                roomListDiv.innerHTML = '';
                
                if (Object.keys(rooms).length === 0) {
                    roomListDiv.innerHTML = 'Нет доступных комнат';
                    return;
                }
                
                for (const id in rooms) {
                    const room = rooms[id];
                    const roomElement = document.createElement('div');
                    roomElement.className = 'room-item';
                    
                    const canJoin = !room.isFull() && room.status === 'waiting';
                    const canStart = room.canStartGame() && room.status === 'waiting';
                    
                    roomElement.innerHTML = \`
                        <div class="room-info">
                            <div class="room-name">\${room.name}</div>
                            <div class="room-players">\${room.players.length}/\${room.maxPlayers} игроков</div>
                        </div>
                        <div>
                            \${canJoin ? \`<button class="join-button" onclick="joinRoom('\${id}')">Войти</button>\` : ''}
                            \${canStart ? \`<button class="join-button" onclick="startGame('\${id}')">Начать игру</button>\` : ''}
                        </div>
                    \`;
                    
                    roomListDiv.appendChild(roomElement);
                }
            });
            
            socket.on('roomMessage', (data) => {
                const messagesDiv = document.getElementById('messages');
                const messageElement = document.createElement('div');
                messageElement.className = 'message';
                messageElement.innerHTML = \`
                    <span class="username">\${data.username}:</span>
                    <span class="text">\${data.message}</span>
                    <span class="time">\${new Date().toLocaleTimeString()}</span>
                \`;
                messagesDiv.appendChild(messageElement);
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            });
            
            socket.on('playerJoined', (data) => {
                const messagesDiv = document.getElementById('messages');
                const messageElement = document.createElement('div');
                messageElement.className = 'message';
                messageElement.innerHTML = \`
                    <span class="text"><em>\${data.username} присоединился к комнате</em></span>
                    <span class="time">\${new Date().toLocaleTimeString()}</span>
                \`;
                messagesDiv.appendChild(messageElement);
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            });
            
            socket.on('playerLeft', (data) => {
                const messagesDiv = document.getElementById('messages');
                const messageElement = document.createElement('div');
                messageElement.className = 'message';
                messageElement.innerHTML = \`
                    <span class="text"><em>\${data.username} покинул комнату</em></span>
                    <span class="time">\${new Date().toLocaleTimeString()}</span>
                \`;
                messagesDiv.appendChild(messageElement);
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            });
            
            socket.on('gameStarted', (data) => {
                const messagesDiv = document.getElementById('messages');
                const messageElement = document.createElement('div');
                messageElement.className = 'message';
                messageElement.innerHTML = \`
                    <span class="text"><strong>🎮 Игра началась!</strong></span>
                    <span class="time">\${new Date().toLocaleTimeString()}</span>
                \`;
                messagesDiv.appendChild(messageElement);
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            });
            
            // Initialize
            document.addEventListener('DOMContentLoaded', () => {
                renderGameBoard();
                socket.emit('getRoomList');
            });
            
            // Enter key for chat
            document.getElementById('messageInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        </script>
    </body>
    </html>
  `);
});

// Socket.io events
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Get room list
  socket.on('getRoomList', () => {
    const roomList = {};
    for (const [id, room] of rooms) {
      roomList[id] = {
        id: room.id,
        name: room.name,
        maxPlayers: room.maxPlayers,
        players: Array.from(room.players.values()),
        status: room.status,
        createdAt: room.createdAt,
        isFull: room.isFull(),
        isEmpty: room.isEmpty(),
        canStartGame: room.canStartGame()
      };
    }
    socket.emit('updateRoomList', roomList);
  });

  // Create room
  socket.on('createRoom', (roomName) => {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const room = new Room(roomId, roomName);
    rooms.set(roomId, room);
    
    console.log(`Room created: ${roomName} (${roomId})`);
    
    // Notify all clients about the new room
    io.emit('updateRoomList', getRoomList());
  });

  // Join room
  socket.on('joinRoom', ({ roomId, username }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    if (room.isFull()) {
      socket.emit('error', 'Room is full');
      return;
    }

    const player = {
      id: socket.id,
      username: username || 'Guest',
      socketId: socket.id,
      joinedAt: new Date()
    };

    if (room.addPlayer(player)) {
      socket.join(roomId);
      players.set(socket.id, { roomId, player });
      
      console.log(`Player ${username} joined room ${room.name}`);
      
      // Notify room about new player
      socket.to(roomId).emit('playerJoined', { username });
      
      // Update room list for all clients
      io.emit('updateRoomList', getRoomList());
    } else {
      socket.emit('error', 'Failed to join room');
    }
  });

  // Leave room
  socket.on('leaveRoom', (roomId) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const playerData = players.get(socket.id);
    if (playerData && playerData.roomId === roomId) {
      room.removePlayer(socket.id);
      players.delete(socket.id);
      socket.leave(roomId);
      
      console.log(`Player left room ${room.name}`);
      
      // Notify room about player leaving
      socket.to(roomId).emit('playerLeft', { username: playerData.player.username });
      
      // If room is empty, delete it
      if (room.isEmpty()) {
        rooms.delete(roomId);
        console.log(`Room ${room.name} deleted (empty)`);
      }
      
      // Update room list for all clients
      io.emit('updateRoomList', getRoomList());
    }
  });

  // Start game
  socket.on('startGame', (roomId) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    const playerData = players.get(socket.id);
    if (!playerData || playerData.roomId !== roomId) {
      socket.emit('error', 'You are not in this room');
      return;
    }

    if (room.startGame()) {
      console.log(`Game started in room ${room.name}`);
      
      // Notify all players in the room
      io.to(roomId).emit('gameStarted', {
        roomId,
        players: Array.from(room.players.values()),
        gameState: room.gameState
      });
      
      // Update room list for all clients
      io.emit('updateRoomList', getRoomList());
    } else {
      socket.emit('error', 'Cannot start game - not enough players');
    }
  });

  // Chat message
  socket.on('chatMessage', ({ roomId, username, message }) => {
    const playerData = players.get(socket.id);
    if (!playerData || playerData.roomId !== roomId) {
      socket.emit('error', 'You are not in this room');
      return;
    }

    const room = rooms.get(roomId);
    if (!room) return;

    // Broadcast message to all players in the room
    io.to(roomId).emit('roomMessage', {
      username,
      message,
      timestamp: new Date()
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    const playerData = players.get(socket.id);
    if (playerData) {
      const room = rooms.get(playerData.roomId);
      if (room) {
        room.removePlayer(socket.id);
        
        // Notify room about player leaving
        socket.to(playerData.roomId).emit('playerLeft', { 
          username: playerData.player.username 
        });
        
        // If room is empty, delete it
        if (room.isEmpty()) {
          rooms.delete(playerData.roomId);
          console.log(`Room ${room.name} deleted (empty)`);
        }
        
        // Update room list for all clients
        io.emit('updateRoomList', getRoomList());
      }
      
      players.delete(socket.id);
    }
  });
});

// Helper function to get room list
function getRoomList() {
  const roomList = {};
  for (const [id, room] of rooms) {
    roomList[id] = {
      id: room.id,
      name: room.name,
      maxPlayers: room.maxPlayers,
      players: Array.from(room.players.values()),
      status: room.status,
      createdAt: room.createdAt,
      isFull: room.isFull(),
      isEmpty: room.isEmpty(),
      canStartGame: room.canStartGame()
    };
  }
  return roomList;
}

// Original Game Board page
app.get('/original-game-board', (req, res) => {
  res.sendFile(path.join(__dirname, 'OriginalGameBoard.html'));
});

// Original board page
app.get('/original-board', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Original Board - Energy of Money</title>
        <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                min-height: 100vh;
                padding: 20px;
                color: white;
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .header {
                text-align: center;
                margin-bottom: 2rem;
            }
            
            .loading-text {
                font-size: 1.5rem;
                margin-bottom: 1rem;
                color: #4CAF50;
            }
            
            .subtitle {
                font-size: 1rem;
                color: #B0BEC5;
                margin-bottom: 2rem;
            }
            
            .debug-panel {
                background: rgba(0, 0, 0, 0.3);
                border: 2px solid #333;
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 2rem;
                backdrop-filter: blur(10px);
            }
            
            .debug-title {
                font-size: 1.2rem;
                font-weight: bold;
                margin-bottom: 15px;
                color: #FFD700;
            }
            
            .debug-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                font-size: 1rem;
            }
            
            .debug-label {
                color: #B0BEC5;
            }
            
            .debug-value {
                color: #4CAF50;
                font-weight: bold;
            }
            
            .debug-value.disconnected {
                color: #F44336;
            }
            
            .board-container {
                position: relative;
                width: 800px;
                height: 800px;
                margin: 0 auto;
                background: #1a1a2e;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.5);
                border: 4px solid #333;
            }
            
            .outer-board {
                position: relative;
                width: 100%;
                height: 100%;
                border-radius: 20px;
            }
            
            .outer-cell {
                position: absolute;
                width: 50px;
                height: 50px;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: bold;
                color: white;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 2px solid rgba(255,255,255,0.2);
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            }
            
            .outer-cell:hover {
                transform: scale(1.1);
                z-index: 10;
                box-shadow: 0 4px 16px rgba(0,0,0,0.5);
            }
            
            .special-zone {
                position: absolute;
                width: 100px;
                height: 80px;
                border-radius: 10px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: bold;
                color: white;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 3px solid #ff6b6b;
                box-shadow: 0 4px 16px rgba(255, 107, 107, 0.3);
            }
            
            .special-zone:hover {
                transform: scale(1.05);
                z-index: 10;
                box-shadow: 0 6px 20px rgba(255, 107, 107, 0.5);
            }
            
            .inner-board {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 300px;
                height: 300px;
                background: #2d2d44;
                border-radius: 50%;
                border: 4px solid #ffd700;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
            }
            
            .center-element {
                width: 150px;
                height: 150px;
                background: linear-gradient(45deg, #ffd700, #ffed4e);
                border-radius: 50%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-size: 28px;
                font-weight: bold;
                color: #333;
                box-shadow: 0 0 25px rgba(255, 215, 0, 0.6);
                position: relative;
            }
            
            .center-element::before {
                content: '1';
                font-size: 42px;
                font-weight: bold;
            }
            
            .center-element::after {
                content: '$$$$';
                position: absolute;
                top: -15px;
                left: -15px;
                right: -15px;
                bottom: -15px;
                background: radial-gradient(circle, transparent 30%, rgba(255, 215, 0, 0.4) 70%);
                border-radius: 50%;
                pointer-events: none;
            }
            
            .inner-cell {
                position: absolute;
                width: 35px;
                height: 35px;
                background: #ddd;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-size: 8px;
                font-weight: bold;
                color: #333;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 2px solid #999;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            }
            
            .inner-cell:hover {
                transform: scale(1.1);
                z-index: 10;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }
            
            .loading-spinner {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #4CAF50;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-right: 10px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .status-indicator {
                display: inline-block;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                margin-right: 8px;
            }
            
            .status-connected {
                background: #4CAF50;
                box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
            }
            
            .status-disconnected {
                background: #F44336;
                box-shadow: 0 0 10px rgba(244, 67, 54, 0.5);
            }
            
            @media (max-width: 768px) {
                .board-container {
                    width: 600px;
                    height: 600px;
                }
                
                .outer-cell {
                    width: 35px;
                    height: 35px;
                    font-size: 8px;
                }
                
                .special-zone {
                    width: 80px;
                    height: 60px;
                    font-size: 8px;
                }
                
                .center-element {
                    width: 100px;
                    height: 100px;
                    font-size: 20px;
                }
                
                .inner-cell {
                    width: 25px;
                    height: 25px;
                    font-size: 6px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="loading-text">
                    <span class="loading-spinner"></span>
                    Загрузка полной игровой доски...
                </div>
                <div class="subtitle">Подготавливаем 24 внутренних + 52 внешних клетки</div>
            </div>
            
            <div class="debug-panel">
                <div class="debug-title">🔧 DEBUG PANEL</div>
                <div class="debug-item">
                    <span class="debug-label">Connected:</span>
                    <span class="debug-value disconnected" id="connectionStatus">❌</span>
                </div>
                <div class="debug-item">
                    <span class="debug-label">Rooms:</span>
                    <span class="debug-value" id="roomsCount">0</span>
                </div>
                <div class="debug-item">
                    <span class="debug-label">Current:</span>
                    <span class="debug-value" id="currentRoom">none</span>
                </div>
            </div>
            
            <div class="board-container">
                <div class="outer-board" id="outerBoard">
                    <!-- 52 outer cells will be rendered here -->
                </div>
                <div class="inner-board" id="innerBoard">
                    <div class="center-element"></div>
                    <!-- 24 inner cells will be rendered here -->
                </div>
            </div>
        </div>
        
        <script>
            // Game cells data
            const INNER_CELLS = ${JSON.stringify(INNER_CELLS)};
            const OUTER_CELLS = ${JSON.stringify(OUTER_CELLS)};
            
            // Socket connection
            const socket = io();
            let isConnected = false;
            let roomsCount = 0;
            
            // Update debug panel
            function updateDebugPanel() {
                document.getElementById('connectionStatus').textContent = isConnected ? '✅' : '❌';
                document.getElementById('connectionStatus').className = isConnected ? 'debug-value status-connected' : 'debug-value disconnected';
                document.getElementById('roomsCount').textContent = roomsCount;
            }
            
            // Socket events
            socket.on('connect', () => {
                isConnected = true;
                updateDebugPanel();
                console.log('Connected to server');
            });
            
            socket.on('disconnect', () => {
                isConnected = false;
                updateDebugPanel();
                console.log('Disconnected from server');
            });
            
            socket.on('updateRoomList', (rooms) => {
                roomsCount = Object.keys(rooms).length;
                updateDebugPanel();
            });
            
            // Render game board
            function renderGameBoard() {
                const outerBoard = document.getElementById('outerBoard');
                const innerBoard = document.getElementById('innerBoard');
                
                // Clear existing content
                outerBoard.innerHTML = '';
                innerBoard.innerHTML = '<div class="center-element"></div>';
                
                // Add special zones
                const specialZones = [
                    { name: 'Большая сделка', icon: '$', color: '#4a90e2', x: 5, y: 15, cards: '24 карт' },
                    { name: 'Малая сделка', icon: '💼', color: '#2ecc71', x: 75, y: 5, cards: '62 карт' },
                    { name: 'Расходы', icon: '🛒', color: '#e74c3c', x: 5, y: 75, cards: '24 карт' },
                    { name: 'Рынок', icon: '🏢', color: '#3498db', x: 75, y: 75, cards: '24 карт' }
                ];
                
                specialZones.forEach(zone => {
                    const zoneElement = document.createElement('div');
                    zoneElement.className = 'special-zone';
                    zoneElement.style.backgroundColor = zone.color;
                    zoneElement.style.left = \`\${zone.x}%\`;
                    zoneElement.style.top = \`\${zone.y}%\`;
                    zoneElement.innerHTML = \`
                        <div>\${zone.icon}</div>
                        <div>\${zone.name}</div>
                        <div style="font-size: 8px;">\${zone.cards}</div>
                    \`;
                    outerBoard.appendChild(zoneElement);
                });
                
                // Render outer cells (52 cells)
                OUTER_CELLS.forEach((cell, index) => {
                    const cellElement = document.createElement('div');
                    cellElement.className = 'outer-cell';
                    cellElement.style.backgroundColor = cell.color;
                    cellElement.innerHTML = \`
                        <div>\${cell.icon}</div>
                        <div style="font-size: 8px;">\${cell.name}</div>
                    \`;
                    
                    // Position calculation for rectangular board
                    let x, y;
                    const cellSize = 50;
                    const margin = 30;
                    const boardWidth = 800;
                    const boardHeight = 800;
                    
                    if (index < 14) {
                        // Top row (1-14)
                        x = margin + (index * (boardWidth - 2 * margin - cellSize) / 13);
                        y = margin;
                    } else if (index < 26) {
                        // Right column (15-26)
                        x = boardWidth - margin - cellSize;
                        y = margin + ((index - 14) * (boardHeight - 2 * margin - cellSize) / 11);
                    } else if (index < 40) {
                        // Bottom row (27-40)
                        x = boardWidth - margin - cellSize - ((index - 26) * (boardWidth - 2 * margin - cellSize) / 13);
                        y = boardHeight - margin - cellSize;
                    } else {
                        // Left column (41-52)
                        x = margin;
                        y = boardHeight - margin - cellSize - ((index - 40) * (boardHeight - 2 * margin - cellSize) / 11);
                    }
                    
                    cellElement.style.left = \`\${x}px\`;
                    cellElement.style.top = \`\${y}px\`;
                    
                    outerBoard.appendChild(cellElement);
                });
                
                // Render inner cells (24 cells)
                INNER_CELLS.forEach((cell, index) => {
                    const cellElement = document.createElement('div');
                    cellElement.className = 'inner-cell';
                    cellElement.style.backgroundColor = cell.color;
                    cellElement.innerHTML = \`
                        <div>\${cell.icon}</div>
                        <div style="font-size: 6px;">\${cell.name}</div>
                    \`;
                    
                    // Position calculation for circular inner board
                    const centerX = 150; // Half of inner board width
                    const centerY = 150; // Half of inner board height
                    const radius = 100; // Distance from center
                    const angle = (index * 360 / 24) * (Math.PI / 180); // Convert to radians
                    
                    const x = centerX + radius * Math.cos(angle) - 17.5; // 17.5 is half of cell width
                    const y = centerY + radius * Math.sin(angle) - 17.5; // 17.5 is half of cell height
                    
                    cellElement.style.left = \`\${x}px\`;
                    cellElement.style.top = \`\${y}px\`;
                    
                    innerBoard.appendChild(cellElement);
                });
            }
            
            // Initialize
            document.addEventListener('DOMContentLoaded', () => {
                renderGameBoard();
                socket.emit('getRoomList');
            });
        </script>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    rooms: rooms.size,
    players: players.size,
    uptime: process.uptime()
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Starting Energy of Money - Lobby Module...`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`✅ Lobby module running on port ${PORT}`);
  console.log(`🌐 Open http://localhost:${PORT} in browser`);
  console.log(`🎯 Game board integrated with 52 outer + 24 inner cells`);
});