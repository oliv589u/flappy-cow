/* global Phaser */

// Simple per-skin hitbox configs
const HITBOXES = {
  birdRed:   { w: 28, h: 20, ox: 6,  oy: 7 },
  birdBlue:  { w: 28, h: 20, ox: 6,  oy: 7 }
};

// ===== Main Menu Scene =====
class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenuScene'); }

  create() {
    if (!this.registry.get('birdSkin')) this.registry.set('birdSkin', 'birdBlue');

    const cx = this.cameras.main.width / 2;

    this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x87ceeb).setOrigin(0, 0);

    this.add.text(cx, 100, 'Flappy Cow', {
      fontSize: '48px', fontWeight: 'bold', fill: '#fff', stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5);

    const btnStyle = {
      fontSize: '36px', fill: '#fff', backgroundColor: '#28a745', padding: { x: 25, y: 12 },
      stroke: '#155724', strokeThickness: 4
    };

    const playBtn = this.add.text(cx, 250, '▶ Play', btnStyle).setOrigin(0.5).setInteractive();
    playBtn.on('pointerdown', () => this.scene.start('GameScene'));

    const customizeBtn = this.add.text(cx, 320, '🎨 Customize', btnStyle).setOrigin(0.5).setInteractive();
    customizeBtn.on('pointerdown', () => this.scene.start('CustomizationScene'));

    const leaderboardBtn = this.add.text(cx, 390, '🏆 Leaderboard', btnStyle).setOrigin(0.5).setInteractive();
    leaderboardBtn.on('pointerdown', () => this.scene.start('LeaderboardScene'));
  }
}

