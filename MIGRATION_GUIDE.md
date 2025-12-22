# 三端通用脚本迁移指南

## 📋 概述

本次更新将仓库中的所有脚本改造为 **Surge / Loon / Quantumult X 三端通用**版本，并统一了脚本引用地址。

---

## 🎯 主要变更

### 1. 脚本统一存放位置

所有三端通用脚本现在统一存放在 **`js/`** 目录下：

```
js/
├── README.md                      # 脚本目录说明
├── CHANGELOG.md                   # 更新日志
├── appstore-monitor.js            # App Store 监控
├── cydia-repo-monitor.js          # Cydia 源监控
├── trollstore-ipa-monitor.js      # 巨魔 IPA 监控
├── trollfools-deb-monitor.js      # 巨魔 DEB 监控
├── xy-ai-auth.js                  # AI 接口授权
├── xy-wechat-dt.js                # 微信斗图
├── xy-wechat-xhh.js               # 微信小火花
├── xy-douyin-parser.js            # 抖音解析
├── xy-themebox-notify.js          # 主题盒子通知
├── xy-themebox-stats-theme.js     # 主题统计
├── xy-themebox-stats-bubble.js    # 气泡统计
├── xy-pkctb-notify.js             # PKC 主题盒子
├── fvtoken.js                     # FV Token 抓取
└── emby-crack.js                  # Emby 解锁
```

### 2. 脚本引用地址变更

**旧地址**（仍可用，但建议更新）：
```
https://img.iosxy.xin/js/xxx.js
```

**新地址**（推荐使用）：
```
https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/js/xxx.js
```

---

## 🔧 技术改进

### 三端兼容封装

所有脚本现在都包含统一的环境检测和 API 封装：

```javascript
const Env = (() => {
  const isSurge = typeof $httpClient !== "undefined";
  const isQX = typeof $task !== "undefined";
  const isLoon = !isSurge && !isQX && typeof $loon !== "undefined";

  const notify = (title, subtitle, body, opts) => {
    // 自动适配三端通知 API
  };

  const read = (key) => {
    // 自动适配三端存储读取
  };

  const write = (val, key) => {
    // 自动适配三端存储写入
  };

  const http = (opts) => {
    // 自动适配三端 HTTP 请求
  };

  return { isSurge, isLoon, isQX, notify, read, write, http };
})();
```

### 参数处理策略

- **Surge/Loon**: 优先使用 `$argument` 传参
- **Quantumult X**: 使用脚本内默认配置或持久化存储

```javascript
function getArgumentsString() {
  // Surge/Loon：有 $argument 就用
  if (typeof $argument !== "undefined" && $argument) {
    return String($argument);
  }
  
  // QX：从存储读取或使用默认值
  const stored = Env.read("script_args");
  return stored || DEFAULT_ARGUMENTS;
}
```

---

## 📱 各平台配置更新

### Surge 模块更新

所有 Surge 模块（`.sgmodule`）的脚本引用已更新为 GitHub Raw 地址。

**示例：`ios-xiyan.sgmodule`**

```ini
[Script]
appstore_panel = type=generic,script-path=https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/js/appstore-monitor.js,argument=APPLIST="{{{APPLIST}}}"
```

### Loon 插件更新

所有 Loon 插件（`.plugin`）的脚本引用已更新。

**示例：`xy-ai.plugin`**

```ini
[Script]
http-request ^https?:\/\/(ai\.cios\.top|gpt\.cios\.top|...)/.* script-path=https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/js/xy-ai-auth.js
```

### Quantumult X 重写更新

所有 QX 重写配置（`.conf`）的脚本引用已更新。

**示例：`xy-aiqx.conf`**

```ini
[rewrite_remote]
^https?:\/\/(ai\.cios\.top|...)/.* url script-request-header https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/js/xy-ai-auth.js
```

---

## ⚠️ 重要提示

### Quantumult X 用户注意

