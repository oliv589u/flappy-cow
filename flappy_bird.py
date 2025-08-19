import pygame
import random
import sys

# Initialize pygame
pygame.init()

# Screen dimensions
WIDTH, HEIGHT = 400, 600
SCREEN = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Flappy Bird")

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
GREEN = (0, 200, 0)
YELLOW = (255, 255, 0)
RED = (255, 0, 0)

# Bird properties
BIRD_SIZE = 30
GRAVITY = 0.5
LIFT = -10

# Pipe properties
PIPE_WIDTH = 60
PIPE_GAP = 150
PIPE_SPEED = 3

FONT = pygame.font.SysFont(None, 36)

clock = pygame.time.Clock()

class Bird:
    def __init__(self):
        self.x = 50
        self.y = HEIGHT // 2
        self.velocity = 0

    def update(self):
        self.velocity += GRAVITY
        self.y += self.velocity
        if self.y < 0:
            self.y = 0

    def flap(self):
        self.velocity = LIFT

    def draw(self):
        pygame.draw.rect(SCREEN, YELLOW, (self.x, int(self.y), BIRD_SIZE, BIRD_SIZE))

    def get_rect(self):
        return pygame.Rect(self.x, int(self.y), BIRD_SIZE, BIRD_SIZE)

class Pipe:
    def __init__(self):
        self.x = WIDTH
        self.height = random.randint(50, HEIGHT - PIPE_GAP - 50)

    def update(self):
        self.x -= PIPE_SPEED

    def draw(self):
        # Top pipe
        pygame.draw.rect(SCREEN, GREEN, (self.x, 0, PIPE_WIDTH, self.height))
        # Bottom pipe
        bottom_y = self.height + PIPE_GAP
        pygame.draw.rect(SCREEN, GREEN, (self.x, bottom_y, PIPE_WIDTH, HEIGHT - bottom_y))

    def get_top_rect(self):
        return pygame.Rect(self.x, 0, PIPE_WIDTH, self.height)

    def get_bottom_rect(self):
        bottom_y = self.height + PIPE_GAP
        return pygame.Rect(self.x, bottom_y, PIPE_WIDTH, HEIGHT - bottom_y)

def draw_text(text, x, y, color=BLACK):
    img = FONT.render(text, True, color)
    SCREEN.blit(img, (x, y))

def main():
    bird = Bird()
    pipes = []
    frame_count = 0
    score = 0
    game_over = False

    while True:
        clock.tick(60)
        SCREEN.fill(WHITE)

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if (event.type == pygame.KEYDOWN and event.key == pygame.K_SPACE) and not game_over:
                bird.flap()
            if event.type == pygame.KEYDOWN and event.key == pygame.K_r and game_over:
                # Restart game
                bird = Bird()
                pipes.clear()
                score = 0
                frame_count = 0
                game_over = False

        if not game_over:
            bird.update()

            if frame_count % 90 == 0:
                pipes.append(Pipe())

            for pipe in pipes:
                pipe.update()
                pipe.draw()

                # Collision detection
                if bird.get_rect().colliderect(pipe.get_top_rect()) or bird.get_rect().colliderect(pipe.get_bottom_rect()):
                    game_over = True

                # Scoring
                if pipe.x + PIPE_WIDTH < bird.x and not hasattr(pipe, 'passed'):
                    score += 1
                    pipe.passed = True

            # Remove pipes off screen
            pipes = [pipe for pipe in pipes if pipe.x + PIPE_WIDTH > 0]

            # Check ground and ceiling collision
            if bird.y + BIRD_SIZE > HEIGHT:
                game_over = True

            bird.draw()
            draw_text(f"Score: {score}", 10, 10)

        else:
            draw_text("Game Over! Press R to restart", WIDTH // 4, HEIGHT // 2, RED)
            draw_text(f"Final Score: {score}", WIDTH // 3, HEIGHT // 2 + 40)

        pygame.display.update()
        frame_count += 1

if __name__ == "__main__":
    main()
