class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  preload() {
    // Optionally load button or background images here
  }

  create() {
    const centerX = this.cameras.main.width / 2;

    // Add colorful background rectangle
    this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x87ceeb).setOrigin(0, 0); // light sky blue

    // Title with gradient text style
    const titleStyle = {
      fontSize: '48px',
      fontWeight: 'bold',
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 4,
      shadow: { offsetX: 2, offsetY: 2, color: '#333', blur: 3, stroke: true, fill: true }
    };

    this.add.text(centerX, 100, 'Flappy Game', titleStyle).setOrigin(0.5);

    // Play button style
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

    // Customize button style
    const customizeText = this.add.text(centerX, 320, '🎨 Customize', btnStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    customizeText.on('pointerover', () => customizeText.setStyle({ backgroundColor: '#0069d9' }));
    customizeText.on('pointerout', () => customizeText.setStyle({ backgroundColor: '#28a745' }));

    customizeText.on('pointerdown', () => {
      this.scene.start('CustomizationScene');
    });
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
    this.load.image('bgSky', 'background_sky.png');     // add your sky image here
    this.load.image('bgGround', 'background_ground.png'); // ground image
  }

  create() {
    gameOver = false;
    score = 0;

    // Create sky backgrounds with adjusted size
    this.bgSky1 = this.add.image(0, 0, 'bgSky').setOrigin(0, 0);
    this.bgSky2 = this.add.image(this.bgSky1.width, 0, 'bgSky').setOrigin(0, 0);

    // Resize bgSky if too big for canvas (assume original might be bigger)
    if (this.bgSky1.width > this.cameras.main.width) {
      const scaleX = this.cameras.main.width / this.bgSky1.width;
      const scaleY = this.cameras.main.height / this.bgSky1.height;
      const scale = Math.min(scaleX, scaleY);
      this.bgSky1.setScale(scale);
      this.bgSky2.setScale(scale);
    }

    // Adjust position of bgSky2 after scaling
    this.bgSky2.x = this.bgSky1.x + this.bgSky1.displayWidth;

    // Ground backgrounds at bottom (y=550), scaled if needed
    this.bgGround1 = this.add.image(0, 550, 'bgGround').setOrigin(0, 0);
    this.bgGround2 = this.add.image(this.bgGround1.width, 550, 'bgGround').setOrigin(0, 0);

    // If ground image wider than game width, scale to fit
    if (this.bgGround1.width > this.cameras.main.width) {
      const scale = this.cameras.main.width / this.bgGround1.width;
      this.bgGround1.setScale(scale);
      this.bgGround2.setScale(scale);
      this.bgGround2.x = this.bgGround1.x + this.bgGround1.displayWidth;
    }

    // Set depth behind bird and pipes
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

    const scrollSpeed = 1;

    // Scroll sky backgrounds left
    this.bgSky1.x -= scrollSpeed;
    this.bgSky2.x -= scrollSpeed;

    // Reset for infinite loop
    if (this.bgSky1.x <= -this.bgSky1.displayWidth) {
      this.bgSky1.x = this.bgSky2.x + this.bgSky2.displayWidth;
    }
    if (this.bgSky2.x <= -this.bgSky2.displayWidth) {
      this.bgSky2.x = this.bgSky1.x + this.bgSky1.displayWidth;
    }

    // Scroll ground faster for parallax
    const groundScrollSpeed = 3;
    this.bgGround1.x -= groundScrollSpeed;
    this.bgGround2.x -= groundScrollSpeed;

    if (this.bgGround1.x <= -this.bgGround1.displayWidth) {
      this.bgGround1.x = this.bgGround2.x + this.bgGround2.displayWidth;
    }
    if (this.bgGround2.x <= -this.bgGround2.displayWidth) {
      this.bgGround2.x = this.bgGround1.x + this.bgGround1.displayWidth;
    }

    // Your existing update logic for bird & pipes
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