由于 QX **不支持 `$argument` 参数传递**，部分需要自定义配置的脚本有以下两种使用方式：

#### 方式 1：修改脚本内默认配置（推荐简单场景）

在脚本顶部找到 `DEFAULT_CONFIG` 或 `DEFAULT_ARGUMENTS`，直接修改：

```javascript
const DEFAULT_CONFIG = {
  wxidkx: "你的wxid",
  wxidmao: "你的wxid",
  // ...
};
```

#### 方式 2：使用持久化存储（推荐灵活场景）

1. 创建一个设置脚本，写入配置到 `$prefs`
2. 主脚本运行时从 `$prefs` 读取配置

详见 `README.md` 的"关于 QX 无 `$argument` 的推荐做法"章节。

---

## 📊 脚本对照表

### AI 接口授权

| 旧脚本 | 新脚本 | 说明 |
|--------|--------|------|
| `xy-aicios.js` | `xy-ai-auth.js` | 合并所有 AI 接口 |
| `xy-ai9527.js` | `xy-ai-auth.js` | 合并所有 AI 接口 |

### 微信相关

| 旧脚本 | 新脚本 | 说明 |
|--------|--------|------|
| `xy-dt.js` | `xy-wechat-dt.js` | 微信斗图 wxid 替换 |
| `xy-wxxhh.js` | `xy-wechat-xhh.js` | 微信小火花列表 |
| `xy-dyurl.js` | `xy-douyin-parser.js` | 抖音链接解析 |

### 主题盒子相关

| 旧脚本 | 新脚本 | 说明 |
|--------|--------|------|
| `xy-pkctb.js` / `xy-pkctbqx.js` / `xy-pkctbsg.js` | `xy-pkctb-notify.js` | PKC 主题盒子通知（三端合一）|
| `xy-themeboxqx.js` / `xy-themeboxsg.js` | `xy-themebox-notify.js` | 主题盒子兑换通知（简化版）|
| `xy-zthzsg.js` | `xy-themebox-stats-theme.js` | 主题统计 |
| `xy-ztqpsg.js` | `xy-themebox-stats-bubble.js` | 气泡统计 |

### 监控脚本

| 旧脚本 | 新脚本 | 说明 |
|--------|--------|------|
| `appstore.js` | `appstore-monitor.js` | App Store 监控（已三端兼容）|
| `cydia-repo-monitor.js` | `cydia-repo-monitor.js` | Cydia 源监控（已三端兼容）|
| `trollstore-ipa-monitor.js` | `trollstore-ipa-monitor.js` | 巨魔 IPA 监控（已三端兼容）|
| `trollfools-deb-monitor.js` | `trollfools-deb-monitor.js` | 巨魔 DEB 监控（已三端兼容）|

### 其他工具

| 旧脚本 | 新脚本 | 说明 |
|--------|--------|------|
| `fvtoken.js` | `fvtoken.js` | FV Token 抓取（已三端兼容）|
| `Emby_crack.js` | `emby-crack.js` | Emby 解锁（已三端兼容）|

---

## 🚀 如何使用

### 1. 更新配置文件

如果你使用的是本仓库的配置文件，直接拉取最新版本即可：

```bash
git pull origin main
```

### 2. 手动更新

如果你自己维护配置文件，请将脚本引用地址替换为：

```
https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/js/脚本名.js
```

### 3. 验证配置

- **Surge**: 在模块管理中重新加载模块
- **Loon**: 在插件管理中重新加载插件
- **Quantumult X**: 在重写管理中重新加载配置

---

## 📚 相关文档

- [README.md](README.md) - 仓库说明和使用指南
- [js/README.md](js/README.md) - 脚本目录说明
- [js/CHANGELOG.md](js/CHANGELOG.md) - 详细更新日志

---

## 🙏 致谢

感谢所有使用和支持本仓库的用户！如有问题，欢迎反馈。

**作者**: 夕颜  
**微信**: 1418581664  
**主页**: https://iosxy.xin

