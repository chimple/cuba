window.__require = function e(t, n, r) {
  function s(o, u) {
    if (!n[o]) {
      if (!t[o]) {
        var b = o.split("/");
        b = b[b.length - 1];
        if (!t[b]) {
          var a = "function" == typeof __require && __require;
          if (!u && a) return a(b, !0);
          if (i) return i(b, !0);
          throw new Error("Cannot find module '" + o + "'");
        }
        o = b;
      }
      var f = n[o] = {
        exports: {}
      };
      t[o][0].call(f.exports, function(e) {
        var n = t[o][1][e];
        return s(n || e);
      }, f, f.exports, e, t, n, r);
    }
    return n[o].exports;
  }
  var i = "function" == typeof __require && __require;
  for (var o = 0; o < r.length; o++) s(r[o]);
  return s;
}({
  "openwindow1-choice-card": [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "87703p2lihOI5qCmTq2dGj+", "openwindow1-choice-card");
    "use strict";
    var __extends = this && this.__extends || function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || {
          __proto__: []
        } instanceof Array && function(d, b) {
          d.__proto__ = b;
        } || function(d, b) {
          for (var p in b) Object.prototype.hasOwnProperty.call(b, p) && (d[p] = b[p]);
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    var __decorate = this && this.__decorate || function(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : null === desc ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if ("object" === typeof Reflect && "function" === typeof Reflect.decorate) r = Reflect.decorate(decorators, target, key, desc); else for (var i = decorators.length - 1; i >= 0; i--) (d = decorators[i]) && (r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r);
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    var ccclass = cc._decorator.ccclass;
    var openwindow1_1 = require("./openwindow1");
    var error_handler_1 = require("../../../common/scripts/lib/error-handler");
    var OpenWindow1ChoiceCard = function(_super) {
      __extends(OpenWindow1ChoiceCard, _super);
      function OpenWindow1ChoiceCard() {
        var _this = null !== _super && _super.apply(this, arguments) || this;
        _this.text = null;
        _this.touchEnabled = false;
        _this.parentNode = null;
        return _this;
      }
      OpenWindow1ChoiceCard.prototype.onLoad = function() {
        this.node.on("touchstart", this.onTouchStart, this);
        this.node.on("touchend", this.onTouchEnd, this);
      };
      OpenWindow1ChoiceCard.prototype.onTouchStart = function(touch) {};
      OpenWindow1ChoiceCard.prototype.onTouchEnd = function(touch) {
        if (this.touchEnabled) {
          var customEvent = new cc.Event.EventCustom(openwindow1_1.CHOICE_CLICKED, true);
          customEvent.setUserData({
            text: this.text,
            parentNode: this.parentNode,
            node: this.node
          });
          this.node.dispatchEvent(customEvent);
        }
      };
      __decorate([ error_handler_1.default() ], OpenWindow1ChoiceCard.prototype, "onLoad", null);
      OpenWindow1ChoiceCard = __decorate([ ccclass ], OpenWindow1ChoiceCard);
      return OpenWindow1ChoiceCard;
    }(cc.Component);
    exports.default = OpenWindow1ChoiceCard;
    cc._RF.pop();
  }, {
    "../../../common/scripts/lib/error-handler": void 0,
    "./openwindow1": "openwindow1"
  } ],
  openwindow1: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "ecfd1GuENlAqqHEUcwUFtTG", "openwindow1");
    "use strict";
    var __extends = this && this.__extends || function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || {
          __proto__: []
        } instanceof Array && function(d, b) {
          d.__proto__ = b;
        } || function(d, b) {
          for (var p in b) Object.prototype.hasOwnProperty.call(b, p) && (d[p] = b[p]);
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    var __decorate = this && this.__decorate || function(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : null === desc ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if ("object" === typeof Reflect && "function" === typeof Reflect.decorate) r = Reflect.decorate(decorators, target, key, desc); else for (var i = decorators.length - 1; i >= 0; i--) (d = decorators[i]) && (r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r);
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.CHOICE_CLICKED = exports.SCROLL_ENDED = exports.SCROLL_BEGAN = exports.START_SCROLL_CLICK = void 0;
    var ccclass = cc._decorator.ccclass;
    var property = cc._decorator.property;
    var config_1 = require("../../../common/scripts/lib/config");
    var util_1 = require("../../../common/scripts/util");
    var openwindow1_choice_card_1 = require("./openwindow1-choice-card");
    var error_handler_1 = require("../../../common/scripts/lib/error-handler");
    var game_1 = require("../../../common/scripts/game");
    exports.START_SCROLL_CLICK = "START_SCROLL_CLICK";
    exports.SCROLL_BEGAN = "SCROLL_BEGAN";
    exports.SCROLL_ENDED = "SCROLL_ENDED";
    exports.CHOICE_CLICKED = "CHOICE_CLICKED";
    var OpenWindow1 = function(_super) {
      __extends(OpenWindow1, _super);
      function OpenWindow1() {
        var _this = null !== _super && _super.apply(this, arguments) || this;
        _this._currentConfig = null;
        _this.slotWindowPrefab = null;
        _this.scrollClip = null;
        _this.correctClip = null;
        _this.wrongClip = null;
        _this._frameHeight = 0;
        _this._choiceCard1 = null;
        _this._choiceCard2 = null;
        _this._helpDragNode = null;
        _this._isRTL = false;
        return _this;
      }
      OpenWindow1.prototype.onLoad = function() {
        var _this = this;
        this._isRTL = config_1.default.i.direction == config_1.Direction.RTL;
        this._currentConfig = this.processConfiguration(config_1.default.getInstance().data[0]);
        this.buildUI();
        this.node.on(exports.START_SCROLL_CLICK, function(event) {
          event.stopPropagation();
          _this.renderUI();
        });
      };
      OpenWindow1.prototype.startAutoScroll = function() {
        var customEvent = new cc.Event.EventCustom(exports.START_SCROLL_CLICK, true);
        this.node.dispatchEvent(customEvent);
      };
      OpenWindow1.prototype.buildUI = function() {
        var _this = this;
        this.buildWord();
        this.buildChoices();
        this.renderUI();
        this.node.on(exports.CHOICE_CLICKED, function(event) {
          event.stopPropagation();
          var data = event.getUserData();
          var matchText = -1 !== _this._currentConfig.goodimage.indexOf("/") ? _this._currentConfig.goodimage.substr(_this._currentConfig.goodimage.lastIndexOf("/") + 1).replace(".png", "") : _this._currentConfig.goodimage;
          if (!data || data.text !== matchText) _this.node.emit("wrong"); else {
            _this._choiceCard1.parent.getComponent(openwindow1_choice_card_1.default).touchEnabled = false;
            _this._choiceCard2.parent.getComponent(openwindow1_choice_card_1.default).touchEnabled = false;
            _this.node.emit("correct");
            var door = data.parentNode;
            var doorAnimation = door.getComponent(cc.Animation);
            doorAnimation.on("finished", function() {
              _this.scheduleOnce(function() {
                _this.node.emit("nextProblem");
              }, 1);
            });
            doorAnimation.play("door_open");
          }
        });
      };
      OpenWindow1.prototype.buildWord = function() {
        var words = -1 !== this._currentConfig.word.indexOf(",") ? this._currentConfig.word.split(",") : this._currentConfig.word.split("");
        var slotWindow = cc.instantiate(this.slotWindowPrefab);
        slotWindow.setPosition(new cc.Vec2(0, cc.winSize.height / 4 - 50));
        var slotLayout = slotWindow.getChildByName("slotLayout");
        var layoutComponent = slotLayout.getComponent(cc.Layout);
        if (words.length > 5) {
          slotWindow.scale = 1.1;
          layoutComponent.resizeMode = cc.Layout.ResizeMode.CONTAINER;
        } else {
          slotWindow.scale = 1.25;
          layoutComponent.resizeMode = cc.Layout.ResizeMode.CONTAINER;
        }
        config_1.default.wide && (layoutComponent.spacingX = 45);
        var labelNode = slotLayout.getChildByName("label");
        var label = labelNode.getComponent(cc.Label);
        label.string = this._currentConfig.word;
        this.node.addChild(slotWindow);
      };
      OpenWindow1.prototype.renderUI = function() {
        var _this = this;
        util_1.Util.loadGameSound(this._currentConfig.sound, function(clip) {
          clip && (_this.friend.extraClip = clip);
          _this.scheduleOnce(function() {
            _this._choiceCard1.parent.getComponent(openwindow1_choice_card_1.default).touchEnabled = true;
            _this._choiceCard2.parent.getComponent(openwindow1_choice_card_1.default).touchEnabled = true;
            _this._choiceCard1.opacity = 255;
            _this._choiceCard2.opacity = 255;
            _this.scheduleOnce(function() {
              util_1.Util.showHelp(_this._helpDragNode, _this._helpDragNode);
            }, .5);
          }, 1);
        });
      };
      OpenWindow1.prototype.autoScrollToWord = function(parent, word) {
        var _this = this;
        var slots = this.getSlotItems();
        var scrollView = parent.getComponent(cc.ScrollView);
        var index = slots.indexOf(word);
        var curOffSet = scrollView.getScrollOffset();
        if (Math.floor(curOffSet.y) !== Math.floor(index * this._frameHeight)) {
          scrollView.scrollToBottom(.5);
          this.scheduleOnce(function() {
            scrollView.scrollToOffset(new cc.Vec2(0, index * _this._frameHeight), .5);
          }, .5);
        }
      };
      OpenWindow1.prototype.getSlotItems = function() {
        var slotItems = -1 !== this._currentConfig.slots.indexOf(",") ? this._currentConfig.slots.split(",") : this._currentConfig.slots.split("");
        var answers = -1 !== this._currentConfig.word.indexOf(",") ? this._currentConfig.word.split(",") : this._currentConfig.word.split("");
        slotItems = slotItems.concat(answers);
        return Array.from(new Set(slotItems));
      };
      OpenWindow1.prototype.buildChoices = function() {
        var firstCardCorrect = Math.random() >= .5;
        this._choiceCard1 = this.node.getChildByName("left_Button").getChildByName("image");
        this.loadTextureAndShowImage(this._choiceCard1, firstCardCorrect ? this._currentConfig.goodimage : this._currentConfig.badimage);
        this._choiceCard2 = this.node.getChildByName("right_Button").getChildByName("image");
        this.loadTextureAndShowImage(this._choiceCard2, firstCardCorrect ? this._currentConfig.badimage : this._currentConfig.goodimage);
        this._helpDragNode = firstCardCorrect ? this._choiceCard1 : this._choiceCard2;
      };
      OpenWindow1.prototype.loadTextureAndShowImage = function(node, image) {
        var _this = this;
        node.opacity = 0;
        var component = node.parent.getComponent(openwindow1_choice_card_1.default);
        component.parentNode = this.node.getChildByName("door_node");
        component.text = -1 !== image.indexOf("/") ? image.substr(image.lastIndexOf("/") + 1).replace(".png", "") : image;
        component.touchEnabled = false;
        util_1.Util.loadTexture(image, function(texture) {
          _this.showImage(node, texture);
        });
      };
      OpenWindow1.prototype.showImage = function(node, texture) {
        var sprite = node.getComponent(cc.Sprite);
        sprite.spriteFrame = new cc.SpriteFrame(texture);
        util_1.Util.resizeSprite(sprite, 272, 201);
      };
      OpenWindow1.prototype.processConfiguration = function(data) {
        void 0 === data && (data = []);
        var configurations = [].concat.apply([], data);
        var level = configurations[0], worksheet = configurations[1], problem = configurations[2], type = configurations[3], word = configurations[4], goodimage = configurations[5], badimage = configurations[6], sound = configurations[7], slots = configurations[8];
        return {
          level: level,
          worksheet: worksheet,
          problem: problem,
          type: type,
          word: word,
          goodimage: goodimage,
          badimage: badimage,
          sound: sound,
          slots: slots
        };
      };
      __decorate([ property(cc.Prefab) ], OpenWindow1.prototype, "slotWindowPrefab", void 0);
      __decorate([ property(cc.AudioClip) ], OpenWindow1.prototype, "scrollClip", void 0);
      __decorate([ property(cc.AudioClip) ], OpenWindow1.prototype, "correctClip", void 0);
      __decorate([ property(cc.AudioClip) ], OpenWindow1.prototype, "wrongClip", void 0);
      __decorate([ error_handler_1.default() ], OpenWindow1.prototype, "onLoad", null);
      __decorate([ error_handler_1.default() ], OpenWindow1.prototype, "startAutoScroll", null);
      __decorate([ error_handler_1.default() ], OpenWindow1.prototype, "buildUI", null);
      __decorate([ error_handler_1.default() ], OpenWindow1.prototype, "buildWord", null);
      __decorate([ error_handler_1.default() ], OpenWindow1.prototype, "renderUI", null);
      __decorate([ error_handler_1.default() ], OpenWindow1.prototype, "autoScrollToWord", null);
      __decorate([ error_handler_1.default() ], OpenWindow1.prototype, "getSlotItems", null);
      __decorate([ error_handler_1.default() ], OpenWindow1.prototype, "buildChoices", null);
      __decorate([ error_handler_1.default() ], OpenWindow1.prototype, "loadTextureAndShowImage", null);
      __decorate([ error_handler_1.default() ], OpenWindow1.prototype, "showImage", null);
      OpenWindow1 = __decorate([ ccclass ], OpenWindow1);
      return OpenWindow1;
    }(game_1.default);
    exports.default = OpenWindow1;
    cc._RF.pop();
  }, {
    "../../../common/scripts/game": void 0,
    "../../../common/scripts/lib/config": void 0,
    "../../../common/scripts/lib/error-handler": void 0,
    "../../../common/scripts/util": void 0,
    "./openwindow1-choice-card": "openwindow1-choice-card"
  } ]
}, {}, [ "openwindow1-choice-card", "openwindow1" ]);