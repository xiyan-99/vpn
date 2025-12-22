# 三端配置文件完整列表

## ✅ 已完成的三端配置（每个功能都有 Surge/Loon/QX 版本）

### 📱 核心监控功能

| 功能 | Surge | Loon | Quantumult X | 脚本 |
|------|-------|------|--------------|------|
| **App Store 监控** | ✅ `ios-xiyan.sgmodule` | ✅ 集成在主模块 | ⚠️ 需手动配置 | `js/appstore-monitor.js` |
| **Cydia 源监控** | ✅ `ios-xiyan.sgmodule` | ✅ 集成在主模块 | ⚠️ 需手动配置 | `js/cydia-repo-monitor.js` |
| **巨魔 IPA 监控** | ✅ `ios-xiyan.sgmodule` | ✅ 集成在主模块 | ⚠️ 需手动配置 | `js/trollstore-ipa-monitor.js` |
| **巨魔 DEB 监控** | ✅ `ios-xiyan.sgmodule` | ✅ 集成在主模块 | ⚠️ 需手动配置 | `js/trollfools-deb-monitor.js` |

### 🔓 解锁/破解功能

| 功能 | Surge | Loon | Quantumult X | 脚本 |
|------|-------|------|--------------|------|
| **Emby 解锁** | ✅ `emby.sgmodule` | ✅ `emby.plugin` | ✅ `emby.conf` | `js/emby-crack.js` |

### 🔑 授权/Token 抓取

| 功能 | Surge | Loon | Quantumult X | 脚本 |
|------|-------|------|--------------|------|
| **AI 接口授权** | ✅ `xy-ai.sgmodule` | ✅ `xy-ai.plugin` | ✅ `xy-aiqx.conf` | `js/xy-ai-auth.js` |
| **FV Token 抓取** | ✅ `fvtoken.sgmodule` | ✅ `fvtoken.plugin` | ✅ `fvtoken.conf` | `js/fvtoken.js` |

### 💬 微信相关功能

| 功能 | Surge | Loon | Quantumult X | 脚本 |
|------|-------|------|--------------|------|
| **微信斗图接口** | ✅ `xy-wxdg.sgmodule` | ✅ `xy-wxdt.plugin` | ✅ `xy-dtqx.conf` | `js/xy-wechat-dt.js` |
| **微信小火花** | ✅ 未单独模块 | ✅ `xy-wx110.plugin` | ⚠️ 需手动配置 | `js/xy-wechat-xhh.js` |
| **微信举报修改** | ✅ `xy-wx110.sgmodule` | ✅ `xy-wx110.plugin` | ✅ `xy-wx110.conf` | `js/xy-wechat-report.js` |
| **微信点歌** | ✅ `xy-wxdg.sgmodule` | ✅ `xy-wxdg.plugin` | ✅ `xy-wxdg.conf` | 多个脚本 |

### 🎨 主题盒子功能

| 功能 | Surge | Loon | Quantumult X | 脚本 |
|------|-------|------|--------------|------|
| **主题盒子兑换** | ✅ `xy-themebox.sgmodule` | ✅ `xy-themebox.plugin` | ✅ `xy-themeboxqx.conf` | `js/xy-themebox-notify.js` |
| **主题统计** | ✅ `xy-themebox.sgmodule` | ✅ `xy-themebox.plugin` | ⚠️ 需手动配置 | `js/xy-themebox-stats-theme.js` |
| **气泡统计** | ✅ `xy-themebox.sgmodule` | ✅ `xy-themebox.plugin` | ⚠️ 需手动配置 | `js/xy-themebox-stats-bubble.js` |
| **PKC 主题盒子** | ✅ `xy-pkctb.sgmodule` | ✅ `xy-pkctb.plugin` | ✅ `xy-pkctbqx.conf` | `js/xy-pkctb-notify.js` |

### 🎬 视频/链接捕获

| 功能 | Surge | Loon | Quantumult X | 脚本 |
|------|-------|------|--------------|------|
| **抖音链接捕获** | ✅ `videos-url-simple.sgmodule` | ✅ `xy-dyurl.plugin` / `videos-url-simple.plugin` | ✅ `douyin.conf` | `js/xy-douyin-parser.js` |
| **多站视频捕获** | ✅ `videos-url.sgmodule` | ✅ `videos-url.plugin` | ✅ `videos-url.conf` | `js/xy-douyin-parser.js` |

### 📱 应用相关

| 功能 | Surge | Loon | Quantumult X | 脚本 |
|------|-------|------|--------------|------|
| **Telegram 跳转** | ✅ `telegram.sgmodule` | ✅ `telegram.plugin` | ✅ `telegram.conf` | `js/telegram.js` |
| **巨魔注入器重写** | ✅ `tf-repo-sg.sgmodule` | ✅ `tf-repo-loon.plugin` | ✅ `tf-repo-qx.conf` | 无需脚本（URL 重写）|

### 🔧 API 查询（Loon 专属，暂未移植）

| 功能 | Surge | Loon | Quantumult X | 说明 |
|------|-------|------|--------------|------|
| **API 余额查询** | ⚠️ 待补充 | ✅ `xy-apikey.plugin` | ⚠️ 待补充 | 需要移植多个脚本 |

---

## 📊 统计数据

