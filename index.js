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

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize() {
    const n = this.length();
    return new V2(this.x / n, this.y / n);
  }
}

const radius = 69;
const speed = 1000;
const TUTORIAL_POPUP_SPEED = 1.5;
const BULLET_SPEED = 2000;
const BULLET_RADIUS = 40;
const BULLET_LIFETIME = 5.0;

const directionMap = {
    's': new V2(0, 1.0),
    'w': new V2(0, -1.0),
    'a': new V2(-1.0, 0),
    'd': new V2(1.0, 0)
};

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

    if(this.dalpha < 0.0 && this.alpha <= 0.0) {
      this.dalpha = 0.0;
      this.alpha = 0.0;
      
      if(this.onFadeOut !== undefined) {
        this.onFadeOut();
      }
 
    } else if(this.dalpha > 0.0 && this.alpha >= 1.0) {
      this.dalpha = 0.0;
      this.alpha = 1.0;
 
      if(this.onFadeIn !== undefined) {
        this.onFadeIn();
      }
    }
  }

  render(context) {  
    const width = context.canvas.width;
    const height = context.canvas.height;

    context.fillStyle = `rgba(255,255,255, ${this.alpha})`;
    context.font = "30px LexendMega"
    context.textAlign = "center";
    context.fillText(this.text, width / 2, height / 2);
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

  render(context) {
    fillCircle(context, this.pos, BULLET_RADIUS, "red"); 
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
 
  render(context) {
    this.popup.render(context)
  }

  playerMoved() {
    if(this.state === TutorialState.LearningMovement) {
      this.popup.fadeOut();
      this.state += 1;       
    }
  }

  playerShot() {
    if(this.state === TutorialState.LearningShooting) {
      this.popup.fadeOut();
      this.state += 1;
    }
  }
};

class Game {
  constructor() {
    this.pos = new V2(radius + 10, radius + 10); 
    this.mousePos = new V2(0, 0);
    this.pressedKey = new Set(); 
    this.tutorial = new Tutorial();
    this.played_move_for_the_first = false;
    this.bullets = [];
  }

  update(dt) {
    let vel = new V2(0,0);
    let moved = false;
    for (let key of this.pressedKey) {
      if(key in directionMap) {
        vel = vel.add(directionMap[key].scale(speed));
        moved = true;
      }
    } 

    if(moved) {
      this.tutorial.playerMoved();
    }

    this.pos = this.pos.add(vel.scale(dt)); 
    this.tutorial.update(dt)

    for (let bullet of this.bullets){
      bullet.update(dt);
    }
    
    this.bullets = this.bullets.filter(bullet => bullet.lifetime > 0.0);
  }

  render(context) {
    const width = context.canvas.width;
    const height = context.canvas.height;

    context.clearRect(0, 0, width, height);
    fillCircle(context, this.pos, radius, "red");

    this.tutorial.render(context);
 
    for (let bullet of this.bullets){
      bullet.render(context);
    }
  }

  keyDown(event) {
    this.pressedKey.add(event.key);
  }

  keyUp(event) {
    this.pressedKey.delete(event.key);
  }

  mouseMove(event) {
  }

  
  mouseDown(event) {
    this.tutorial.playerShot();
    const mousePos = new V2(event.offsetX, event.offsetY);
    const bulletVel = mousePos
          .sub(this.pos)
          .normalize()
          .scale(BULLET_SPEED);

    this.bullets.push(new Bullet(this.pos, bulletVel));
  }
}

function fillCircle(context, center, radius, color="green") {
  context.beginPath();
  context.arc(center.x, center.y, radius, 0, 2 * Math.PI, false);
  context.fillStyle = color;
  context.fill(); 
}


(() => {
  const canvas = document.getElementById("game"); 
  const context = canvas.getContext("2d");

  const game = new Game();

  let start;  
  function step (timestamp) {
    if(start === undefined) {
      start = timestamp;
    } 

    const dt = (timestamp - start) * 0.001;
    start = timestamp;
 
    const { innerWidth, innerHeight } = window;
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    
    game.update(dt);
    game.render(context);
 
    window.requestAnimationFrame(step);
  }
  
  window.requestAnimationFrame(step);

  //Eventos
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
})();
