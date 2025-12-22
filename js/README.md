# 通用脚本目录

本目录存放**三端通用**的 JavaScript 脚本，兼容 Surge / Loon / Quantumult X。

## 脚本命名规范

- **单一功能脚本**：直接命名，如 `emby-crack.js`、`fvtoken.js`
- **监控类脚本**：以 `*-monitor.js` 结尾
- **工具类脚本**：以功能命名，如 `xy-themebox.js`、`xy-ai-auth.js`

## 脚本分类

### 📱 App/源监控脚本
- `appstore-monitor.js` - App Store 应用更新监控
- `cydia-repo-monitor.js` - iOS 越狱源监控
- `trollstore-ipa-monitor.js` - 巨魔 IPA 软件源监控
- `trollfools-deb-monitor.js` - 巨魔 DEB 插件商店监控

### 🎨 主题盒子相关
- `xy-themebox-redeem.js` - 主题盒子兑换通知（通用版）
- `xy-themebox-stats.js` - 主题盒子统计数据修改

### 🔑 API 授权/Token
- `xy-ai-auth.js` - AI 接口 wxid 授权（合并多个接口）
- `fvtoken.js` - FineShare Token 抓取

### 🎬 抖音/微信相关
- `xy-douyin-parser.js` - 抖音音视频链接解析捕获
- `xy-wechat-dt.js` - 微信斗图接口 wxid 替换
- `xy-wechat-xhh.js` - 微信小火花 wxid 列表

### 🎭 破解/修改脚本
- `emby-crack.js` - Emby 会员解锁

## 引用方式

所有配置文件中的脚本引用统一使用 GitHub Raw 地址：

```
https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/js/脚本名.js
```

例如：
```
https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/js/appstore-monitor.js
```

