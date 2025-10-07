
(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const startBtn = document.getElementById('startBtn');
  const scoreDisplay = document.getElementById('scoreDisplay');
  const bestDisplay = document.getElementById('bestDisplay');
  const message = document.getElementById('message');
  const bgColorInput = document.getElementById('bgColor');
  const fgColorInput = document.getElementById('fgColor');
  const saveColorsBtn = document.getElementById('saveColors');
  const touchLeft = document.getElementById('touchLeft');
  const touchRight = document.getElementById('touchRight');

  // Config
  const PADDLE_WIDTH_RATIO = 0.22; // fraction of canvas width
  const PADDLE_HEIGHT = 12; // px
  const PADDLE_Y_OFFSET = 24; // px from bottom
  const BALL_RADIUS = 8; // px

  const BASE_SPEED = 320; // pixels per second
  const ACCELERATION_PER_BOUNCE = 1.08; // multiplier per bounce
  const MAX_SPEED_MULTIPLIER = 5.0;
  const MIN_X_COMPONENT = 0.35; // to avoid strictly vertical

  let game = {
    width: canvas.width,
    height: canvas.height,
    paddle: { x: 0, w: 100, h: PADDLE_HEIGHT },
    ball: { x: 0, y: 0, r: BALL_RADIUS, vx: 0, vy: 0, speed: BASE_SPEED, speedMult: 1 },
    running: false,
    lastTime: 0,
    startTime: 0,
    score: 0,
    best: 0,
    colors: { bg: '#071131', fg: '#f8fafc' },
    moveLeft: false,
    moveRight: false,
  };

  // Local storage keys
  const KEY_BEST = 'pong_best';
  const KEY_COLORS = 'pong_colors';

  function loadStorage() {
    const b = parseFloat(localStorage.getItem(KEY_BEST));
    if (!Number.isNaN(b)) game.best = b;
    const colors = localStorage.getItem(KEY_COLORS);
    if (colors) {
      try { game.colors = JSON.parse(colors); } catch(e){}
    }
    bgColorInput.value = game.colors.bg;
    fgColorInput.value = game.colors.fg;
    bestDisplay.textContent = formatNumber(game.best);
  }

  function saveColors() {
    game.colors.bg = bgColorInput.value;
    game.colors.fg = fgColorInput.value;
    localStorage.setItem(KEY_COLORS, JSON.stringify(game.colors));
  }

  function formatNumber(v){ return v.toFixed(2); }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(300, Math.floor(rect.width * dpr));
    canvas.height = Math.max(200, Math.floor(rect.width * 9/16 * dpr));
    game.width = canvas.width;
    game.height = canvas.height;

    // scale paddle width
    game.paddle.w = Math.floor(game.width * PADDLE_WIDTH_RATIO);
    game.paddle.h = PADDLE_HEIGHT * dpr;
    game.paddle.x = Math.floor((game.width - game.paddle.w)/2);
    game.paddle.y = game.height - PADDLE_Y_OFFSET * dpr - game.paddle.h;

    // ball radius scaled
    game.ball.r = Math.max(4, BALL_RADIUS * dpr);

    // if ball is out of bounds, reposition
    if (!game.running) {
      game.ball.x = game.width / 2;
      game.ball.y = game.height / 2;
    }
  }

  function randomDirection() {
    // choose angle so that |cos| (x component) >= MIN_X_COMPONENT
    let angle, vx, vy;
    const minX = MIN_X_COMPONENT;
    do {
      // angle from -80deg to -100deg for upward - or downward? launch upward
      angle = (Math.random() * Math.PI * 2);
      vx = Math.cos(angle);
      vy = Math.sin(angle);
    } while (Math.abs(vx) < minX || Math.abs(vy) < 0.2); // avoid too shallow too

    // ensure ball moves upwards initially (vy < 0)
    if (vy > 0) vy = -Math.abs(vy);

    return { vx, vy };
  }

  function resetGame() {
    game.ball.x = game.width / 2;
    game.ball.y = game.height / 2;
    game.ball.speed = BASE_SPEED * (window.devicePixelRatio || 1);
    game.ball.speedMult = 1;
    const dir = randomDirection();
    // normalize vector then apply speed
    const len = Math.hypot(dir.vx, dir.vy) || 1;
    game.ball.vx = dir.vx / len;
    game.ball.vy = dir.vy / len;
    game.running = false;
    game.startTime = 0;
    game.score = 0;
    message.textContent = '';
    scoreDisplay.textContent = formatNumber(0);
    startBtn.setAttribute('aria-pressed','false');
  }

  function startOrReset() {
    if (game.running) {
      // reset
      cancelAnimationFrame(game.raf);
      resetGame();
      draw();
      manageAfterStop();
      // mark start button aria
    } else {
      // start
      resetGame();
      game.running = true;
      game.startTime = performance.now();
      game.lastTime = performance.now();
      startBtn.setAttribute('aria-pressed','true');
      message.textContent = '';
      game.raf = requestAnimationFrame(loop);
    }
  }

  function manageAfterStop() {
    // update displays
    bestDisplay.textContent = formatNumber(game.best);
  }

  function loop(timestamp) {
    if (!game.running) return;
    const dt = Math.min(1/30, (timestamp - game.lastTime) / 1000);
    game.lastTime = timestamp;

    update(dt);
    draw();

    // update score display
    game.score = (timestamp - game.startTime) / 1000;
    scoreDisplay.textContent = formatNumber(game.score);

    game.raf = requestAnimationFrame(loop);
  }

  function update(dt) {
    // handle paddle input
    const paddleSpeed = game.width * 1.2; // px per second
    if (game.moveLeft) game.paddle.x -= paddleSpeed * dt;
    if (game.moveRight) game.paddle.x += paddleSpeed * dt;

    // keep paddle in bounds
    if (game.paddle.x < 0) game.paddle.x = 0;
    if (game.paddle.x + game.paddle.w > game.width) game.paddle.x = game.width - game.paddle.w;

    // ball movement
    const moveDist = game.ball.speed * game.ball.speedMult * dt;
    game.ball.x += game.ball.vx * moveDist;
    game.ball.y += game.ball.vy * moveDist;

    // collisions with walls
    // left
    if (game.ball.x - game.ball.r <= 0) {
      game.ball.x = game.ball.r;
      game.ball.vx = Math.abs(game.ball.vx);
      onBounce();
    }
    // right
    if (game.ball.x + game.ball.r >= game.width) {
      game.ball.x = game.width - game.ball.r;
      game.ball.vx = -Math.abs(game.ball.vx);
      onBounce();
    }
    // top
    if (game.ball.y - game.ball.r <= 0) {
      game.ball.y = game.ball.r;
      game.ball.vy = Math.abs(game.ball.vy);
      onBounce();
    }

    // paddle
    if (game.ball.y + game.ball.r >= game.paddle.y) {
      if (game.ball.x >= game.paddle.x && game.ball.x <= game.paddle.x + game.paddle.w && game.ball.vy > 0) {
        // compute hit position
        const relative = (game.ball.x - (game.paddle.x + game.paddle.w/2)) / (game.paddle.w/2);
        const maxAngle = (75 * Math.PI) / 180; // 75deg
        const angle = relative * maxAngle;
        // set new direction upwards
        const vx = Math.sin(angle);
        const vy = -Math.cos(angle);
        // normalize
        const len = Math.hypot(vx, vy) || 1;
        game.ball.vx = vx / len;
        game.ball.vy = vy / len;
        game.ball.y = game.paddle.y - game.ball.r - 1;
        onBounce(true);
      }
    }

    // missed: ball beyond bottom
    if (game.ball.y - game.ball.r > game.height) {
      // game over
      endGame();
    }
  }

  function onBounce(isPaddle=false) {
    // increase speed multiplier gently up to max
    game.ball.speedMult = Math.min(MAX_SPEED_MULTIPLIER, game.ball.speedMult * ACCELERATION_PER_BOUNCE);
    // ensure x component not too small
    if (Math.abs(game.ball.vx) < MIN_X_COMPONENT) {
      game.ball.vx = Math.sign(game.ball.vx || 1) * MIN_X_COMPONENT;
      // renormalize keeping vy sign
      const s = Math.hypot(game.ball.vx, game.ball.vy) || 1;
      game.ball.vx /= s; game.ball.vy /= s;
    }
  }

  function endGame() {
    game.running = false;
    cancelAnimationFrame(game.raf);
    message.textContent = `Partie terminée — durée : ${formatNumber(game.score)} s`;
    startBtn.setAttribute('aria-pressed','false');
    // update best
    if (game.score > game.best) {
      game.best = game.score;
      localStorage.setItem(KEY_BEST, String(game.best));
      message.textContent += ' — Nouveau meilleur score !';
    }
    manageAfterStop();
  }

  function draw() {
    // background
    ctx.fillStyle = game.colors.bg;
    ctx.fillRect(0,0,game.width,game.height);

    // paddle
    ctx.fillStyle = game.colors.fg;
    ctx.fillRect(game.paddle.x, game.paddle.y, game.paddle.w, game.paddle.h);

    // ball
    ctx.beginPath();
    ctx.arc(game.ball.x, game.ball.y, game.ball.r, 0, Math.PI*2);
    ctx.fill();

    // bottom info strip (small)
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(0, game.height - 26, game.width, 26);
  }

  // Input handlers
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'Left') { game.moveLeft = true; e.preventDefault(); }
    if (e.key === 'ArrowRight' || e.key === 'Right') { game.moveRight = true; e.preventDefault(); }
    if (e.key === ' ' || e.key === 'Spacebar') { startOrReset(); }
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'Left') { game.moveLeft = false; }
    if (e.key === 'ArrowRight' || e.key === 'Right') { game.moveRight = false; }
  });

  // pointer to control paddle position (desktop + touch drag)
  let isPointerDown = false;
  canvas.addEventListener('pointerdown', (e) => { isPointerDown = true; canvas.setPointerCapture(e.pointerId); movePaddleToPointer(e); });
  canvas.addEventListener('pointerup', (e) => { isPointerDown = false; canvas.releasePointerCapture(e.pointerId); });
  canvas.addEventListener('pointercancel', (e) => { isPointerDown = false; });
  canvas.addEventListener('pointermove', (e) => { if (isPointerDown) movePaddleToPointer(e); });

  function movePaddleToPointer(e) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const x = (e.clientX - rect.left) * dpr;
    game.paddle.x = Math.max(0, Math.min(game.width - game.paddle.w, x - game.paddle.w/2));
  }

  // simple touch buttons
  touchLeft.addEventListener('touchstart', (e) => { e.preventDefault(); game.moveLeft = true; });
  touchLeft.addEventListener('touchend', (e) => { e.preventDefault(); game.moveLeft = false; });
  touchRight.addEventListener('touchstart', (e) => { e.preventDefault(); game.moveRight = true; });
  touchRight.addEventListener('touchend', (e) => { e.preventDefault(); game.moveRight = false; });

  // start button
  startBtn.addEventListener('click', startOrReset);

  // color management
  saveColorsBtn.addEventListener('click', () => { saveColors(); message.textContent = 'Couleurs sauvegardées.'; setTimeout(()=>message.textContent='','1500'); });

  // initialize
  loadStorage();
  resize();
  resetGame();
  draw();

  window.addEventListener('resize', () => { resize(); draw(); });
})();