// ===== Game Scene =====
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  preload() {
    this.load.image('birdRed', 'bird_red.png');
    this.load.image('birdBlue', 'bird_blue.png');
    this.load.image('bgSky', 'background_sky.png');
  }

  create() {
    gameOver = false;
    score = 0;

    this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x87ceeb).setOrigin(0, 0);

    this.bgSky1 = this.add.image(0, 0, 'bgSky').setOrigin(0, 0);
    this.bgSky2 = this.add.image(this.bgSky1.width, 0, 'bgSky').setOrigin(0, 0);

    const scaleX = this.cameras.main.width / this.bgSky1.width;
    const scaleY = this.cameras.main.height / this.bgSky1.height;
    const scale = Math.max(scaleX, scaleY);
    this.bgSky1.setScale(scale);
    this.bgSky2.setScale(scale);
    this.bgSky2.x = this.bgSky1.x + this.bgSky1.displayWidth;

    const g = this.add.graphics();
    g.fillStyle(0x008000, 1);
    g.fillRect(0, 0, 60, 400);
    g.generateTexture('pipe', 60, 400);
    g.destroy();

    const selectedSkin = this.registry.get('birdSkin') || 'birdBlue';
    bird = this.physics.add.sprite(50, 300, selectedSkin);
    bird.setOrigin(0, 0);

    const hb = HITBOXES[selectedSkin] || { w: bird.width, h: bird.height, ox: 0, oy: 0 };
    bird.body.setSize(hb.w, hb.h);
    bird.body.setOffset(hb.ox, hb.oy);
    bird.setCollideWorldBounds(true);

    pipes = this.physics.add.group();

    scoreText = this.add.text(10, 10, 'Score: 0', {
      fontSize: '40px', fontWeight: 'bold', fill: '#ff0', stroke: '#000', strokeThickness: 6
    });

    pipeTimer = this.time.addEvent({ delay: 1500, callback: this.addPipes, callbackScope: this, loop: true });

    this.input.keyboard.on('keydown-W', this.flap, this);
    this.input.keyboard.on('keydown-SPACE', this.flap, this);
    this.input.keyboard.on('keydown-UP', this.flap, this);
    this.input.on('pointerdown', this.flap, this);

    this.physics.add.overlap(bird, pipes, this.hitPipe, null, this);
  }

  update() {
    if (gameOver) return;

    const scrollSpeed = 1;
    this.bgSky1.x -= scrollSpeed;
    this.bgSky2.x -= scrollSpeed;

    if (this.bgSky1.x <= -this.bgSky1.displayWidth) this.bgSky1.x = this.bgSky2.x + this.bgSky2.displayWidth;
    if (this.bgSky2.x <= -this.bgSky2.displayWidth) this.bgSky2.x = this.bgSky1.x + this.bgSky1.displayWidth;

    if (bird.y > 600) this.endGame();

    pipes.getChildren().forEach(pipe => {
      if (!pipe.scored && pipe.x + pipe.displayWidth < bird.x && pipe.y === 0) {
        score++;
        scoreText.setText('Score: ' + score);
        pipe.scored = true;
      }
      if (pipe.x < -pipe.displayWidth) pipe.destroy();
    });
  }

  flap() {
    if (!gameOver) bird.setVelocityY(-400);
  }

  addPipes() {
    const gap = 150;
    const pipeHeight = Phaser.Math.Between(50, 400);

    const topPipe = pipes.create(400, 0, 'pipe').setOrigin(0, 0).setDisplaySize(60, pipeHeight);
    topPipe.body.setAllowGravity(false).setImmovable(true).setVelocityX(-200);
    topPipe.scored = false;

    const bottomPipe = pipes.create(400, pipeHeight + gap, 'pipe').setOrigin(0, 0)
      .setDisplaySize(60, 600 - (pipeHeight + gap));
    bottomPipe.body.setAllowGravity(false).setImmovable(true).setVelocityX(-200);
    bottomPipe.scored = false;
  }

  hitPipe() {
    if (!gameOver) this.endGame();
  }

  endGame() {
    gameOver = true;
    this.physics.pause();
    pipeTimer.remove();

    const overlay = this.add.rectangle(0, 0, 400, 600, 0x000000, 0.5).setOrigin(0, 0).setDepth(99);
    const gameOverText = this.add.text(200, 150, `Game Over!\nScore: ${score}`, {
      fontSize: '40px', fill: '#fff', align: 'center', stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5).setDepth(100);

    const name = prompt('Enter your name for the leaderboard:') || 'Anonymous';
    saveScore(name, score); // ✅ Save to localStorage

    const retryBtn = this.add.text(200, 300, 'Retry', {
      fontSize: '28px', fill: '#fff', backgroundColor: '#28a745',
      padding: { x: 20, y: 10 }, stroke: '#155724', strokeThickness: 3
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(100);
    retryBtn.on('pointerdown', () => this.scene.restart());

    const menuBtn = this.add.text(200, 370, 'Main Menu', {
      fontSize: '28px', fill: '#fff', backgroundColor: '#007bff',
      padding: { x: 20, y: 10 }, stroke: '#0056b3', strokeThickness: 3
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(100);
    menuBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));
  }
}

// ===== Leaderboard Scene =====
class LeaderboardScene extends Phaser.Scene {
  constructor() { super('LeaderboardScene'); }

  create() {
    const cx = this.cameras.main.width / 2;

    this.add.rectangle(0, 0, 400, 600, 0x333333).setOrigin(0, 0);

    this.add.text(cx, 60, '🏆 Leaderboard', {
      fontSize: '48px', fill: '#fff', stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5);

    const scores = JSON.parse(localStorage.getItem('flappyScores') || '[]');
    scores.forEach((entry, i) => {
      this.add.text(cx, 130 + i * 40, `${i + 1}. ${entry.name} - ${entry.score}`, {
        fontSize: '28px', fill: '#fff'
      }).setOrigin(0.5);
    });

    const backBtn = this.add.text(cx, 540, '← Back', {
      fontSize: '28px', fill: '#fff', backgroundColor: '#007bff',
      padding: { x: 20, y: 10 }, stroke: '#0056b3', strokeThickness: 3
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));
  }
}

// ===== Customization Scene =====
class CustomizationScene extends Phaser.Scene {
  constructor() { super('CustomizationScene'); }

  preload() {
    this.load.image('birdRed', 'bird_red.png');
    this.load.image('birdBlue', 'bird_blue.png');
  }

  create() {
    if (!this.registry.get('birdSkin')) this.registry.set('birdSkin', 'birdBlue');

    this.add.rectangle(0, 0, 400, 600, 0x87ceeb).setOrigin(0, 0);
    this.add.text(200, 50, 'Choose Your Bird', {
      fontSize: '32px', fill: '#000'
    }).setOrigin(0.5);

    const skins = ['birdRed', 'birdBlue'];
    const selectedSkin = this.registry.get('birdSkin') || 'birdBlue';
    const spacing = 120;

    skins.forEach((skin, index) => {
      const x = 80 + index * spacing;
      const sprite = this.add.image(x, 200, skin).setScale(2).setInteractive();

      if (skin === selectedSkin) {
        sprite.selectedBorder = this.add.rectangle(x, 200, sprite.width * 2 + 10, sprite.height * 2 + 10)
          .setStrokeStyle(4, 0xffff00).setOrigin(0.5);
      }

      sprite.on('pointerdown', () => {
        this.children.list.forEach(child => {
          if (child.selectedBorder) child.selectedBorder.destroy();
        });

        sprite.selectedBorder = this.add.rectangle(x, 200, sprite.width * 2 + 10, sprite.height * 2 + 10)
          .setStrokeStyle(4, 0xffff00).setOrigin(0.5);

        this.registry.set('birdSkin', skin);
      });
    });

    const backBtn = this.add.text(200, 500, '← Back to Menu', {
      fontSize: '24px', fill: '#fff', backgroundColor: '#007bff',
      padding: { x: 20, y: 10 }, stroke: '#0056b3', strokeThickness: 3
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));
  }
}

// ===== Leaderboard Logic =====
function saveScore(name, score) {
  const existing = JSON.parse(localStorage.getItem('flappyScores') || '[]');
  existing.push({ name, score });
  existing.sort((a, b) => b.score - a.score);
  localStorage.setItem('flappyScores', JSON.stringify(existing.slice(0, 10)));
}

// ===== Game Setup =====
let gameOver = false;
let score = 0;
let bird;
let pipes;
let scoreText;
let pipeTimer;

const config = {
  type: Phaser.AUTO,
  width: 400,
  height: 600,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 1000 }, debug: false }
  },
  scene: [MainMenuScene, GameScene, CustomizationScene, LeaderboardScene]
};

new Phaser.Game(config);
