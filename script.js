
"use strict";

/* =========================
   CANVAS
========================= */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

/* =========================
   GAME SETTINGS
========================= */

const GAME = {
    gravity: 1400,
    flapPower: -500,
    pipeSpeed: 230,
    pipeGap: 180,
    pipeWidth: 70,
    pipeDistance: 280,
    groundHeight: 55
};

let width = 480;
let height = 700;

function resizeCanvas() {
    const box = canvas.parentElement;

    width = box.clientWidth;
    height = box.clientHeight;

    canvas.width = width;
    canvas.height = height;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* =========================
   GAME VARIABLES
========================= */

let running = false;
let gameOver = false;

let score = 0;
let highScore =
    Number(localStorage.getItem("flappyHighScore")) || 0;

let pipes = [];
let lastTime = 0;
let groundOffset = 0;

let theme =
    localStorage.getItem("flappyTheme") || "day";

let customBackground =
    localStorage.getItem("flappyBackground") || null;

/* =========================
   BIRD
========================= */

const bird = {
    x: width * 0.25,
    y: height * 0.45,
    radius: 18,
    velocity: 0,
    rotation: 0,

    reset() {
        this.x = width * 0.25;
        this.y = height * 0.45;
        this.velocity = 0;
        this.rotation = 0;
    },

    flap() {
        if (!running) return;

        this.velocity = GAME.flapPower;
    },

    update(dt) {
        this.velocity += GAME.gravity * dt;
        this.y += this.velocity * dt;

        this.rotation =
            Math.max(
                -0.5,
                Math.min(1.1, this.velocity / 650)
            );
    },

    draw() {
        ctx.save();

        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        /* Body */
        const body = ctx.createLinearGradient(
            -20,
            -20,
            20,
            20
        );

        body.addColorStop(0, "#ffe066");
        body.addColorStop(1, "#f59f00");

        ctx.fillStyle = body;

        ctx.beginPath();
        ctx.arc(
            0,
            0,
            this.radius,
            0,
            Math.PI * 2
        );
        ctx.fill();

        /* Wing */
        ctx.fillStyle = "#ffb703";

        ctx.beginPath();
        ctx.ellipse(
            -7,
            7,
            12,
            7,
            -0.3,
            0,
            Math.PI * 2
        );
        ctx.fill();

        /* Eye */
        ctx.fillStyle = "white";

        ctx.beginPath();
        ctx.arc(7, -7, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#111";

        ctx.beginPath();
        ctx.arc(9, -7, 2.5, 0, Math.PI * 2);
        ctx.fill();

        /* Beak */
        ctx.fillStyle = "#f76707";

        ctx.beginPath();
        ctx.moveTo(14, -2);
        ctx.lineTo(30, 5);
        ctx.lineTo(14, 10);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
};

/* =========================
   PIPE
========================= */

function createPipe(x) {
    const minTop = 80;

    const maxTop =
        height -
        GAME.groundHeight -
        GAME.pipeGap -
        100;

    const top =
        minTop +
        Math.random() *
        Math.max(20, maxTop - minTop);

    return {
        x: x,
        width: GAME.pipeWidth,
        top: top,
        passed: false
    };
}

function spawnPipes() {
    pipes = [];

    let x = width + 100;

    for (let i = 0; i < 4; i++) {
        pipes.push(createPipe(x));
        x += GAME.pipeDistance;
    }
}

function updatePipes(dt) {
    for (const pipe of pipes) {
        pipe.x -= GAME.pipeSpeed * dt;
    }

    if (
        pipes.length &&
        pipes[0].x + pipes[0].width < 0
    ) {
        pipes.shift();

        const last =
            pipes[pipes.length - 1];

        pipes.push(
            createPipe(
                last.x + GAME.pipeDistance
            )
        );
    }

    for (const pipe of pipes) {
        if (
            !pipe.passed &&
            pipe.x + pipe.width < bird.x
        ) {
            pipe.passed = true;
            score++;

            /* Increase difficulty */
            if (score % 5 === 0) {
                GAME.pipeSpeed += 8;
            }
        }
    }
}

function drawPipe(pipe) {
    const bottom =
        pipe.top + GAME.pipeGap;

    const gradient =
        ctx.createLinearGradient(
            pipe.x,
            0,
            pipe.x + pipe.width,
            0
        );

    gradient.addColorStop(
        0,
        "#1864ab"
    );

    gradient.addColorStop(
        0.5,
        "#339af0"
    );

    gradient.addColorStop(
        1,
        "#1864ab"
    );

    ctx.fillStyle = gradient;

    /* Top pipe */
    ctx.fillRect(
        pipe.x,
        0,
        pipe.width,
        pipe.top
    );

    /* Bottom pipe */
    ctx.fillRect(
        pipe.x,
        bottom,
        pipe.width,
        height -
            GAME.groundHeight -
            bottom
    );

    /* Pipe caps */
    ctx.fillStyle = "#145a96";

    ctx.fillRect(
        pipe.x - 6,
        pipe.top - 22,
        pipe.width + 12,
        22
    );

    ctx.fillRect(
        pipe.x - 6,
        bottom,
        pipe.width + 12,
        22
    );
}

/* =========================
   COLLISION
========================= */

function checkCollision() {
    const ground =
        height - GAME.groundHeight;

    /* Ceiling */
    if (
        bird.y - bird.radius <= 0
    ) {
        return true;
    }

    /* Ground */
    if (
        bird.y + bird.radius >= ground
    ) {
        return true;
    }

    /* Pipes */
    for (const pipe of pipes) {
        const birdLeft =
            bird.x - bird.radius;

        const birdRight =
            bird.x + bird.radius;

        const birdTop =
            bird.y - bird.radius;

        const birdBottom =
            bird.y + bird.radius;

        const pipeLeft =
            pipe.x - 5;

        const pipeRight =
            pipe.x +
            pipe.width +
            5;

        const horizontal =
            birdRight > pipeLeft &&
            birdLeft < pipeRight;

        if (!horizontal) continue;

        const hitsTop =
            birdTop < pipe.top;

        const hitsBottom =
            birdBottom >
            pipe.top + GAME.pipeGap;

        if (hitsTop || hitsBottom) {
            return true;
        }
    }

    return false;
}

/* =========================
   BACKGROUND
========================= */

function drawBackground() {

    /* Custom image */
    if (customBackground) {
        ctx.drawImage(
            customBackground,
            0,
            0,
            width,
            height
        );

        return;
    }

    let top;
    let bottom;

    if (theme === "sunset") {

        top = "#ff6b6b";
        bottom = "#ffd166";

    } else if (theme === "night") {

        top = "#111827";
        bottom = "#334155";

    } else {

        top = "#4dabf7";
        bottom = "#d0f4ff";
    }

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            height
        );

    gradient.addColorStop(
        0,
        top
    );

    gradient.addColorStop(
        1,
        bottom
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        width,
        height
    );

    /* Clouds */
    if (theme !== "night") {
        drawCloud(
            width * 0.2,
            120,
            40
        );

        drawCloud(
            width * 0.75,
            210,
            30
        );
    }

    /* Mountains */
    drawMountains();
}

function drawCloud(x, y, size) {

    ctx.fillStyle =
        "rgba(255,255,255,0.7)";

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        size,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + size * 0.8,
        y + 5,
        size * 0.7,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x - size * 0.8,
        y + 8,
        size * 0.6,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

function drawMountains() {

    const ground =
        height - GAME.groundHeight;

    ctx.fillStyle =
        "rgba(40,60,90,0.25)";

    ctx.beginPath();

    ctx.moveTo(
        0,
        ground
    );

    ctx.lineTo(
        width * 0.25,
        ground - 120
    );

    ctx.lineTo(
        width * 0.45,
        ground
    );

    ctx.lineTo(
        width * 0.65,
        ground - 150
    );

    ctx.lineTo(
        width,
        ground
    );

    ctx.closePath();

    ctx.fill();
}

/* =========================
   GROUND
========================= */

function drawGround(dt) {

    const ground =
        height - GAME.groundHeight;

    groundOffset +=
        GAME.pipeSpeed * dt;

    ctx.fillStyle = "#74b816";

    ctx.fillRect(
        0,
        ground,
        width,
        GAME.groundHeight
    );

    ctx.fillStyle = "#a9e34b";

    ctx.fillRect(
        0,
        ground,
        width,
        8
    );

    /* Moving pattern */
    ctx.fillStyle =
        "rgba(255,255,255,0.15)";

    const offset =
        -(groundOffset % 40);

    for (
        let x = offset;
        x < width + 40;
        x += 40
    ) {
        ctx.fillRect(
            x,
            ground + 17,
            20,
            5
        );
    }
}

/* =========================
   SCORE
========================= */

function drawScore() {

    ctx.save();

    ctx.textAlign = "center";

    ctx.font =
        "bold 42px Arial";

    ctx.lineWidth = 5;

    ctx.strokeStyle =
        "rgba(0,0,0,0.4)";

    ctx.fillStyle = "white";

    ctx.strokeText(
        score,
        width / 2,
        65
    );

    ctx.fillText(
        score,
        width / 2,
        65
    );

    ctx.restore();
}

/* =========================
   GAME START
========================= */

function startGame() {

    score = 0;

    GAME.pipeSpeed = 230;

    running = true;
    gameOver = false;

    bird.reset();

    spawnPipes();

    const menu =
        document.getElementById("menu");

    const over =
        document.getElementById("gameOver");

    if (menu) {
        menu.style.display = "none";
    }

    if (over) {
        over.style.display = "none";
    }
}

/* =========================
   GAME OVER
========================= */

function endGame() {

    if (!running) return;

    running = false;
    gameOver = true;

    if (score > highScore) {

        highScore = score;

        localStorage.setItem(
            "flappyHighScore",
            highScore
        );
    }

    const text =
        document.getElementById("scoreText");

    if (text) {

        text.textContent =
            `Score: ${score} • Best: ${highScore}`;
    }

    const over =
        document.getElementById("gameOver");

    if (over) {
        over.style.display = "flex";
    }
}

/* =========================
   GAME UPDATE
========================= */

function update(dt) {

    bird.update(dt);

    updatePipes(dt);

    if (checkCollision()) {
        endGame();
    }
}

/* =========================
   GAME DRAW
========================= */

function draw(dt) {

    ctx.clearRect(
        0,
        0,
        width,
        height
    );

    drawBackground();

    for (const pipe of pipes) {
        drawPipe(pipe);
    }

    drawGround(dt);

    bird.draw();

    if (running) {
        drawScore();
    }
}

/* =========================
   GAME LOOP
========================= */

function loop(timestamp) {

    if (!lastTime) {
        lastTime = timestamp;
    }

    let dt =
        (timestamp - lastTime) / 1000;

    lastTime = timestamp;

    /* Prevent huge jumps */
    dt = Math.min(dt, 0.033);

    if (running) {
        update(dt);
    }

    draw(dt);

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

/* =========================
   PLAY BUTTON
========================= */

const playBtn =
    document.getElementById("playBtn");

if (playBtn) {

    playBtn.addEventListener(
        "click",
        startGame
    );
}

/* =========================
   RESTART BUTTON
========================= */

const restartBtn =
    document.getElementById("restartBtn");

if (restartBtn) {

    restartBtn.addEventListener(
        "click",
        startGame
    );
}

/* =========================
   KEYBOARD
========================= */

window.addEventListener(
    "keydown",
    function (event) {

        if (
            event.code === "Space" ||
            event.code === "ArrowUp"
        ) {

            event.preventDefault();

            if (running) {
                bird.flap();
            }
        }
    }
);

/* =========================
   MOUSE
========================= */

canvas.addEventListener(
    "mousedown",
    function () {

        if (running) {
            bird.flap();
        }
    }
);

/* =========================
   TOUCH
========================= */

canvas.addEventListener(
    "touchstart",
    function (event) {

        event.preventDefault();

        if (running) {
            bird.flap();
        }
    },
    { passive: false }
);

/* =========================
   THEMES
========================= */

function setTheme(newTheme) {

    theme = newTheme;

    localStorage.setItem(
        "flappyTheme",
        newTheme
    );

    customBackground = null;

    localStorage.removeItem(
        "flappyBackground"
    );
}

const dayBtn =
    document.getElementById("dayTheme");

const sunsetBtn =
    document.getElementById("sunsetTheme");

const nightBtn =
    document.getElementById("nightTheme");

if (dayBtn) {
    dayBtn.addEventListener(
        "click",
        () => setTheme("day")
    );
}

if (sunsetBtn) {
    sunsetBtn.addEventListener(
        "click",
        () => setTheme("sunset")
    );
}

if (nightBtn) {
    nightBtn.addEventListener(
        "click",
        () => setTheme("night")
    );
}

/* =========================
   BACKGROUND UPLOAD
========================= */

const upload =
    document.getElementById(
        "backgroundUpload"
    );

if (upload) {

    upload.addEventListener(
        "change",
        function (event) {

            const file =
                event.target.files[0];

            if (!file) return;

            if (!file.type.startsWith("image/")) {

                alert(
                    "Please select an image."
                );

                return;
            }

            const reader =
                new FileReader();

            reader.onload = function () {

                const image =
                    new Image();

                image.onload = function () {

                    customBackground =
                        image;

                    theme = "custom";

                    try {

                        localStorage.setItem(
                            "flappyBackground",
                            image.src
                        );

                        localStorage.setItem(
                            "flappyTheme",
                            "custom"
                        );

                    } catch (error) {

                        console.warn(
                            "Background is too large to save."
                        );
                    }
                };

                image.src =
                    reader.result;
            };

            reader.readAsDataURL(file);
        }
    );
}

/* =========================
   LOAD SAVED BACKGROUND
========================= */

if (customBackground) {

    const image =
        new Image();

    image.onload = function () {
        customBackground = image;
    };

    image.src =
        customBackground;
}

/* =========================
   PREVENT PAGE SCROLLING
   WHILE PLAYING
========================= */

document.addEventListener(
    "touchmove",
    function (event) {

        if (running) {
            event.preventDefault();
        }

    },
    { passive: false }
);
