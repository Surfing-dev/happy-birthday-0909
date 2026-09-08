/* ============================================================
 *  生日互动网页 · 主逻辑
 *  状态机：Loading → 蛋糕弹出 → 转场 → 主页 → 点击礼物弹卡牌
 *  所有图片路径都写在 config.js，这里不包含任何写死的素材路径
 * ============================================================ */

(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  /* ---------- 1. 按 config 搭建主页舞台 ---------- */

  /* 全局应用拿刀小羊光标：页面任何位置都不显示默认鼠标
   * 路径和热点写在 config.js，加载失败自动回退 pointer */
  if (CONFIG.assets.cursor) {
    var hs = CONFIG.cursorHotspot || { x: 0, y: 0 };
    var globalCursor = "url(\"" + CONFIG.assets.cursor + "\") " + hs.x + " " + hs.y + ", pointer";
    document.documentElement.style.cursor = globalCursor;
    document.body.style.cursor = globalCursor;
  }

  /* 手机触摸光标：小羊跟随手指移动，只在触摸设备启用 */
  var touchCursor = $("touch-cursor");
  var touchCursorImg = $("touch-cursor-img");
  var isTouchDevice = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  if (!isTouchDevice && 'ontouchstart' in window) {
    isTouchDevice = true;
  }
  if (touchCursor && touchCursorImg && isTouchDevice) {
    // 手机触摸光标同样使用拿刀小羊
    touchCursorImg.src = CONFIG.assets.cursor;
    var tcX = -100, tcY = -100;
    function updateTouchCursor(x, y) {
      // 新 cursor-sheep.png 的刀尖在羊的右下方，
      // 让小羊位于手指左上方，刀尖向右下露出，避免被手指挡住
      tcX = x - 36;
      tcY = y - 48;
      touchCursor.style.transform = "translate(" + tcX + "px, " + tcY + "px) translate(-50%, -50%)";
    }
    document.addEventListener("touchstart", function (e) {
      if (e.touches && e.touches[0]) {
        updateTouchCursor(e.touches[0].clientX, e.touches[0].clientY);
        touchCursor.classList.add("active");
      }
    }, { passive: true });
    document.addEventListener("touchmove", function (e) {
      if (e.touches && e.touches[0]) {
        updateTouchCursor(e.touches[0].clientX, e.touches[0].clientY);
        touchCursor.classList.add("active");
      }
    }, { passive: true });
    document.addEventListener("touchend", function () {
      touchCursor.classList.remove("active");
    }, { passive: true });
  }

  var stageEl = $("stage");
  stageEl.style.width = CONFIG.stage.width + "px";
  stageEl.style.height = CONFIG.stage.height + "px";

  // Loading 舞台与主页舞台完全同一尺寸和缩放
  var loadingStage = $("loading-stage");
  if (loadingStage) {
    loadingStage.style.width = CONFIG.stage.width + "px";
    loadingStage.style.height = CONFIG.stage.height + "px";
  }

  var loadingInner = $("loading-inner");
  var loadingTopText = $("loading-top-text");
  var loadingBottomText = $("loading-bottom-text");

  // Loading 亮蓝卡片背景：大小/位置与主页卡片区完全重合
  var loadingCardBg = $("loading-card-bg");
  if (loadingCardBg) {
    loadingCardBg.style.left = CONFIG.homeTile.x + "px";
    loadingCardBg.style.top = CONFIG.homeTile.y + "px";
    loadingCardBg.style.width = CONFIG.homeTile.width + "px";
    loadingCardBg.style.height = CONFIG.homeTile.height + "px";
  }

  $("loading-sheep").src = CONFIG.assets.loadingSheep;
  $("loading-cake").src = CONFIG.assets.loadingCake;
  $("home-bg").src = CONFIG.assets.homeBg;

  /* 根据 gifts 列表生成九张卡片，全部叠放在首页同一位置
   * 每张卡片 = 底图（tile）+ 居中放上去的底盘礼物（可浮动、可点击）
   * 一次只显示一张，左右切换 */
  var tiles = [];

  CONFIG.gifts.forEach(function (gift, index) {
    // 卡片底（底图）
    var tile = document.createElement("div");
    tile.className = "gift-tile";
    tile.style.left = CONFIG.homeTile.x + "px";
    tile.style.top = CONFIG.homeTile.y + "px";
    tile.style.width = CONFIG.homeTile.width + "px";

    var tileBg = document.createElement("img");
    tileBg.className = "tile-bg";
    // 首屏只给第一张卡片真正加载图片，其余先记在 data-src，翻到时才加载
    if (index === 0) {
      tileBg.src = gift.tile;
    } else {
      tileBg.setAttribute("data-src", gift.tile);
    }
    tileBg.alt = "";
    tileBg.draggable = false;
    tile.appendChild(tileBg);

    // 底盘+礼物（居中放在底图上，浮动与点击都在这一层）
    var floatWrap = document.createElement("div");
    floatWrap.className = "gift-float";
    floatWrap.style.left = ((100 - CONFIG.tileGift.widthPct) / 2) + "%";
    floatWrap.style.top = CONFIG.tileGift.topPct + "%";
    floatWrap.style.width = CONFIG.tileGift.widthPct + "%";

    var hit = document.createElement("div");
    hit.className = "gift-hit";
    hit.setAttribute("role", "button");
    hit.setAttribute("aria-label", "打开礼物");

    var img = document.createElement("img");
    img.className = "gift-img";
    if (index === 0) {
      img.src = gift.image;
    } else {
      img.setAttribute("data-src", gift.image);
    }
    img.alt = "";
    img.draggable = false;

    hit.appendChild(img);
    floatWrap.appendChild(hit);
    tile.appendChild(floatWrap);
    stageEl.appendChild(tile);
    tiles.push(tile);

    hit.addEventListener("click", function () {
      openCard(gift);
    });
  });

  /* ---------- 1b. 左右切换九张卡片（滑动 / 箭头 / 键盘 / 圆点） ---------- */

  // 真正加载第 n 张卡片的图片（把 data-src 变成 src，才会发起下载）
  function hydrate(n, isBackground) {
    var t = tiles[n];
    if (!t) return;
    var imgs = t.querySelectorAll("img[data-src]");
    for (var i = 0; i < imgs.length; i++) {
      // 后台补齐的图标记为低优先级，永远不跟用户正在看的那张抢带宽
      if (isBackground) {
        try { imgs[i].fetchPriority = "low"; } catch (e) {}
      }
      imgs[i].src = imgs[i].getAttribute("data-src");
      imgs[i].removeAttribute("data-src");
    }
  }

  // 翻页时后台让路的标记
  var navBusy = false;

  /* 等第 n 张卡片能看了再翻过去：
   * 底图（才 80KB）一好就先翻，礼物图随后补上——比干等两张都好要快得多，也不会空白 */
  function ensureLoaded(n, cb) {
    var t = tiles[n];
    if (!t) { cb(); return; }
    var imgs = t.querySelectorAll("img");
    var bg = imgs[0];                       // 底图
    var all = [];
    for (var i = 0; i < imgs.length; i++) {
      if (imgs[i].getAttribute("src")) all.push(imgs[i]);
    }
    var ready = function (im) { return im.complete && im.naturalWidth > 0; };
    if (all.length === 0 || ready(bg) || all.every(ready)) { cb(); return; }

    var fired = false;
    var go = function () { if (!fired) { fired = true; cb(); } };
    bg.addEventListener("load", go, { once: true });
    bg.addEventListener("error", go, { once: true });
    // 兜底：底图实在下不来，3.5 秒后也翻，不至于卡死
    setTimeout(go, 3500);
  }

  var current = 0;
  tiles[current].classList.add("active");

  // 底部小圆点（颜色与卡片一一对应）
  var dotsWrap = document.createElement("div");
  dotsWrap.className = "nav-dots";
  var dots = [];
  CONFIG.gifts.forEach(function (g, i) {
    var dot = document.createElement("span");
    dot.className = "nav-dot" + (i === 0 ? " on" : "");
    dot.style.background = (CONFIG.dotColors && CONFIG.dotColors[i]) || "#FFFFFF";
    dot.addEventListener("click", function () { goTo(i); });
    dotsWrap.appendChild(dot);
    dots.push(dot);
  });
  stageEl.appendChild(dotsWrap);

  // 左右箭头（轻量手绘感，不是重按钮）
  var prevBtn = document.createElement("button");
  prevBtn.className = "nav-arrow nav-prev";
  prevBtn.setAttribute("aria-label", "上一张");
  var nextBtn = document.createElement("button");
  nextBtn.className = "nav-arrow nav-next";
  nextBtn.setAttribute("aria-label", "下一张");
  stageEl.appendChild(prevBtn);
  stageEl.appendChild(nextBtn);

  function goTo(n) {
    var total = tiles.length;
    var next = ((n % total) + total) % total;
    if (next === current) return;
    var from = current;

    // 翻到哪张才加载哪张（顺带把下一张预备好，翻页不卡）
    hydrate(next);
    hydrate((next + 1) % tiles.length);

    // 提前把这张的人物卡下好，点开基本秒出
    new Image().src = CONFIG.gifts[next].card;

    // 图还没下好就先停在原卡片，等就绪再翻——避免翻过去一片空白
    navBusy = true;
    ensureLoaded(next, function () {
      navBusy = false;
      if (current !== from) return;   // 等待期间用户又翻了，放弃这次动画
      swap(from, next);
    });
  }

  function swap(from, next) {
    var total = tiles.length;
    var dir = (next - from + total) % total === 1 ? 1 : -1;  // 1=向右翻，-1=向左翻

    var oldTile = tiles[from];
    var newTile = tiles[next];
    current = next;

    oldTile.classList.remove("active");
    oldTile.classList.add(dir > 0 ? "exit-left" : "exit-right");
    setTimeout(function () {
      oldTile.classList.remove("exit-left", "exit-right");
    }, 500);

    newTile.classList.add("no-trans");
    newTile.style.transform = "translateX(" + (dir > 0 ? 70 : -70) + "px)";
    void newTile.offsetWidth;               // 强制 reflow，让起始位置生效
    newTile.classList.remove("no-trans");
    newTile.style.transform = "";
    newTile.classList.add("active");

    dots.forEach(function (d, i) {
      d.classList.toggle("on", i === current);
    });
  }

  prevBtn.addEventListener("click", function () { goTo(current - 1); });
  nextBtn.addEventListener("click", function () { goTo(current + 1); });

  // 键盘左右键（弹窗打开时不响应）
  document.addEventListener("keydown", function (e) {
    if (document.body.classList.contains("modal-open")) return;
    if (e.key === "ArrowLeft") goTo(current - 1);
    if (e.key === "ArrowRight") goTo(current + 1);
  });

  // 触摸滑动切换（手机端主交互）
  var touchX = null;
  stageEl.addEventListener("touchstart", function (e) {
    touchX = e.touches[0].clientX;
  }, { passive: true });
  stageEl.addEventListener("touchend", function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) {
      if (dx < 0) goTo(current + 1);        // 左滑 → 下一张
      else goTo(current - 1);               // 右滑 → 上一张
    }
    touchX = null;
  }, { passive: true });

  /* ---------- 2. 舞台等比缩放（核心：永不拉伸/压扁/裁切） ---------- */

  // 主页舞台 + Loading 舞台同步缩放
  function fitStage() {
    var scale = Math.min(
      window.innerWidth / CONFIG.stage.width,
      window.innerHeight / CONFIG.stage.height
    );
    var transform = "translate(-50%, -50%) scale(" + scale + ")";
    stageEl.style.transform = transform;
    if (loadingStage) loadingStage.style.transform = transform;

    // Loading 内容层不参与缩放，但需要精确对齐主页卡片中心
    fitLoadingInner(scale);
  }

  // Loading 内容层定位：让它始终位于主页卡片中心（与主页卡片区重合）
  function fitLoadingInner(scale) {
    if (!loadingInner) return;
    var stageLeft = (window.innerWidth - CONFIG.stage.width * scale) / 2;
    var stageTop = (window.innerHeight - CONFIG.stage.height * scale) / 2;
    var cardLeft = stageLeft + CONFIG.homeTile.x * scale;
    var cardTop = stageTop + CONFIG.homeTile.y * scale;
    var cardRight = cardLeft + CONFIG.homeTile.width * scale;
    var cardBottom = cardTop + CONFIG.homeTile.height * scale;
    var cardWidth = cardRight - cardLeft;
    var cardHeight = cardBottom - cardTop;
    var cx = (cardLeft + cardRight) / 2;
    var cy = (cardTop + cardBottom) / 2;
    loadingInner.style.left = cx + "px";
    loadingInner.style.top = cy + "px";

    // 顶部/底部文字：严格限制在卡片区内，按卡片实际边界计算宽高、字号与位置
    // 水平内边距约为卡片宽度的 3%
    var textPadH = Math.max(24, Math.round(cardWidth * 0.03));
    var textBoxW = Math.max(200, Math.round(cardWidth - textPadH * 2));

    // 顶部文字字号：Fredoka One 较宽，按可用宽度计算，保证单行不溢出
    var topFontSize = Math.max(18, Math.min(82, Math.floor(textBoxW / 14.5)));
    // HAPPY BIRTHDAY 与顶部文字字母同大，整体居中显示
    var bottomFontSize = topFontSize;
    // 进度数字参考图约为顶部文字的 0.65 倍
    var progressFontSize = Math.max(14, Math.round(topFontSize * 0.65));

    if (loadingTopText) {
      loadingTopText.style.left = cx + "px";
      // 顶部文字位于卡片上部约 18% 处（参考图红框位置）
      loadingTopText.style.top = (cardTop + cardHeight * 0.18) + "px";
      loadingTopText.style.width = textBoxW + "px";
      loadingTopText.style.maxWidth = textBoxW + "px";
      loadingTopText.style.fontSize = topFontSize + "px";
    }
    if (loadingBottomText) {
      loadingBottomText.style.left = cx + "px";
      // 底部文字位于卡片下部约 22% 距底处（参考图红框位置）
      loadingBottomText.style.bottom = (window.innerHeight - cardBottom + cardHeight * 0.22) + "px";
      loadingBottomText.style.width = textBoxW + "px";
      loadingBottomText.style.maxWidth = textBoxW + "px";
      loadingBottomText.style.fontSize = bottomFontSize + "px";
    }

    // 百分比数字大小跟随顶部文字比例
    var progressNum = document.getElementById("progress-num");
    if (progressNum) {
      progressNum.style.fontSize = progressFontSize + "px";
    }
  }

  window.addEventListener("resize", fitStage);
  window.addEventListener("orientationchange", fitStage);
  fitStage();

  /* ---------- 3. 预加载：首屏只加载必需品，其余进主页后后台补齐 ---------- */

  function preload(srcList) {
    return Promise.all(srcList.map(function (src) {
      return new Promise(function (resolve) {
        var im = new Image();
        im.onload = resolve;
        im.onerror = resolve;   // 某张图失败也不卡流程
        im.src = src;
      });
    }));
  }

  // 首屏必需：Loading 小羊 + 蛋糕 + 主页背景 + 蛋糕托 + 第一张卡片的底图与礼物
  var essentialSrcs = [
    CONFIG.assets.loadingSheep,
    CONFIG.assets.loadingCake,
    CONFIG.assets.homeBg,
    CONFIG.assets.cakeStand
  ];
  var firstGift = CONFIG.gifts[0];
  if (firstGift) essentialSrcs.push(firstGift.tile, firstGift.image);
  var assetsReady = preload(essentialSrcs);

  // 进主页后，逐张补齐其余卡片的底图与礼物（串行加载，不抢占首屏带宽）
  var restStarted = false;
  function preloadRest() {
    if (restStarted) return;
    restStarted = true;
    var total = CONFIG.gifts.length;
    /* 关键：后台补卡片图会占满带宽，把点开的人物卡挤到队尾（手机上就表现为"卡打不开"）。
     * 所以这里：① 进主页 4 秒后才开始补 ② 一次只补一张 ③ 人物卡在下载时一律让路 */
    setTimeout(function () {
      (function step(i) {
        if (i >= total) { startCardChain(); return; }
        if (cardBusy() || navBusy) { setTimeout(function () { step(i); }, 250); return; }
        hydrate(i, true);
        setTimeout(function () { step(i + 1); }, 700);
      })(1);
    }, 4000);
  }

  // 是否正在等某张人物卡下载（弹窗已开、图还没好）
  function cardBusy() {
    var body = document.querySelector(".card-body");
    return !!(body && body.classList.contains("card-loading"));
  }

  // 九张人物卡最后补（只有点开弹窗才用得上，不阻塞首屏）
  var cardChainStarted = false;
  function startCardChain() {
    if (cardChainStarted) return;
    cardChainStarted = true;
    preloadCard(typeof current === "number" ? current : 0);   // 先下当前这张
  }

  function preloadCard(i) {
    if (i >= CONFIG.gifts.length) return;
    var im = new Image();
    im.onload = im.onerror = function () { preloadCard(i + 1); };
    im.src = CONFIG.gifts[i].card;
  }

  /* ---------- 4. Loading：0% → 100%（小羊跟随真实进度） ---------- */

  var DURATION = CONFIG.timing.loadingDuration;
  var fillEl = $("progress-fill");
  var numEl = $("progress-num");
  var sheepEl = $("loading-sheep");
  var trackEl = document.querySelector(".sheep-track");
  var startTime = null;

  // 柔和加速减速，但保证结束时刚好 100%
  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function tick(now) {
    if (!startTime) startTime = now;
    var t = Math.min((now - startTime) / DURATION, 1);
    var p = easeInOutQuad(t);
    var pct = Math.round(p * 100);

    fillEl.style.width = pct + "%";
    numEl.textContent = pct + "%";

    // 小羊位置 = 真实进度 × 可行走距离（严格同步，不是假动画）
    // 右端给 100% 时弹出的小蛋糕留出约 60px，小羊停在蛋糕旁边
    var cakeReserve = 60;
    var walkRange = trackEl.clientWidth - sheepEl.clientWidth - cakeReserve;
    sheepEl.style.left = (p * walkRange) + "px";

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      // 首屏素材就绪就弹蛋糕；慢网下最多再等 2.5 秒就放行，绝不干等全部素材
      Promise.race([
        assetsReady,
        new Promise(function (resolve) { setTimeout(resolve, 2500); })
      ]).then(showCake);
    }
  }
  requestAnimationFrame(tick);

  /* ---------- 5. 蛋糕弹出 → 停留 → 转场进主页 ---------- */

  function showCake() {
    // 蛋糕停留的这 1.5 秒正好用来偷偷补齐素材：先下第一张人物卡，再补其余卡片
    startCardChain();
    preloadRest();
    $("screen-loading").classList.add("loading-done");  // 百分比数字淡出（进度条和小羊保留）
    $("cake-pop").classList.add("show");                // 蛋糕在进度条右端上方 scale 弹出 + 小星星

    setTimeout(goHome, CONFIG.timing.cakeStay + 600);   // 弹出动画 0.6s + 停留 0.9s
  }

  function goHome() {
    var loading = $("screen-loading");
    var home = $("screen-home");
    loading.classList.add("screen-out");   // fade + scale + blur
    home.classList.add("screen-in");
    document.dispatchEvent(new Event("bgm:home"));   // 通知音乐模块：可以显示按钮了
    setTimeout(function () {
      loading.style.display = "none";
    }, CONFIG.timing.transition + 100);
  }

  /* ---------- 6. 卡牌弹窗 ---------- */

  var modal = $("card-modal");
  var cardImg = $("card-img");
  var isOpen = false;

  function openCard(gift) {
    if (isOpen) return;
    isOpen = true;

    // 卡牌图：优先加载 + 没好之前显示转圈，避免弹窗一片空白
    var cardBody = document.querySelector(".card-body");
    cardImg.classList.remove("is-loaded");
    cardBody.classList.add("card-loading");
    try { cardImg.fetchPriority = "high"; } catch (e) {}
    cardImg.onload = function () {
      cardBody.classList.remove("card-loading");
      cardImg.classList.add("is-loaded");
    };
    cardImg.onerror = function () {
      cardBody.classList.remove("card-loading");
    };
    cardImg.src = gift.card;
    if (cardImg.complete && cardImg.naturalWidth > 0) cardImg.onload();

    // 标题栏颜色跟着当前卡牌走（不突兀），没有配置则用默认蓝
    document.querySelector(".card-titlebar").style.background =
      gift.title || "#B4DCF2";
    modal.style.display = "flex";
    void modal.offsetWidth;               // 强制 reflow，保证动画从头播放
    modal.classList.remove("closing");
    modal.classList.add("open");
    document.body.classList.add("modal-open");
  }

  function closeCard() {
    if (!isOpen) return;
    isOpen = false;
    modal.classList.remove("open");
    modal.classList.add("closing");       // 反向动画
    setTimeout(function () {
      modal.style.display = "none";
      modal.classList.remove("closing");
    }, CONFIG.timing.cardOut + 50);
    document.body.classList.remove("modal-open");
  }

  $("card-backdrop").addEventListener("click", closeCard);  // 点空白关闭
  $("card-close").addEventListener("click", closeCard);     // 点小 × 关闭
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeCard();
  });

  /* ---------- 7. 背景音乐 ---------- */
  (function initAudio() {
    var conf = CONFIG.audio || {};
    var audio = $("bgm");
    var btn = $("music-btn");
    if (!conf.src || !audio || !btn) return;   // 没配音乐：按钮保持隐藏，页面跟原来一样

    audio.loop = conf.loop !== false;
    audio.volume = typeof conf.volume === "number" ? conf.volume : 0.5;

    // 默认开；用户手动关过一次就记住，下次进来保持关闭
    var STORE_KEY = "bgm-enabled";
    var enabled = conf.defaultOn !== false;
    try {
      var saved = localStorage.getItem(STORE_KEY);
      if (saved !== null) enabled = saved === "1";
    } catch (e) {}

    function paint() {
      var playing = enabled && !audio.paused;
      btn.classList.toggle("is-playing", playing);
      btn.classList.toggle("is-muted", !playing);
    }

    /* 分两级加载，避免整首歌（8.9MB）在后台偷偷吃掉图片带宽：
     * loadAudio()      —— 只取歌曲信息（几 KB），先不下载音频数据
     * loadAudioFull()  —— 用户一点/一按，才真正开始缓冲并播放
     */
    var srcSet = false, fullLoaded = false;
    function loadAudio() {
      if (srcSet) return;
      srcSet = true;
      audio.preload = "metadata";
      audio.src = conf.src;
    }
    function loadAudioFull() {
      if (fullLoaded) return;
      fullLoaded = true;
      audio.preload = "auto";
      if (srcSet) {
        audio.load();          // 从"只取信息"切换成"整首缓冲"
      } else {
        srcSet = true;
        audio.src = conf.src;
      }
    }

    var playTimer = null;
    function tryPlay() {
      // 注意：这里不能隐藏提示。只有音乐真的响起来（play 事件）才收起提示，
      // 否则随手点了屏幕一下、浏览器却没允许播放时，提示就没了、音乐也没有
      if (!enabled || !audio.paused) return;
      // 延后一点再开始下载：先让用户这次点击真正想看的东西（比如卡牌图）加载，
      // 否则 8.9MB 的歌会瞬间占满带宽，把图片挤到后面去
      if (playTimer) return;
      playTimer = setTimeout(function () {
        // 人物卡还在下载的话，音乐继续等——8.9MB 会把卡图挤死
        if (cardBusy()) {
          playTimer = null;
          tryPlay();
          return;
        }
        playTimer = null;
        loadAudioFull();
        var p = audio.play();
        if (p && p.catch) p.catch(function () { /* 浏览器还不允许，等下次点击 */ });
      }, 800);
    }

    // Loading 阶段的轻提示：点一下就开音乐，点了/进主页自动消失
    var hint = $("bgm-hint");
    function showHint() {
      if (hint && enabled && audio.paused) hint.classList.add("show");
    }
    function hideHint() {
      if (hint) hint.classList.remove("show");
    }
    if (hint) {
      showHint();
      hint.addEventListener("click", function (e) {
        e.stopPropagation();
        tryPlay();
      });
    }
    audio.addEventListener("play", hideHint);

    // 手机和电脑都不允许无交互自动播放，等用户第一次点/摸屏幕再启动
    // 注意：点音乐按钮本身要跳过，否则会和按钮的开关逻辑打架
    ["pointerdown", "touchstart", "click", "keydown"].forEach(function (ev) {
      document.addEventListener(ev, function (e) {
        if (e.target && btn.contains(e.target)) return;
        tryPlay();
      }, { passive: true });
    });

    audio.addEventListener("play", paint);
    audio.addEventListener("pause", paint);

    // 进主页后才显示按钮，并且这时才开始加载音乐（不拖慢 Loading 和图片）
    function maybeShow() {
      btn.classList.add("show");
    }
    document.addEventListener("bgm:home", function () {
      hideHint();
      maybeShow();
    });

    // 这里不预加载任何音频：用户没点之前，一个字节都不下，带宽全留给图片
    audio.addEventListener("canplay", maybeShow);
    audio.addEventListener("error", function () { btn.classList.remove("show"); });

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      // 按真实播放状态切换：正在响就关掉，没响就开起来
      if (!audio.paused) {
        enabled = false;
        audio.pause();
      } else {
        enabled = true;
        loadAudioFull();
        var p = audio.play();
        if (p && p.catch) p.catch(function () {});
      }
      try { localStorage.setItem(STORE_KEY, enabled ? "1" : "0"); } catch (err) {}
      paint();
    });

    paint();
    maybeShow();   // 喇叭按钮从 Loading 阶段就显示，随时能开关音乐
  })();

})();
