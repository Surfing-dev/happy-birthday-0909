# HAPPY BIRTHDAY TO YANGYANG 🎁

一个生日互动小网页：Loading 小羊推进度条 → 蛋糕弹出 → 九张礼物卡片左右轮播 → 点击礼物弹出人物卡牌。

## 玩法

1. 打开网页，等待 Loading（小羊拿刀推礼物进度条）
2. 100% 后蛋糕 + HAPPY BIRTHDAY 弹出
3. 进入主页，左右滑动 / 点击箭头切换九张礼物卡片
4. 点击卡片上的礼物，弹出对应的人物卡牌（电脑小窗口造型）

支持电脑和手机，全局小羊拿刀光标（手机端跟随手指）。

## 本地运行

无需安装任何依赖，双击 `index.html` 即可打开。

或用本地服务器：

```bash
cd birthday
python -m http.server 8080
# 浏览器打开 http://localhost:8080
```

## 目录结构

```
birthday/
├── index.html        # 页面入口
├── config.js         # 素材/坐标/颜色集中配置
├── css/style.css     # 样式（舞台缩放、弹窗、光标）
├── js/main.js        # 逻辑（Loading、轮播、弹窗、触摸光标）
└── assets/images/    # 图片素材
```

## 自定义

所有素材路径、礼物坐标、标题栏颜色、光标热点都在 `config.js` 里集中管理，换图改配置即可。
