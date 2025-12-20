# App Store 更新检测 Surge 面板

## 功能介绍

这是一个支持自定义App包名和自动检测更新时间的Surge面板模块，可以：

- ✅ 自动检测App Store应用更新
- ✅ 支持自定义应用包名列表
- ✅ 支持自定义自动更新间隔
- ✅ 面板实时显示检测结果
- ✅ 发现更新时自动推送通知
- ✅ 支持多种应用类型（代理工具、社交软件等）

## 安装使用

### 方法一：使用模块文件（推荐）

1. 在Surge中添加模块：
   ```
   https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/appstore.sgmodule
   ```

2. 配置参数：
   - **applist**: 填写要监控的应用包名，多个包名用英文逗号分隔
   - **updateInterval**: 自动更新间隔（秒），默认300秒（5分钟）

3. 示例配置：
   ```
   applist = com.liguangming.Shadowrocket,com.nssurge.inc.surge-ios,com.ruikq.decar
   updateInterval = 300
   ```

### 方法二：手动配置

在Surge配置文件中添加：

```ini
[Panel]
appstore_panel = script-name=appstore_panel,update-interval=300

[Script]
appstore_panel = type=generic,timeout=10,script-path=https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/appstore.js,argument=applist=com.liguangming.Shadowrocket,com.nssurge.inc.surge-ios,com.ruikq.decar
```

## 支持的应用

### 预置应用数据库

脚本内置了常见应用的名称和图标，包括：

| 包名 | 应用名 | 图标 |
|------|--------|------|
| com.liguangming.Shadowrocket | Shadowrocket | 🚀 |
| com.nssurge.inc.surge-ios | Surge | ⚡️ |
| com.ruikq.decar | Loon | 🎈 |
| ph.telegra.Telegraph | Telegram | ✈️ |
| com.tencent.xin | 微信 | 💬 |
| com.ss.iphone.ugc.Aweme | 抖音 | 🎵 |
| com.zhihu.ios | 知乎 | 📖 |
| com.tencent.mqq | QQ | 🐧 |

### 添加自定义应用

如果要监控的应用不在预置列表中，可以直接添加包名：

```
applist = com.example.app1,com.example.app2
```

脚本会自动使用包名的最后一部分作为显示名称。

## 如何获取应用包名

### 方法一：通过抓包

1. 在App Store中搜索应用
2. 使用Surge抓包查看请求
3. 找到类似 `https://itunes.apple.com/lookup?bundleId=xxx` 的请求
4. 其中的 `xxx` 就是包名

### 方法二：使用在线工具

访问：https://tools.lancely.tech/apple/app-info
输入应用名称即可查询包名

### 方法三：直接搜索

在浏览器中访问：
```
https://itunes.apple.com/search?term=应用名&entity=software
```

在返回的JSON中找到 `bundleId` 字段

## 参数说明

### applist（必填）

- **格式**: 逗号分隔的包名列表
- **示例**: `com.liguangming.Shadowrocket,com.nssurge.inc.surge-ios`
- **默认值**: 
  - com.liguangming.Shadowrocket
  - com.nssurge.inc.surge-ios
  - com.ruikq.decar

### updateInterval（可选）

- **格式**: 整数（秒）
- **示例**: `300` (5分钟)
- **说明**: 
  - 只有在策略选择视图时才会自动更新
  - 建议设置 1 秒让面板每次都自动更新
  - 设置过小可能增加流量消耗
- **推荐值**:
  - 频繁使用：60-300秒
  - 一般使用：300-600秒
  - 省流量：600-3600秒

## 面板显示说明

### 状态类型

1. **✅ 全部最新** (绿色)
   - 所有应用都是最新版本
   - 查询全部成功

2. **🆕 发现应用更新** (橙色)
   - 有应用发现新版本
   - 显示版本号变化

3. **❌ 检测异常** (红色)
   - 部分或全部应用查询失败
   - 显示失败和成功的应用

### 显示内容

```
📱 App Store 更新检测
--------------------
🚀 Shadowrocket: 2.2.88
⚡️ Surge: 5.9.2
🎈 Loon: 3.2.1

⏱️ 耗时: 2.3s | 📅 14:30
```

## 通知说明

### 通知时机

- ✅ 发现应用更新时
- ❌ 应用查询失败时
- ⏹️ 全部最新且查询成功时**不通知**

### 通知内容

```
标题: 🚀 应用更新
副标题: ✨ 发现应用更新

内容:
🆕 应用更新:
⚡️ Surge: 5.9.1 → 5.9.2

✅ 最新版应用:
🚀 Shadowrocket: 2.2.88
🎈 Loon: 3.2.1

⏱️ 检测耗时: 2.3秒
📅 2025/12/20 14:30
🔔 自动检测 | 发现更新或失败时通知
```

## 常见问题

### Q: 为什么查询失败？

A: 可能的原因：
1. 应用不在当前区域的App Store上架
2. 包名输入错误
3. 网络问题或API限流
4. 应用已下架

解决方法：
- 检查包名是否正确
- 尝试切换网络环境
- 增加请求间隔时间

### Q: Surge经常查询失败？

A: Surge有多个bundleId版本，脚本已内置多个备选方案：
- com.nssurge.inc.surge-ios
- com.nssurge.inc.surge

会自动尝试所有可能的bundleId。

### Q: 如何减少流量消耗？

A: 
1. 增加 `updateInterval` 参数值
2. 减少监控的应用数量
3. 只在需要时手动刷新面板

### Q: 面板不显示？

A: 检查：
1. Surge版本是否 ≥ 4.9.3
2. 是否有有效订阅
3. 订阅是否在2021年9月22日后到期
4. 模块是否正确加载

## 技术特性

### 优化措施

1. **并行请求**: 同时查询所有应用，提高速度
2. **超时控制**: 4秒超时，避免长时间等待
3. **重试机制**: 多个API地址轮询重试
4. **限流保护**: 请求间隔随机延迟，避免被限流
5. **错误处理**: 完善的异常捕获和日志输出

### API接口

使用Apple官方iTunes API：
- 香港区: `https://itunes.apple.com/hk/lookup?bundleId=xxx`
- 中国区: `https://itunes.apple.com/cn/lookup?bundleId=xxx`
- 美国区: `https://itunes.apple.com/us/lookup?bundleId=xxx`

## 更新日志

### v2.0 (面板增强版)
- ✨ 新增面板支持
- ✨ 支持自定义包名列表
- ✨ 支持自定义更新间隔
- ✨ 优化通知逻辑（只在有更新或失败时通知）
- ✨ 改进面板显示样式
- 🐛 修复Surge查询问题

### v1.0 (初始版本)
- 基础更新检测功能
- 通知推送功能

## 作者信息

- **作者**: 夕颜
- **微信**: 1418581664
- **主页**: https://iosxy.xin
- **GitHub**: https://github.com/xiyan-99/vpn

## 许可证

MIT License

