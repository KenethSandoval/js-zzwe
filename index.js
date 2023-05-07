function lerp(a, b, t) {
  return a + (b - a) * t;
}

class Color {
  constructor(r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  toRgba() {
    return `rgba(${this.r * 255}, ${this.g * 255}, ${this.b * 255}, ${this.a * 255})`;
  }

  withAlpha(a) {
    return new Color(this.r, this.g, this.b, a);
  }

  grayScale(t = 1.0) {
    let x = (this.r + this.g + this.b) / 3;
    return new Color(
      lerp(this.r,x, t),
      lerp(this.g, x, t), 
      lerp(this.b, x, t), 
      this.a);
  }

  static hex(hexcolor) {
    let matches =
      hexcolor.match(/#([0-9a-z]{2})([0-9a-z]{2})([0-9a-z]{2})/i);
    if (matches) {
      let [, r, g, b] = matches;
      return new Color(parseInt(r, 16) / 255.0,
        parseInt(g, 16) / 255.0,
        parseInt(b, 16) / 255.0,
        1.0);
    } else {
      throw `Could not parse ${hexcolor} as color`;
    }
  }
}

class V2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(that) {
    return new V2(this.x + that.x, this.y + that.y);
  }

  sub(that) {
    return new V2(this.x - that.x, this.y - that.y);
  }

  scale(s) {
    return new V2(this.x * s, this.y * s);
  }

  len() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize() {
    const n = this.len();
    return new V2(this.x / n, this.y / n);
  }

  dist(that) {
    return this.sub(that).len();
  }

  static polarV2(mag, dir) {
    return new V2(Math.cos(dir) * mag, Math.sin(dir) * mag);
  }
}

class Camera {
  pos = new V2(0.0, 0.0);
  vel = new V2(0.0, 0.0);
  grayness = 0.0;

  constructor(context) {
    this.context = context;
  }

  update(dt) {
    this.pos = this.pos.add(this.vel.scale(dt));
  }

  width() {
    return this.context.canvas.width;
  }

  height() {
    return this.context.canvas.height;
  }

  toScreen(point) {
    const width = this.context.canvas.width;
    const height = this.context.canvas.height;
    return point.sub(this.pos).add(new V2(width / 2, height / 2));
  }

  clear() {
    const width = this.context.canvas.width;
    const height = this.context.canvas.height;
    this.context.clearRect(0,0, width, height);
  }

  fillCircle(center, radius, color) {
    let screenCenter = this.toScreen(center);

    this.context.fillStyle = color.grayScale(this.grayness).toRgba();
    this.context.beginPath();
    this.context.arc(screenCenter.x, screenCenter.y, radius, 0, 2 * Math.PI, false);
    this.context.fill();
  }

  fillRect(x, y, w, h, color) {
    let screenPos = new V2(x, y).sub(this.pos);

   this.context.fillStyle = color.grayScale(this.grayness).toRgba();
   this.context.fillRect(screenPos.x, screenPos.y, w, h);
  }

  fillMessage(text, color) {
    const width = this.context.canvas.width;
    const height = this.context.canvas.height;
  
    this.context.fillStyle = color.toRgba();
    this.context.font = "30px LexendMega"
    this.context.textAlign = "center";
    this.context.fillText(text, width / 2, height / 2);
  }

}

const PLAYER_RADIUS = 69;
const PLAYER_COLOR = Color.hex("#f43841");
const PLAYER_SPEED = 1000;
const PLAYER_MAX_HEALTH = 100;
const HEALTH_BAR_HEIGHT = 10;
const TUTORIAL_POPUP_SPEED = 1.7;
const BULLET_SPEED = 2000;
const BULLET_RADIUS = 42;
const BULLET_LIFETIME = 5.0;
const ENEMY_SPEED = PLAYER_SPEED / 3;
const ENEMY_SPAWN_COOLDOWN = 1.0;
const ENEMY_SPAWN_DISTANCE = 1500.0;
const ENEMY_COLOR = Color.hex("#9e95c7");
const ENEMY_RADIUS = PLAYER_RADIUS;
const ENEMY_KILL_SCORE = 100;
const ENEMY_DAMAGE = PLAYER_MAX_HEALTH / 5;
const ENEMY_KILL_HEAL = PLAYER_MAX_HEALTH / 10;
const PARTICLE_COUNT = 50;
const PARTICLE_MAG = BULLET_SPEED;
const PARTICLE_LIFETIME = 1.0;
const PARTICLE_RADIUS = 10.0;
const MESSAGE_COLOR = Color.hex("#ffffff");

const directionMap = {
  's': new V2(0, 1.0),
  'w': new V2(0, -1.0),
  'a': new V2(-1.0, 0),
  'd': new V2(1.0, 0)
};

class Particle {
  constructor(pos, vel, lifetime, radius, color) {
    this.pos = pos;
    this.vel = vel;
    this.lifetime = lifetime;
    this.radius = radius
    this.color = color;
  }

