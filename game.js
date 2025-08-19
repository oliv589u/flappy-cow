let bird;
let pipes;
let pipeTimer;
let score = 0;
let scoreText;
let gameOver = false;

class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  preload() {
    // No assets needed here, you can add button images if you want
  }

  create() {
    const centerX = this.cameras.main.width / 2;

    this.add.text(centerX, 100, 'Flappy Game', { fontSize: '40px', fill: '#000' }).setOrigin(0.5);

    const playText = this.add.text(centerX, 250, '▶ Play', { fontSize: '32px', fill: '#00f' })
      .setOrigin(0.5)
      .setInteractive();

    const customizeText = this.add.text(centerX, 320, '🎨 Customize', { fontSize: '32px', fill: '#00f' })
      .setOrigin(0.5)
      .setInteractive();

    playText.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    customizeText.on('pointerdown', () => {
      this.scene.start('CustomizationScene');
    });
  }
}

class CustomizationScene extends Phaser.Scene {
  constructor() {
    super('CustomizationScene');
  }

  preload() {
    this.load.image('birdRed', 'bird_red.png');
    this.load.image('birdBlue', 'bird_blue.png');
  }

  create() {
    this.add.text(70, 50, 'Choose Your Bird', { fontSize: '32px', fill: '#000' });

    const redBird = this.add.image(120, 200, 'birdRed').setInteractive();
    const blueBird = this.add.image(280, 200, 'birdBlue').setInteractive();

    let selectionText = this.add.text(100, 350, '', { fontSize: '20px', fill: '#f00' });

    redBird.on('pointerdown', () => {
      this.registry.set('birdSkin', 'birdRed');
      selectionText.setText('Selected Red');
    });

    blueBird.on('pointerdown', () => {
      this.registry.set('birdSkin', 'birdBlue');
      selectionText.setText('Selected Blue');
      selectionText.setFill('#00f');
    });

    this.add.text(150, 500, '🔙 Back', { fontSize: '24px', fill: '#00f' })
      .setInteractive()
      .on('pointerdown', () => this.scene.start('MainMenuScene'));
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    this.load.image('bird', 'bird.png');       // default bird
    this.load.image('birdRed', 'bird_red.png'); 
    this.load.image('birdBlue', 'bird_blue.png');

    // Load background images for scrolling background
    this.load.image('bgSky', 'background_sky.png');
    this.load.image('bgGround', 'background_ground.png');
  }

  create() {
    gameOver = false;
    score = 0;

    // Create two copies of the sky background for seamless scrolling
    this.bgSky1 = this.add.image(0, 0, 'bgSky').setOrigin(0, 0);
    this.bgSky2 = this.add.image(this.bgSky1.width, 0, 'bgSky').setOrigin(0, 0);

    // Create two copies of the ground background for scrolling
    this.bgGround1 = this.add.image(0, 550, 'bgGround').setOrigin(0, 0);
    this.bgGround2 = this.add.image(this.bgGround1.width, 550, 'bgGround').setOrigin(0, 0);

    // Set background depths so they appear behind bird and pipes
    this.bgSky1.setDepth(-10);
    this.bgSky2.setDepth(-10);
    this.bgGround1.setDepth(-5);
    this.bgGround2.setDepth(-5);

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

    scoreText = this.add.text(10, 10, 'Score: 0', { fontSize: '32px', fill: '#000' });

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

    // Scroll background layers with different speeds for parallax effect
    const skySpeed = 1;
    const groundSpeed = 3;

    // Move sky backgrounds left
    this.bgSky1.x -= skySpeed;
    this.bgSky2.x -= skySpeed;
    if (this.bgSky1.x <= -this.bgSky1.width) {
      this.bgSky1.x = this.bgSky2.x + this.bgSky2.width;
    }
    if (this.bgSky2.x <= -this.bgSky2.width) {
      this.bgSky2.x = this.bgSky1.x + this.bgSky1.width;
    }

    // Move ground backgrounds left
    this.bgGround1.x -= groundSpeed;
    this.bgGround2.x -= groundSpeed;
    if (this.bgGround1.x <= -this.bgGround1.width) {
      this.bgGround1.x = this.bgGround2.x + this.bgGround2.width;
    }
    if (this.bgGround2.x <= -this.bgGround2.width) {
      this.bgGround2.x = this.bgGround1.x + this.bgGround1.width;
    }

    // Bird falls below bottom boundary
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
    scoreText.setText('Game Over! Final Score: ' + score + '\nPress Space or Click to Restart');

    pipes.getChildren().forEach(pipe => {
      pipe.setVelocityX(0);
    });

    this.physics.pause();

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.restart();
    });

    this.input.once('pointerdown', () => {
      this.scene.restart();
    });
  }
}

const config = {
  type: Phaser.AUTO,
  width: 400,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#fff',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1000 },
      debug: false
    }
  },
  scene: [MainMenuScene, CustomizationScene, GameScene]
};

const game = new Phaser.Game(config);
