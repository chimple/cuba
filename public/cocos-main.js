window.boot = function () {
  var settings = window._CCSettings;
  // window._CCSettings = undefined;
  // var onProgress = null;

  const RESOURCES = cc.AssetManager.BuiltinBundleName.RESOURCES;
  const INTERNAL = cc.AssetManager.BuiltinBundleName.INTERNAL;
  const MAIN = cc.AssetManager.BuiltinBundleName.MAIN;
  const onStart = function () {
    cc.view.enableRetina(true);
    cc.view.resizeWithBrowserSize(true);
    if (cc.sys.isMobile) {
      cc.view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE);
      /* if (settings.orientation === "landscape") {
        cc.view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE);
      } else if (settings.orientation === "portrait") {
        cc.view.setOrientation(cc.macro.ORIENTATION_PORTRAIT);
      } */
      cc.view.enableAutoFullScreen(
        [
          cc.sys.BROWSER_TYPE_BAIDU,
          cc.sys.BROWSER_TYPE_BAIDU_APP,
          cc.sys.BROWSER_TYPE_WECHAT,
          cc.sys.BROWSER_TYPE_MOBILE_QQ,
          cc.sys.BROWSER_TYPE_MIUI,
          cc.sys.BROWSER_TYPE_HUAWEI,
          cc.sys.BROWSER_TYPE_UC,
        ].indexOf(cc.sys.browserType) < 0
      );
    }

    // Limit downloading max concurrent task to 2,
    // more tasks simultaneously may cause performance draw back on some android system / browsers.
    // You can adjust the number based on your own test result, you have to set it before any loading process to take effect.
    if (cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
      cc.assetManager.downloader.maxConcurrency = 2;
      cc.assetManager.downloader.maxRequestsPerFrame = 2;
    }
    var launchScene = settings.launchScene;
    var bundle = cc.assetManager.bundles.find(function (b) {
      return b.getSceneInfo(launchScene);
    });

    bundle.loadScene(launchScene, null, null, function (err, scene) {
      if (!err) {
        console.log("init loaded scene", scene);
        // cc.director.runSceneImmediate(scene);
      }
    });
  };

  var option = {
    id: "GameCanvas",
    debugMode: settings.debug
      ? cc.debug.DebugMode.INFO
      : cc.debug.DebugMode.ERROR,
    showFPS: settings.debug,
    frameRate: 60,
    groupList: settings.groupList,
    collisionMatrix: settings.collisionMatrix,
  };

  cc.assetManager.init({
    bundleVers: settings.bundleVers,
    remoteBundles: settings.remoteBundles,
    server: settings.server,
  });

  var bundleRoot = [INTERNAL];
  settings.hasResourcesBundle && bundleRoot.push(RESOURCES);

  var count = 0;
  function cb(err) {
    if (err) return console.error(err.message, err.stack);
    count++;
    if (count === bundleRoot.length + 1) {
      cc.assetManager.loadBundle(MAIN, function (err) {
        if (!err) cc.game.run(option, onStart);
      });
    }
  }

  cc.assetManager.loadScript(
    settings.jsList.map(function (x) {
      return "src/" + x;
    }),
    cb
  );

  for (var i = 0; i < bundleRoot.length; i++) {
    cc.assetManager.loadBundle(bundleRoot[i], cb);
  }
};

window.launchGame = function () {
  var settings = window._CCSettings;
  var launchScene = settings.launchScene;
  var bundle = cc.assetManager.bundles.find(function (b) {
    return b.getSceneInfo(launchScene);
  });

  bundle.loadScene(launchScene, null, null, function (err, scene) {
    if (!err) {
      cc.director.runSceneImmediate(scene);
      if (cc.sys.isBrowser) {
        // show canvas
        var canvas = document.getElementById("GameCanvas");
        canvas.style.visibility = "";
        canvas.style.display = "";
        const container = document.getElementById("Cocos2dGameContainer");
        if (container) {
          container.style.display = "";
        }
        var div = document.getElementById("GameDiv");
        if (div) {
          div.style.backgroundImage = "";
        }
        console.log("Success to load scene: " + launchScene);
      }
    }
  });
};

window.killGame = function () {
  console.log("pausing the game");
  cc.game.pause();
  cc.audioEngine.stopAll();
  var canvas = document.getElementById("GameCanvas");
  canvas.style.visibility = "none";
  canvas.style.display = "none";
  const container = document.querySelector("#Cocos2dGameContainer");
  if (container) {
    container.style.display = "none";
  }
};
