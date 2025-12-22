# 更新日志

## 2025-01-XX - 三端通用脚本改造

### 🎉 重大更新

将所有脚本改造为 **Surge / Loon / Quantumult X 三端通用**版本。

### ✨ 新增脚本

#### 核心监控脚本
- `appstore-monitor.js` - App Store 应用更新监控（三端通用）
- `cydia-repo-monitor.js` - iOS 越狱源监控（三端通用）
- `trollstore-ipa-monitor.js` - 巨魔 IPA 软件源监控（三端通用）
- `trollfools-deb-monitor.js` - 巨魔 DEB 插件商店监控（三端通用）

#### 工具类脚本
- `xy-ai-auth.js` - AI 接口 wxid 授权（合并多个接口，三端通用）
- `xy-wechat-dt.js` - 微信斗图接口 wxid 替换（三端通用）
- `xy-wechat-xhh.js` - 微信小火花 wxid 列表注入（三端通用）
- `xy-douyin-parser.js` - 抖音音视频链接解析捕获（三端通用）
- `fvtoken.js` - FineShare Token 抓取（三端通用）
- `emby-crack.js` - Emby 会员解锁（三端通用）

#### 主题盒子相关
- `xy-themebox-notify.js` - 主题盒子兑换通知（简化版，三端通用）
- `xy-themebox-stats-theme.js` - 主题盒子主题统计（三端通用）
- `xy-themebox-stats-bubble.js` - 主题盒子气泡统计（三端通用）
- `xy-pkctb-notify.js` - PKC 主题盒子兑换通知（三端通用）

### 🔧 技术改进

1. **环境兼容封装**
   - 统一的 `Env` 对象封装三端差异
   - 自动检测运行平台（Surge/Loon/QX）
   - 统一的存储、通知、HTTP 请求接口

2. **参数处理策略**
   - Surge/Loon：优先使用 `$argument` 传参
   - QX：支持默认配置 + 持久化存储兜底
   - 统一的 QueryString 参数格式

3. **代码规范**
   - 所有脚本添加详细注释和作者信息
   - 统一的错误处理机制
   - 完善的日志输出

### 📝 配置文件更新

#### Surge 模块
- ✅ `ios-xiyan.sgmodule` - 更新所有监控脚本引用
- ✅ `xy-ai.sgmodule` - 改用三端通用脚本
- ✅ `xy-themebox.sgmodule` - 更新主题盒子脚本
- ✅ `xy-pkctb.sgmodule` - 更新 PKC 主题盒子脚本
- ✅ `xy-wxdg.sgmodule` - 更新微信斗图脚本
- ✅ `videos-url.sgmodule` - 更新视频链接捕获脚本

#### Loon 插件
- ✅ `emby.plugin` - 更新 Emby 解锁脚本
- ✅ `fvtoken.plugin` - 更新 Token 抓取脚本
- ✅ `xy-ai.plugin` - 改用三端通用脚本
- ✅ `xy-pkctb.plugin` - 更新 PKC 主题盒子脚本
- ✅ `xy-dyurl.plugin` - 更新抖音解析脚本
- ✅ `xy-wxdt.plugin` - 简化微信斗图配置
- ✅ `xy-wx110.plugin` - 更新小火花脚本

#### Quantumult X 重写
- ✅ `xy-aiqx.conf` - 改用三端通用 AI 授权脚本
- ✅ `xy-pkctbqx.conf` - 更新 PKC 主题盒子脚本
- ✅ `xy-themeboxqx.conf` - 更新主题盒子脚本
- ✅ `xy-dtqx.conf` - 改用三端通用微信斗图脚本

### 🌐 脚本引用地址

所有脚本统一使用 GitHub Raw 地址：

```
https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/js/脚本名.js
```

### ⚠️ 重要说明

1. **QX 用户注意**：部分脚本需要配置参数，由于 QX 不支持 `$argument`，请在脚本内修改默认配置或使用持久化存储。

2. **向后兼容**：旧的脚本链接（`https://img.iosxy.xin/js/...`）仍然可用，但建议更新到新的 GitHub Raw 地址。

3. **参数格式**：所有参数统一使用 QueryString 格式：`KEY=value&KEY2=value2`

### 📚 文档更新

- ✅ 新增 `README.md` - 仓库说明和使用指南
- ✅ 新增 `js/README.md` - 脚本目录说明
- ✅ 新增 `js/CHANGELOG.md` - 更新日志（本文件）

### 🙏 致谢

感谢所有使用和支持本仓库的用户！

---

**作者**: 夕颜  
**微信**: 1418581664  
**主页**: https://iosxy.xin

