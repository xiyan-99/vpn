# App Store 更新检测 Surge 面板

## 功能介绍

这是一个支持自定义App包名和自动检测更新时间的Surge面板模块，可以：

- ✅ 自动检测App Store应用更新
- ✅ 支持自定义应用包名列表
- ✅ 支持自定义自动更新间隔
- ✅ **支持Cron定时任务**（后台自动执行）
- ✅ 面板实时显示检测结果
- ✅ 发现更新时自动推送通知
- ✅ 支持多种应用类型（代理工具、社交软件等）

## 安装使用

### 方法一：本地模块文件（推荐 - 可自定义参数）

1. 下载 `appstore.sgmodule` 文件到本地

2. 修改应用包名和检查间隔：
   
   打开文件，找到这两行：
   ```ini
   appstore_panel = script-name=appstore_panel,update-interval=300
   ```
   修改 `update-interval=` 后的数字（秒）
   
   ```ini
   argument=applist=com.liguangming.Shadowrocket|com.nssurge.inc.surge-ios|com.loon0x00.LoonLite
   ```
   修改 `argument=applist=` 后的包名列表，用 `|` 分隔

3. 在Surge中加载本地模块文件

### 方法二：在线模块（使用默认配置）

直接添加模块URL：
```
https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/appstore.sgmodule
```

默认监控：Shadowrocket、Surge、Loon
默认间隔：300秒（5分钟）

### 方法三：在配置文件中覆盖参数

安装在线模块后，在主配置文件中添加：

```ini
[Panel]
appstore_panel = script-name=appstore_custom,update-interval=600

[Script]
appstore_custom = type=generic,timeout=10,script-path=https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main/appstore.js,argument=applist=你的包名1|你的包名2
```

这会覆盖模块的默认配置。

## 支持的应用

### 预置应用数据库

脚本内置了常见应用的名称和图标，包括：

| 包名 | 应用名 | 图标 |
|------|--------|------|
| com.liguangming.Shadowrocket | Shadowrocket | 🚀 |
| com.nssurge.inc.surge-ios | Surge | ⚡️ |
| com.loon0x00.LoonLite | Loon | 🎈 |
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

### 应用包名列表

在模块文件的 Script 部分配置：

```ini
argument=applist=包名1|包名2|包名3
```

- **格式**: 用 `|` 分隔的包名列表（也支持逗号`,`和分号`;`）
- **示例**: `argument=applist=com.liguangming.Shadowrocket|ph.telegra.Telegraph|com.tencent.xin`
- **默认值**: 
  - com.liguangming.Shadowrocket
  - com.nssurge.inc.surge-ios
  - com.loon0x00.LoonLite

### UPDATEINTERVAL（面板自动更新间隔）

在模块文件的 Panel 部分配置：

```ini
update-interval=秒数
```

- **格式**: 整数（秒）
- **示例**: `update-interval=600` (10分钟)
- **说明**: 
  - 只有在策略选择视图时才会自动更新
  - 建议设置 60-600 秒
  - 设置为 1 可以每次都自动更新
- **推荐值**:
  - 频繁使用：60-180秒
  - 一般使用：300-600秒
  - 省流量：1800-3600秒
- **默认值**: 3600秒（1小时）

⚠️ **注意：** 这个参数只影响**面板**的自动刷新。要使用定时任务，请配置 **CRON** 参数。

### CRON（定时任务，可选）

定时任务表达式，默认 `0 */2 * * *`（每2小时执行）

```
CRON = 0 */2 * * *
```

**格式：** `分 时 日 月 星期`

**常用示例：**

| 表达式 | 说明 | 适用场景 |
|--------|------|----------|
| `0 */2 * * *` | 每2小时执行（默认） | 常规监控 |
| `0 */4 * * *` | 每4小时执行 | 降低频率 |
| `0 8,20 * * *` | 每天8点和20点执行 | 固定时间检查 |
| `30 9 * * *` | 每天上午9:30执行 | 工作日早晨检查 |
| `0 */1 * * *` | 每小时执行 | 频繁监控 |
| `0 6 * * 1` | 每周一早上6点执行 | 每周总结 |