  render(camera) {
    const a = this.lifetime / PARTICLE_LIFETIME;
    camera.fillCircle(this.pos, this.radius, this.color.withAlpha(a));
  }

  update(dt) {
    this.pos = this.pos.add(this.vel.scale(dt));
    this.lifetime -= dt;
  }
}

function particleBurs(particle, center, color) {
  const N = Math.random() * PARTICLE_COUNT;
  for (let i = 0; i < N; ++i) {
    particle.push(new Particle(
      center,
      V2.polarV2(Math.random() * PARTICLE_MAG, Math.random() * 2 * Math.PI),
      Math.random() * PARTICLE_LIFETIME,
      Math.random() * PARTICLE_RADIUS + 10.0, color));
  }
}

class Enemy {
  constructor(pos) {
    this.pos = pos;
    this.ded = false;
  }

  update(dt, followPos) {
    let vel = followPos.sub(this.pos).normalize().scale(ENEMY_SPEED * dt);
    this.pos = this.pos.add(vel);
  }

  render(camera) {
    camera.fillCircle(this.pos, ENEMY_RADIUS, ENEMY_COLOR);
  }
}

class Popup {
  constructor(text) {
    this.alpha = 0.0;
    this.dalpha = 0.0;
    this.text = text;
    this.onFadeOut = undefined;
    this.onFadeIn = undefined;
  }

  update(dt) {
    this.alpha += this.dalpha * dt;

    if (this.dalpha < 0.0 && this.alpha <= 0.0) {
      this.dalpha = 0.0;
      this.alpha = 0.0;

      this.onFadeOut?.();

    } else if (this.dalpha > 0.0 && this.alpha >= 1.0) {
      this.dalpha = 0.0;
      this.alpha = 1.0;

      this.onFadeIn?.();
    }
  }

  render(camera) {
    camera.fillMessage(this.text, MESSAGE_COLOR.withAlpha(this.alpha));
  }

  fadeIn() {
    this.dalpha = TUTORIAL_POPUP_SPEED;
  }

  fadeOut() {
    this.dalpha = -TUTORIAL_POPUP_SPEED;
  }
}

class Bullet {
  constructor(pos, vel) {
    this.pos = pos;
    this.vel = vel;
    this.lifetime = BULLET_LIFETIME;
  }

  update(dt) {
    this.pos = this.pos.add(this.vel.scale(dt));
    this.lifetime -= dt;
  }

  render(camera) {
    camera.fillCircle(this.pos, BULLET_RADIUS, PLAYER_COLOR);
  }
}

const TutorialState = Object.freeze({
  "LearningMovement": 0,
  "LearningShooting": 1,
  "Finished": 2,
});

const tutorialMessage = Object.freeze([
  "WASD to move",
  "Left mouse click to shoot",
  ""
])

class Tutorial {
  constructor() {
    this.state = 0;
    this.popup = new Popup(tutorialMessage[this.state]);
    this.popup.fadeIn();
    this.popup.onFadeOut = () => {
      this.popup.text = tutorialMessage[this.state];
      this.popup.fadeIn();
    };
  }

  update(dt) {
    this.popup.update(dt);
  }

  render(camera) {
    this.popup.render(camera)
  }

  playerMoved() {
    if (this.state === TutorialState.LearningMovement) {
      this.popup.fadeOut();
      this.state += 1;
    }
  }

  playerShot() {
    if (this.state === TutorialState.LearningShooting) {
      this.popup.fadeOut();
      this.state += 1;
    }
  }
};

class Player {
  health = PLAYER_MAX_HEALTH;

  constructor(pos) {
    this.pos = pos;
  }

  render(camera) {
    if (this.health > 0.0) {
      camera.fillCircle(this.pos, PLAYER_RADIUS, PLAYER_COLOR);
    }
  }

  update(dt, vel) {
    this.pos = this.pos.add(vel.scale(dt));
  }

  shootAt(target) {
    const bulletDir = target
      .sub(this.pos)
      .normalize();
    const bulletVel = bulletDir.scale(BULLET_SPEED);
    const bulletPos = this
      .pos
      .add(bulletDir.scale(PLAYER_RADIUS + BULLET_RADIUS));

    return new Bullet(bulletPos, bulletVel);
  }

  damage(value) {
    this.health = Math.max(this.health - value, 0.0);
  }

  heal(value) {
    this.health = Math.min(this.health + value, PLAYER_MAX_HEALTH);
  }
}

class Game {
  player = new Player(new V2(0,0));
  score = 0;
  mousePos = new V2(0, 0);
  pressedKey = new Set();
  tutorial = new Tutorial();
  bullets = [];
  enemies = [];
  particles = [];
  enemySpawnRate = ENEMY_SPAWN_COOLDOWN;
  enemySpawnCooldown = this.enemySpawnRate;
  paused = false;

  constructor(context) {
    this.camera = new Camera(context);
  }

