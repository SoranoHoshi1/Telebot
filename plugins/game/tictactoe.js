
const games = new Map();

export default {
  command: ['ttt', 'tictactoe', 'xo'],
  tags: ['game', 'fun'],
  help: ['/ttt', '/tictactoe', '/xo'],
  description: 'Main Tic Tac Toe (XO)',
  on: ['callback_query'],
  callbackPattern: /^ttt_/,
  async run(ctx) {
    try {
      if (ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;
        const [action, gameId, position] = data.split('_');
        
        if (action === 'ttt') {
          const game = games.get(gameId);
          if (!game) {
            return ctx.answerCallbackQuery('Game sudah berakhir!');
          }

          const pos = parseInt(position);
          if (game.board[pos] !== '⬜') {
            return ctx.answerCallbackQuery('Posisi sudah terisi!');
          }

          // Make move
          game.board[pos] = game.currentPlayer;
          
          // Check win
          const winner = checkWinner(game.board);
          if (winner) {
            games.delete(gameId);
            const resultText = winner === 'draw' ? 
              '🤝 *SERI!*\n\nPermainan berakhir seri!' :
              `🎉 *${winner} MENANG!*\n\nSelamat untuk pemenang!`;
            
            await ctx.editMessageText(
              `${resultText}\n\n${getBoardDisplay(game.board)}`,
              { parse_mode: 'Markdown' }
            );
            return ctx.answerCallbackQuery(winner === 'draw' ? 'Permainan seri!' : `${winner} menang!`);
          }

          // Switch player
          game.currentPlayer = game.currentPlayer === '❌' ? '⭕' : '❌';
          
          await ctx.editMessageText(
            `🎮 *Tic Tac Toe*\n\nGiliran: ${game.currentPlayer}\n\n${getBoardDisplay(game.board)}`,
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: getBoardKeyboard(gameId, game.board)
              }
            }
          );
          
          ctx.answerCallbackQuery(`Giliran ${game.currentPlayer}`);
        }
        return;
      }

      // Start new game
      const gameId = Date.now().toString();
      const game = {
        board: Array(9).fill('⬜'),
        currentPlayer: '❌',
        players: [ctx.from.id]
      };
      
      games.set(gameId, game);

      ctx.reply(
        `🎮 *Tic Tac Toe Dimulai!*\n\nGiliran: ❌\n\n${getBoardDisplay(game.board)}\n\n📋 *Cara main:*\nKlik kotak untuk menempatkan simbol Anda!`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: getBoardKeyboard(gameId, game.board)
          }
        }
      );
    } catch (error) {
      console.error('TicTacToe Error:', error);
      ctx.reply('⚠️ Gagal memulai game. Coba lagi nanti.');
    }
  }
};

function getBoardDisplay(board) {
  return `${board[0]}${board[1]}${board[2]}\n${board[3]}${board[4]}${board[5]}\n${board[6]}${board[7]}${board[8]}`;
}

function getBoardKeyboard(gameId, board) {
  const keyboard = [];
  for (let i = 0; i < 9; i += 3) {
    keyboard.push([
      { text: board[i], callback_data: `ttt_${gameId}_${i}` },
      { text: board[i + 1], callback_data: `ttt_${gameId}_${i + 1}` },
      { text: board[i + 2], callback_data: `ttt_${gameId}_${i + 2}` }
    ]);
  }
  return keyboard;
}

function checkWinner(board) {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] !== '⬜' && board[a] === board[b] && board[b] === board[c]) {
      return board[a];
    }
  }

  if (!board.includes('⬜')) {
    return 'draw';
  }

  return null;
}
