var game;
if(!localStorage.getItem('barbitos.mall')){
    game = {
        money: new Decimal(10),
        distance: new Decimal(0),
        endurance: new Decimal(10),
        upgradeLevels: [0, 0, 0, 0, 0, 0],
        prestigeUnlocked: false,
        prestigePoints: new Decimal(0),
        prestigeBagSpace: new Decimal(0)
    };
}else{
    game = JSON.parse(localStorage.getItem('barbitos.mall'));
    game.money = new Decimal(game.money);
    game.distance = new Decimal(game.distance);
    game.endurance = new Decimal(game.endurance);
}

game.upgrades = [];

game.upgrades.push(new Upgrade("Wallet", "Generates <span class=\"upgradeInfo\">$1/s</span>", 10, 1, 1, 0, game.upgradeLevels.shift()));
game.upgrades.push(new Upgrade("Shoes", "Start running at <span class=\"upgradeInfo\">1 m/s</span>", 20, 1, 1, 0, game.upgradeLevels.shift()));
game.upgrades.push(new Upgrade("Bigger Wallet", "Generates <span class=\"upgradeInfo\">1.5×</span> more <span class=\"upgradeInfo\">$/s</span>", 20, 2, 0, 10, game.upgradeLevels.shift()));
game.upgrades.push(new Upgrade("Water Bottle", "Multiplies max endurance by <span class=\"upgradeInfo\">1.5×</span>", 50, 2, 0, 10, game.upgradeLevels.shift()));
game.upgrades.push(new Upgrade("Energy Drink", "Refills your endurance", 100, 3, 0, 10, game.upgradeLevels.shift()));
game.upgrades.push(new Upgrade("Better Shoes", "Run <span class=\"upgradeInfo\">2×</span> faster", 250, 5, 0, 50, game.upgradeLevels.shift()));
//create upgrades and transfer levels to the upgrades objects

for(let i = 0; i < game.upgrades.length; i++){
    let upgradeElem = document.getElementById("upgrade" + i);
    upgradeElem.onclick = function(){
        buyUpgrade(i, 1);
    }
}

var lastUpdate = Date.now();

function update(){
    let delta = (Date.now() - lastUpdate)/1000;
    lastUpdate = Date.now();
    game.money = Decimal.add(game.money, Decimal.mul(getMoneyPerSecond(), delta));
    if(game.endurance.gt(0) && getSpeed().gt(0)){
        game.distance = Decimal.add(game.distance, Decimal.mul(getSpeed(), Decimal.min(delta, game.endurance)));
        game.endurance = Decimal.sub(game.endurance, Decimal.min(delta, game.endurance))
    }
    if(!game.prestigeUnlocked && getCurrentSpace() == 0){
        game.prestigeUnlocked = true;
    }
    updateUI();
    window.requestAnimationFrame(update);
}

