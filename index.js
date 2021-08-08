function fillCircle(context, x, y, radius, color="green") {
  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI, false);
  context.fillStyle = color;
  context.fill(); 
}

(() => {
  const canvas = document.getElementById("game");
  const { width, height } = canvas;
  const radius = 69;
  const context = canvas.getContext("2d");

  let start;
  let x = width / 2;
  let y = height / 2;
  let dx = 100;
  let dy = 100;
  
  function step (timestamp) {
    if(start === undefined) {
      start = timestamp;
    } 

    const dt = (timestamp - start) * 0.001;
    start = timestamp;
  
    x += dx * dt;
    y += dy * dt;

    if(x + radius >= width  || x - radius <= 0) dx = -dx;
    if(y + radius >= height || y - radius <= 0) dy = -dy;
   
    context.clearRect(0, 0, width, height);
    fillCircle(context, x, y, radius, "red");

    window.requestAnimationFrame(step);
  }
  
  window.requestAnimationFrame(step);

})();
