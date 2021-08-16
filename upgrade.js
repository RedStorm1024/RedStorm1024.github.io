class Upgrade{
    constructor(name, desc, baseCost, costScaling, maxLevel, requiredDistance, level = 0){
        this.name = name;
        this.desc = desc;
        this.baseCost = new Decimal(baseCost);
        this.costScaling = new Decimal(costScaling);
        this.maxLevel = maxLevel;
        this.requiredDistance = new Decimal(requiredDistance);
        this.level = level
    }

    getSinglePurchaseCost(currentLevel = this.level, baseCost = this.baseCost, costScaling = this.costScaling){
        return Decimal.mul(baseCost, Decimal.pow(costScaling, currentLevel));
    }

    getBulkPurchaseCost(bulkAmount, currentLevel = this.level, baseCost = this.baseCost, costScaling = this.costScaling){
        if (bulkAmount === 1) {
            return this.getSinglePurchaseCost(currentLevel, baseCost, costScaling);
        }
        return Decimal.mul(this.getSinglePurchaseCost(currentLevel, baseCost, costScaling), (Decimal.div(Decimal.sub(Decimal.pow(costScaling, bulkAmount), 1), Decimal.sub(costScaling, 1))));
    }
    getMaxAffoardable(money = game.money, currentLevel = this.level, baseCost = this.baseCost, costScaling = this.costScaling){
        let singlePurchaseCost = this.getSinglePurchaseCost(currentLevel, baseCost, costScaling);
        if(Decimal.gt(singlePurchaseCost, money)){
            return 0;
        }
        if(costScaling.eq(1)){
            return Math.floor(game.money.div(baseCost).toNumber());
        }
        return Decimal.ln(costScaling.sub(1).mul(money).div(singlePurchaseCost).add(1)) / Decimal.ln(costScaling);
    }
}
