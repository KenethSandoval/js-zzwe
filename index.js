function fillCircle(context, x, y, radius, color="green") {
  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI, false);
  context.fillStyle = color;
  context.fill(); 
}

(() => {
  const canvas = document.getElementById("game"); 
  const radius = 69;
  const context = canvas.getContext("2d");
  const speed = 100;


  let start;
  let x = radius + 10;
  let y = radius + 10;
  let dx = speed;
  let dy = speed;
  
  function step (timestamp) {
    if(start === undefined) {
      start = timestamp;
    } 

    const dt = (timestamp - start) * 0.001;
    start = timestamp;
 
    const { innerWidth, innerHeight } = window;
    canvas.width = innerWidth;
    canvas.height = innerHeight;
 
    if(x + radius >= innerWidth  || x - radius <= 0) dx = -dx;
    if(y + radius >= innerHeight || y - radius <= 0) dy = -dy;
    
    x += dx * dt;
    y += dy * dt;

    context.clearRect(0, 0, innerWidth, innerHeight);
    fillCircle(context, x, y, radius, "red");

    window.requestAnimationFrame(step);
  }
  
  window.requestAnimationFrame(step);

})();
