p5.disableFriendlyErrors = true;
function distSquared(x1, y1, x2, y2) {
    let dx = x2 - x1;
    let dy = y2 - y1;
    return dx * dx + dy * dy;
}

let player;
const zombies = [];
const rocks = [];
const coins = [];
const movingTexts = [];
const abilities = [];
let paused = false;

const drawnCycle = [];

let zombiesSpawned = 0;
let killedZombiesInWave = 0;
let stopSpawning = false;

let waitTick = 0;
let isWaiting = false;
let waitingFor = 0;

let helpMenuDisplayed = true;

const rockColors = [[90, 76, 66, 200], [106, 57, 9, 200], [105, 102, 92, 200], [163, 162, 165, 200], [99, 95, 98, 200]]

// Setup P5.JS

function setup() {
  createCanvas(windowWidth, windowHeight);
  player = new Player(windowWidth / 2, windowHeight / 2, zombies);
  player.load()

  for (let x = -5000; x <= 5000; x += 10) {
    for (let y = -5000; y <= 5000; y += 10) {
      if (Math.random() > 0.98) {
        rocks.push({ x: x, y: y, fill: rockColors[Math.floor(random(0, 5))], size: random(5, 10) })
      }
    }
  }
}

function wait(time) {
  isWaiting = true;
  waitingFor = time;
  waitTick = 0;
}

