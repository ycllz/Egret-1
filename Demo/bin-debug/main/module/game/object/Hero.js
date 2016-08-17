/**
 *
 * @author
 *
 */
var Hero = (function (_super) {
    __extends(Hero, _super);
    function Hero($controller) {
        _super.call(this, $controller);
        this.aiReactionTime = 0.1;
        this.hpArr = [];
        this.posArr = [];
    }
    var d = __define,c=Hero,p=c.prototype;
    p.init = function (id, side) {
        _super.prototype.init.call(this, side);
        this.id = id;
        if (this.side == Side.Own) {
            this.scaleX = 1;
        }
        else if (this.side == Side.Enemy) {
            this.scaleX = -1;
        }
        this.heroData = GameManager.GetHeroData(id);
        this.width = this.heroData.width;
        this.height = this.heroData.height;
        this.anchorOffsetX = this.width / 2;
        this.anchorOffsetY = this.height / 2;
        //设置动画，并装上枪
        this.setAnim(this.heroData.anim);
        this.setGun(this.heroData.gun);
        this.isUp = false;
        this.speed = 0;
        //血条
        this.hp = 0;
        this.addHp(this.heroData.hp);
        this.showFreez(false);
        this.rotation = 0;
        this.aiReactionCd = 0;
    };
    p.setAnim = function (anim) {
        if (this.anim == null) {
            this.anim = new egret.MovieClip();
            this.anim.scaleX = this.anim.scaleY = 0.8;
            this.anim.anchorOffsetX = -this.width / 2 / 0.8;
            this.anim.anchorOffsetY = -this.height / 0.8;
            this.addChild(this.anim);
        }
        var mcData = RES.getRes("hero_json");
        var mcTexture = RES.getRes("hero_png");
        var mcDataFactory = new egret.MovieClipDataFactory(mcData, mcTexture);
        this.anim.movieClipData = mcDataFactory.generateMovieClipData(anim);
        this.anim.gotoAndPlay(1, -1);
    };
    p.setGun = function (id) {
        if (this.gun == null) {
            this.gun = new egret.Bitmap;
            this.gun.x = this.heroData.gunX;
            this.gun.y = this.heroData.gunY;
            this.addChild(this.gun);
        }
        this.gun.visible = true;
        this.gunData = GameManager.GetGunData(id);
        this.gun.texture = RES.getRes(this.gunData.img);
        this.shootCd = this.shootInterval;
    };
    p.addHp = function (value) {
        var _loop_1 = function(i) {
            var bar;
            if (this_1.hpArr.length > i) {
                bar = this_1.hpArr[i];
            }
            else {
                bar = new egret.Shape();
                bar.graphics.beginFill(0xff00ff);
                bar.graphics.drawRect(0, 0, 20, 15);
                bar.graphics.endFill();
                bar.x = -40;
                bar.y = i * 25;
                this_1.addChild(bar);
                this_1.hpArr.push(bar);
            }
            bar.visible = true;
            bar.scaleX = bar.scaleY = 0.01;
            egret.setTimeout(function () {
                egret.Tween.get(bar).to({ scaleX: 1, scaleY: 1 }, 300, egret.Ease.elasticOut);
            }, this_1, 200 * i);
        };
        var this_1 = this;
        for (var i = this.hp; i < this.hp + value; i++) {
            _loop_1(i);
        }
        this.hp += value;
    };
    p.subHp = function (value) {
        var _loop_2 = function(i) {
            var bar = this_2.hpArr[i];
            egret.setTimeout(function () {
                egret.Tween.get(bar).to({ scaleX: 0.01, scaleY: 0.01 }, 300, egret.Ease.elasticOut)
                    .call(function () {
                    bar.visible = false;
                });
            }, this_2, 200 * (this_2.hp - 1 - i));
        };
        var this_2 = this;
        for (var i = this.hp - 1; i >= Math.max(0, this.hp - value); i--) {
            _loop_2(i);
        }
        this.hp = Math.max(0, this.hp - value);
        if (this.hp <= 0) {
            this.state = HeroState.Die;
            App.ControllerManager.applyFunc(ControllerConst.Game, GameConst.HeroDie, this);
        }
    };
    p.showFreez = function (v) {
        if (this.freezImg == null) {
            this.freezImg = App.DisplayUtils.createBitmap("freez_png");
            this.addChild(this.freezImg);
            this.freezImg.anchorOffsetX = this.freezImg.width / 2;
            this.freezImg.anchorOffsetY = this.freezImg.height / 2;
        }
        this.freezImg.x = this.width / 2;
        this.freezImg.y = this.height / 2;
        this.freezImg.visible = v;
    };
    p.SetAI = function (aiType) {
        this.aiType = aiType;
    };
    p.SetPosArr = function (posX_1, posX_2) {
        this.posArr = [posX_1, posX_2];
    };
    p.ChangeGun = function (id) {
        this.setGun(id);
    };
    p.Entrance = function () {
        this.Move(new egret.Point(this.posArr[0], this.y));
        this.curPosIndex = 0;
    };
    p.Move = function (pos) {
        this.state = HeroState.Move;
        this.targetPos = pos;
    };
    p.ToIdle = function () {
        this.state = HeroState.Idle;
    };
    p.Hurt = function (damage) {
        if (damage <= 0) {
            return;
        }
        App.ShockUtils.shock(App.ShockUtils.SPRITE, this, 1);
        this.state = HeroState.Hurt;
        this.hurtTime = 0;
        this.subHp(damage);
    };
    p.Freez = function (duration) {
        this.state = HeroState.Freez;
        this.freezTime = duration;
    };
    p.Release = function (duration) {
        this.state = HeroState.Release;
        this.releaseTime = duration;
    };
    p.Dodge = function () {
        if (this.state != HeroState.Idle) {
            return;
        }
        this.state = HeroState.Dodge;
        if (this.curPosIndex == 0) {
            this.curPosIndex = 1;
        }
        else {
            this.curPosIndex = 0;
        }
        this.targetPos = new egret.Point(this.posArr[this.curPosIndex], this.y);
    };
    p.Shoot = function () {
        var _this = this;
        if (this.state != HeroState.Idle) {
            return;
        }
        if (this.shootCd <= 0) {
            var bulletId = this.gunData.bullet;
            var createFunc = function (type, direction) {
                var x = _this.x + (_this.gun.x + _this.gunData.bulletX - _this.anchorOffsetX) * _this.scaleX;
                var y = _this.y - _this.anchorOffsetY + _this.gun.y + _this.gunData.bulletY;
                var moveData = new MoveData(direction);
                App.ControllerManager.applyFunc(ControllerConst.Game, GameConst.CeateBullet, bulletId, type, _this, x, y, moveData);
            };
            switch (this.gunData.type) {
                case GunType.Normal:
                    createFunc("NormalBullet", 0);
                    this.shootCd = this.shootInterval;
                    break;
                case GunType.Running:
                    var info = this.gunData.info;
                    var count = info.count;
                    var interval = info.interval * 1000;
                    App.TimerManager.doTimer(interval, count, function () { return createFunc("NormalBullet", 0); }, this);
                    this.ResetGun();
                    break;
                case GunType.Shot:
                    var info = this.gunData.info;
                    var count = info.count;
                    var angle = info.angle;
                    var ini_angle = -(count - 1) / 2 * angle;
                    for (var i = 0; i < count; i++) {
                        createFunc("NormalBullet", ini_angle + i * angle);
                    }
                    this.ResetGun();
                    break;
                case GunType.Boomerang:
                    this.gun.visible = false;
                    createFunc("BoomerangBullet", 0);
                    this.shootCd = 100;
                    break;
                case GunType.Laser:
                    createFunc("LaserBullet", 0);
                    this.shootCd = 100;
                    break;
                case GunType.Freez:
                    createFunc("FreezBullet", 0);
                    this.ResetGun();
                    break;
                case GunType.Grenade:
                    var info = this.gunData.info;
                    var direction = info.direction;
                    createFunc("GrenadeBullet", direction);
                    this.ResetGun();
                    break;
                case GunType.Wave:
                    createFunc("WaveBullet", direction);
                    this.ResetGun();
                    break;
                default:
                    break;
            }
        }
    };
    p.GunReturn = function () {
        this.gun.visible = true;
        this.shootCd = this.shootInterval;
    };
    p.ResetGun = function () {
        this.ChangeGun(this.heroData.gun);
    };
    p.update = function (time) {
        _super.prototype.update.call(this, time);
        var t = time / 1000;
        switch (this.state) {
            case HeroState.Move:
                var xa = time / 2;
                var ya = xa * (this.targetPos.y - this.y) / (this.targetPos.x - this.x);
                var ra = time / 2;
                var r = 45;
                if (this.scaleX == 1) {
                    if (this.x < this.targetPos.x) {
                        this.x = Math.min(this.targetPos.x, this.x + xa);
                        if (this.rotation < r) {
                            this.rotation = Math.min(r, this.rotation + ra);
                        }
                    }
                    else {
                        this.rotation = Math.max(0, this.rotation - ra);
                        if (this.rotation == 0) {
                            this.state = HeroState.Idle;
                        }
                    }
                }
                else {
                    if (this.x > this.targetPos.x) {
                        this.x = Math.max(this.targetPos.x, this.x - xa);
                        if (this.rotation > -r) {
                            this.rotation = Math.max(-r, this.rotation - ra);
                        }
                    }
                    else {
                        this.rotation = Math.min(0, this.rotation + ra);
                        if (this.rotation == 0) {
                            this.state = HeroState.Idle;
                        }
                    }
                }
                if (this.y < this.targetPos.y) {
                    this.y = Math.min(this.y + Math.abs(ya), this.targetPos.y);
                }
                else if (this.y > this.targetPos.y) {
                    this.y = Math.max(this.y - Math.abs(ya), this.targetPos.y);
                }
                return;
            case HeroState.Dodge:
                var xa = time * 1.5;
                var ra = time * 1.5;
                var r = 45;
                if (this.x > this.targetPos.x) {
                    this.x = Math.max(this.targetPos.x, this.x - xa);
                    if (this.rotation > -r) {
                        this.rotation = Math.max(-r, this.rotation - ra);
                    }
                }
                else if (this.x < this.targetPos.x) {
                    this.x = Math.min(this.targetPos.x, this.x + xa);
                    if (this.rotation < r) {
                        this.rotation = Math.min(r, this.rotation + ra);
                    }
                }
                else {
                    if (this.rotation > 0) {
                        this.rotation = Math.max(0, this.rotation - ra);
                    }
                    else if (this.rotation < 0) {
                        this.rotation = Math.min(0, this.rotation + ra);
                    }
                    else {
                        this.state = HeroState.Idle;
                        this.speed = 0;
                    }
                }
                return;
            case HeroState.Idle:
                if (this.side == Side.Enemy) {
                    switch (this.aiType) {
                        case AiType.Follow:
                            this.followAi(t);
                            break;
                        default:
                            break;
                    }
                }
                break;
            case HeroState.Hurt:
                this.hurtTime -= t;
                if (this.hurtTime <= 0) {
                    this.state = HeroState.Idle;
                }
                break;
            case HeroState.Freez:
                this.isUp = false;
                this.freezTime -= t;
                this.showFreez(true);
                this.speed = 0;
                if (this.freezTime <= 0) {
                    this.state = HeroState.Idle;
                    this.showFreez(false);
                }
                break;
            case HeroState.Release:
                this.isUp = false;
                this.releaseTime -= t;
                this.speed = 0;
                if (this.releaseTime <= 0) {
                    this.state = HeroState.Idle;
                }
                break;
        }
        if (this.shootCd > 0) {
            this.shootCd -= t;
        }
        var as = this.heroData.downAs;
        if (this.isUp) {
            as = this.heroData.upAs;
        }
        var s = this.speed;
        this.speed = Math.max(Math.min(this.speed + as * t, this.heroData.maxSpeed), this.heroData.minSpeed);
        this.y -= (s + this.speed) / 2 * t;
        if (this.gameController.CheckHeroOut(this)) {
            this.speed = 0;
        }
    };
    d(p, "IsUp",undefined
        ,function (value) {
            this.isUp = value;
        }
    );
    p.followAi = function (t) {
        if (this.aiReactionCd > 0) {
            this.aiReactionCd -= t;
            return;
        }
        var safeArea = this.gameController.GetSafeArea(this);
        var up = null;
        if (safeArea.length > 0) {
            var idx = -1;
            var l = 1000;
            for (var i = 0; i < safeArea.length; i++) {
                var min = safeArea[i][0] + this.height / 1.8;
                var max = safeArea[i][1] - this.height / 1.8;
                if (this.speed > 0) {
                    min += this.speed * 0.2;
                }
                else {
                    max += this.speed * 0.2;
                }
                if (this.y > min && this.y < max) {
                    break;
                }
                else if (this.y <= min) {
                    if (min - this.y < l) {
                        up = false;
                        idx = i;
                    }
                }
                else {
                    if (this.y - max) {
                        up = true;
                        idx = i;
                    }
                }
            }
        }
        var r = this.gameController.CheckEnemyPosByHero(this);
        if (up == null) {
            if (r > 0) {
                up = true;
            }
            else {
                up = false;
            }
        }
        if (up != null) {
            if (this.isUp != up) {
                this.aiReactionCd = this.aiReactionTime;
            }
            this.isUp = up;
        }
        if (r == 0) {
            this.Shoot();
        }
    };
    p.GetState = function () {
        return this.state;
    };
    d(p, "rect"
        ,function () {
            if (this.state == HeroState.Move || this.state == HeroState.Die || this.state == HeroState.Dodge) {
                return (new Rect(-10000, -10000, 0, 0, this.rotation));
            }
            return new Rect(this.x, this.y, this.width, this.height, this.rotation);
        }
    );
    d(p, "shootInterval"
        ,function () {
            return this.gunData.interval;
        }
    );
    return Hero;
}(BaseGameObject));
egret.registerClass(Hero,'Hero');
var HeroState;
(function (HeroState) {
    HeroState[HeroState["Move"] = 0] = "Move";
    HeroState[HeroState["Idle"] = 1] = "Idle";
    HeroState[HeroState["Dodge"] = 2] = "Dodge";
    HeroState[HeroState["Hurt"] = 3] = "Hurt";
    HeroState[HeroState["Freez"] = 4] = "Freez";
    HeroState[HeroState["Release"] = 5] = "Release";
    HeroState[HeroState["Die"] = 6] = "Die";
})(HeroState || (HeroState = {}));
var AiType;
(function (AiType) {
    AiType[AiType["Follow"] = 0] = "Follow";
})(AiType || (AiType = {}));
