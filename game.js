/* global Phaser */

const HITBOXES = {
  birdRed:   { w: 28, h: 20, ox: 6,  oy: 7 },
  birdBlue:  { w: 28, h: 20, ox: 6,  oy: 7 }
};

class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenuScene'); }

  create() {
    if (!this.registry.get('birdSkin')) {
      this.registry.set('birdSkin', 'birdBlue');
    }

    const cx = this.cameras.main.width / 2;

    this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x87ceeb).setOrigin(0, 0);

    const titleStyle = {
      fontSize: '48px', fontWeight: 'bold', fill: '#fff', stroke: '#000', strokeThickness: 6,
      shadow: { offsetX: 3, offsetY: 3, color: '#333', blur: 5, stroke: true, fill: true }
    };
    this.add.text(cx, 100, 'Flappy Cow', titleStyle).setOrigin(0.5);

    const btnStyle = {
      fontSize: '36px', fill: '#fff', backgroundColor: '#28a745', padding: { x: 25, y: 12 },
      stroke: '#155724', strokeThickness: 4
    };

    const playText = this.add.text(cx, 250, '▶ Play', btnStyle).setOrigin(0.5).setInteractive({ useHandCursor: true });
    playText.on('pointerover', () => playText.setStyle({ backgroundColor: '#218838' }));
    playText.on('pointerout',  () => playText.setStyle({ backgroundColor: '#28a745' }));
    playText.on('pointerdown', () => this.scene.start('GameScene'));

    const customizeText = this.add.text(cx, 320, '🎨 Customize', btnStyle).setOrigin(0.5).setInteractive({ useHandCursor: true });
    customizeText.on('pointerover', () => customizeText.setStyle({ backgroundColor: '#0069d9' }));
    customizeText.on('pointerout',  () => customizeText.setStyle({ backgroundColor: '#28a745' }));
    customizeText.on('pointerdown', () => this.scene.start('CustomizationScene'));

    const leaderboardText = this.add.text(cx, 390, '🏆 Leaderboard', btnStyle).setOrigin(0.5).setInteractive({ useHandCursor: true });
    leaderboardText.on('pointerover', () => leaderboardText.setStyle({ backgroundColor: '#ffc107' }));
    leaderboardText.on('pointerout', () => leaderboardText.setStyle({ backgroundColor: '#28a745' }));
    leaderboardText.on('pointerdown', () => this.scene.start('LeaderboardScene'));
  }
}

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
    scoreText.setDepth(100);

    pipeTimer = this.time.addEvent({ delay: 1500, callback: this.addPipes, callbackScope: this, loop: true });

    this.input.keyboard.on('keydown-W', this.flap, this);
    this.input.keyboard.on('keydown-SPACE', this.flap, this);
    this.input.keyboard.on('keydown-UP', this.flap, this);
    this.input.on('pointerdown', this.flap, this);

    this.physics.add.overlap(bird, pipes, this.hitPipe, null, this);

    this.input.keyboard.on('keydown-P', () => {
      const dbg = this.physics.world.drawDebug;
      this.physics.world.drawDebug = !dbg;
      this.physics.world.debugGraphic.clear();
    });
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
    const minHeight = 50;
    const maxHeight = 600 - gap - 50;
    const pipeHeight = Phaser.Math.Between(minHeight, maxHeight);

    const topPipe = pipes.create(400, 0, 'pipe');
    topPipe.setOrigin(0, 0);
    topPipe.setDisplaySize(60, pipeHeight);
    topPipe.body.setAllowGravity(false);
    topPipe.setImmovable(true);
    topPipe.setVelocityX(-200);
    topPipe.scored = false;

    const bottomPipe = pipes.create(400, pipeHeight + gap, 'pipe');
    bottomPipe.setOrigin(0, 0);
    bottomPipe.setDisplaySize(60, 600 - (pipeHeight + gap));
    bottomPipe.body.setAllowGravity(false);
    bottomPipe.setImmovable(true);
    bottomPipe.setVelocityX(-200);
    bottomPipe.scored = false;
  }

  hitPipe() {
    if (!gameOver) this.endGame();
  }

  async endGame() {
    gameOver = true;
    this.physics.pause();
    pipeTimer.remove();

    let playerName = prompt("Enter your name:", "Player");
    if (!playerName) playerName = "Player";

    try {
      await fetch('https://flappy-leaderboard-backend.onrender.com/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, score })
      });
    } catch (err) {
      console.warn('Failed to submit score', err);
    }

    const overlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.5).setOrigin(0, 0);
    overlay.setDepth(99);

    const gameOverText = this.add.text(this.cameras.main.width / 2, 200, 'Game Over!\nScore: ' + score, {
      fontSize: '48px', fontWeight: 'bold', fill: '#fff', stroke: '#000', strokeThickness: 6, align: 'center'
    }).setOrigin(0.5).setDepth(100);

    const btnStyle = {
      fontSize: '32px', fill: '#fff', backgroundColor: '#28a745', padding: { x: 20, y: 10 },
      stroke: '#155724', strokeThickness: 4
    };

    const continueBtn = this.add.text(this.cameras.main.width / 2, 350, 'Continue', btnStyle).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(100);
    continueBtn.on('pointerover', () => continueBtn.setStyle({ backgroundColor: '#218838' }));
    continueBtn.on('pointerout',  () => continueBtn.setStyle({ backgroundColor: '#28a745' }));
    continueBtn.on('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });

    const leaderboardBtn = this.add.text(this.cameras.main.width / 2, 420, 'View Leaderboard', btnStyle).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(100);
    leaderboardBtn.on('pointerover', () => leaderboardBtn.setStyle({ backgroundColor: '#ffc107', fill: '#000' }));
    leaderboardBtn.on('pointerout',  () => leaderboardBtn.setStyle({ backgroundColor: '#28a745', fill: '#fff' }));
    leaderboardBtn.on('pointerdown', () => {
      this.scene.start('LeaderboardScene');
    });
  }
}

