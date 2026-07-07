document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // STATE VARIABLES
    // ==========================================================================
    const passcode = "1207";
    let currentPasscodeInput = "";
    
    // Anniversary start date (July 12, 2025 00:00:00)
    // July is month 6 (0-indexed)
    const anniversaryStartDate = new Date(2025, 6, 12, 0, 0, 0); 
    
    // Slides Navigation State
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const slideIndicator = document.querySelector('.slide-indicator');
    const prevBtn = document.getElementById('prev-slide');
    const nextBtn = document.getElementById('next-slide');

    // Music State
    const bgMusic = document.getElementById('bg-music');
    const musicToggle = document.getElementById('music-toggle');
    const musicWidget = document.querySelector('.music-widget');
    let isMusicPlaying = false;

    // Puzzle State
    let puzzleTiles = []; 
    let selectedTileIndex = null;
    let puzzleMoves = 0;
    let puzzleStartTime = null;
    let puzzleTimerInterval = null;
    let isPuzzleSolved = false;

    // Sweet messages revealed when puzzles are solved
    const puzzleSuccessMessages = {
        "assets/couple_portrait_vertical.png": "❤️ Official Portrait Unlocked: 'Since July 12th, 2025, you have officially been my partner and my whole world. This puzzle represents our pieces coming together to make one beautiful story. I love you!'",
        "assets/photo1.png": "🌅 Portrait Unlocked: 'You are the most beautiful girl in the world, and my absolute favorite view. Your smile makes every day feel like a perfect sunset.'",
        "assets/photo2.png": "🌸 Portrait Unlocked: 'Your kind heart, gentle laughter, and sweet presence make every single moment magical. You bring so much color and joy into my life.'",
        "assets/photo3.png": "✨ Portrait Unlocked: 'Your elegance, charm, and grace light up my life like no other. You are my brightest star and my greatest blessing.'"
    };

    // ==========================================================================
    // PASSCODE LOCK SCREEN LOGIC
    // ==========================================================================
    const lockScreen = document.getElementById('lock-screen');
    const appContainer = document.getElementById('app-container');
    const passcodeBoxes = document.querySelectorAll('.passcode-display .passcode-box');
    const keypadButtons = document.querySelectorAll('.key-btn[data-val]');
    const keyClear = document.getElementById('key-clear');
    const keyEnter = document.getElementById('key-enter');
    const lockContainer = document.querySelector('.lock-container');

    // Handle keypad numeric buttons
    keypadButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentPasscodeInput.length < 4) {
                currentPasscodeInput += btn.getAttribute('data-val');
                updatePasscodeDisplay();
                if (currentPasscodeInput.length === 4) {
                    // Auto verify on 4 digits
                    setTimeout(verifyPasscode, 300);
                }
            }
        });
    });

    // Handle backspace / clear button
    keyClear.addEventListener('click', () => {
        if (currentPasscodeInput.length > 0) {
            currentPasscodeInput = currentPasscodeInput.slice(0, -1);
            updatePasscodeDisplay();
        }
    });

    // Handle Heart/Enter button
    keyEnter.addEventListener('click', () => {
        if (currentPasscodeInput.length === 4) {
            verifyPasscode();
        } else {
            shakeLockContainer();
        }
    });

    function updatePasscodeDisplay() {
        passcodeBoxes.forEach((box, index) => {
            if (index < currentPasscodeInput.length) {
                box.innerText = "*";
                box.classList.add('filled');
            } else {
                box.innerText = "";
                box.classList.remove('filled');
            }
        });
    }

    function verifyPasscode() {
        if (currentPasscodeInput === passcode) {
            unlockPortal();
        } else {
            // Failed attempt
            shakeLockContainer();
            passcodeBoxes.forEach(box => {
                box.classList.add('error');
                box.innerText = "✗";
            });
            setTimeout(() => {
                currentPasscodeInput = "";
                updatePasscodeDisplay();
                passcodeBoxes.forEach(box => box.classList.remove('error'));
            }, 600);
        }
    }

    function shakeLockContainer() {
        lockContainer.classList.add('shake');
        setTimeout(() => {
            lockContainer.classList.remove('shake');
        }, 400);
    }

    function unlockPortal() {
        // Play brief unlock sound and start bg music
        startMusic();

        setTimeout(() => {
            lockScreen.classList.add('fade-out');
            appContainer.classList.remove('hidden');
            void appContainer.offsetWidth;
            appContainer.classList.add('show');
            
            // Initialize animations & clocks
            initHeartsCanvas();
            setInterval(updateCounter, 1000);
            updateCounter();
            
            // Start typewriter prologue
            startTypewriter();
            
            // Initialize puzzle
            initPuzzle();
            updateSlideNavigation();
        }, 300);
    }

    // ==========================================================================
    // SLIDE NAVIGATOR LOGIC
    // ==========================================================================
    prevBtn.addEventListener('click', () => {
        navigateSlides(-1);
    });

    nextBtn.addEventListener('click', () => {
        navigateSlides(1);
    });

    function navigateSlides(direction) {
        // Calculate next slide index with wrap-around boundaries
        let nextIndex = currentSlide + direction;
        if (nextIndex >= 0 && nextIndex < slides.length) {
            slides[currentSlide].classList.remove('active-slide');
            currentSlide = nextIndex;
            slides[currentSlide].classList.add('active-slide');
            updateSlideNavigation();
        }
    }

    function updateSlideNavigation() {
        // Toggle arrow button visibility
        if (currentSlide === 0) {
            prevBtn.style.opacity = '0.3';
            prevBtn.style.pointerEvents = 'none';
        } else {
            prevBtn.style.opacity = '1';
            prevBtn.style.pointerEvents = 'auto';
        }

        if (currentSlide === slides.length - 1) {
            nextBtn.style.opacity = '0.3';
            nextBtn.style.pointerEvents = 'none';
        } else {
            nextBtn.style.opacity = '1';
            nextBtn.style.pointerEvents = 'auto';
        }

        // Update indicator text
        slideIndicator.innerText = `Slide ${currentSlide + 1} / ${slides.length}`;

        // Update roadmap steps active/completed state
        const roadmapSteps = document.querySelectorAll('.roadmap-step');
        roadmapSteps.forEach((step, index) => {
            if (index === currentSlide) {
                step.classList.add('active-step');
                step.classList.remove('completed-step');
            } else if (index < currentSlide) {
                step.classList.remove('active-step');
                step.classList.add('completed-step');
            } else {
                step.classList.remove('active-step');
                step.classList.remove('completed-step');
            }
        });
    }

    // ==========================================================================
    // FLOATING HEARTS CANVAS ANIMATION
    // ==========================================================================
    let canvas, ctx, hearts;
    
    function initHeartsCanvas() {
        canvas = document.getElementById('canvas-hearts');
        ctx = canvas.getContext('2d');
        resizeCanvas();

        window.addEventListener('resize', resizeCanvas);

        hearts = [];
        const heartCount = Math.min(30, Math.floor(window.innerWidth / 40));
        
        for (let i = 0; i < heartCount; i++) {
            hearts.push(createHeart(true));
        }

        animateHearts();
    }

    function resizeCanvas() {
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    }

    function createHeart(randomY = false) {
        return {
            x: Math.random() * canvas.width,
            y: randomY ? Math.random() * canvas.height : canvas.height + 50,
            size: Math.random() * 12 + 6,
            speed: Math.random() * 1.2 + 0.4,
            opacity: Math.random() * 0.4 + 0.15,
            sway: Math.random() * 2 * Math.PI,
            swaySpeed: Math.random() * 0.015 + 0.005,
            color: `rgba(255, ${Math.floor(Math.random() * 60 + 80)}, ${Math.floor(Math.random() * 100 + 120)}, `
        };
    }

    function drawHeart(x, y, size, opacity, color) {
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color + '1)';
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(230, 57, 70, 0.3)';
        
        ctx.beginPath();
        ctx.moveTo(x, y - size / 4);
        ctx.quadraticCurveTo(x, y - size, x - size / 2, y - size);
        ctx.quadraticCurveTo(x - size, y - size, x - size, y - size / 4);
        ctx.quadraticCurveTo(x - size, y + size / 3, x, y + size);
        ctx.quadraticCurveTo(x + size, y + size / 3, x + size, y - size / 4);
        ctx.quadraticCurveTo(x + size, y - size, x + size / 2, y - size);
        ctx.quadraticCurveTo(x, y - size, x, y - size / 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function animateHearts() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        hearts.forEach(heart => {
            heart.y -= heart.speed;
            heart.sway += heart.swaySpeed;
            heart.x += Math.sin(heart.sway) * 0.3;
            
            drawHeart(heart.x, heart.y, heart.size, heart.opacity, heart.color);

            // Recycle heart
            if (heart.y < -50) {
                Object.assign(heart, createHeart(false));
            }
        });

        requestAnimationFrame(animateHearts);
    }

    // ==========================================================================
    // MUSIC PLAYER CONTROLLER
    // ==========================================================================
    musicToggle.addEventListener('click', () => {
        if (isMusicPlaying) {
            pauseMusic();
        } else {
            startMusic();
        }
    });

    function startMusic() {
        bgMusic.play().then(() => {
            isMusicPlaying = true;
            musicWidget.classList.add('playing');
            musicToggle.innerHTML = '<i class="fa-solid fa-pause"></i>';
        }).catch(err => {
            console.log("Audio autoplay prevented.", err);
        });
    }

    function pauseMusic() {
        bgMusic.pause();
        isMusicPlaying = false;
        musicWidget.classList.remove('playing');
        musicToggle.innerHTML = '<i class="fa-solid fa-music"></i>';
    }

    // ==========================================================================
    // ANNIVERSARY LIVE COUNT-UP
    // ==========================================================================
    function updateCounter() {
        const now = new Date();
        let diff = now - anniversaryStartDate;
        if (diff < 0) diff = 0;

        // Breakdown Years, Months, Days
        let years = now.getFullYear() - anniversaryStartDate.getFullYear();
        let months = now.getMonth() - anniversaryStartDate.getMonth();
        let days = now.getDate() - anniversaryStartDate.getDate();

        if (days < 0) {
            months--;
            const prevMonthDate = new Date(now.getFullYear(), now.getMonth(), 0);
            days += prevMonthDate.getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }

        // Remaining Time
        const lastMonthAnniversary = new Date(anniversaryStartDate);
        lastMonthAnniversary.setFullYear(anniversaryStartDate.getFullYear() + years);
        lastMonthAnniversary.setMonth(anniversaryStartDate.getMonth() + months);
        lastMonthAnniversary.setDate(anniversaryStartDate.getDate() + days);

        let timeRemainder = now - lastMonthAnniversary;
        if (timeRemainder < 0) timeRemainder = 0;

        const hours = Math.floor(timeRemainder / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemainder % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemainder % (1000 * 60)) / 1000);

        document.getElementById('c-years').innerText = String(years).padStart(2, '0');
        document.getElementById('c-months').innerText = String(months).padStart(2, '0');
        document.getElementById('c-days').innerText = String(days).padStart(2, '0');
        document.getElementById('c-hours').innerText = String(hours).padStart(2, '0');
        document.getElementById('c-minutes').innerText = String(minutes).padStart(2, '0');
        document.getElementById('c-seconds').innerText = String(seconds).padStart(2, '0');
    }

    // ==========================================================================
    // SLIDE 3: GIFT BOX LOGIC
    // ==========================================================================
    const giftBoxBtn = document.getElementById('gift-box-btn');

    giftBoxBtn.addEventListener('click', (e) => {
        // Prevent closing/toggling when clicking inside the paper scroll
        if (e.target.closest('.gift-letter-paper')) return;
        giftBoxBtn.classList.toggle('open');
    });

    // ==========================================================================
    // PUZZLE GAME LOGIC
    // ==========================================================================
    const canvasPuzzle = document.getElementById('puzzle-canvas');
    const ctxPuzzle = canvasPuzzle.getContext('2d');
    const puzzleSelect = document.getElementById('puzzle-image-select');
    const puzzleShuffleBtn = document.getElementById('puzzle-shuffle');
    const puzzlePreviewBtn = document.getElementById('puzzle-preview-btn');
    const puzzlePreviewOverlay = document.getElementById('puzzle-preview-overlay');
    const puzzlePreviewImg = document.getElementById('puzzle-preview-img');
    const puzzleTargetImg = document.getElementById('puzzle-target-img');
    const puzzleSolveBtn = document.getElementById('puzzle-solve');
    const movesCountDisplay = document.getElementById('moves-count');
    const puzzleTimerDisplay = document.getElementById('puzzle-timer');
    const successCard = document.getElementById('puzzle-success-card');
    const successMsg = document.getElementById('puzzle-success-msg');
    const successCloseBtn = document.getElementById('puzzle-success-close');

    let puzzleImg = new Image();
    let draggedTile = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    
    // Board sizes
    let boardW = 240;
    let boardH = 320;
    let boardX = 0;
    let boardY = 0;
    let tileW = 0;
    let tileH = 0;

    // Handle select image changes
    puzzleSelect.addEventListener('change', () => {
        const selectedImg = puzzleSelect.value;
        puzzlePreviewImg.src = selectedImg;
        puzzleTargetImg.src = selectedImg;
        loadPuzzleImage(selectedImg);
    });

    function loadPuzzleImage(src) {
        puzzleImg.onload = () => {
            initPuzzle();
        };
        puzzleImg.src = src;
    }

    // Shuffle
    puzzleShuffleBtn.addEventListener('click', shufflePuzzle);

    // Preview
    puzzlePreviewBtn.addEventListener('mousedown', showPreview);
    puzzlePreviewBtn.addEventListener('mouseup', hidePreview);
    puzzlePreviewBtn.addEventListener('mouseleave', hidePreview);
    puzzlePreviewBtn.addEventListener('touchstart', (e) => { e.preventDefault(); showPreview(); });
    puzzlePreviewBtn.addEventListener('touchend', hidePreview);

    function showPreview() { puzzlePreviewOverlay.classList.remove('hidden'); }
    function hidePreview() { puzzlePreviewOverlay.classList.add('hidden'); }

    // Solve Magic
    puzzleSolveBtn.addEventListener('click', solvePuzzleMagic);

    // Close Success
    successCloseBtn.addEventListener('click', () => {
        successCard.classList.add('hidden');
        shufflePuzzle();
    });

    // Draw Jigsaw Edge with Bezier curves
    function drawJigsawEdge(ctx, x1, y1, x2, y2, ox, oy, direction) {
        if (direction === 0) {
            ctx.lineTo(x2, y2);
            return;
        }
        
        const dx = x2 - x1;
        const dy = y2 - y1;
        const L = Math.sqrt(dx * dx + dy * dy);
        
        // Key points along the line
        const p1x = x1 + dx * 0.38;
        const p1y = y1 + dy * 0.38;
        const p2x = x1 + dx * 0.44;
        const p2y = y1 + dy * 0.44;
        const p3x = x1 + dx * 0.56;
        const p3y = y1 + dy * 0.56;
        const p4x = x1 + dx * 0.62;
        const p4y = y1 + dy * 0.62;
        
        // Tab size (height)
        const h = L * 0.18 * direction;
        
        // Apex center of the tab bulb
        const cx = (x1 + x2) / 2 + ox * h;
        const cy = (y1 + y2) / 2 + oy * h;
        
        // Neck control points
        const c1x = p2x + ox * h * 0.15;
        const c1y = p2y + oy * h * 0.15;
        
        // Bulb control points (widened tabs)
        const c2x = p2x + ox * h * 1.05 - (dx / L) * (L * 0.08);
        const c2y = p2y + oy * h * 1.05 - (dy / L) * (L * 0.08);
        
        const c3x = p3x + ox * h * 1.05 + (dx / L) * (L * 0.08);
        const c3y = p3y + oy * h * 1.05 + (dy / L) * (L * 0.08);
        
        const c4x = p3x + ox * h * 0.15;
        const c4y = p3y + oy * h * 0.15;
        
        ctx.lineTo(p1x, p1y);
        ctx.bezierCurveTo(c1x, c1y, c2x, c2y, cx, cy);
        ctx.bezierCurveTo(c3x, c3y, c4x, c4y, p4x, p4y);
        ctx.lineTo(x2, y2);
    }

    function initPuzzle() {
        clearInterval(puzzleTimerInterval);
        puzzleTimerDisplay.innerText = "00:00";
        puzzleStartTime = null;
        puzzleMoves = 0;
        movesCountDisplay.innerText = "0";
        isPuzzleSolved = false;
        draggedTile = null;
        successCard.classList.add('hidden');

        // Set up canvas dimensions dynamically based on container
        const rect = canvasPuzzle.parentElement.getBoundingClientRect();
        canvasPuzzle.width = rect.width;
        canvasPuzzle.height = rect.height;

        // Set up board geometry
        if (canvasPuzzle.width < 360) {
            boardW = 210;
            boardH = 280;
        } else {
            boardW = 240;
            boardH = 320;
        }

        boardX = (canvasPuzzle.width - boardW) / 2;
        boardY = (canvasPuzzle.height - boardH) / 2;
        tileW = boardW / 3;
        tileH = boardH / 3;

        // Generate interlocking edge values for the 3x3 grid
        const horizontalEdges = [];
        const verticalEdges = [];

        // 2 inner horizontal boundaries
        for (let r = 0; r < 2; r++) {
            horizontalEdges[r] = [];
            for (let c = 0; c < 3; c++) {
                horizontalEdges[r][c] = Math.random() < 0.5 ? 1 : -1;
            }
        }
        // 2 inner vertical boundaries
        for (let r = 0; r < 3; r++) {
            verticalEdges[r] = [];
            for (let c = 0; c < 2; c++) {
                verticalEdges[r][c] = Math.random() < 0.5 ? 1 : -1;
            }
        }

        puzzleTiles = [];
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const targetX = boardX + c * tileW;
                const targetY = boardY + r * tileH;

                // edges order: [top, right, bottom, left]
                const edges = [
                    r === 0 ? 0 : -horizontalEdges[r - 1][c],      // top matches bottom of above
                    c === 2 ? 0 : verticalEdges[r][c],            // right
                    r === 2 ? 0 : horizontalEdges[r][c],           // bottom
                    c === 0 ? 0 : -verticalEdges[r][c - 1]         // left matches right of left
                ];

                puzzleTiles.push({
                    col: c,
                    row: r,
                    edges: edges,
                    targetX: targetX,
                    targetY: targetY,
                    x: targetX,
                    y: targetY,
                    isSnapped: true // Initially solved until shuffled
                });
            }
        }

        redrawCanvas();
    }

    function shufflePuzzle() {
        if (isPuzzleSolved) {
            successCard.classList.add('hidden');
            isPuzzleSolved = false;
        }

        clearInterval(puzzleTimerInterval);
        puzzleTimerDisplay.innerText = "00:00";
        puzzleStartTime = null;
        puzzleMoves = 0;
        movesCountDisplay.innerText = "0";
        draggedTile = null;

        // Scatter pieces
        puzzleTiles.forEach(tile => {
            tile.isSnapped = false;
            
            // Scatter mostly on the sides of the board
            let startX;
            if (Math.random() < 0.5) {
                startX = Math.random() * Math.max(10, boardX - tileW - 10);
            } else {
                startX = boardX + boardW + Math.random() * Math.max(10, canvasPuzzle.width - boardX - boardW - tileW - 10);
            }
            startX = Math.max(5, Math.min(canvasPuzzle.width - tileW - 5, startX));
            
            const startY = Math.random() * (canvasPuzzle.height - tileH - 10) + 5;

            tile.x = startX;
            tile.y = startY;
        });

        // Re-randomize drawing order
        puzzleTiles.sort(() => Math.random() - 0.5);

        redrawCanvas();
    }

    function drawJigsawPiece(tile, strokeGlow) {
        ctxPuzzle.save();
        ctxPuzzle.beginPath();
        ctxPuzzle.moveTo(tile.x, tile.y);

        // Top Edge (ox = 0, oy = -1)
        drawJigsawEdge(ctxPuzzle, tile.x, tile.y, tile.x + tileW, tile.y, 0, -1, tile.edges[0]);
        // Right Edge (ox = 1, oy = 0)
        drawJigsawEdge(ctxPuzzle, tile.x + tileW, tile.y, tile.x + tileW, tile.y + tileH, 1, 0, tile.edges[1]);
        // Bottom Edge (ox = 0, oy = 1)
        drawJigsawEdge(ctxPuzzle, tile.x + tileW, tile.y + tileH, tile.x, tile.y + tileH, 0, 1, tile.edges[2]);
        // Left Edge (ox = -1, oy = 0)
        drawJigsawEdge(ctxPuzzle, tile.x, tile.y + tileH, tile.x, tile.y, -1, 0, tile.edges[3]);
        ctxPuzzle.closePath();

        ctxPuzzle.clip();

        // Draw image slice
        const sx = tile.col * (puzzleImg.width / 3);
        const sy = tile.row * (puzzleImg.height / 3);
        const sw = puzzleImg.width / 3;
        const sh = puzzleImg.height / 3;
        ctxPuzzle.drawImage(puzzleImg, sx, sy, sw, sh, tile.x, tile.y, tileW, tileH);
        ctxPuzzle.restore();

        // Draw outline
        ctxPuzzle.save();
        ctxPuzzle.beginPath();
        ctxPuzzle.moveTo(tile.x, tile.y);
        drawJigsawEdge(ctxPuzzle, tile.x, tile.y, tile.x + tileW, tile.y, 0, -1, tile.edges[0]);
        drawJigsawEdge(ctxPuzzle, tile.x + tileW, tile.y, tile.x + tileW, tile.y + tileH, 1, 0, tile.edges[1]);
        drawJigsawEdge(ctxPuzzle, tile.x + tileW, tile.y + tileH, tile.x, tile.y + tileH, 0, 1, tile.edges[2]);
        drawJigsawEdge(ctxPuzzle, tile.x, tile.y + tileH, tile.x, tile.y, -1, 0, tile.edges[3]);
        ctxPuzzle.closePath();

        if (strokeGlow) {
            ctxPuzzle.strokeStyle = '#00f0ff';
            ctxPuzzle.lineWidth = 3;
            ctxPuzzle.shadowColor = '#00f0ff';
            ctxPuzzle.shadowBlur = 10;
        } else {
            ctxPuzzle.strokeStyle = 'rgba(0, 240, 255, 0.4)';
            ctxPuzzle.lineWidth = 1.5;
        }
        ctxPuzzle.stroke();
        ctxPuzzle.restore();
    }

    function redrawCanvas() {
        ctxPuzzle.clearRect(0, 0, canvasPuzzle.width, canvasPuzzle.height);

        // 1. Faint guide image
        ctxPuzzle.save();
        ctxPuzzle.globalAlpha = 0.12;
        ctxPuzzle.drawImage(puzzleImg, boardX, boardY, boardW, boardH);
        ctxPuzzle.restore();

        // 2. Dashed lines
        ctxPuzzle.save();
        ctxPuzzle.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctxPuzzle.setLineDash([4, 4]);
        ctxPuzzle.lineWidth = 1;
        for (let c = 0; c <= 3; c++) {
            ctxPuzzle.beginPath();
            ctxPuzzle.moveTo(boardX + c * tileW, boardY);
            ctxPuzzle.lineTo(boardX + c * tileW, boardY + boardH);
            ctxPuzzle.stroke();
        }
        for (let r = 0; r <= 3; r++) {
            ctxPuzzle.beginPath();
            ctxPuzzle.moveTo(boardX, boardY + r * tileH);
            ctxPuzzle.lineTo(boardX + boardW, boardY + r * tileH);
            ctxPuzzle.stroke();
        }
        ctxPuzzle.restore();

        // 3. Target board border
        ctxPuzzle.save();
        ctxPuzzle.strokeStyle = 'rgba(0, 240, 255, 0.35)';
        ctxPuzzle.lineWidth = 3;
        ctxPuzzle.strokeRect(boardX, boardY, boardW, boardH);
        ctxPuzzle.restore();

        // 4. Snapped pieces
        const snappedTiles = puzzleTiles.filter(t => t.isSnapped);
        snappedTiles.forEach(tile => {
            drawJigsawPiece(tile, false);
        });

        // 5. Unsnapped pieces
        const unsnappedTiles = puzzleTiles.filter(t => !t.isSnapped);
        unsnappedTiles.forEach(tile => {
            drawJigsawPiece(tile, true);
        });
    }

    // Canvas Events
    canvasPuzzle.addEventListener('mousedown', onDragStart);
    canvasPuzzle.addEventListener('mousemove', onDragMove);
    canvasPuzzle.addEventListener('mouseup', onDragEnd);

    // Touch support
    canvasPuzzle.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            onDragStart(e.touches[0]);
        }
    });
    canvasPuzzle.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
            onDragMove(e.touches[0]);
        }
    });
    canvasPuzzle.addEventListener('touchend', onDragEnd);

    function onDragStart(e) {
        if (isPuzzleSolved) return;

        const rect = canvasPuzzle.getBoundingClientRect();
        const clientX = e.clientX || e.pageX;
        const clientY = e.clientY || e.pageY;
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;

        for (let i = puzzleTiles.length - 1; i >= 0; i--) {
            const tile = puzzleTiles[i];
            if (tile.isSnapped) continue;

            if (mouseX >= tile.x && mouseX <= tile.x + tileW &&
                mouseY >= tile.y && mouseY <= tile.y + tileH) {
                
                draggedTile = tile;
                dragOffsetX = mouseX - tile.x;
                dragOffsetY = mouseY - tile.y;

                puzzleTiles.splice(i, 1);
                puzzleTiles.push(tile);

                canvasPuzzle.style.cursor = 'grabbing';
                
                if (!puzzleStartTime) {
                    startPuzzleTimer();
                }
                break;
            }
        }
        redrawCanvas();
    }

    function onDragMove(e) {
        if (!draggedTile) return;

        const rect = canvasPuzzle.getBoundingClientRect();
        const clientX = e.clientX || e.pageX;
        const clientY = e.clientY || e.pageY;
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;

        draggedTile.x = mouseX - dragOffsetX;
        draggedTile.y = mouseY - dragOffsetY;

        redrawCanvas();
    }

    function onDragEnd() {
        if (!draggedTile) return;

        const dx = draggedTile.x - draggedTile.targetX;
        const dy = draggedTile.y - draggedTile.targetY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 24) {
            draggedTile.x = draggedTile.targetX;
            draggedTile.y = draggedTile.targetY;
            draggedTile.isSnapped = true;
            playSnapSound();
            
            puzzleMoves++;
            movesCountDisplay.innerText = puzzleMoves;
            checkPuzzleWin();
        } else {
            puzzleMoves++;
            movesCountDisplay.innerText = puzzleMoves;
        }

        draggedTile = null;
        canvasPuzzle.style.cursor = 'grab';
        redrawCanvas();
    }

    function playSnapSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(140, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(550, audioCtx.currentTime + 0.08);
            
            gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        } catch (e) {
            console.log("AudioContext blocked", e);
        }
    }

    function checkPuzzleWin() {
        const allSnapped = puzzleTiles.every(t => t.isSnapped);
        if (allSnapped) {
            triggerPuzzleWin();
        }
    }

    function triggerPuzzleWin() {
        isPuzzleSolved = true;
        clearInterval(puzzleTimerInterval);
        
        confetti({
            particleCount: 160,
            spread: 90,
            origin: { y: 0.6 }
        });

        const photoUrl = puzzleSelect.value;
        successMsg.innerText = puzzleSuccessMessages[photoUrl] || "A beautiful memory re-assembled perfectly!";
        
        setTimeout(() => {
            successCard.classList.remove('hidden');
        }, 500);
    }

    function solvePuzzleMagic() {
        puzzleTiles.forEach(tile => {
            tile.x = tile.targetX;
            tile.y = tile.targetY;
            tile.isSnapped = true;
        });
        playSnapSound();
        triggerPuzzleWin();
        redrawCanvas();
    }

    function startPuzzleTimer() {
        puzzleStartTime = Date.now();
        puzzleTimerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - puzzleStartTime) / 1000);
            const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
            const secs = String(elapsed % 60).padStart(2, '0');
            puzzleTimerDisplay.innerText = `${mins}:${secs}`;
        }, 1000);
    }

    // Trigger initial load
    loadPuzzleImage(puzzleSelect.value);

    // ==========================================================================
    // PHOTO GALLERY LIGHTBOX LOGIC
    // ==========================================================================
    const galleryCards = document.querySelectorAll('.gallery-card');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.getElementById('lightbox-close');

    galleryCards.forEach(card => {
        card.addEventListener('click', () => {
            const img = card.querySelector('img');
            const caption = card.getAttribute('data-caption');
            
            lightboxImg.src = img.src;
            lightboxCaption.innerText = caption;
            
            lightbox.classList.remove('hidden');
            void lightbox.offsetWidth;
            lightbox.classList.add('show');
        });
    });

    lightboxClose.addEventListener('click', closeLightbox);
    
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !lightbox.classList.contains('hidden')) {
            closeLightbox();
        }
    });

    function closeLightbox() {
        lightbox.classList.remove('show');
        setTimeout(() => {
            lightbox.classList.add('hidden');
        }, 400);
    }

    // ==========================================================================
    // LOVE COUPONS REDEMPTION LOGIC
    // ==========================================================================
    const couponRedeemButtons = document.querySelectorAll('.coupon-redeem-btn');

    couponRedeemButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.coupon-card');
            const stamp = card.querySelector('.coupon-stamp');
            
            // Show stamp
            stamp.classList.remove('hidden');
            
            // Disable button
            btn.disabled = true;
            btn.innerText = "Redeemed";
            btn.style.opacity = '0.5';

            // Confetti
            confetti({
                particleCount: 50,
                angle: 60,
                spread: 55,
                origin: { x: 0 }
            });
            confetti({
                particleCount: 50,
                angle: 120,
                spread: 55,
                origin: { x: 1 }
            });
            
            // Play quick click
            playSnapSound();
        });
    });

    // ==========================================================================
    // BUCKET LIST HEART INTERACTION LOGIC
    // ==========================================================================
    const bucketCheckboxes = document.querySelectorAll('.bucket-checkbox');

    bucketCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            if (cb.checked) {
                // Heart confetti spray
                confetti({
                    particleCount: 25,
                    angle: cb.getBoundingClientRect().left < window.innerWidth / 2 ? 60 : 120,
                    spread: 45,
                    colors: ['#ff3b70', '#ff7096', '#ffbe0b']
                });
                playSnapSound();
            }
        });
    });

    // ==========================================================================
    // NARRATIVE PROLOGUE TYPEWRITER LOGIC
    // ==========================================================================
    const prologueText = "This is a digital space dedicated to a love story that grows stronger second by second... A scrapbook of our shared smiles, virtual coupon dates, solved puzzle challenges, and dreams of the future. Are you ready to see our timeline?";
    let typewriterIndex = 0;
    const typewriterEl = document.getElementById('prologue-text');
    const startTimelineBtn = document.getElementById('prologue-start-btn');

    function startTypewriter() {
        typewriterIndex = 0;
        typewriterEl.innerHTML = "";
        startTimelineBtn.classList.add('hidden');
        typeNextChar();
    }

    function typeNextChar() {
        if (typewriterIndex < prologueText.length) {
            typewriterEl.innerHTML += prologueText.charAt(typewriterIndex);
            typewriterIndex++;
            setTimeout(typeNextChar, 40);
        } else {
            startTimelineBtn.classList.remove('hidden');
            startTimelineBtn.classList.add('animate-pop-in');
        }
    }

    startTimelineBtn.addEventListener('click', () => {
        navigateSlides(1);
    });

    // ==========================================================================
    // ROADMAP STEP DIRECT CLICK NAVIGATION
    // ==========================================================================
    const roadmapStepsNodes = document.querySelectorAll('.roadmap-step');
    roadmapStepsNodes.forEach((step, index) => {
        step.addEventListener('click', () => {
            slides[currentSlide].classList.remove('active-slide');
            currentSlide = index;
            slides[currentSlide].classList.add('active-slide');
            updateSlideNavigation();
            playSnapSound();
        });
    });

    // ==========================================================================
    // LOVE JAR NOTE DRAWER LOGIC
    // ==========================================================================
    const loveJarReasons = [
        "Your laugh is my absolute favorite sound in the entire universe.",
        "The way you hold my hand makes all my worries completely melt away.",
        "Your kind, gentle heart always inspires me to be a better person.",
        "How your eyes shine so brightly whenever you talk about things you love.",
        "Your warm, sweet presence that instantly makes any place feel like home.",
        "Your patience, understanding, and how you always know how to comfort me.",
        "Your goofy sense of humor that makes even the most ordinary days special.",
        "The beautiful way you care for and support the people around you.",
        "How you look at me with so much love, making me feel so incredibly lucky.",
        "Just being yourself, because you are the most beautiful person inside and out."
    ];

    let jarOpenedCount = 0;
    const jarTrigger = document.getElementById('love-jar-trigger');
    const noteCard = document.getElementById('drawn-note-card');
    const noteNumberLabel = document.getElementById('drawn-note-number');
    const noteTextLabel = document.getElementById('drawn-note-text');
    const noteProgressCountText = document.getElementById('notes-opened-count');
    const noteProgressBarFill = document.getElementById('jar-progress-fill-bar');

    jarTrigger.addEventListener('click', () => {
        // Unhide card and animate unfold
        noteCard.classList.remove('hidden');
        noteCard.classList.remove('animate-unfold');
        void noteCard.offsetWidth; // trigger reflow
        noteCard.classList.add('animate-unfold');

        // Pick next note
        const currentReasonText = loveJarReasons[jarOpenedCount % 10];
        noteNumberLabel.innerText = `Reason #${(jarOpenedCount % 10) + 1}`;
        noteTextLabel.innerText = `"${currentReasonText}"`;

        if (jarOpenedCount < 10) {
            jarOpenedCount++;
            noteProgressCountText.innerText = jarOpenedCount;
            noteProgressBarFill.style.width = `${(jarOpenedCount / 10) * 100}%`;

            if (jarOpenedCount === 10) {
                // Confetti blast on final reason
                confetti({
                    particleCount: 70,
                    spread: 80,
                    colors: ['#ff3b70', '#ffd166']
                });
            }
        } else {
            // Keep looping increment for text rotation
            jarOpenedCount++;
        }

        // Sound click
        playSnapSound();
    });

    // ==========================================================================
    // RELATIONSHIP TRIVIA QUIZ LOGIC
    // ==========================================================================
    const quizQuestions = [
        {
            question: "Which month is our special anniversary month?",
            options: ["April", "June", "July", "December"],
            correct: 2,
            feedback: "Correct! July 12th is the day we officially became partners."
        },
        {
            question: "What is my absolute favorite thing about you?",
            options: ["Your beautiful eyes", "Your sweet laughter", "Your kind heart", "All of the above!"],
            correct: 3,
            feedback: "Correct! Every single part of you is my absolute favorite."
        },
        {
            question: "How long do I want to love you?",
            options: ["For a few years", "As long as we are happy", "To infinity and beyond!", "Only on weekends"],
            correct: 2,
            feedback: "Correct! My love for you is endless, to infinity and beyond!"
        }
    ];

    let currentQuizIdx = 0;
    const quizBox = document.getElementById('quiz-box');
    const quizQuestionNumLabel = document.getElementById('quiz-question-num');
    const quizQuestionTextLabel = document.getElementById('quiz-question-text');
    const quizOptionsButtons = document.querySelectorAll('.quiz-opt-btn');
    const quizFeedbackPanel = document.getElementById('quiz-feedback');
    const quizFeedbackMsg = document.getElementById('quiz-feedback-msg');
    const quizNextBtn = document.getElementById('quiz-next-question-btn');
    const quizVictoryCard = document.getElementById('quiz-victory-card');
    const quizVictoryCloseBtn = document.getElementById('quiz-victory-close-btn');

    function loadQuizQuestion() {
        // Clear option classes and hide feedback
        quizOptionsButtons.forEach(btn => {
            btn.classList.remove('correct-opt', 'incorrect-opt');
            btn.disabled = false;
        });
        quizFeedbackPanel.classList.add('hidden');

        // Set text
        const q = quizQuestions[currentQuizIdx];
        quizQuestionNumLabel.innerText = currentQuizIdx + 1;
        quizQuestionTextLabel.innerText = q.question;
        
        quizOptionsButtons.forEach((btn, index) => {
            btn.innerText = q.options[index];
        });
    }

    quizOptionsButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const selectedIdx = Number(btn.getAttribute('data-opt'));
            const q = quizQuestions[currentQuizIdx];

            if (selectedIdx === q.correct) {
                // Correct answer
                btn.classList.add('correct-opt');
                // Disable all options
                quizOptionsButtons.forEach(b => b.disabled = true);
                // Show feedback
                quizFeedbackPanel.classList.remove('hidden');
                quizFeedbackMsg.innerText = q.feedback;
                // Soft click sound
                playSnapSound();
            } else {
                // Incorrect answer - shake and highlight
                btn.classList.add('incorrect-opt');
                quizBox.classList.remove('shake');
                void quizBox.offsetWidth; // trigger reflow
                quizBox.classList.add('shake');
                setTimeout(() => quizBox.classList.remove('shake'), 400);
            }
        });
    });

    quizNextBtn.addEventListener('click', () => {
        if (currentQuizIdx < quizQuestions.length - 1) {
            currentQuizIdx++;
            loadQuizQuestion();
        } else {
            // Quiz victory!
            quizBox.classList.add('hidden');
            quizVictoryCard.classList.remove('hidden');
            // Victory confetti
            confetti({
                particleCount: 80,
                spread: 100,
                colors: ['#ffd166', '#ffbe0b']
            });
            playSnapSound();
        }
    });

    quizVictoryCloseBtn.addEventListener('click', () => {
        // Advance to Slide 8 (Memory Match)
        navigateSlides(1);
    });

    // Load first question on script initialization
    loadQuizQuestion();

    // ==========================================================================
    // SLIDE 8: MEMORY MATCH GAME LOGIC
    // ==========================================================================
    const memoryCards = document.querySelectorAll('.memory-card');
    let hasFlippedCard = false;
    let lockBoard = false;
    let firstCard, secondCard;
    let matchedPairs = 0;

    function shuffleMemoryCards() {
        memoryCards.forEach(card => {
            let randomPos = Math.floor(Math.random() * 8);
            card.style.order = randomPos;
            card.classList.remove('flipped', 'matched');
            card.addEventListener('click', flipCard); // Re-bind clicks
        });
        matchedPairs = 0;
        document.getElementById('memory-victory').classList.add('hidden');
    }

    function flipCard() {
        if (lockBoard) return;
        if (this === firstCard) return;

        this.classList.add('flipped');
        playSnapSound();

        if (!hasFlippedCard) {
            hasFlippedCard = true;
            firstCard = this;
            return;
        }

        secondCard = this;
        checkForMatch();
    }

    function checkForMatch() {
        let isMatch = firstCard.dataset.card === secondCard.dataset.card;
        isMatch ? disableCards() : unflipCards();
    }

    function disableCards() {
        firstCard.removeEventListener('click', flipCard);
        secondCard.removeEventListener('click', flipCard);
        firstCard.classList.add('matched');
        secondCard.classList.add('matched');

        matchedPairs++;
        if (matchedPairs === 4) {
            // Game won!
            setTimeout(() => {
                document.getElementById('memory-victory').classList.remove('hidden');
                confetti({
                    particleCount: 50,
                    spread: 60,
                    colors: ['#2ecc71', '#a3e4d7']
                });
                playSnapSound();
            }, 500);
        }

        resetBoard();
    }

    function unflipCards() {
        lockBoard = true;
        setTimeout(() => {
            firstCard.classList.remove('flipped');
            secondCard.classList.remove('flipped');
            resetBoard();
        }, 1000);
    }

    function resetBoard() {
        [hasFlippedCard, lockBoard] = [false, false];
        [firstCard, secondCard] = [null, null];
    }

    // Bind initial listeners
    memoryCards.forEach(card => card.addEventListener('click', flipCard));
    
    // Shuffle on start
    shuffleMemoryCards();

    document.getElementById('memory-next-btn').addEventListener('click', () => {
        navigateSlides(1);
    });

    // ==========================================================================
    // SLIDE 9: WISH LANTERN SKY LOGIC
    // ==========================================================================
    const wishInput = document.getElementById('wish-text-input');
    const sendWishBtn = document.getElementById('send-wish-btn');
    const lanternsArea = document.getElementById('lanterns-area');
    const wishesBoardList = document.getElementById('wishes-board-list');

    function releaseLantern(text) {
        const lantern = document.createElement('div');
        lantern.className = 'wish-lantern';
        // Random horizontal start position
        lantern.style.left = Math.random() * 80 + 10 + '%';
        
        lanternsArea.appendChild(lantern);
        
        // Remove after floating away
        setTimeout(() => {
            lantern.remove();
        }, 12000);
        
        // Little burst of sparkles
        confetti({
            particleCount: 15,
            spread: 30,
            origin: { y: 0.8 }
        });
        
        playSnapSound();
        saveWish(text);
    }

    function saveWish(text) {
        let wishes = JSON.parse(localStorage.getItem('anniversary_wishes') || '[]');
        wishes.push(text);
        localStorage.setItem('anniversary_wishes', JSON.stringify(wishes));
        renderWishes();
    }

    function renderWishes() {
        let wishes = JSON.parse(localStorage.getItem('anniversary_wishes') || '[]');
        wishesBoardList.innerHTML = '';
        if (wishes.length === 0) {
            wishesBoardList.innerHTML = '<span class="empty-wish-msg">No wishes released yet. Release a lantern to write our history...</span>';
            return;
        }
        // Render in reverse so new wishes appear at the top
        wishes.slice().reverse().forEach(wish => {
            const row = document.createElement('div');
            row.className = 'wish-item-row';
            row.innerText = wish;
            wishesBoardList.appendChild(row);
        });
    }

    sendWishBtn.addEventListener('click', () => {
        const wishText = wishInput.value.trim();
        if (wishText) {
            releaseLantern(wishText);
            wishInput.value = '';
        }
    });

    wishInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const wishText = wishInput.value.trim();
            if (wishText) {
                releaseLantern(wishText);
                wishInput.value = '';
            }
        }
    });

    // Render initial wishes
    renderWishes();
});
