let gameOver = false;
let score = 0;
let bird;
let pipes;
let scoreText;
let pipeTimer;

class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  preload() {
    // Load assets here if any for menu
  }

  create() {
    const centerX = this.cameras.main.width / 2;

    this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x87ceeb).setOrigin(0);

    const titleStyle = {
      fontSize: '48px',
      fontWeight: 'bold',
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 4,
      shadow: { offsetX: 2, offsetY: 2, color: '#333', blur: 3, stroke: true, fill: true }
    };
    this.add.text(centerX, 100, 'Flappy Game', titleStyle).setOrigin(0.5);

    const btnStyle = {
      fontSize: '36px',
      fill: '#fff',
      backgroundColor: '#28a745',
      padding: { x: 20, y: 10 },
      stroke: '#155724',
      strokeThickness: 3,
      shadow: { offsetX: 1, offsetY: 1, color: '#155724', blur: 2, stroke: true, fill: true }
    };

    const playText = this.add.text(centerX, 250, '▶ Play', btnStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    playText.on('pointerover', () => playText.setStyle({ backgroundColor: '#218838' }));
    playText.on('pointerout', () => playText.setStyle({ backgroundColor: '#28a745' }));

    playText.on('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    this.load.image('bird', 'bird_red.png');
    this.load.image('bgSky', 'background_sky.png');
    this.load.image('bgGround', 'background_ground.png');
  }

  create() {
    gameOver = false;
    score = 0;

    // Background layers
    this.bgSky1 = this.add.image(0, 0, 'bgSky').setOrigin(0);
    this.bgSky2 = this.add.image(this.bgSky1.width, 0, 'bgSky').setOrigin(0);

    this.bgGround1 = this.add.image(0, 550, 'bgGround').setOrigin(0);
    this.bgGround2 = this.add.image(this.bgGround1.width, 550, 'bgGround').setOrigin(0);

    // Add score text FIRST so it's behind pipes
    scoreText = this.add.text(10, 10, 'Score: 0', { fontSize: '32px', fill: '#000' });

    // Pipe graphics
    const graphics = this.add.graphics();
    graphics.fillStyle(0x008000, 1);
    graphics.fillRect(0, 0, 60, 400);
    graphics.generateTexture('pipe', 60, 400);
    graphics.destroy();

    bird = this.physics.add.sprite(50, 300, 'bird').setOrigin(0, 0);
    bird.body.setSize(bird.width, bird.height);
    bird.setCollideWorldBounds(true);

    pipes = this.physics.add.group();

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

    // Sky scrolling
    const scrollSpeed = 1;
    this.bgSky1.x -= scrollSpeed;
    this.bgSky2.x -= scrollSpeed;

    if (this.bgSky1.x <= -this.bgSky1.displayWidth) {
      this.bgSky1.x = this.bgSky2.x + this.bgSky2.displayWidth;
    }
    if (this.bgSky2.x <= -this.bgSky2.displayWidth) {
      this.bgSky2.x = this.bgSky1.x + this.bgSky1.displayWidth;
    }

    // Ground scrolling
    const groundScrollSpeed = 3;
    this.bgGround1.x -= groundScrollSpeed;
    this.bgGround2.x -= groundScrollSpeed;

    if (this.bgGround1.x <= -this.bgGround1.displayWidth) {
      this.bgGround1.x = this.bgGround2.x + this.bgGround2.displayWidth;
    }
    if (this.bgGround2.x <= -this.bgGround2.displayWidth) {
      this.bgGround2.x = this.bgGround1.x + this.bgGround1.displayWidth;
    }

    // Bird out of bounds
    if (bird.y > this.scale.height) {
      this.endGame();
    }

    // Pipe logic
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
    const maxHeight = this.scale.height - gap - 50;
    const pipeHeight = Phaser.Math.Between(minHeight, maxHeight);

    const topPipe = pipes.create(this.scale.width, 0, 'pipe').setOrigin(0, 0);
    topPipe.setDisplaySize(60, pipeHeight);
    topPipe.body.setAllowGravity(false);
    topPipe.setImmovable(true);
    topPipe.setVelocityX(-200);
    topPipe.scored = false;

    const bottomPipe = pipes.create(this.scale.width, pipeHeight + gap, 'pipe').setOrigin(0, 0);
    bottomPipe.setDisplaySize(60, this.scale.height - (pipeHeight + gap));
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
    scoreText.setText('Game Over! Final Score: ' + score + '\nPress Space or Click to Restart');

    pipes.getChildren().forEach(pipe => pipe.setVelocityX(0));
    this.physics.pause();

    this.input.keyboard.once('keydown-SPACE', () => this.scene.restart());
    this.input.once('pointerdown', () => this.scene.restart());
  }
}

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false
    }
  },
  scene: [MainMenuScene, GameScene]
};

const game = new Phaser.Game(config);
