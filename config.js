/* ============================================================
 *  生日互动网页 · 素材与配置中心
 *  以后只需要改这一个文件，就能换图、加礼物、加卡牌
 *  不需要动 index.html / css / js 里的任何动画代码
 * ============================================================ */

const CONFIG = {

  /* ---------- 主页舞台 ---------- */
  stage: {
    width: 1500,   // 主页设计稿宽度（px），按你的原稿 1500×2000
    height: 2000,  // 主页设计稿高度（px），比例 3:4，永不拉伸变形
  },

  /* ---------- 独立素材图片（路径替换在这里） ---------- */
  assets: {
    // 在这里替换 Loading 小羊（极简卡通 PNG，透明底）
    loadingSheep: "assets/images/loading-sheep.png",

    // 在这里替换 Loading 结束后“啵”出来的小蛋糕
    loadingCake: "assets/images/loading-cake.png",

    // 在这里替换主页背景（1500×2000，不含礼物）
    homeBg: "assets/images/home-bg.svg",

    // 在这里替换鼠标指针图（hover 礼物时显示，透明底 PNG，建议 ≤128px）
    cursor: "assets/images/cursor-sheep.png",
  },

  /* 鼠标指针的点击热点（图内坐标，单位 px）：刀尖位置，换了指针图再调 */
  // 新 cursor-sheep.png 为 1254×1254，刀尖在右下方；热点设在刀尖处
  cursorHotspot: { x: 1000, y: 850 },

  /* ---------- 首页单张卡片的位置 ----------
   * 首页一次只显示一张「底图 + 礼物」，可左右切换九张
   * x / y / width = 卡片在 1500×2000 设计稿上的坐标与宽度
   */
  homeTile: { x: 60, y: 60, width: 1380, height: 1840 },  // 卡片几乎撑满整个 1500×2000 舞台

  /* 底部小圆点的颜色（与九张卡片一一对应，取自各底图主色） */
  dotColors: ["#87BFCE", "#A9CDA7", "#F8A4A2", "#FCD270", "#FA5E11", "#F9B0AA", "#F6BD0B", "#79BDB2", "#80B7D5"],

  /* ---------- 九张礼物卡片（左右切换） ----------
   * 每一张 = tile（底图，彩色卡片）+ image（底盘+礼物，居中放在底图上）
   * card  = 点开后小窗口里显示的人物卡（按色系配对，想换顺序改这一行即可）
   */
  gifts: [
    { id: "gift01", tile: "assets/images/card-bg1.jpg", image: "assets/images/gift1.png", card: "assets/images/card1.jpg", title: "#BCE4EC" },  // RISE 滑雪
    { id: "gift02", tile: "assets/images/card-bg2.jpg", image: "assets/images/gift2.png", card: "assets/images/card2.jpg", title: "#D1DDC8" },  // WANDER 绿叶相机
    { id: "gift03", tile: "assets/images/card-bg3.jpg", image: "assets/images/gift3.png", card: "assets/images/card3.jpg", title: "#E2B6BE" },  // REVERIE 粉蔷薇
    { id: "gift04", tile: "assets/images/card-bg4.jpg", image: "assets/images/gift4.png", card: "assets/images/card4.jpg", title: "#EFEECE" },  // PAUSE 黄底蓝窗
    { id: "gift05", tile: "assets/images/card-bg5.jpg", image: "assets/images/gift5.png", card: "assets/images/card5.jpg", title: "#DBC4BE" },  // FIERCE 红黑衣
    { id: "gift06", tile: "assets/images/card-bg6.jpg", image: "assets/images/gift6.png", card: "assets/images/card6.jpg", title: "#F5F5F3" },  // DRIFT 白纸拍立得
    { id: "gift07", tile: "assets/images/card-bg7.jpg", image: "assets/images/gift7.png", card: "assets/images/card7.jpg", title: "#A8BAA4" },  // SERENE 金色手掌
    { id: "gift08", tile: "assets/images/card-bg8.jpg", image: "assets/images/gift8.png", card: "assets/images/card8.jpg", title: "#C0DCEF" },  // BREEZE 海边
    { id: "gift09", tile: "assets/images/card-bg9.jpg", image: "assets/images/gift9.png", card: "assets/images/card9.jpg", title: "#FFFCF7" },  // 第九张 生日蛋糕合集
  ],

  /* 底盘+礼物在卡片内的摆位（百分比，照你的示意图调好的，一般不用改） */
  tileGift: {
    widthPct: 58,   // 礼物（含底盘）宽度 = 卡片宽度的 58%
    topPct: 28,     // 礼物顶部距卡片顶部 = 卡片高度的 28%
  },

  /* ---------- 背景音乐 ----------
   * src       : 音乐文件路径（把你的 mp3 放进 assets/audio/ 就行）
   *             没这个文件的话，音乐按钮会自动隐藏，页面跟原来一样
   * volume    : 音量 0~1，0.5 = 50%
   * loop      : 是否循环
   * defaultOn : 进页面是否默认开（用户关过一次就会记住，下次保持关闭）
   */
  audio: {
    src: "assets/audio/bgm.mp3",
    volume: 0.5,
    loop: true,
    defaultOn: true,
  },

  /* ---------- 动画时长（毫秒，一般不用改） ---------- */
  timing: {
    loadingDuration: 3600,  // Loading 0%→100% 总时长（3–4 秒）
    cakeStay: 900,          // 蛋糕弹出后停留时间（0.8–1 秒）
    transition: 800,        // Loading → 主页的 fade+scale+blur 转场时长
    cardIn: 520,            // 卡牌弹出动画时长（450–600ms）
    cardOut: 380,           // 卡牌关闭动画时长
  },
};
