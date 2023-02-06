window.__require=function t(e,n,o){function r(c,a){if(!n[c]){if(!e[c]){var l=c.split("/");if(l=l[l.length-1],!e[l]){var u="function"==typeof __require&&__require;if(!a&&u)return u(l,!0);if(i)return i(l,!0);throw new Error("Cannot find module '"+c+"'")}c=l}var s=n[c]={exports:{}};e[c][0].call(s.exports,function(t){return r(e[c][1][t]||t)},s,s.exports,t,e,n,o)}return n[c].exports}for(var i="function"==typeof __require&&__require,c=0;c<o.length;c++)r(o[c]);return r}({"balancing-button":[function(t,e,n){"use strict";cc._RF.push(e,"f3d32S9ObxIyJpgmL+EfSK7","balancing-button");var o,r=this&&this.__extends||(o=function(t,e){return(o=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&(t[n]=e[n])})(t,e)},function(t,e){function n(){this.constructor=t}o(t,e),t.prototype=null===e?Object.create(e):(n.prototype=e.prototype,new n)}),i=this&&this.__decorate||function(t,e,n,o){var r,i=arguments.length,c=i<3?e:null===o?o=Object.getOwnPropertyDescriptor(e,n):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)c=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(r=t[a])&&(c=(i<3?r(c):i>3?r(e,n,c):r(e,n))||c);return i>3&&c&&Object.defineProperty(e,n,c),c};Object.defineProperty(n,"__esModule",{value:!0});var c=cc._decorator.ccclass,a=t("./balancing"),l=t("../../../common/scripts/lib/error-handler"),u=function(t){function e(){var e=null!==t&&t.apply(this,arguments)||this;return e._clicked=!1,e._enabled=!1,e}return r(e,t),e.prototype.onLoad=function(){this._enabled=!0},e.prototype.onButtonClick=function(){if(!this._clicked&&this._enabled){this._clicked=!0;var t=new cc.Event.EventCustom(a.BALANCE_BTN_CLICKED,!0);t.setUserData({type:this.node.name}),this.node.dispatchEvent(t)}},e.prototype.makeInteractable=function(t){var e=this.node.getComponent(cc.Button);e&&(e.interactable=t,this._enabled=t)},Object.defineProperty(e.prototype,"clicked",{set:function(t){this._clicked=t},enumerable:!1,configurable:!0}),i([l.default()],e.prototype,"onLoad",null),i([l.default()],e.prototype,"onButtonClick",null),i([l.default()],e.prototype,"makeInteractable",null),i([c],e)}(cc.Component);n.default=u,cc._RF.pop()},{"../../../common/scripts/lib/error-handler":void 0,"./balancing":"balancing"}],balancing:[function(t,e,n){"use strict";cc._RF.push(e,"80af9ysOR1FIJNUu6o0KJj0","balancing");var o,r=this&&this.__extends||(o=function(t,e){return(o=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&(t[n]=e[n])})(t,e)},function(t,e){function n(){this.constructor=t}o(t,e),t.prototype=null===e?Object.create(e):(n.prototype=e.prototype,new n)}),i=this&&this.__decorate||function(t,e,n,o){var r,i=arguments.length,c=i<3?e:null===o?o=Object.getOwnPropertyDescriptor(e,n):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)c=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(r=t[a])&&(c=(i<3?r(c):i>3?r(e,n,c):r(e,n))||c);return i>3&&c&&Object.defineProperty(e,n,c),c};Object.defineProperty(n,"__esModule",{value:!0}),n.BALANCE_BTN_CLICKED=n.BACK_GROUND=n.RIGHT_BTN=n.LEFT_BTN=n.EQUAL_BTN=void 0;var c=cc._decorator.ccclass,a=cc._decorator.property,l=t("../../../common/scripts/game"),u=t("../../../common/scripts/lib/config"),s=t("../../../common/scripts/lib/error-handler"),p=t("../../../common/scripts/util"),h=t("./balancing-button");n.EQUAL_BTN="equalBtn",n.LEFT_BTN="leftBtn",n.RIGHT_BTN="rightBtn",n.BACK_GROUND="Background",n.BALANCE_BTN_CLICKED="BalanceBtnClicked";var f=function(t){function e(){var e=null!==t&&t.apply(this,arguments)||this;return e._currentConfig=null,e._images=["apple","guava","orange","peach"],e.apple=null,e.guava=null,e.orange=null,e.peach=null,e.numberLabelPrefab=null,e.imageNodePrefab=null,e.loadingAudio=null,e.correctAudio=null,e.inCorrectAudio=null,e._leftCount=null,e._rightCount=null,e._leftBucket=null,e._rightBucket=null,e._leftBtn=null,e._rightBtn=null,e._equalBtn=null,e._correctAnswered=!1,e}return r(e,t),e.prototype.onLoad=function(){var t=this;this._currentConfig=this.processConfiguration(u.default.getInstance().data[0]),this.buildUI(),this.node.on(n.BALANCE_BTN_CLICKED,function(e){e.stopPropagation();var n=e.getUserData();t.checkResult(n.type)})},e.prototype.checkResult=function(t){switch(t){case n.LEFT_BTN:this._leftCount>this._rightCount?this.playCorrectAnimation():this.playWrongAnimation();break;case n.RIGHT_BTN:this._leftCount<this._rightCount?this.playCorrectAnimation():this.playWrongAnimation();break;case n.EQUAL_BTN:this._leftCount===this._rightCount?this.playCorrectAnimation():this.playWrongAnimation()}},e.prototype.foodFeedingAnim=function(t){var e=this,n=t?340:-350,o=t?this._leftBucket:this._rightBucket;return(new cc.Tween).target(o).call(function(){e.friend.playAnimation("eating",1)}).parallel((new cc.Tween).to(.75,{x:o.x+n},{progress:null,easing:"quadOut"}),(new cc.Tween).to(.75,{y:o.y-10},{progress:null,easing:"backOut"}),(new cc.Tween).to(.75,{scale:.5},{progress:null,easing:"backOut"})).to(.75,{scale:0},{progress:null,easing:"backOut"})},e.prototype.playFeedDog=function(){var t=this;return this._leftCount>this._rightCount?this.foodFeedingAnim(!0):this._leftCount<this._rightCount?this.foodFeedingAnim(!1):this.foodFeedingAnim(!0).call(function(){t.foodFeedingAnim(!1).start()})},e.prototype.playCorrectAnimation=function(){var t=this;try{this._leftBtn.getComponent(h.default).makeInteractable(!1),this._rightBtn.getComponent(h.default).makeInteractable(!1),this._equalBtn.getComponent(h.default).makeInteractable(!1),this._correctAnswered||(this._correctAnswered=!0,this.node.emit("correct"),this.scheduleOnce(function(){t.playFeedDog().call(function(){t.scheduleOnce(function(){t.node.emit("nextProblem")},1)}).start()},2))}catch(e){}},e.prototype.playWrongAnimation=function(){var t=this;try{this._correctAnswered||(this.node.emit("wrong"),this.scheduleOnce(function(){t._leftBtn.getComponent(h.default).clicked=!1,t._rightBtn.getComponent(h.default).clicked=!1,t._equalBtn.getComponent(h.default).clicked=!1},.5))}catch(e){}},e.prototype.createImage=function(t,e){var n=cc.instantiate(this.imageNodePrefab);return n.getComponent(cc.Sprite).spriteFrame=this[e],n},e.prototype.buildUI=function(){this._leftBucket=this.node.getChildByName("balancingmachine_node").getChildByName("left_bucket").getChildByName("left_node"),this.setUpBucket(this._leftBucket,"left"),this._rightBucket=this.node.getChildByName("balancingmachine_node").getChildByName("right_bucket").getChildByName("right_node"),this.setUpBucket(this._rightBucket,"right"),this._leftBtn=this.node.getChildByName(n.LEFT_BTN),this._rightBtn=this.node.getChildByName(n.RIGHT_BTN),this._equalBtn=this.node.getChildByName(n.EQUAL_BTN),this.loadingAnimation()},e.prototype.playLoadingSound=function(t,e){var n=this;t>0&&(t--,this.scheduleOnce(function(){try{n.loadingAudio&&(p.Util.playSfx(n.loadingAudio),n.playLoadingSound(t,e/2))}catch(o){}},e))},e.prototype.loadingAnimation=function(){var t=this,e=this.node.getComponent(cc.Animation);this.playLoadingSound(2,.5),e.play("introduction_balance"),this.scheduleOnce(function(){t._leftCount>t._rightCount?p.Util.showHelp(t._leftBtn,t._leftBtn):t._leftCount<t._rightCount?p.Util.showHelp(t._rightBtn,t._rightBtn):p.Util.showHelp(t._equalBtn,t._equalBtn)},1)},e.prototype.setUpBucket=function(t,e){switch(this._currentConfig[e+"Property"]){case"image":this["_"+e+"Count"]=Number(this._currentConfig[e+"1Count"]),console.log("count for "+e+this._currentConfig[e+"1Count"]),console.log("counter property",this["_"+e+"Count"]),this.buildStack(e,t,this._currentConfig[e+"1Count"]);break;case"number":if(this._currentConfig[e+"1Count"]&&this._currentConfig[e+"2Count"]&&this._currentConfig[e+"Operator"]){switch(this._currentConfig[e+"Operator"]){case"+":this["_"+e+"Count"]=Number(this._currentConfig[e+"1Count"])+Number(this._currentConfig[e+"2Count"]);break;case"-":this["_"+e+"Count"]=Number(this._currentConfig[e+"1Count"])-Number(this._currentConfig[e+"2Count"])}this.equation(t,this._currentConfig[e+"1Count"],this._currentConfig[e+"Operator"],this._currentConfig[e+"2Count"])}else this["_"+e+"Count"]=Number(this._currentConfig[e+"1Count"]),this.showNumber(t,this._currentConfig[e+"1Count"])}},e.prototype.equation=function(t,e,n,o){this.showNumber(t,e+n+o)},e.prototype.showNumber=function(t,e){var n=cc.instantiate(this.numberLabelPrefab),o=n.getChildByName("label");if(null!==o){var r=o.getComponent(cc.Label);r.string=String(e),r.fontSize=120,t.addChild(n),o.addComponent(cc.LabelOutline).width=2,n.position=new cc.Vec2(0,0)}},e.prototype.buildStack=function(t,e,n){for(var o=0,r=(e.getParent().width,p.Util.randomElements(this._images,1)[0]),i=0;i<n;i++){var c=this.createImage("left"===t?0:1,r);e.addChild(c),o=3,c.position=new cc.Vec2((i%o==0?0:i%o==1?-1:1)*c.width,Math.floor(i/o)*c.height)}},e.prototype.processConfiguration=function(t){void 0===t&&(t=[]);var e=[].concat.apply([],t);return{level:e[0],worksheet:e[1],problem:e[2],leftProperty:e[3],left1Count:e[4],leftOperator:e[5],left2Count:e[6],rightProperty:e[7],right1Count:e[8],rightOperator:e[9],right2Count:e[10]}},i([a(cc.SpriteFrame)],e.prototype,"apple",void 0),i([a(cc.SpriteFrame)],e.prototype,"guava",void 0),i([a(cc.SpriteFrame)],e.prototype,"orange",void 0),i([a(cc.SpriteFrame)],e.prototype,"peach",void 0),i([a(cc.Prefab)],e.prototype,"numberLabelPrefab",void 0),i([a(cc.Prefab)],e.prototype,"imageNodePrefab",void 0),i([a(cc.AudioClip)],e.prototype,"loadingAudio",void 0),i([a(cc.AudioClip)],e.prototype,"correctAudio",void 0),i([a(cc.AudioClip)],e.prototype,"inCorrectAudio",void 0),i([s.catchError()],e.prototype,"onLoad",null),i([s.catchError()],e.prototype,"foodFeedingAnim",null),i([s.catchError()],e.prototype,"playFeedDog",null),i([s.catchError()],e.prototype,"playCorrectAnimation",null),i([s.catchError()],e.prototype,"playWrongAnimation",null),i([s.catchError()],e.prototype,"createImage",null),i([s.catchError()],e.prototype,"buildUI",null),i([s.catchError()],e.prototype,"playLoadingSound",null),i([s.catchError()],e.prototype,"loadingAnimation",null),i([s.catchError()],e.prototype,"setUpBucket",null),i([s.catchError()],e.prototype,"equation",null),i([s.catchError()],e.prototype,"showNumber",null),i([s.catchError()],e.prototype,"buildStack",null),i([c],e)}(l.default);n.default=f,cc._RF.pop()},{"../../../common/scripts/game":void 0,"../../../common/scripts/lib/config":void 0,"../../../common/scripts/lib/error-handler":void 0,"../../../common/scripts/util":void 0,"./balancing-button":"balancing-button"}]},{},["balancing-button","balancing"]);