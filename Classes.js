const MOVE_SPEED = 3;

class Drawable {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.doDraw = true;
    this.size = 30;
    this.stroke = 5;
    this.isEllipse = false;
  }

  update() { }

  draw() {
    if (!this.doDraw) {
      return
    }

    stroke(0)
    strokeWeight(this.stroke)
    fill(this.color)
    if(this.isEllipse) {
      ellipse(this.x, this.y, this.size)
    } else {
      rect(this.x, this.y, this.size, this.size)
    }
  }
}

class MovingText {
  constructor(startX, startY, endX, endY, text, color, size = 24, centered = false, speed = 0) {
    this.endX = endX;
    this.endY = endY;
    this.text = text;
    this.x = startX;
    this.y = startY;
    this.doDraw = true;
    this.color = color;
    this.size = size;
    this.centered = centered;
    this.speed = speed;
  }

  update() {
    let d = dist(this.x, this.y, this.endX, this.endY)
    if(d <= 1) {
      this.doDraw = false;
    }
    
    let vec = createVector(this.x - this.endX, this.y - this.endY);
    vec.normalize();
    this.x -= vec.x * (MOVE_SPEED + this.speed);
    this.y -= vec.y * (MOVE_SPEED + this.speed);
  }

  draw() {
    fill(this.color)
    strokeWeight(5)
    stroke(255)
    textSize(this.size)
    textAlign(this.centered ? CENTER : LEFT, CENTER)
    textFont('AloneOnEarth')
    text(this.text, this.x, this.y)
  }
}

class DroppedCoin extends Drawable {
  constructor(x, y, amount) {
    super(x, y, [225, 181, 48])
    this.amount = amount;
    this.size = 10;
    this.stroke = 3;
    this.isEllipse = true;
  }
}

class Zombie extends Drawable {
  constructor(x, y, speed, player) {
    super(x, y, [119, 221, 118])
    this.speed = speed;
    this.player = player;
    this.damageTick = 0;
    this.frozen = false;
    this.freeRoamTick = 1000;
    this.strength = random(0.5, 0.9)
  }

  update() {
    if (this.frozen) {
      return
    }

    if (this.player.displayDead) {
      return
    }

    this.speed += 0.001

    let vec = createVector(this.x - this.player.x, this.y - this.player.y);
    vec.normalize();
    this.x -= vec.x * (MOVE_SPEED + this.speed);
    this.y -= vec.y * (MOVE_SPEED + this.speed);

    if (this.damageTick++ >= 20 && dist(this.x + 15, this.y + 15, this.player.x + 15, this.player.y + 15) <= 30) {
      let debuff = Math.round(Math.max(this.player.data.health - (random(1,3) + ((this.player.data.wave - 1)*1.2)), 0))
      movingTexts.push(new MovingText(250, windowHeight - 75, 250, windowHeight + 20, '-' + (this.player.data.health - debuff), [235, 33, 46]))
      this.player.data.health = debuff;
      this.damageTick = 0;
      this.frozen = true;
      setTimeout(() => this.frozen = false, 1500)
    }
  }
}

class Player extends Drawable {
  constructor(x, y, zombies) {
    super(x, y, [255, 255, 255])
    this.isMovingLeft = false;
    this.isMovingRight = false;
    this.isMovingUp = false;
    this.isMovingDown = false;
    this.damageColorTick = 0;
    this.canMove = true;
    this.isAttacking = false;
    this.attackingTick = 0;
    this.zombies = zombies;
    this.ringColor = [255, 255, 255, 40]
    this.data = {
      kills: 0,
      maxAttackingTick: 100,
      health: 100,
      isUpgrading: false,
      attackSpeed: 1,
      coinMultiplier: 1.0,
      spawnSpeed: 0.95,
      wave: 1
    };
    this.lastHealth = this.data.health;
  }

  update() {
    if (this.displayDead) {
      return;
    }

    // if (this.data.kills > 0 && this.data.kills % 50 === 0 && !this.data.isUpgrading) {
    //   this.data.isUpgrading = true;
    // }

    if (this.data.health <= 0 && this.lastHealth !== 0) {
      // handle death better
      this.displayDead = true;
      this.canMove = false;
      this.lastHealth = 0;
      this.data.health = 100;
      //this.data.kills = parseInt(this.data.kills / 2);
      this.save()
      setTimeout(() => {
        paused = true;
        helpMenuDisplayed = true;
        this.lastHealth = this.data.health;
        this.canMove = true;
        this.displayDead = false;
        zombies.splice(0, zombies.length)
        this.x = windowWidth / 2
        this.y = windowHeight / 2
        this.data.spawnSpeed = 0.95;
        zombiesSpawned = 0;
        killedZombiesInWave = 0;
        stopSpawning = false;
      }, 3000)

      return
    }

    if (this.data.health !== this.lastHealth) {
      this.color = [255, 105, 97];
      setTimeout(() => this.color = [255, 255, 255], 1500);
      this.lastHealth = this.data.health;
    }

    //
    // Player Movement
    //

    if (!this.canMove) {
      return;
    }

    if (this.isAttacking) {
      this.ringColor = [255, 255, 255, 120]
      this.attackingTick += this.data.attackSpeed;
      if (this.attackingTick >= this.data.maxAttackingTick) {
        this.attackingTick = 0;
      }
      // attack
      for (let zombie of this.zombies) {
        if (dist(zombie.x, zombie.y, this.x, this.y) <= (this.attackingTick / 2) && Math.random() > zombie.strength) {
          zombie.doDraw = false;
          killedZombiesInWave++;
          if(killedZombiesInWave % 50 === 0) {
            this.data.health = Math.min(100, this.data.health + 30);
            // rect 20, windowHeight - 100, player.data.health * 2, 50
            movingTexts.push(new MovingText(25, windowHeight - 75, player.data.health * 2, windowHeight - 75, '+', 255, 80))
          }
          coins.push(new DroppedCoin(zombie.x, zombie.y, (random(1,3 + this.data.wave) * this.data.coinMultiplier)))
        }
      }
    } else {
      this.ringColor = [255, 255, 255, 40]
    }

    for (let coin of coins) {
      if(dist(coin.x, coin.y, this.x + 15, this.y + 15) <= 35) {
        coin.doDraw = false;
        this.data.kills+=coin.amount;
        movingTexts.push(new MovingText(20 - 5, windowHeight - 130, 20 - 5, windowHeight - 230, '+' + numberWithCommas(coin.amount) + " ⛁", 0))
      }
    }

    if (this.isMovingLeft && this.x <= 4970) {
      this.x += MOVE_SPEED;
    }

    if (this.isMovingRight && this.x >= -5000) {
      this.x -= MOVE_SPEED;
    }

    if (this.isMovingUp && this.y >= -5000) {
      this.y -= MOVE_SPEED;
    }

    if (this.isMovingDown && this.y <= 4970) {
      this.y += MOVE_SPEED;
    }
  }

  draw() {
    super.draw()

    fill(0, 0, 0, 0)
    stroke(this.ringColor)
    ellipseMode(CENTER)
    ellipse(this.x + 15, this.y + 15, this.data.maxAttackingTick)
    if (this.isAttacking) {
      stroke(0, 0, 0, 40)
      ellipse(this.x + 15, this.y + 15, this.attackingTick)
    }
  }

  save() {
    document.cookie = JSON.stringify(this.data)
  }

  load() {
    if (!document.cookie) {
      return;
    }

    this.data = JSON.parse(document.cookie)
    this.data.health = 100; // wave system now so yeah
    this.lastHealth = this.data.health;
  }
}