### Surge 模块（13个）
1. ✅ `ios-xiyan.sgmodule` - iOS 全能更新监控
2. ✅ `emby.sgmodule` - Emby 解锁
3. ✅ `fvtoken.sgmodule` - FV Token 抓取
4. ✅ `xy-ai.sgmodule` - AI 接口授权
5. ✅ `xy-pkctb.sgmodule` - PKC 主题盒子
6. ✅ `xy-themebox.sgmodule` - 主题盒子通知
7. ✅ `xy-wxdg.sgmodule` - 微信点歌
8. ✅ `xy-wx110.sgmodule` - 微信举报修改
9. ✅ `telegram.sgmodule` - Telegram 跳转
10. ✅ `tf-repo-sg.sgmodule` - 巨魔注入器重写
11. ✅ `videos-url.sgmodule` - 多站视频捕获
12. ✅ `videos-url-simple.sgmodule` - 抖音链接捕获

### Loon 插件（15个）
1. ✅ `emby.plugin` - Emby 解锁
2. ✅ `fvtoken.plugin` - FV Token 抓取
3. ✅ `xy-ai.plugin` - AI 接口授权
4. ✅ `xy-pkctb.plugin` - PKC 主题盒子
5. ✅ `xy-themebox.plugin` - 主题盒子通知
6. ✅ `xy-wxdt.plugin` - 微信斗图接口
7. ✅ `xy-wxdg.plugin` - 微信点歌
8. ✅ `xy-wx110.plugin` - 微信举报修改
9. ✅ `xy-dyurl.plugin` - 抖音解析链接捕获
10. ✅ `telegram.plugin` - Telegram 跳转
11. ✅ `tf-repo-loon.plugin` - 巨魔注入器重写
12. ✅ `videos-url.plugin` - 多站视频捕获
13. ✅ `videos-url-simple.plugin` - 抖音链接捕获
14. ✅ `xy-apikey.plugin` - API 余额查询（多功能）
15. ⚠️ 其他（未列出）

### Quantumult X 重写（14个）
1. ✅ `emby.conf` - Emby 解锁
2. ✅ `fvtoken.conf` - FV Token 抓取
3. ✅ `xy-aiqx.conf` - AI 接口授权
4. ✅ `xy-pkctbqx.conf` - PKC 主题盒子
5. ✅ `xy-themeboxqx.conf` - 主题盒子兑换
6. ✅ `xy-dtqx.conf` - 微信斗图接口
7. ✅ `xy-wxdg.conf` - 微信点歌（简化版）
8. ✅ `xy-wx110.conf` - 微信举报修改
9. ✅ `telegram.conf` - Telegram 跳转
10. ✅ `tf-repo-qx.conf` - 巨魔注入器重写
11. ✅ `videos-url.conf` - 多站视频捕获
12. ✅ `douyin.conf` - 抖音链接捕获

---

## 🎯 配置文件引用地址

### Surge 模块引用

```ini
# 核心监控（包含 App Store/Cydia/巨魔 IPA/DEB 监控）
https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/Surge/module/ios-xiyan.sgmodule

# Emby 解锁
https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/Surge/module/emby.sgmodule

# FV Token 抓取
https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/Surge/module/fvtoken.sgmodule

# AI 接口授权
https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/Surge/module/xy-ai.sgmodule

# 主题盒子通知
https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/Surge/module/xy-themebox.sgmodule

# Telegram 跳转
https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/Surge/module/telegram.sgmodule
```

### Loon 插件引用

```ini
# Emby 解锁
https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/Loon/Plugins/emby.plugin

# FV Token 抓取
https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/Loon/Plugins/fvtoken.plugin

# AI 接口授权
https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/Loon/Plugins/xy-ai.plugin

# 主题盒子兑换
https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/Loon/Plugins/xy-themebox.plugin

# Telegram 跳转
https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/Loon/Plugins/telegram.plugin
```

### Quantumult X 重写引用

```ini
[rewrite_remote]
# Emby 解锁
https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/QX/rewrite/emby.conf, tag=Emby解锁, update-interval=86400, opt-parser=false, enabled=true

# AI 接口授权
https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/QX/rewrite/xy-aiqx.conf, tag=AI接口授权, update-interval=86400, opt-parser=false, enabled=true

# 主题盒子兑换
https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/QX/rewrite/xy-themeboxqx.conf, tag=主题盒子兑换, update-interval=86400, opt-parser=false, enabled=true

# Telegram 跳转
https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/QX/rewrite/telegram.conf, tag=Telegram跳转, update-interval=86400, opt-parser=false, enabled=true
```

---

## ⚠️ 特别说明

### Quantumult X 用户注意

由于 QX **不支持 `$argument` 参数传递**，以下功能需要额外配置：

1. **需要修改脚本内默认配置的**：
   - 微信斗图接口（`xy-dtqx.conf`）
   - 微信举报修改（`xy-wx110.conf`）
   - Telegram 跳转（默认跳转 Telegram，如需其他客户端需改脚本）

2. **暂未提供 QX 配置的**（功能复杂）：
   - iOS 全能更新监控（需手动配置 CRON + 参数）
   - API 余额查询（需多个脚本配合）

### 推荐使用 Surge/Loon

如果你需要完整的功能和最佳体验，建议使用 **Surge** 或 **Loon**，它们支持参数传递，配置更灵活。

---

## 🙏 致谢

所有脚本均为三端通用，可在 Surge / Loon / Quantumult X 中无缝使用！

**作者**: 夕颜  
**微信**: 1418581664  
**主页**: https://iosxy.xin  
**仓库**: https://github.com/xiyan-99/vpn