function drawGUI() {
  // HealthBar
  fill(255)
  stroke(0)
  rect(20 - 5, windowHeight - 100 - 5, Math.max(player.data.health * 2, 100 * 2) + 10, 50 + 10, 5)
  fill(235, 33, 46)
  stroke(235, 33, 46)
  if (player.data.health > 0) {
    rect(20, windowHeight - 100, player.data.health * 2, 50)
  }

  fill(0)
  strokeWeight(5)
  stroke(255)
  textSize(32)
  textAlign(LEFT)
  textFont('AloneOnEarth')
  text(numberWithCommas(player.data.kills) + " ⛁", 20 - 5, windowHeight - 130)
  textSize(40)
  textAlign(CENTER)
  text('[Upgrades]', windowWidth / 2, windowHeight - 90)
  text('Wave: ' + player.data.wave, windowWidth / 2, windowHeight - 42)
  textSize(20)
  text('Zombies Remaining: ' + ((player.data.wave * 100) - killedZombiesInWave), windowWidth / 2, windowHeight - 10)

  if (player.data.isUpgrading) {
    paused = true;
    noStroke()
    fill(43, 45, 47, 100)
    rect(0, 0, windowWidth, windowHeight)

    push()
    rectMode(CENTER)
    fill(155, 118, 83)
    stroke(0)
    strokeWeight(5)
    rect(windowWidth / 2, windowHeight / 2, 500, windowHeight - 100, 15)
    fill(255, 105, 97)
    ellipseMode(CENTER)
    //console.log((windowWidth / 2 + 250) + " " + (windowHeight / 2 - (windowHeight - 50)))
    ellipse(windowWidth / 2 + 250, 50, 30)
    textSize(20)
    textAlign(CENTER, CENTER)
    stroke(255)
    strokeWeight(3)
    fill(0)
    textFont('AloneOnEarth')
    text('X', windowWidth / 2 + 250, 50)
    textAlign(CENTER, CENTER)
    textSize(32)
    text('Upgrades', windowWidth / 2, 100)

    // draw boxes for each upgrade stat
    let attackSpeedPrice = (((player.data.attackSpeed + 1) ** 1.1) * 20 * player.data.wave).toFixed(2)
    let attackRadiusPrice = ((player.data.maxAttackingTick + 10) ** 1.1 * player.data.wave).toFixed(2)
    let coinMultiplierPrice = (((player.data.coinMultiplier + 0.1) ** 1) * 50 * player.data.wave).toFixed(2)
    rectMode(CENTER)

    if (player.data.kills >= attackSpeedPrice) {
      fill(92, 219, 92, isMouseOverRect(windowWidth / 2, 200, 400, 100) ? 200 : 60)
    } else {
      fill(255, 0, 33, isMouseOverRect(windowWidth / 2, 200, 400, 100) ? 200 : 60)
    }
    stroke(0)
    strokeWeight(5)
    // AttackSpeed
    rect(windowWidth / 2, 200, 400, 100, 15)
    textSize(24)
    textAlign(LEFT, CENTER)
    fill(255)
    noStroke()
    text('Attack Speed: ' + numberWithCommas(player.data.attackSpeed) + " >> " + numberWithCommas(player.data.attackSpeed + 1), windowWidth / 2 - 190, 200)
    textAlign(RIGHT, CENTER)
    text(numberWithCommas(attackSpeedPrice) + " ⛁", windowWidth / 2 + 190, 200)

    if (mouseIsPressed && isMouseOverRect(windowWidth / 2, 200, 400, 100) && player.data.kills >= attackSpeedPrice) {
      player.data.attackSpeed += 1;
      player.data.kills -= attackSpeedPrice;
      mouseIsPressed = false;
    }
    //

    if (player.data.kills >= attackRadiusPrice) {
      fill(92, 219, 92, isMouseOverRect(windowWidth / 2, 350, 400, 100) ? 200 : 60)
    } else {
      fill(255, 0, 33, isMouseOverRect(windowWidth / 2, 350, 400, 100) ? 200 : 60)
    }
    stroke(0)
    strokeWeight(5)
    // AttackRadius
    rect(windowWidth / 2, 350, 400, 100, 15)
    textSize(24)
    textAlign(LEFT, CENTER)
    fill(255)
    noStroke()
    text('Attack Radius: ' + numberWithCommas(player.data.maxAttackingTick) + " >> " + numberWithCommas(player.data.maxAttackingTick + 10), windowWidth / 2 - 190, 350)
    textAlign(RIGHT, CENTER)
    text(numberWithCommas(attackRadiusPrice) + " ⛁", windowWidth / 2 + 190, 350)

    if (mouseIsPressed && isMouseOverRect(windowWidth / 2, 350, 400, 100) && player.data.kills >= attackRadiusPrice) {
      player.data.maxAttackingTick += 10;
      player.data.kills -= attackRadiusPrice;
      mouseIsPressed = false;
    }

    //
    if (player.data.kills >= coinMultiplierPrice) {
      fill(92, 219, 92, isMouseOverRect(windowWidth / 2, 500, 400, 100) ? 200 : 60)
    } else {
      fill(255, 0, 33, isMouseOverRect(windowWidth / 2, 500, 400, 100) ? 200 : 60)
    }
    stroke(0)
    strokeWeight(5)
    // CoinMultiplier
    rect(windowWidth / 2, 500, 400, 100, 15)
    textSize(24)
    textAlign(LEFT, CENTER)
    fill(255)
    noStroke()
    text('Coin Multiplier: ' + numberWithCommas(player.data.coinMultiplier) + " >> " + numberWithCommas(player.data.coinMultiplier + 0.1), windowWidth / 2 - 190, 500)
    textAlign(RIGHT, CENTER)
    text(numberWithCommas(coinMultiplierPrice) + " ⛁", windowWidth / 2 + 190, 500)

    if (mouseIsPressed && isMouseOverRect(windowWidth / 2, 500, 400, 100) && player.data.kills >= coinMultiplierPrice) {
      player.data.coinMultiplier += 0.1;
      player.data.kills -= coinMultiplierPrice;
      mouseIsPressed = false;
    }

    pop()
  }

  if (helpMenuDisplayed && !player.data.isUpgrading) {
    paused = true;
    noStroke()
    fill(43, 45, 47, 100)
    rect(0, 0, windowWidth, windowHeight)

    push()
    rectMode(CENTER)
    fill(155, 118, 83)
    stroke(0)
    strokeWeight(5)
    rect(windowWidth / 2, windowHeight / 2, 500, windowHeight - 100, 15)
    fill(255, 105, 97)
    ellipseMode(CENTER)
    //console.log((windowWidth / 2 + 250) + " " + (windowHeight / 2 - (windowHeight - 50)))
    ellipse(windowWidth / 2 + 250, 50, 30)
    textSize(20)
    textAlign(CENTER, CENTER)
    stroke(255)
    strokeWeight(3)
    fill(0)
    textFont('AloneOnEarth')
    text('X', windowWidth / 2 + 250, 50)
    textAlign(CENTER, TOP)
    rectMode(CORNER)
    textSize(40)
    textLeading(55)
    text('Paused!', windowWidth / 2 - 200, 100, 400, windowHeight - 100)
    fill(255)
    textSize(30)
    noStroke()
    text('Hello! Welcome to Zombies by byteful. This is a game of skill and somewhat luck. Use arrow keys or WASD to move. Use the spacebar to charge your attack. Every 50 kills, an upgrade menu will open allowing you to upgrade your stats. To reopen this menu, press ESC.', windowWidth / 2 - 200, 170, 400, windowHeight - 100)
    pop()
  }

  if (player.displayDead) {
    fill(0)
    stroke(255)
    strokeWeight(5)
    textAlign(CENTER, CENTER)
    textSize(32)
    textFont('AloneOnEarth')
    text('You died! Resetting in 3 seconds...', windowWidth / 2, windowHeight / 2)
  }

  for (let i = 0; i < movingTexts.length; i++) {
    let drawable = movingTexts[i];
    drawable.update();
    if (!drawable.doDraw) {
      movingTexts.splice(i, 1);
      i--;
    } else {
      drawable.draw();
    }
  }

  // mini map
  push()

  ellipseMode(CENTER)
  fill(155, 118, 83)
  stroke(116, 89, 62)
  strokeWeight(5)
  rect(windowWidth - 220, windowHeight - 220, 200, 200)

  noStroke()
  fill(119, 221, 118)

  for (let zombie of zombies) {
    if(!zombie.doDraw) {
      continue
    }
    let x = map(zombie.x, -5000, 5000, windowWidth - 220, windowWidth - 20)
    let y = map(zombie.y, -5000, 5000, windowHeight - 220, windowHeight - 20)
    
    ellipse(x, y, 5)
  }

  for (let ability of abilities) {
    if(!ability.doDraw) {
      continue
    }
    if(ability instanceof HealthAbility) {
      fill(235, 33, 46)
    }
    if(ability instanceof CoinMagnet) {
      fill(192, 192, 192)
    }
    let x = map(ability.x, -5000, 5000, windowWidth - 220, windowWidth - 20)
    let y = map(ability.y, -5000, 5000, windowHeight - 220, windowHeight - 20)
    
    ellipse(x, y, 5)
  }

  let x = map(player.x, -5000, 5000, windowWidth - 220, windowWidth - 20)
  let y = map(player.y, -5000, 5000, windowHeight - 220, windowHeight - 20)
  let size = player.data.maxAttackingTick / (100 / 5) //map(player.data.maxAttackingTick, -5000, 5000, windowWidth - 220, windowWidth - 20)

  fill(255)
  ellipse(x, y, size)
  
  pop()
}

