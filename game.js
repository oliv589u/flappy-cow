/* global Phaser */

// Simple per-skin hitbox configs
const HITBOXES = {
  birdRed:   { w: 28, h: 20, ox: 6,  oy: 7 },
  birdBlue:  { w: 28, h: 20, ox: 6,  oy: 7 }
};

class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenuScene'); }

  create() {
    // ✅ Set default skin if not selected
    if (!this.registry.get('birdSkin')) {
      this.registry.set('birdSkin', 'birdBlue');
    }

    const cx = this.cameras.main.width / 2;

    this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x87ceeb).setOrigin(0, 0);

    const titleStyle = {
      fontSize: '48px', fontWeight: 'bold', fill: '#fff', stroke: '#000', strokeThickness: 6,
      shadow: { offsetX: 3, offsetY: 3, color: '#333', blur: 5, stroke: true, fill: true }
    };
    this.add.text(cx, 100, 'Flappy Game', titleStyle).setOrigin(0.5);

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

    // ✅ Use a safe default skin
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

  endGame() {
    gameOver = true;
    this.physics.pause();
    pipeTimer.remove();

    const overlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.5).setOrigin(0, 0);
    overlay.setDepth(99);

    const gameOverText = this.add.text(200, 200, 'Game Over!\nScore: ' + score, {
      fontSize: '48px', fontWeight: 'bold', fill: '#fff', stroke: '#000', strokeThickness: 6, align: 'center'
    }).setOrigin(0.5).setDepth(100);

    const btnStyle = {
      fontSize: '32px', fill: '#fff', backgroundColor: '#28a745', padding: { x: 20, y: 10 },
      stroke: '#155724', strokeThickness: 4
    };

    const continueBtn = this.add.text(200, 350, 'Continue', btnStyle).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(100);
    continueBtn.on('pointerover', () => continueBtn.setStyle({ backgroundColor: '#218838' }));
    continueBtn.on('pointerout',  () => continueBtn.setStyle({ backgroundColor: '#28a745' }));
    continueBtn.on('pointerdown', () => this.scene.restart());

    const menuBtn = this.add.text(200, 420, 'Main Menu', btnStyle).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(100);
    menuBtn.on('pointerover', () => menuBtn.setStyle({ backgroundColor: '#218838' }));
    menuBtn.on('pointerout',  () => menuBtn.setStyle({ backgroundColor: '#28a745' }));
    menuBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));
  }
}

class CustomizationScene extends Phaser.Scene {
  constructor() { super('CustomizationScene'); }

  preload() {
    this.load.image('birdRed', 'bird_red.png');
    this.load.image('birdBlue', 'bird_blue.png');
  }

  create() {
    // ✅ Default skin fallback
    if (!this.registry.get('birdSkin')) {
      this.registry.set('birdSkin', 'birdBlue');
    }

    this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x87ceeb).setOrigin(0, 0);
    this.add.text(200, 50, 'Choose Your Bird', {
      fontSize: '32px', fill: '#000'
    }).setOrigin(0.5);

    const skins = ['birdRed', 'birdBlue'];
    const selectedSkin = this.registry.get('birdSkin') || 'birdBlue';
    const spacing = 120;

    skins.forEach((skin, index) => {
      const x = 80 + index * spacing;
      const sprite = this.add.image(x, 200, skin).setScale(2).setInteractive({ useHandCursor: true });

      if (skin === selectedSkin) {
        sprite.selectedBorder = this.add.rectangle(x, 200, sprite.width * 2 + 10, sprite.height * 2 + 10)
          .setStrokeStyle(4, 0xffff00)
          .setOrigin(0.5);
      }

      sprite.on('pointerdown', () => {
        this.children.list.forEach(child => {
          if (child.selectedBorder) child.selectedBorder.destroy();
        });

        sprite.selectedBorder = this.add.rectangle(x, 200, sprite.width * 2 + 10, sprite.height * 2 + 10)
          .setStrokeStyle(4, 0xffff00)
          .setOrigin(0.5);

        this.registry.set('birdSkin', skin);
      });
    });

    const backBtn = this.add.text(200, 500, '← Back to Menu', {
      fontSize: '24px',
      fill: '#fff',
      backgroundColor: '#007bff',
      padding: { x: 20, y: 10 },
      stroke: '#0056b3',
      strokeThickness: 3
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => backBtn.setStyle({ backgroundColor: '#0056b3' }));
    backBtn.on('pointerout', () => backBtn.setStyle({ backgroundColor: '#007bff' }));
    backBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));
  }
}

// Globals
let gameOver = false;
let score = 0;
let bird;
let pipes;
let scoreText;
let pipeTimer;

// Game Config
const config = {
  type: Phaser.AUTO,
  width: 400,
  height: 600,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1000 },
      debug: false
    }
  },
  scene: [MainMenuScene, GameScene, CustomizationScene]
};

new Phaser.Game(config);