**优势：**
- ✅ **后台运行** - 即使不打开面板也会执行
- ✅ **精确时间** - 可以指定具体时间点
- ✅ **系统唤醒** - 可以唤醒设备执行检查
- ✅ **独立于面板** - 不依赖面板刷新

**注意事项：**
- Cron 任务会在后台运行，有更新时会发送通知
- 如果不需要定时任务，可以在 Surge 模块管理中禁用 `appstore_panel_cron` 脚本
- 建议设置合理的执行频率，避免过度消耗资源

### ALWAYSNOTIFY（总是通知，可选）

是否每次都发送通知

- `false` - 默认，只在有更新时通知
- `true` - 每次检测都通知（包括无更新时）

```
ALWAYSNOTIFY = false
```

## 配置示例

### 示例1：默认配置（每2小时定时检查）

```
APPLIST = com.liguangming.Shadowrocket,com.nssurge.inc.surge-ios
UPDATEINTERVAL = 3600
CRON = 0 */2 * * *
ALWAYSNOTIFY = false
```

### 示例2：高频监控（每小时检查）

```
APPLIST = com.liguangming.Shadowrocket,com.nssurge.inc.surge-ios,com.loon0x00.LoonLite
UPDATEINTERVAL = 3600
CRON = 0 */1 * * *
ALWAYSNOTIFY = false
```

### 示例3：固定时间检查（每天8点和20点）

```
APPLIST = com.tencent.xin#微信,com.ss.iphone.ugc.Aweme#抖音
UPDATEINTERVAL = 7200
CRON = 0 8,20 * * *
ALWAYSNOTIFY = false
```

### 示例4：总是通知模式

```
APPLIST = com.liguangming.Shadowrocket
UPDATEINTERVAL = 3600
CRON = 0 */4 * * *
ALWAYSNOTIFY = true
```

### 示例5：使用 App Store 链接

```
APPLIST = https://apps.apple.com/cn/app/id414478124#微信,https://apps.apple.com/us/app/id1442620678#Surge
UPDATEINTERVAL = 3600
CRON = 0 */2 * * *
ALWAYSNOTIFY = false
```

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
1. 增加 `UPDATEINTERVAL` 参数值
2. 减少监控的应用数量
3. 只在需要时手动刷新面板
4. 调整 `CRON` 定时任务频率（如改为每4小时或每天2次）

### Q: Cron 定时任务和面板自动刷新有什么区别？

A: 两者的区别：

| 特性 | 面板自动刷新 | Cron 定时任务 |
|------|------------|--------------|
| 触发条件 | 打开面板后才开始计时 | 后台自动运行 |
| 是否需要打开Surge | 需要 | 不需要 |
| 是否唤醒设备 | 否 | 可以（设置了wake-system） |
| 执行精度 | 相对时间（间隔） | 绝对时间（固定时间点） |
| 通知方式 | 按设置发送 | 按设置发送 |

**推荐搭配：**
- 面板刷新用于查看时自动更新
- Cron 任务用于定时后台监控

### Q: 如何禁用 Cron 定时任务？

A: 在 Surge 模块管理中：
1. 找到本模块
2. 点击展开脚本列表
3. 禁用 `appstore_panel_cron` 脚本

### Q: Cron 表达式怎么写？

A: Surge 的 Cron 表达式格式：`分 时 日 月 星期`

**字段说明：**
- **分**：0-59
- **时**：0-23
- **日**：1-31
- **月**：1-12
- **星期**：0-7（0和7都表示周日）

**特殊字符：**
- `*` - 任意值
- `*/n` - 每n个时间单位
- `1,2,3` - 指定多个值
- `1-5` - 范围

**实用示例：**
```
0 */2 * * *      每2小时执行
0 8,12,18 * * *  每天8点、12点、18点执行
30 9 * * 1-5     工作日上午9:30执行
0 0 * * 0        每周日午夜执行
0 6 1 * *        每月1号早上6点执行
```

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