function updateUI(){
    let moneyAmount = document.getElementById("moneyAmount");
    let moneyGeneratedAmount = document.getElementById("moneyGeneratedAmount");
    let distanceAmount = document.getElementById("distanceAmount");
    let speedAmount = document.getElementById("speedAmount");
    let enduranceAmount = document.getElementById("enduranceAmount");
    let spaceAmount = document.getElementById("spaceAmount");
    let prestigeButtonSpace = document.getElementById("prestigeButtonSpace");
    let prestigeButton = document.getElementById("prestigeButton");
    let nextShopDistance = document.getElementById("nextShopDistance");

    moneyAmount.innerHTML = "$" + game.money.toFixed(3);
    moneyGeneratedAmount.innerHTML = "$" + getMoneyPerSecond().toFixed(3);
    distanceAmount.innerHTML = game.distance.toFixed(3) + " m";
    speedAmount.innerHTML = getSpeed().toFixed(3) + " m/s";
    enduranceAmount.innerHTML = game.endurance.toFixed(3) + "/" + getMaxEndurance().toFixed(3) + " s";
    spaceAmount.innerHTML = getCurrentSpace() + "/" + getMaxSpace();

    for(var i = 0; i < game.upgrades.length; i++){
        let upgradeElem = document.getElementById("upgrade" + i);
        let upgrade = game.upgrades[i];
        if(Decimal.gte_tolerance(game.distance, upgrade.requiredDistance, 0.001)){
            upgradeElem.hidden = false;
            if(upgrade.maxLevel != 0 && upgrade.level >= upgrade.maxLevel){
                upgradeElem.className = "upgradeUnaffoardable";
                upgradeElem.innerHTML = upgrade.name + "<br/>" + upgrade.desc + "</span><br/>Level: <span class=\"upgradeInfo\">" + (upgrade.maxLevel == 0 ? upgrade.level : (upgrade.level + "/" + upgrade.maxLevel)) + "</span>";
                continue;
            }else{
                upgradeElem.innerHTML = upgrade.name + "<br/>" + upgrade.desc + "<br/>Cost: <span class=\"upgradeInfo\">$" + upgrade.getSinglePurchaseCost().toFixed(1) + "</span><br/>Level: <span class=\"upgradeInfo\">" + (upgrade.maxLevel == 0 ? upgrade.level : (upgrade.level + "/" + upgrade.maxLevel)) + "</span>";
            }if(getCurrentSpace() > 0 && Decimal.gte(game.money, upgrade.getSinglePurchaseCost())){
                upgradeElem.className = "upgradeAffoardable";
            }else{
                upgradeElem.className = "upgradeUnaffoardable";
            }
        }else{
            upgradeElem.hidden = true;
        }
    }
    let nextShopDistanceText = "";
    for(var j = 0; j < game.upgrades.length; j++){
        let upgrade = game.upgrades[j];
        if(game.distance.lt(upgrade.requiredDistance)){
            nextShopDistanceText = "Next shop is at <span class=\"amount\">" + upgrade.requiredDistance.toFixed(0) + "m</span>";
            break;
        }
    }
    nextShopDistance.innerHTML = nextShopDistanceText;

    if(game.prestigeUnlocked == true){
        prestigeButtonSpace.style.display = "flex";
        if(getCurrentSpace() == 0){
            prestigeButton.className = "prestigeButtonAffoardable";
            prestigeButton.innerHTML = "Prestige for <span class=\"amount\">" + getBagSpaceOnPrestige() + "</span> bag space<br/>and <span class=\"amount\">" + getPrestigePointsOnPrestige().toFixed(0) + "</span> prestige point";
        }else{
            prestigeButton.className = "prestigeButtonUnaffoardable";
            prestigeButton.innerHTML = "Prestige<br/>Your bag needs to be full";
        }
    }else{
        prestigeButtonSpace.style.display = "none";
    }

}

function getMoneyPerSecond(){
    if(game.upgrades[0].level >= 1){
        return new Decimal(1).mul(Decimal.pow(1.5, game.upgrades[2].level));
    }
    return new Decimal(0);
}

function getSpeed(){
    if(game.upgrades[1].level >= 1){
        return new Decimal(1).mul(Decimal.pow(2, game.upgrades[5].level));
    }
    return new Decimal(0);
}
function getMaxEndurance(){
    return new Decimal(10).mul(Decimal.pow(1.5, game.upgrades[3].level));
}

function buyUpgrade(upgradeIndex, amount){
    let upgrade = game.upgrades[upgradeIndex];
    if(game.distance.lt_tolerance(upgrade.requiredDistance, 0.001)) return;
    amount = Math.min(amount, upgrade.getMaxAffoardable(), getCurrentSpace());
    if(amount <= 0) return;
    game.money = Decimal.sub(game.money, upgrade.getBulkPurchaseCost(amount));
    upgrade.level += amount;


    if(upgradeIndex == 4) game.endurance = getMaxEndurance();
    if(upgradeIndex == 3) game.endurance = Decimal.min(getMaxEndurance(), game.endurance.add(getMaxEndurance().div(3)));
    save(); //TODO save every minute instead
}

function getMaxSpace(){
    return 10;
}

function getSpaceUsed(){
    let x = 0;
    game.upgrades.forEach(upgrade => x += upgrade.level);
    return x;
}

function getCurrentSpace(){
    return getMaxSpace() - getSpaceUsed();
}

function getBagSpaceOnPrestige(){
    return 1;
}

function getPrestigePointsOnPrestige(){
    return Decimal.floor(1);
}

function save(){
    game.upgradeLevels = [];
    game.upgrades.forEach(element => game.upgradeLevels.push(element.level));
    let upgrades = game.upgrades;
    delete game.upgrades;
    localStorage.setItem("barbitos.mall", JSON.stringify(game));
    game.upgrades = upgrades;
}

window.requestAnimationFrame(update);
