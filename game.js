class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    const centerX = this.cameras.main.width / 2;

    // Sky background only
    this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x87ceeb).setOrigin(0, 0);

    const titleStyle = {
      fontSize: '48px',
      fontWeight: 'bold',
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 6,
      shadow: { offsetX: 3, offsetY: 3, color: '#333', blur: 5, stroke: true, fill: true }
    };

    this.add.text(centerX, 100, 'Flappy Game', titleStyle).setOrigin(0.5);

    const btnStyle = {
      fontSize: '36px',
      fill: '#fff',
      backgroundColor: '#28a745',
      padding: { x: 25, y: 12 },
      stroke: '#155724',
      strokeThickness: 4
    };

    const playText = this.add.text(centerX, 250, '▶ Play', btnStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    playText.on('pointerover', () => playText.setStyle({ backgroundColor: '#218838' }));
    playText.on('pointerout', () => playText.setStyle({ backgroundColor: '#28a745' }));
    playText.on('pointerdown', () => this.scene.start('GameScene'));
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    this.load.image('bird', 'bird.png');
    this.load.image('birdRed', 'bird_red.png'); 
    this.load.image('birdBlue', 'bird_blue.png');
    this.load.image('bgSky', 'background_sky.png');
  }

  create() {
    gameOver = false;
    score = 0;

    // Sky background only
    this.bgSky1 = this.add.image(0, 0, 'bgSky').setOrigin(0, 0);
    this.bgSky2 = this.add.image(this.bgSky1.width, 0, 'bgSky').setOrigin(0, 0);

    if (this.bgSky1.width > this.cameras.main.width) {
      const scaleX = this.cameras.main.width / this.bgSky1.width;
      const scaleY = this.cameras.main.height / this.bgSky1.height;
      const scale = Math.min(scaleX, scaleY);
      this.bgSky1.setScale(scale);
      this.bgSky2.setScale(scale);
    }
    this.bgSky2.x = this.bgSky1.x + this.bgSky1.displayWidth;

    // Generate pipe texture programmatically
    const graphics = this.add.graphics();
    graphics.fillStyle(0x008000, 1);
    graphics.fillRect(0, 0, 60, 400);
    graphics.generateTexture('pipe', 60, 400);
    graphics.destroy();

    const selectedSkin = this.registry.get('birdSkin') || 'bird';
    bird = this.physics.add.sprite(50, 300, selectedSkin);
    bird.setOrigin(0, 0);
    bird.body.setSize(bird.width, bird.height);
    bird.setCollideWorldBounds(true);

    pipes = this.physics.add.group();

    scoreText = this.add.text(10, 10, 'Score: 0', { 
      fontSize: '40px', 
      fontWeight: 'bold', 
      fill: '#ff0', 
      stroke: '#000', 
      strokeThickness: 6 
    });
    scoreText.setDepth(100); // always in front

    pipeTimer = this.time.addEvent({
      delay: 1500,
      callback: this.addPipes,
      callbackScope: this,
      loop: true
    });

    this.input.keyboard.on('keydown-W', this.flap, this);
    this.input.on('pointerdown', this.flap, this);

    this.physics.add.overlap(bird, pipes, this.hitPipe, null, this);
  }

  update() {
    if (gameOver) return;

    // Scroll sky backgrounds
    const scrollSpeed = 1;
    this.bgSky1.x -= scrollSpeed;
    this.bgSky2.x -= scrollSpeed;

    if (this.bgSky1.x <= -this.bgSky1.displayWidth) {
      this.bgSky1.x = this.bgSky2.x + this.bgSky2.displayWidth;
    }
    if (this.bgSky2.x <= -this.bgSky2.displayWidth) {
      this.bgSky2.x = this.bgSky1.x + this.bgSky1.displayWidth;
    }

    if (bird.y > 600) {
      this.endGame();
    }

    pipes.getChildren().forEach(pipe => {
      if (!pipe.scored && pipe.x + pipe.displayWidth < bird.x && pipe.y === 0) {
        score++;
        scoreText.setText('Score: ' + score);
        pipe.scored = true;
      }
      if (pipe.x < -pipe.displayWidth) {
        pipe.destroy();
      }
    });
  }

  flap() {
    if (gameOver) return;
    bird.setVelocityY(-400);
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
    if (!gameOver) {
      this.endGame();
    }
  }

  endGame() {
    gameOver = true;
    this.physics.pause();
    pipeTimer.remove();

    // Overlay
    const overlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.5).setOrigin(0, 0);
    overlay.setDepth(99);

    const gameOverText = this.add.text(200, 200, 'Game Over!\nScore: ' + score, {
      fontSize: '48px',
      fontWeight: 'bold',
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 6,
      align: 'center'
    }).setOrigin(0.5);
    gameOverText.setDepth(100);

    // Buttons
    const btnStyle = {
      fontSize: '32px',
      fill: '#fff',
      backgroundColor: '#28a745',
      padding: { x: 20, y: 10 },
      stroke: '#155724',
      strokeThickness: 4
    };

    const continueBtn = this.add.text(200, 350, 'Continue', btnStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(100);
    continueBtn.on('pointerover', () => continueBtn.setStyle({ backgroundColor: '#218838' }));
    continueBtn.on('pointerout', () => continueBtn.setStyle({ backgroundColor: '#28a745' }));
    continueBtn.on('pointerdown', () => {
      this.scene.restart();
    });

    const menuBtn = this.add.text(200, 420, 'Main Menu', btnStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(100);
    menuBtn.on('pointerover', () => menuBtn.setStyle({ backgroundColor: '#218838' }));
    menuBtn.on('pointerout', () => menuBtn.setStyle({ backgroundColor: '#28a745' }));
    menuBtn.on('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });
  }
}

// Globals and Phaser config
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
  scene: [MainMenuScene, GameScene]
};

new Phaser.Game(config);
