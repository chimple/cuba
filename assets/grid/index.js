window.__require=function t(o,e,n){function i(c,s){if(!e[c]){if(!o[c]){var l=c.split("/");if(l=l[l.length-1],!o[l]){var d="function"==typeof __require&&__require;if(!s&&d)return d(l,!0);if(r)return r(l,!0);throw new Error("Cannot find module '"+c+"'")}c=l}var a=e[c]={exports:{}};o[c][0].call(a.exports,function(t){return i(o[c][1][t]||t)},a,a.exports,t,o,e,n)}return e[c].exports}for(var r="function"==typeof __require&&__require,c=0;c<n.length;c++)i(n[c]);return i}({CommonBlock:[function(t,o,e){"use strict";cc._RF.push(o,"67f43WsyVpLZ7sWQJdjmnZ6","CommonBlock");var n,i=this&&this.__extends||(n=function(t,o){return(n=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,o){t.__proto__=o}||function(t,o){for(var e in o)Object.prototype.hasOwnProperty.call(o,e)&&(t[e]=o[e])})(t,o)},function(t,o){function e(){this.constructor=t}n(t,o),t.prototype=null===o?Object.create(o):(e.prototype=o.prototype,new e)}),r=this&&this.__decorate||function(t,o,e,n){var i,r=arguments.length,c=r<3?o:null===n?n=Object.getOwnPropertyDescriptor(o,e):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)c=Reflect.decorate(t,o,e,n);else for(var s=t.length-1;s>=0;s--)(i=t[s])&&(c=(r<3?i(c):r>3?i(o,e,c):i(o,e))||c);return r>3&&c&&Object.defineProperty(o,e,c),c};Object.defineProperty(e,"__esModule",{value:!0}),e.DEFAULT_FONT_COLOR=void 0;var c=cc._decorator.property,s=cc.Label.Overflow,l=t("../../../common/scripts/lib/error-handler"),d=t("../../../common/scripts/chimple-label");e.DEFAULT_FONT_COLOR=cc.Color.BLACK;var a=function(t){function o(){var o=null!==t&&t.apply(this,arguments)||this;return o.slotSelectedPrefab=null,o._contentText=null,o._fontSize=null,o._fontColor=null,o._questionSound=null,o.highlightNode=null,o._isHighlightNodePresent=!1,o}return i(o,t),Object.defineProperty(o.prototype,"contentText",{get:function(){return this._contentText},set:function(t){this._contentText=t},enumerable:!1,configurable:!0}),Object.defineProperty(o.prototype,"fontSize",{get:function(){return this._fontSize},set:function(t){this._fontSize=t},enumerable:!1,configurable:!0}),Object.defineProperty(o.prototype,"fontColor",{get:function(){return this._fontColor},set:function(t){this._fontColor=t},enumerable:!1,configurable:!0}),o.prototype.createLabelNode=function(t,o,n,i,r){void 0===t&&(t=null),void 0===o&&(o=""),void 0===n&&(n="10"),void 0===i&&(i=null),void 0===r&&(r=!0);var c=new cc.Node(o),l=c.addComponent(d.default);l.string=r?o:"",l.overflow=s.NONE;var a=e.DEFAULT_FONT_COLOR;i&&(a=a.fromHEX(i)),c.color=a,c.addComponent(cc.LabelOutline).width=3;var h=parseInt(n);return l.fontSize=h,l.lineHeight=h,c.position=new cc.Vec2(0,.1*h),c},o.prototype.getRandom=function(t,o){return Math.random()*(o-t)+t},o.prototype.addHighLightedNode=function(){!this._isHighlightNodePresent&&this.highlightNode&&(this._isHighlightNodePresent=!0,this.highlightNode.width=this.node.width,this.highlightNode.height=this.node.height,this.node.addChild(this.highlightNode))},o.prototype.removeHighLightedNode=function(){this._isHighlightNodePresent&&this.highlightNode&&(this._isHighlightNodePresent=!1,this.node.removeChild(this.highlightNode))},r([c(cc.Prefab)],o.prototype,"slotSelectedPrefab",void 0),r([l.default()],o.prototype,"createLabelNode",null),r([l.default()],o.prototype,"addHighLightedNode",null),r([l.default()],o.prototype,"removeHighLightedNode",null),o}(cc.Component);e.default=a,cc._RF.pop()},{"../../../common/scripts/chimple-label":void 0,"../../../common/scripts/lib/error-handler":void 0}],answerblock:[function(t,o,e){"use strict";cc._RF.push(o,"736a5xa/ABAMYiLpVMzh3hK","answerblock");var n,i=this&&this.__extends||(n=function(t,o){return(n=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,o){t.__proto__=o}||function(t,o){for(var e in o)Object.prototype.hasOwnProperty.call(o,e)&&(t[e]=o[e])})(t,o)},function(t,o){function e(){this.constructor=t}n(t,o),t.prototype=null===o?Object.create(o):(e.prototype=o.prototype,new e)}),r=this&&this.__decorate||function(t,o,e,n){var i,r=arguments.length,c=r<3?o:null===n?n=Object.getOwnPropertyDescriptor(o,e):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)c=Reflect.decorate(t,o,e,n);else for(var s=t.length-1;s>=0;s--)(i=t[s])&&(c=(r<3?i(c):r>3?i(o,e,c):i(o,e))||c);return r>3&&c&&Object.defineProperty(o,e,c),c};Object.defineProperty(e,"__esModule",{value:!0});var c=t("./CommonBlock"),s=t("./grid"),l=t("./wordblock"),d=t("./questionblock"),a=t("../../../common/scripts/util"),h=t("../../../common/scripts/lib/config"),u=cc.Vec2,p=t("../../../common/scripts/lib/error-handler"),f=cc._decorator,g=f.ccclass,_=f.property,m=function(t){function o(){var o=null!==t&&t.apply(this,arguments)||this;return o.originalPosition=new u(0,0),o.finishPosition=new u(0,0),o.matchRect=null,o.match=!1,o.moved=!1,o._sound=null,o._explode=null,o._startPos=null,o._isRTL=!1,o.shouldStopMovementX=!1,o.shouldStopMovementY=!1,o.wrongMoveAudio=null,o.rightMoveAudio=null,o.problemClear=null,o.explodeParticle=null,o.questionBlocksMap=new Map,o}return i(o,t),o.prototype.onLoad=function(){var t=this;this.node.on(s.TouchEvents.TOUCH_START,this.onTouchStart,this),this.node.on(s.TouchEvents.TOUCH_END,this.onTouchEnd,this),this.node.on(s.TouchEvents.TOUCH_MOVE,this.onTouchMove,this),this.node.on(s.TouchEvents.TOUCH_CANCEL,this.onTouchEnd,this),this.fontColor="#654321";var o=this.createLabelNode(null,this.contentText,this.fontSize,this.fontColor);this._isRTL=h.default.i.direction==h.Direction.RTL,this._isRTL?(this.node.scaleX*=-s.SCALE,this.node.scaleY*=s.SCALE):this.node.scale*=s.SCALE,this.node.addChild(o),this.node.width=s.Grid._maxNodeWidth,this.node.height=s.Grid._maxNodeHeight,this.highlightNode=cc.instantiate(this.slotSelectedPrefab),a.Util.loadGameSound(this.contentText,function(o){t._sound=o})},o.prototype.start=function(){var t=this.contentText+s.PLACEHOLDER_PAIR,o=this.node.parent.getChildByName("ground");this.pairingPlaceHolderBlock=o.getChildByName(t).getComponent(l.default);var e=this.pairingPlaceHolderBlock.node.getBoundingBox();this.matchRect=cc.Rect.fromMinMax(cc.v2(e.x+40,e.y+40),cc.v2(e.x+e.width-40,e.y+e.height-40)),this.finishPosition=this.pairingPlaceHolderBlock.node.position;var n=cc.moveTo(.3,this.originalPosition);this.node.runAction(n)},o.prototype.checkRTLAndScale=function(t){return this._isRTL?-t*s.SCALE:t*s.SCALE},o.prototype.renderAnswerHolder=function(t){if(t.yPositionAdj=25,this.render(t),t.combinedQAndA){var o=t.content,e=[];t.combinedQAndA.split("-").map(function(t){e.push(t)}),this.questionBlocksMap.set(o,e)}},o.prototype.render=function(t){var o=t.xPositions[t.index],e=-t.groundHeight*s.HALF+s.HALF*s.V_MARGIN;this.originalPosition=new u(o,e),this.originalPosition.y+=t.yPositionAdj?t.yPositionAdj:0,this.grid=t.wordMatrix,this.fontSize=s.FONT_SIZE,this.contentText=t.content,this.node.setPosition(this.originalPosition.x,this.originalPosition.y),t.parentNode.addChild(this.node)},o.prototype.onTouchStart=function(t){var o=this;this.shouldStopMovementX=!1,this.shouldStopMovementY=!1;var e=this.node.getParent().convertToNodeSpaceAR(t.getLocation());this._startPos=e,this.match?(new cc.Tween).target(this.node).to(.1,{scaleX:this.checkRTLAndScale(1.1),scaleY:1.1*s.SCALE},{progress:null,easing:"sineOut"}).call(function(){o.speak()}).start():(this.moved=!1,(new cc.Tween).target(this.node).to(.1,{scaleX:this.checkRTLAndScale(1.1),scaleY:1.1*s.SCALE},{progress:null,easing:"sineOut"}).call(function(){o.speak()}).start())},o.prototype.speak=function(){try{this._sound?(this._soundID=a.Util.play(this._sound,!1),-1===this._soundID&&a.Util.speakGameAudioOrPhonics(this.contentText,function(){})):a.Util.speakGameAudioOrPhonics(this.contentText,function(){})}catch(t){}},o.prototype.onTouchMove=function(t){var o=this;this.moved=!0;var e=new cc.Vec2(1/s.MATRIX_CONTAINER_SCALE*t.getDelta().x,1/s.MATRIX_CONTAINER_SCALE*t.getDelta().y);this.node.setPosition(this.node.position.add(cc.v2(this._isRTL?e.neg().x:e.x,e.y))),this.node.getBoundingBox().intersects(this.matchRect)?(this.match=!0,this.pairingPlaceHolderBlock.removeHighLightedNode(),this.pairingPlaceHolderBlock.addHighLightedNode(),this.questionBlocksMap.get(this.contentText).forEach(function(t){o.node.parent.getChildByName("ground").getChildByName(t).getComponent(d.default).addHighLightedNode()})):(this.match=!1,this.pairingPlaceHolderBlock.removeHighLightedNode(),this.questionBlocksMap.get(this.contentText).forEach(function(t){o.node.parent.getChildByName("ground").getChildByName(t).getComponent(d.default).removeHighLightedNode()})),(new cc.Tween).target(this.node).call(function(){cc.audioEngine.stopEffect(o._sound)}).to(.15,{scaleX:this.checkRTLAndScale(1),scaleY:s.SCALE},{progress:null,easing:"sineOut"}).start()},o.prototype.shouldConsiderAsInvalidMove=function(){this.node.position.x>cc.winSize.width/2-50?(this.node.position.x=cc.winSize.width/2-50,this.shouldStopMovementX=!0):this.node.position.x<-cc.winSize.width/2+50&&(this.node.position.x=-cc.winSize.width/2+50,this.shouldStopMovementX=!0),this.node.position.y>cc.winSize.height/2-50?(this.node.position.y=cc.winSize.height/2-50,this.shouldStopMovementY=!0):this.node.position.y<-cc.winSize.height/2&&(this.node.position.y=-cc.winSize.height/2+50,this.shouldStopMovementY=!0)},o.prototype.onTouchEnd=function(t){var o=this.node.getParent().convertToNodeSpaceAR(t.getLocation()).sub(this._startPos);(new cc.Tween).target(this.node).to(.15,{scaleX:this.checkRTLAndScale(1),scaleY:s.SCALE},{progress:null,easing:"sineOut"}).start();var e=o.magSqr()>=50;this.match?this.matchFound():(this.match=!1,this.matchNotFound(e))},o.prototype.matchFound=function(){var t=this;this.match=!0,this.node.off(s.TouchEvents.TOUCH_MOVE),this.node.off(s.TouchEvents.TOUCH_END),this.node.parent.emit("correct"),this.moveToPos(this.finishPosition).call(function(){t.removeHighLightedNode(),t.sparkle(),t.rightMoveAudio&&a.Util.playSfx(t.rightMoveAudio),t.grid.scheduleOnce(function(){t.unSparkle(),t.grid.wordMatched(t.contentText)},.5),t.questionBlocksMap.get(t.contentText).forEach(function(o){t.node.parent.getChildByName("ground").getChildByName(o).getComponent(d.default).removeHighLightedNode()}),t.moved=!1}).start()},o.prototype.matchNotFound=function(t){var o=this;this.moveToPos(this.originalPosition).call(function(){o.moved&&t&&(o.wrongMoveAudio&&a.Util.playSfx(o.wrongMoveAudio),o.node.parent.emit("wrong"),o.moved=!1)}).start()},o.prototype.moveToPos=function(t){return(new cc.Tween).target(this.node).to(.15,{position:t,scaleX:this.checkRTLAndScale(1),scaleY:s.SCALE},{progress:null,easing:"quadOut"})},o.prototype.onDestroy=function(){cc.audioEngine.stopAllEffects()},o.prototype.sparkle=function(){this._explode=cc.instantiate(this.explodeParticle),this._explode.position=this.node.position,this.node.parent.addChild(this._explode)},o.prototype.unSparkle=function(){null!=this._explode&&(this.node.removeChild(this._explode),this._explode=null)},o.prototype.update=function(){this.shouldConsiderAsInvalidMove(),(this.shouldStopMovementX||this.shouldStopMovementY)&&this.matchNotFound(!1)},r([_({type:cc.AudioClip})],o.prototype,"wrongMoveAudio",void 0),r([_({type:cc.AudioClip})],o.prototype,"rightMoveAudio",void 0),r([_({type:cc.AudioClip})],o.prototype,"problemClear",void 0),r([_(cc.Prefab)],o.prototype,"explodeParticle",void 0),r([p.default()],o.prototype,"onLoad",null),r([p.default()],o.prototype,"start",null),r([p.default()],o.prototype,"checkRTLAndScale",null),r([p.default()],o.prototype,"renderAnswerHolder",null),r([p.default()],o.prototype,"render",null),r([p.default()],o.prototype,"onTouchStart",null),r([p.default()],o.prototype,"speak",null),r([p.default()],o.prototype,"onTouchMove",null),r([p.default()],o.prototype,"onTouchEnd",null),r([p.default()],o.prototype,"matchFound",null),r([p.default()],o.prototype,"matchNotFound",null),r([p.default()],o.prototype,"moveToPos",null),r([p.default()],o.prototype,"sparkle",null),r([p.default()],o.prototype,"unSparkle",null),r([g],o)}(c.default);e.default=m,cc._RF.pop()},{"../../../common/scripts/lib/config":void 0,"../../../common/scripts/lib/error-handler":void 0,"../../../common/scripts/util":void 0,"./CommonBlock":"CommonBlock","./grid":"grid","./questionblock":"questionblock","./wordblock":"wordblock"}],grid:[function(t,o,e){"use strict";cc._RF.push(o,"3ca74VIctlE4JZY6uSw5DYe","grid");var n,i=this&&this.__extends||(n=function(t,o){return(n=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,o){t.__proto__=o}||function(t,o){for(var e in o)Object.prototype.hasOwnProperty.call(o,e)&&(t[e]=o[e])})(t,o)},function(t,o){function e(){this.constructor=t}n(t,o),t.prototype=null===o?Object.create(o):(e.prototype=o.prototype,new e)}),r=this&&this.__decorate||function(t,o,e,n){var i,r=arguments.length,c=r<3?o:null===n?n=Object.getOwnPropertyDescriptor(o,e):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)c=Reflect.decorate(t,o,e,n);else for(var s=t.length-1;s>=0;s--)(i=t[s])&&(c=(r<3?i(c):r>3?i(o,e,c):i(o,e))||c);return r>3&&c&&Object.defineProperty(o,e,c),c};Object.defineProperty(e,"__esModule",{value:!0}),e.Grid=e.TouchEvents=e.BLOCK_TYPE=e.PLACEHOLDER_PAIR=e.FONT_SIZE=e.HALF=e.SCALE=e.MATRIX_CONTAINER_SCALE=e.V_MARGIN=e.H_MARGIN=e.H_GAP=e.V_GAP=e.GAME_SOUND=void 0;var c,s=cc._decorator.ccclass,l=cc._decorator.property,d=t("../../../common/scripts/lib/config"),a=t("./answerblock"),h=t("./wordblock"),u=cc.Vec2,p=t("./questionblock"),f=t("../../../common/scripts/util"),g=t("../../../common/scripts/lib/error-handler"),_=t("../../../common/scripts/game");e.GAME_SOUND="games/grid/sound/",e.V_GAP=18,e.H_GAP=20,e.H_MARGIN=50,e.V_MARGIN=30,e.MATRIX_CONTAINER_SCALE=1,e.SCALE=1,e.HALF=.5,e.FONT_SIZE="65",e.PLACEHOLDER_PAIR="-PAIR",function(t){t[t.H_QUESTION=0]="H_QUESTION",t[t.V_QUESTION=1]="V_QUESTION",t[t.ANSWER=2]="ANSWER",t[t.PLACEHOLDER=3]="PLACEHOLDER"}(c=e.BLOCK_TYPE||(e.BLOCK_TYPE={})),function(t){t.TOUCH_START="touchstart",t.TOUCH_END="touchend",t.TOUCH_MOVE="touchmove",t.TOUCH_CANCEL="touchCancel"}(e.TouchEvents||(e.TouchEvents={}));var m=function(t){function o(){var o=null!==t&&t.apply(this,arguments)||this;return o.groundPrefab=null,o.questionBlockPrefab=null,o.answerBlockPrefab=null,o.wordBlockPrefab=null,o.gameLoadAudio=null,o.currentConfig=null,o._remainingAnswers=[],o._matchedCounterInCurrentRun=0,o._helpDragNode=null,o._helpDropNode=null,o._isRTL=!1,o}var n;return i(o,t),n=o,o.prototype.onLoad=function(){var t=this;n._horizontalPositions=[],n._verticalPositions=[],this.currentConfig=this.processConfiguration(d.default.getInstance().data[0]),this._isRTL=d.default.i.direction==d.Direction.RTL,f.Util.playSfx(this.gameLoadAudio),null!==this.currentConfig&&(this.matrixContainer=this.node,this._isRTL?(this.matrixContainer.scaleX*=-e.MATRIX_CONTAINER_SCALE,this.matrixContainer.scaleY*=e.MATRIX_CONTAINER_SCALE):this.matrixContainer.scale*=e.MATRIX_CONTAINER_SCALE,this.currentConfig.horizontalProblem=this.currentConfig.horizontalProblem,this.currentConfig.verticalProblem=this.shuffle(this.currentConfig.verticalProblem),this.buildGround(),this.renderWordMatrix(this.mapToWordMatrixElements(this.currentConfig.horizontalProblem),this.questionBlockPrefab,c.H_QUESTION),this.renderWordMatrix(this.mapToWordMatrixElements(this.currentConfig.verticalProblem),this.questionBlockPrefab,c.V_QUESTION),this.buildAnswersAndPlaceHolders(this.currentConfig.horizontalProblem,this.currentConfig.verticalProblem,this.currentConfig.aHorizontalProblem),this.scheduleOnce(function(){f.Util.showHelp(t._helpDragNode,t._helpDropNode)},.5))},o.prototype.mapToWordMatrixElements=function(t){return t.map(function(t){return{text:t}})},o.prototype.processConfiguration=function(t){void 0===t&&(t=[]);var o=[].concat.apply([],t),e=o[0],n=o[1],i=o[2],r=o[3],c=o[4],s=o[5]||c;return{level:e,workSheet:n,problemNo:i,verticalProblem:this.shuffle(r.split(",")),horizontalProblem:c.split(","),aHorizontalProblem:s.split(",")}},o.prototype.getRandom=function(t,o){return Math.random()*(o-t)+t},o.prototype.buildGround=function(){var t=this.currentConfig.horizontalProblem.length,o=this.currentConfig.verticalProblem.length,i=this.currentConfig.horizontalProblem.reduce(function(t,o){return t.length>o.length?t:o}),r=this.currentConfig.verticalProblem.reduce(function(t,o){return t.length>o.length?t:o}),c=cc.instantiate(this.questionBlockPrefab).getComponent(p.default),s=c.createLabelNode(c.textFont,String(o*Number(i)+t*Number(r)),e.FONT_SIZE,"#654321");this._isRTL?(s.scaleX=-e.SCALE,s.scaleY=e.SCALE):s.scale=e.SCALE,n._maxNodeWidth=s.getBoundingBox().width+2.25*e.H_MARGIN,n._maxNodeHeight=s.getBoundingBox().height+1.5*e.V_MARGIN,this._ground=cc.instantiate(this.groundPrefab);var l=10*e.V_MARGIN+n._maxNodeWidth+t*n._maxNodeWidth,d=15*e.V_MARGIN+n._maxNodeHeight+o*n._maxNodeHeight;this.ground.setContentSize(new cc.Size(l,d)),this.ground.width=l,this.ground.height=d,this.matrixContainer.addChild(this.ground)},o.prototype.renderWordMatrix=function(t,o,e){var n=this,i=t.length;t.forEach(function(t,r){var s=JSON.parse(JSON.stringify(t)),l=cc.instantiate(o);switch(e){case c.H_QUESTION:case c.V_QUESTION:var d=l.getComponent(p.default),u={wordMatrix:n,parentNode:n.ground,content:s.text,blockType:e,index:r,totalBlocks:i};d.render(u);break;case c.ANSWER:var f=l.getComponent(a.default),g={wordMatrix:n,parentNode:n.matrixContainer,content:s.text,combinedQAndA:s.questionRelatedText,blockType:e,index:r,totalBlocks:i,xPositions:s.xPositions,groundHeight:n.ground.getBoundingBox().height};f.renderAnswerHolder(g),0===r&&(n._helpDragNode=l);break;case c.PLACEHOLDER:var _=l.getComponent(h.default),m={wordMatrix:n,parentNode:n.ground,content:s.placeHolderText,blockType:e,index:r,totalBlocks:i,position:s.placeHolderPosition};_.render(m),0===r&&(n._helpDropNode=l)}})},o.prototype.flattenDeep=function(t){var o=this;return t.reduce(function(t,e){return Array.isArray(e)?t.concat(o.flattenDeep(e)):t.concat(e)},[])},o.prototype.buildAnswersAndPlaceHolders=function(t,o,e){this._remainingAnswers=this.computeAnswers(t,o,e),this.renderWordMatrix(this._remainingAnswers,this.wordBlockPrefab,c.PLACEHOLDER),this.renderWordMatrix(this.slices(this._remainingAnswers,t.length),this.answerBlockPrefab,c.ANSWER)},o.prototype.computeAnswers=function(t,o,i){console.log("horizontalConfigs",t),console.log("aHorizontalConfigs",i);var r=this.flattenDeep(o.map(function(o,r){return t.map(function(t,c){return{text:o+i[c],placeHolderPosition:new u(n._horizontalPositions[c],n._verticalPositions[r]),placeHolderText:o+i[c]+e.PLACEHOLDER_PAIR,questionRelatedText:o+"-"+t,xPositions:Array.from(new Set(n._horizontalPositions))}})}));return this.shuffle(r)},o.prototype.slices=function(t,o){return this._matchedCounterInCurrentRun=0,t.slice(0,o)},o.prototype.shuffle=function(t){for(var o,e,n=t.length;n>0;)e=Math.floor(Math.random()*n),o=t[--n],t[n]=t[e],t[e]=o;return t},o.addToHorizontalPositions=function(t){n._horizontalPositions.push(t)},o.addToVerticalPositions=function(t){n._verticalPositions.push(t)},Object.defineProperty(o.prototype,"ground",{get:function(){return this._ground},enumerable:!1,configurable:!0}),o.prototype.wordMatched=function(t){this._matchedCounterInCurrentRun++,this._remainingAnswers=this._remainingAnswers.filter(function(o){return o.text!==t}),this._remainingAnswers.length<=0?this.node.emit("nextProblem"):this._matchedCounterInCurrentRun===this.currentConfig.horizontalProblem.length&&this.renderWordMatrix(this.slices(this._remainingAnswers,this.currentConfig.horizontalProblem.length),this.answerBlockPrefab,c.ANSWER)},o.prototype.playGameSound=function(t){var o=this;f.Util.loadGameSound(t,function(t){o.friend.speak(t)})},o._maxNodeWidth=0,o._maxNodeHeight=0,o._horizontalPositions=[],o._verticalPositions=[],r([l(cc.Prefab)],o.prototype,"groundPrefab",void 0),r([l(cc.Prefab)],o.prototype,"questionBlockPrefab",void 0),r([l(cc.Prefab)],o.prototype,"answerBlockPrefab",void 0),r([l(cc.Prefab)],o.prototype,"wordBlockPrefab",void 0),r([l({type:cc.AudioClip})],o.prototype,"gameLoadAudio",void 0),r([g.default()],o.prototype,"onLoad",null),r([g.default()],o.prototype,"mapToWordMatrixElements",null),r([g.default()],o.prototype,"buildGround",null),r([g.default()],o.prototype,"renderWordMatrix",null),r([g.default()],o.prototype,"buildAnswersAndPlaceHolders",null),r([g.default()],o.prototype,"computeAnswers",null),r([g.default()],o.prototype,"slices",null),r([g.default()],o.prototype,"wordMatched",null),r([g.default()],o.prototype,"playGameSound",null),n=r([s],o)}(_.default);e.Grid=m,cc._RF.pop()},{"../../../common/scripts/game":void 0,"../../../common/scripts/lib/config":void 0,"../../../common/scripts/lib/error-handler":void 0,"../../../common/scripts/util":void 0,"./answerblock":"answerblock","./questionblock":"questionblock","./wordblock":"wordblock"}],ground:[function(t,o,e){"use strict";cc._RF.push(o,"16f0fFVfwRFAojrnIPvN0ch","ground");var n,i=this&&this.__extends||(n=function(t,o){return(n=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,o){t.__proto__=o}||function(t,o){for(var e in o)Object.prototype.hasOwnProperty.call(o,e)&&(t[e]=o[e])})(t,o)},function(t,o){function e(){this.constructor=t}n(t,o),t.prototype=null===o?Object.create(o):(e.prototype=o.prototype,new e)}),r=this&&this.__decorate||function(t,o,e,n){var i,r=arguments.length,c=r<3?o:null===n?n=Object.getOwnPropertyDescriptor(o,e):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)c=Reflect.decorate(t,o,e,n);else for(var s=t.length-1;s>=0;s--)(i=t[s])&&(c=(r<3?i(c):r>3?i(o,e,c):i(o,e))||c);return r>3&&c&&Object.defineProperty(o,e,c),c};Object.defineProperty(e,"__esModule",{value:!0});var c=cc._decorator,s=c.ccclass,l=(c.property,function(t){function o(){return null!==t&&t.apply(this,arguments)||this}return i(o,t),r([s],o)}(cc.Component));e.default=l,cc._RF.pop()},{}],questionblock:[function(t,o,e){"use strict";cc._RF.push(o,"fec20HTyIZFwZJfUjwQdlER","questionblock");var n,i=this&&this.__extends||(n=function(t,o){return(n=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,o){t.__proto__=o}||function(t,o){for(var e in o)Object.prototype.hasOwnProperty.call(o,e)&&(t[e]=o[e])})(t,o)},function(t,o){function e(){this.constructor=t}n(t,o),t.prototype=null===o?Object.create(o):(e.prototype=o.prototype,new e)}),r=this&&this.__decorate||function(t,o,e,n){var i,r=arguments.length,c=r<3?o:null===n?n=Object.getOwnPropertyDescriptor(o,e):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)c=Reflect.decorate(t,o,e,n);else for(var s=t.length-1;s>=0;s--)(i=t[s])&&(c=(r<3?i(c):r>3?i(o,e,c):i(o,e))||c);return r>3&&c&&Object.defineProperty(o,e,c),c};Object.defineProperty(e,"__esModule",{value:!0});var c=t("./CommonBlock"),s=t("./grid"),l=cc._decorator.property,d=t("../../../common/scripts/lib/config"),a=t("../../../common/scripts/util"),h=t("../../../common/scripts/lib/error-handler"),u=t("../../../common/scripts/lessonController"),p=cc._decorator.ccclass,f=function(t){function o(){var o=null!==t&&t.apply(this,arguments)||this;return o.slotSelectedPrefab=null,o.highlightNode=null,o._isHighlightNodePresent=!1,o._sound=null,o._isRTL=!1,o}return i(o,t),o.prototype.onLoad=function(){var t=this;this.node.on(s.TouchEvents.TOUCH_START,this.onTouchStart,this),this.node.on(s.TouchEvents.TOUCH_MOVE,this.onTouchMove,this),this.node.on(s.TouchEvents.TOUCH_END,this.onTouchEnd,this),this.node.on(s.TouchEvents.TOUCH_CANCEL,this.onTouchEnd,this),this.fontColor="#654321";var o=this.createLabelNode(this.textFont,this.contentText,this.fontSize,this.fontColor);this.node.addChild(o),this.highlightNode=cc.instantiate(this.slotSelectedPrefab),this._isRTL=d.default.i.direction==d.Direction.RTL,a.Util.loadGameSound(this.contentText,function(o){t._sound=o}),this._isRTL&&(this.node.scaleX=-1)},o.prototype.onTouchMove=function(t){var o=t.getLocation(),e=this.node.getParent().convertToNodeSpaceAR(o);this.node.getBoundingBox().contains(e)||this.touchEnded()},o.prototype.onTouchStart=function(){var t=this;(new cc.Tween).target(this.node).call(function(){t.addHighLightedNode(),t.speak()}).to(.15,{scaleX:this.checkRTLAndScale(1.1),scaleY:1.1*s.SCALE},{progress:null,easing:"sineOut"}).start()},o.prototype.speak=function(){u.default.getFriend().speakGameAudioOrPhonics(this.contentText,function(){})},o.prototype.onTouchEnd=function(){this.touchEnded()},o.prototype.touchEnded=function(){var t=this;(new cc.Tween).target(this.node).to(.15,{scaleX:this.checkRTLAndScale(1.1),scaleY:1.1*s.SCALE},{progress:null,easing:"sineOut"}).call(function(){t.removeHighLightedNode()}).start()},o.prototype.checkRTLAndScale=function(t){return t*s.SCALE*(this._isRTL?-1:1)},o.prototype.render=function(t){this.node.name=t.content,this.contentText=t.content,this.node.width=s.Grid._maxNodeWidth,this.node.height=s.Grid._maxNodeHeight,this.fontSize=s.FONT_SIZE,this.node.scale*=s.SCALE;var o,e=0;switch(t.blockType){case s.BLOCK_TYPE.H_QUESTION:var n=parseFloat(((t.index+1)/(t.totalBlocks+1)).toFixed(2));o=t.parentNode.getBoundingBox().width*(this.node.anchorX-n)+.5*this.node.getBoundingBox().width,e=t.parentNode.getBoundingBox().height*s.HALF-2.35*s.V_MARGIN,this.node.setPosition(o,e),s.Grid.addToHorizontalPositions(o);break;case s.BLOCK_TYPE.V_QUESTION:this.node.width-=s.H_MARGIN,n=parseFloat(((t.index+1)/(t.totalBlocks+1)).toFixed(2)),o=t.parentNode.getBoundingBox().x+this.node.getBoundingBox().width*s.HALF+s.H_MARGIN,e=t.parentNode.getBoundingBox().height*(this.node.anchorY-n)-.7*this.node.getBoundingBox().height,this.node.setPosition(o,e),s.Grid.addToVerticalPositions(e)}t.parentNode.addChild(this.node)},o.prototype.onDestroy=function(){cc.audioEngine.stopAllEffects()},r([l(cc.Prefab)],o.prototype,"slotSelectedPrefab",void 0),r([h.default()],o.prototype,"onLoad",null),r([h.default()],o.prototype,"speak",null),r([h.default()],o.prototype,"checkRTLAndScale",null),r([h.default()],o.prototype,"render",null),r([p],o)}(c.default);e.default=f,cc._RF.pop()},{"../../../common/scripts/lessonController":void 0,"../../../common/scripts/lib/config":void 0,"../../../common/scripts/lib/error-handler":void 0,"../../../common/scripts/util":void 0,"./CommonBlock":"CommonBlock","./grid":"grid"}],wordblock:[function(t,o,e){"use strict";cc._RF.push(o,"838aexRwfVPA6gdgGhMuC9w","wordblock");var n,i=this&&this.__extends||(n=function(t,o){return(n=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,o){t.__proto__=o}||function(t,o){for(var e in o)Object.prototype.hasOwnProperty.call(o,e)&&(t[e]=o[e])})(t,o)},function(t,o){function e(){this.constructor=t}n(t,o),t.prototype=null===o?Object.create(o):(e.prototype=o.prototype,new e)}),r=this&&this.__decorate||function(t,o,e,n){var i,r=arguments.length,c=r<3?o:null===n?n=Object.getOwnPropertyDescriptor(o,e):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)c=Reflect.decorate(t,o,e,n);else for(var s=t.length-1;s>=0;s--)(i=t[s])&&(c=(r<3?i(c):r>3?i(o,e,c):i(o,e))||c);return r>3&&c&&Object.defineProperty(o,e,c),c};Object.defineProperty(e,"__esModule",{value:!0});var c=t("./CommonBlock"),s=t("./grid"),l=t("../../../common/scripts/lib/config"),d=t("../../../common/scripts/lib/error-handler"),a=cc._decorator,h=a.ccclass,u=(a.property,function(t){function o(){return null!==t&&t.apply(this,arguments)||this}return i(o,t),o.prototype.onLoad=function(){this.fontColor="#654321";var t=this.createLabelNode(null,this.contentText,this.fontSize,this.fontColor,!1);this.node.addChild(t),this.node.width=s.Grid._maxNodeWidth+s.H_GAP,this.node.height=s.Grid._maxNodeHeight+s.V_GAP,this.highlightNode=cc.instantiate(this.slotSelectedPrefab),l.default.i.direction==l.Direction.RTL&&(this.node.scaleX=-1)},o.prototype.render=function(t){this.fontSize=s.FONT_SIZE,this.node.name=t.content,this.contentText=t.content,this.node.setPosition(t.position.x,t.position.y),t.parentNode.addChild(this.node),l.default.i.direction==l.Direction.RTL&&(this.node.scaleX=-1)},r([d.default()],o.prototype,"onLoad",null),r([d.default()],o.prototype,"render",null),r([h],o)}(c.default));e.default=u,cc._RF.pop()},{"../../../common/scripts/lib/config":void 0,"../../../common/scripts/lib/error-handler":void 0,"./CommonBlock":"CommonBlock","./grid":"grid"}]},{},["CommonBlock","answerblock","grid","ground","questionblock","wordblock"]);