function drawBackgroundRocks() {
  for (let rock of rocks) {
    if (isOnScreen(rock.x, rock.y)) {
      fill(rock.fill)
      noStroke()
      ellipse(rock.x, rock.y, rock.size)
    }
  }
  push()
  fill(255, 255, 255, 0)
  stroke(0, 0, 0, 200)
  strokeWeight(10)
  rectMode(CENTER)
  rect(0, 0, 10000, 10000)
  pop()
}

function isOnScreen(x, y) {
  let startingX = player.x - (windowWidth / 2)
  let startingY = player.y - (windowHeight / 2)
  let endX = player.x + (windowWidth / 2)
  let endY = player.y + (windowHeight / 2)

  return x >= startingX && x <= endX && y >= startingY && y <= endY;
}

let healthAbilityTick = 0;
let coinMagnetTick = 0;
let optimizeTick = 0;
let randomCoinsTick = 0;

function draw() {
  background(155, 118, 83)
  //
  if (paused) {
    drawGUI()
    return
  }
  push()
  //scale(100 / player.data.maxAttackingTick)
  translate(windowWidth / 2 - player.x - 15, windowHeight / 2 - player.y - 15);
  drawBackgroundRocks()
  //
  player.update()
  player.draw()
  player.save()

  if (isWaiting && waitTick++ >= waitingFor) {
    isWaiting = false;
    waitTick = 0;
    waitingFor = 0;
    stopSpawning = false;
    coins.splice(0, coins.length);
    movingTexts.push(new MovingText(0, windowHeight / 2, windowWidth, windowHeight / 2, 'Wave starting now!', 0, 32, true, 3))
  }

  if (!isWaiting && !stopSpawning && zombies.length < 300) {
    player.data.spawnSpeed = Math.max(0, player.data.spawnSpeed - 0.00005);
  }
  if (Math.random() > player.data.spawnSpeed && !isWaiting && !stopSpawning && zombies.length < 300) {
    let zombieX = Math.random() > 0.5 ? random(player.x - windowWidth / 2 - 200, player.x - windowWidth / 2 - 15) : random(windowWidth / 2 + player.x + 15, windowWidth / 2 + player.x + 200);
    let zombieY = Math.random() > 0.5 ? random(player.y - windowHeight / 2 - 200, player.y - windowHeight / 2 - 15) : random(windowHeight / 2 + player.y + 15, windowHeight / 2 + player.y + 200);
    let zombieSpeed = random(-2.0, 0.3)

    zombies.push(new Zombie(zombieX, zombieY, zombieSpeed, player))
    zombiesSpawned++;
    // if (zombies.length >= 500) {
    //   zombies.splice(zombies.length - 1, 1)
    // }
  }

  if (zombiesSpawned >= (player.data.wave * 100)) {
    stopSpawning = true;
  }
  if (killedZombiesInWave >= (player.data.wave * 100) && stopSpawning) {
    player.data.wave++;
    killedZombiesInWave = 0;
    zombiesSpawned = 0;
    movingTexts.push(new MovingText(windowWidth / 2, 0, windowWidth / 2, windowHeight, 'Wave completed!', 0, 32, true, 3))
    wait(1000)
  }

  if(randomCoinsTick++ >= 20 && coins.length < 500         ) {
    coins.push(new DroppedCoin(random(-2000, 2000), random(-2000, 2000), random(1, 500)))
    randomCoinsTick = 0;        
  }

  (async () => {
    if (optimizeTick++ >= 100) {
      for (let i = 0; i < coins.length; i++) {
        let coin = coins[i];

        if (!coin.doDraw) {
          continue;
        }

        for (let j = i; j < coins.length; j++) {
          let other = coins[j];
          if (coin !== other && !other.isMovingTo && other.doDraw && dist(coin.x, coin.y, other.x, other.y) <= coins.length) {
            other.moveTo = { x: coin.x, y: coin.y }
            other.isMovingTo = true
            coin.amount += other.amount;
          }
        }
      }
      optimizeTick = 0;
    }
  })()

  for (let i = 0; i < coins.length; i++) {
    let drawable = coins[i];
    drawable.update();
    // merge
    // if(i !== coins.length - 1) {
    //   let next = coins[i+1]

    //   if(dist(drawable.x, drawable.y, next.x, next.y) <= 15) {
    //     drawable.doDraw = false;
    //     next.amount += drawable.amount;
    //   }
    // }
    if (!drawable.doDraw) {
      coins.splice(i, 1);
      i--;
    } else {
      if (i <= 300) {
        drawable.draw();
      }
    }
  }

  for (let i = 0; i < zombies.length; i++) {
    let drawable = zombies[i];
    drawable.update();
    if (!drawable.doDraw) {
      zombies.splice(i, 1);
      i--;
    } else {
      if (i <= 500) {
        drawable.draw();
      }
    }
  }

  if (abilities.length <= 20 && healthAbilityTick++ >= 100 && Math.random() > 0.99) {
    healthAbilityTick = 0;
    abilities.push(new HealthAbility(random(-4000, 4000), random(-4000, 4000), player));
  }

  if (abilities.length <= 20 && coinMagnetTick++ >= 100 && Math.random() > 0.99) {
    coinMagnetTick = 0;
    abilities.push(new CoinMagnet(random(-4000, 4000), random(-4000, 4000), player));
  }

  for (let i = 0; i < abilities.length; i++) {
    let drawable = abilities[i];
    drawable.update();
    if (!drawable.doDraw) {
      abilities.splice(i, 1);
      i--;
    } else {
      if (i <= 20) {
        drawable.draw();
      }
    }
  }

  pop()
  drawGUI()
  drawnCycle.splice(0, drawnCycle.length);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

//
//
//

//
// Player Movement Logic
//

function keyPressed() {
  if (keyCode === 32) {
    player.isAttacking = true;
  }

  if (keyCode === 27 && !player.displayDead) {
    paused = !paused;
    if (player.data.isUpgrading) {
      player.data.isUpgrading = false;
    } else {
      helpMenuDisplayed = !helpMenuDisplayed;
    }
  }

  if (keyCode === 87 || keyCode === 38) {
    player.isMovingUp = true;
  }

  if (keyCode === 83 || keyCode === 40) {
    player.isMovingDown = true;
  }

  if (keyCode === 65 || keyCode === 37) {
    player.isMovingRight = true;
  }

  if (keyCode === 68 || keyCode === 39) {
    player.isMovingLeft = true;
  }
}

function keyReleased() {
  if (keyCode === 32) {
    player.isAttacking = false;
  }

  if (keyCode === 87 || keyCode === 38) {
    player.isMovingUp = false;
  }

  if (keyCode === 83 || keyCode === 40) {
    player.isMovingDown = false;
  }

  if (keyCode === 65 || keyCode === 37) {
    player.isMovingRight = false;
  }

  if (keyCode === 68 || keyCode === 39) {
    player.isMovingLeft = false;
  }
}

function mousePressed() {
  if ((helpMenuDisplayed || player.data.isUpgrading) && dist(windowWidth / 2 + 250, 50, mouseX, mouseY) <= 10) {
    helpMenuDisplayed = false;
    if (player.data.isUpgrading) {
      player.data.isUpgrading = false;
    }
    paused = false;
  }

  if (isMouseOverRect(windowWidth / 2, windowHeight - 70, 160, 80) && !player.data.isUpgrading && !paused && !player.data.displayDead) {
    paused = true;
    player.data.isUpgrading = true;
  }

  console.log(dist(player.x, player.y, mouseX, mouseY))
  console.log(player.x + " " + player.y)
  console.log(mouseX + " " + mouseY)
}

function numberWithCommas(x) {
  return Number(x).toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); //x.toString().includes('.') ? new Number(x).toFixed(2) : x.toLocaleString('en'); //x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

function isMouseOverRect(x, y, w, h) {
  return mouseX >= (x - (w / 2)) && mouseX <= (x + (w / 2)) && mouseY >= (y - (h / 2)) && mouseY <= (y + (h / 2))
}

//
//
//