class CustomizationScene extends Phaser.Scene {
  constructor() { super('CustomizationScene'); }

  create() {
    this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x87ceeb).setOrigin(0, 0);

    this.add.text(this.cameras.main.width / 2, 80, 'Customize Your Bird', {
      fontSize: '48px', fontWeight: 'bold', fill: '#fff', stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5);

    const skins = ['birdBlue', 'birdRed'];
    const cx = this.cameras.main.width / 2;

    skins.forEach((skin, i) => {
      const img = this.add.image(cx - 100 + i * 200, 300, skin).setScale(2).setInteractive({ useHandCursor: true });
      img.on('pointerdown', () => {
        this.registry.set('birdSkin', skin);
        alert(`Selected skin: ${skin}`);
      });
    });

    const backText = this.add.text(cx, 500, '⬅ Back to Menu', {
      fontSize: '36px', fill: '#fff', backgroundColor: '#28a745',
      padding: { x: 20, y: 10 }, stroke: '#155724', strokeThickness: 4
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backText.on('pointerdown', () => this.scene.start('MainMenuScene'));
    backText.on('pointerover', () => backText.setStyle({ backgroundColor: '#218838' }));
    backText.on('pointerout', () => backText.setStyle({ backgroundColor: '#28a745' }));
  }
}

class LeaderboardScene extends Phaser.Scene {
  constructor() { super('LeaderboardScene'); }

  async create() {
    this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x87ceeb).setOrigin(0, 0);

    this.add.text(this.cameras.main.width / 2, 60, 'Leaderboard', {
      fontSize: '48px', fontWeight: 'bold', fill: '#fff', stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5);

    const cx = this.cameras.main.width / 2;

    try {
      const response = await fetch('https://flappy-leaderboard-backend.onrender.com/scores');
      const scores = await response.json();

      scores.sort((a, b) => b.score - a.score);
      const topScores = scores.slice(0, 10);

      topScores.forEach((entry, i) => {
        this.add.text(cx, 140 + i * 40, `${i + 1}. ${entry.name} - ${entry.score}`, {
          fontSize: '32px', fill: '#fff', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5);
      });
    } catch (err) {
      this.add.text(cx, 140, 'Failed to load leaderboard', {
        fontSize: '32px', fill: '#f00'
      }).setOrigin(0.5);
    }

    const backText = this.add.text(cx, 550, '⬅ Back to Menu', {
      fontSize: '36px', fill: '#fff', backgroundColor: '#28a745',
      padding: { x: 20, y: 10 }, stroke: '#155724', strokeThickness: 4
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backText.on('pointerdown', () => this.scene.start('MainMenuScene'));
    backText.on('pointerover', () => backText.setStyle({ backgroundColor: '#218838' }));
    backText.on('pointerout', () => backText.setStyle({ backgroundColor: '#28a745' }));
  }
}

const config = {
  type: Phaser.AUTO,
  width: 400,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: [MainMenuScene, GameScene, CustomizationScene, LeaderboardScene]
};

let game = new Phaser.Game(config);

let bird;
let pipes;
let pipeTimer;
let score = 0;
let scoreText;
let gameOver = false;