  update(dt) {
    if (this.paused) {
      this.camera.grayness = 1.0;
      return;
    } else {
      this.camera.grayness = 1.0 - this.player.health / PLAYER_MAX_HEALTH;
    }

    if (this.player.health <= 0.0) {
      dt /= 50;
    }

    let vel = new V2(0, 0);
    let moved = false;
    for (let key of this.pressedKey) {
      if (key in directionMap) {
        vel = vel.add(directionMap[key].scale(PLAYER_SPEED));
        moved = true;
      }
    }

    if (moved) {
      this.tutorial.playerMoved();
    }

    this.player.update(dt, vel);
    this.tutorial.update(dt)

    for (let enemy of this.enemies) {
      if (!enemy.ded) {
        for (let bullet of this.bullets) {
          if (enemy.pos.dist(bullet.pos) <= BULLET_RADIUS + ENEMY_RADIUS) {
            this.score += ENEMY_KILL_SCORE;
            this.player.heal(ENEMY_KILL_HEAL);
            bullet.lifetime = 0.0;
            enemy.ded = true;
            particleBurs(this.particles, enemy.pos, ENEMY_COLOR);
          }
        }
      }

      if(this.player.health > 0.0 && !enemy.ded) {
        if (enemy.pos.dist(this.player.pos) <= PLAYER_RADIUS + ENEMY_RADIUS) {
          this.player.damage(ENEMY_DAMAGE);
          enemy.ded = true;
          particleBurs(this.particles, enemy.pos, PLAYER_COLOR);
        }
      }
    }

    for (let bullet of this.bullets) {
      bullet.update(dt);
    }

    this.bullets = this.bullets.filter(bullet => bullet.lifetime > 0.0);

    for (let particle of this.particles) {
      particle.update(dt);
    }

    this.particles = this.particles.filter(particle => particle.lifetime > 0.0);

    for (let enemy of this.enemies) {
      enemy.update(dt, this.player.pos);
    }

    this.enemies = this.enemies.filter(enemy => !enemy.ded);

    if (this.tutorial.state == TutorialState.Finished) {
      this.enemySpawnCooldown -= dt;
      if (this.enemySpawnCooldown <= 0.0) {
        this.spawnEnemy();
        this.enemySpawnCooldown = this.enemySpawnRate;
        this.enemySpawnRate = Math.max(0.01, this.enemySpawnRate - 0.01);
      }
    }
  }

  spawnEnemy() {
    let dir = Math.random() * 2 * Math.PI;
    this.enemies.push(
      new Enemy(this.player.pos.add(V2.polarV2(ENEMY_SPAWN_DISTANCE, dir)))
    );
  }
 
  renderEntities(entities) {
    for (let entity of entities) {
      entity.render(this.camera);
    }
  }

  render() {
    const width = this.camera.width();
    const height = this.camera.height();

    this.camera.clear();
    this.player.render(this.camera);

    this.renderEntities(this.bullets);
    this.renderEntities(this.particles);
    this.renderEntities(this.enemies);

    if (this.paused) {
      this.camera.fillMessage("PAUSED (SPACE to resume)", MESSAGE_COLOR);
    } else if (this.player.health <= 0.0) {
      this.camera.fillMessage(`GAME OVER (F5 to reset)\n YOUR SCORE: ${this.score}`, MESSAGE_COLOR);
    } else {
      this.tutorial.render(this.camera);
    }

    this.camera.fillRect(0, height - HEALTH_BAR_HEIGHT, width * (this.player.health / PLAYER_MAX_HEALTH), HEALTH_BAR_HEIGHT, PLAYER_COLOR);
  }

  togglePause() {
    this.paused = !this.paused;
  }

  keyDown(event) {
    if (this.player.health <= 0.0) {
      return;
    }

    if (event.code === 'Space') {
      this.togglePause();
    }

    this.pressedKey.add(event.key);
  }

  keyUp(event) {
    this.pressedKey.delete(event.key);
  }

  mouseMove(event) {

  }

  mouseDown(event) {
    if (this.paused) {
      return;
    }

    if (this.player.health <= 0.0) {
      return;
    }

    this.tutorial.playerShot();
    const mousePos = new V2(event.offsetX, event.offsetY);
    this.bullets.push(this.player.shootAt(mousePos));
  }
}


(() => {
  const canvas = document.getElementById("game");
  const context = canvas.getContext("2d");
  let windowWasResized = true;

  const game = new Game(context);

  let start;
  function step(timestamp) {
    if (start === undefined) {
      start = timestamp;
    }

    const dt = (timestamp - start) * 0.001;
    start = timestamp;

    if (windowWasResized) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      windowWasResized = false;
    }

    game.update(dt);
    game.render();

    window.requestAnimationFrame(step);
  }

  window.requestAnimationFrame(step);

  //Events
  document.addEventListener('keydown', event => {
    game.keyDown(event);
  });

  document.addEventListener('keyup', event => {
    game.keyUp(event);
  });

  document.addEventListener('mousemove', event => {
    game.mouseMove(event);
  });

  document.addEventListener('mousedown', event => {
    game.mouseDown(event);
  });

  document.addEventListener('resize', event => {
    windowWasResized = true;
  });
})();
