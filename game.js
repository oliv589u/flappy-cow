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
  bird.body.setSize(60, 40);
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
}

function update() {
  if (gameOver) return;

  if (bird.y > 600) {
    endGame.call(this);
  }

  pipes.getChildren().forEach(pipe => {
    if (!pipe.scored && pipe.x + pipe.displayWidth < bird.x) {
      score += 0.5; // Each pipe counts for 0.5, pair adds to 1
      scoreText.setText('Score: ' + Math.floor(score));
      pipe.scored = true;
    }

    if (pipe.x < -pipe.displayWidth) {
      pipe.destroy();
    }
  });
}

function flap() {
  if (gameOver) return;
  bird.setVelocityY(-500);
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
    endGame.call(this);
  }
}

function endGame() {
  gameOver = true;
  scoreText.setText('Game Over! Final Score: ' + Math.floor(score) + '\nPress Space or Click to Restart');

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
