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
  scene: {
    preload,
    create,
    update
  }
};

let bird;
let pipes;
let pipeTimer;
let score = 0;
let scoreText;
let gameOver = false;

const game = new Phaser.Game(config);

function preload() {
  console.log('preload running');
  this.load.image('bird', 'bird.png');
}

function create() {
  console.log('create running');

  // Generate pipe texture programmatically
  const graphics = this.add.graphics();
  graphics.fillStyle(0x008000, 1);
  graphics.fillRect(0, 0, 60, 400);
  graphics.generateTexture('pipe', 60, 400);
  graphics.destroy();

  bird = this.physics.add.sprite(50, 300, 'bird');
  bird.setOrigin(0, 0);
  bird.body.setSize(bird.width, bird.height);
  bird.setCollideWorldBounds(true);

  pipes = this.physics.add.group();

  scoreText = this.add.text(10, 10, 'Score: 0', { fontSize: '32px', fill: '#000' });

  pipeTimer = this.time.addEvent({
    delay: 1500,
    callback: addPipes,
    callbackScope: this,
    loop: true
  });

  this.input.keyboard.on('keydown-SPACE', flap, this);
  this.input.on('pointerdown', flap, this);

  this.physics.add.overlap(bird, pipes, hitPipe, null, this);

  gameOver = false;
  score = 0;

  // Reset bird rotation on restart
  bird.setAngle(0);
}

function update() {
  if (gameOver) return;

  if (bird.y > 600) {
    endGame.call(this);
  }

  pipes.getChildren().forEach(pipe => {
    // Only count score once per pipe pair (top pipes have originY=0)
    if (!pipe.scored && pipe.x + pipe.displayWidth < bird.x && pipe.originY === 0) {
      score++;
      scoreText.setText('Score: ' + score);
      pipe.scored = true;

      // Mark the bottom pipe in the pair as scored too to avoid double counting
      const bottomPipe = pipes.getChildren().find(p => p.x === pipe.x && p.originY !== 0);
      if (bottomPipe) bottomPipe.scored = true;
    }

    if (pipe.x < -pipe.displayWidth) {
      pipe.destroy();
    }
  });

  // Rotate bird slowly downwards (max 20 degrees)
  if (bird.angle < 20) {
    bird.setAngle(bird.angle + 1);
  }
}

function flap() {
  if (gameOver) return;
  bird.setVelocityY(-500);
  bird.setAngle(-20);
}

function addPipes() {
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

function hitPipe() {
  if (!gameOver) {
