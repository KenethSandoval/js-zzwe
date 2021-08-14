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
}

const radius = 69;
const speed = 1000;
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
  } 

  update(dt) {
    this.alpha += this.dalpha * dt;

    if(this.dalpha < 0.0 && this.alpha <= 0.0) {
      this.dalpha = 0.0;
      this.alpha = 0.0;
    } else if(this.dalpha > 0.0 && this.alpha >= 1.0) {
      this.dalpha = 0.0;
      this.alpha = 1.0;
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
    this.dalpha = 1.0;
    this.alpha = 0.0;
  }

  fadeOut() {
    this.dalpha = -1.0;
    this.alpha = 1.0;
  }
}

class Game {
  constructor() {
    this.pos = new V2(radius + 10, radius + 10); 
    this.pressedKey = new Set(); 
    this.popup = new Popup("WASD to move around");
    this.popup.fadeIn()
  }

  update(dt) {
    let vel = new V2(0,0);
    for (let key of this.pressedKey) {
      if(key in directionMap) {
        vel = vel.add(directionMap[key].scale(speed));
      }
    } 
 
    this.pos = this.pos.add(vel.scale(dt)); 
    this.popup.update(dt)
  }

  render(context) {
    const width = context.canvas.width;
    const height = context.canvas.height;

    context.clearRect(0, 0, width, height);
    fillCircle(context, this.pos, radius, "red");

    this.popup.render(context)
  }

  keyDown(event) {
    this.pressedKey.add(event.key);
  }

  keyUp(event) {
    this.pressedKey.delete(event.key);
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
  let move_for_the_first_time = false;

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
})();
