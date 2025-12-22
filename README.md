## 说明

这是一个面向 **Surge / Loon / Quantumult X（QX）** 的配置与脚本仓库，仓库地址：https://raw.githubusercontent.com/xiyan-99/vpn/refs/heads/main
包含：

- **Surge**：`.sgmodule` 模块 + 相关脚本
- **Loon**：`.plugin` 插件（含 `[Argument]` 参数面板）
- **Quantumult X**：`.conf` 重写配置 + 相关脚本

仓库目标：**同一份 JS 逻辑尽量做到三端通用**（同域名/同接口的重写脚本，尽可能只维护一份），并给出统一的参数/存储/网络请求封装规范。

> 关键差异：**Surge 与 Loon 支持 `$argument` 传入自定义参数；QX 不支持 `$argument`。**  
> 本仓库要求：脚本必须兼容三端运行，即使 QX 没有 `$argument` 也要能正常工作（通过“默认值/持久化存储/单独配置段”兜底）。

---

## 目录结构

- **`Surge/`**
  - **`Surge/module/`**：Surge 模块（`.sgmodule`）
  - **`Surge/js/`**：Surge 相关脚本（部分为 Panel/Cron 脚本）
- **`Loon/`**
  - **`Loon/Plugins/`**：Loon 插件（`.plugin`）
  - **`Loon/js/`**：Loon 相关脚本（如有）
- **`QX/`**
  - **`QX/rewrite/`**：Quantumult X 重写配置（`.conf`）
  - **`QX/js/`**：Quantumult X 脚本（如有）
- **`js/`**
  - 建议作为“**通用脚本**”目录（三端共用的 JS 放这里；如需按平台区分，建议命名带后缀：`*.sg.js / *.loon.js / *.qx.js`，但优先做成单文件三端兼容）

---

## 三端使用方式（安装/导入）

### Surge（`.sgmodule`）

- 将 `Surge/module/*.sgmodule` 导入 Surge 模块管理器启用即可。
- Surge 支持在脚本配置里通过 `argument=` 传参，脚本中通过 `$argument` 读取。
- 示例：`Surge/module/ios-xiyan.sgmodule` 里大量使用 `argument=KEY=...&KEY2=...` 传参。

### Loon（`.plugin`）

- 将 `Loon/Plugins/*.plugin` 导入 Loon 插件管理器启用即可。
- Loon 支持通过 `[Argument]` 定义参数面板，并在脚本行上用 `argument=[{...}]` 传参。
- 示例：`Loon/Plugins/xy-themebox.plugin` 的 `[Argument]` + `argument=[{barkKey},{title},...]`。

### Quantumult X（`.conf`）

- 将 `QX/rewrite/*.conf` 导入 Quantumult X 的配置（或复制其中段落到你的配置文件）。
- QX 的脚本入口通常在：
  - `[rewrite_local]`：`script-request-header / script-request-body / script-response-body`
  - `[task_local]`：定时任务
- **注意：QX 不支持 `$argument`**，无法像 Surge/Loon 一样从配置向脚本传入自定义参数。

---

## JS 脚本三端兼容规范（强制）

### 运行场景统一判断

脚本必须同时支持三类触发：

- **请求阶段**：`typeof $request !== "undefined"` 且 `typeof $response === "undefined"`
- **响应阶段**：`typeof $response !== "undefined"`
- **定时/面板（无请求无响应）**：两者都不存在

### 参数策略（Surge/Loon：`$argument`；QX：兜底）

统一约定参数格式为 **QueryString**：

```
KEY=value&KEY2=value2
```

- **Surge/Loon**：优先从 `$argument` 读取
- **QX**：没有 `$argument`，必须提供兜底来源（至少一种）：
  - **默认参数字符串**（写在脚本里）
  - **持久化存储**（用户先运行一次“设置脚本”写入 `$prefs`，脚本再读取）
  - **脚本顶部配置对象**（QX 用户改文件即可）

> 本仓库推荐优先级：`$argument`（Surge/Loon）→ 存储（QX/三端通用）→ 默认值（脚本内）。

---

## 通用脚手架（建议所有新脚本直接复制使用）

下面这段“环境 + 参数 + 存储 + HTTP”封装，适用于三端：

```javascript
/**
 * Universal Runtime (Surge/Loon/QX)
 * - Surge/Loon: supports $argument
 * - QX: no $argument, use storage/default fallback
 */

const Env = (() => {
  const isRequest = typeof $request !== "undefined";
  const isResponse = typeof $response !== "undefined";
  const isSurge = typeof $httpClient !== "undefined";
  const isQX = typeof $task !== "undefined";
  const isLoon = !isSurge && !isQX && typeof $loon !== "undefined"; // 兜底判断

  const platform = isSurge ? "Surge" : isLoon ? "Loon" : isQX ? "QX" : "Unknown";

  const notify = (title, subtitle = "", body = "", opts = {}) => {
    if (typeof $notification !== "undefined") $notification.post(title, subtitle, body, opts);
  };

  const read = (key) => {
    if (typeof $persistentStore !== "undefined") return $persistentStore.read(key);
    if (typeof $prefs !== "undefined") return $prefs.valueForKey(key);
    return null;
  };

  const write = (val, key) => {
    if (typeof $persistentStore !== "undefined") return $persistentStore.write(val, key);
    if (typeof $prefs !== "undefined") return $prefs.setValueForKey(String(val), key);
    return false;
  };

  const http = (opts) =>
    new Promise((resolve, reject) => {
      if (isQX) {
        $task.fetch(opts).then(resolve, reject);
        return;
      }
      if (isSurge || isLoon) {
        const method = (opts.method || "GET").toUpperCase();
        const cb = (err, resp, data) => (err ? reject(err) : resolve({ status: resp?.status, headers: resp?.headers, body: data }));
        if (method === "POST") $httpClient.post(opts, cb);
        else $httpClient.get(opts, cb);
        return;
      }
      reject(new Error("Unknown platform"));
    });

  const done = (val = {}) => $done(val);

  return { platform, isSurge, isLoon, isQX, isRequest, isResponse, notify, read, write, http, done };
})();

function parseArgs(qs) {
  const out = {};
  if (!qs || typeof qs !== "string") return out;
  const s = qs.trim().replace(/^\?/, "");
  if (!s) return out;

  for (const part of s.split("&")) {
    if (!part) continue;
    const idx = part.indexOf("=");
    const k = decodeURIComponent((idx >= 0 ? part.slice(0, idx) : part).trim());
    const v = decodeURIComponent((idx >= 0 ? part.slice(idx + 1) : "").trim());
    if (k) out[k] = v;
  }
  return out;
}

// 你可以在每个脚本里定义默认参数（给 QX 兜底）
const DEFAULT_ARGUMENTS = ""; // 例如：'APPLIST="com.tencent.xin"&MAXNOTIFY="10"&ALWAYSNOTIFY="false"'

function getArgumentsString() {
  // Surge/Loon：有 $argument 就用
  if (typeof $argument !== "undefined" && $argument) return String($argument);

  // QX/三端兜底：优先读存储，其次默认值
  const stored = Env.read("script_args"); // 每个脚本建议改成自己的 key
  return stored || DEFAULT_ARGUMENTS;
}

const Args = parseArgs(getArgumentsString());
// Args.KEY / Args.KEY2 ...
```

### 参数 key 命名建议

- **全大写**（更适合 Surge/Loon 的参数面板展示）：`APPLIST / REPOURL / ALWAYSNOTIFY / MAXNOTIFY`
- 禁用开关建议统一支持 `#`：例如 `APPLIST="#"` 代表禁用该功能（见 `Surge/module/ios-xiyan.sgmodule` 的约定）

---

## 关于 QX 无 `$argument` 的推荐做法

### 做法 A：脚本内默认值（最简单）

在脚本中维护 `DEFAULT_ARGUMENTS` 或一个 `DEFAULT_CONFIG`，QX 用户直接改文件即可。

### 做法 B：用存储“模拟参数”（最推荐，最像 Surge/Loon）

1. 提供一个“设置脚本”（用户在 QX 手动运行一次），把配置写进 `$prefs`：  
   - `Env.write("APPLIST=...&MAXNOTIFY=...", "script_args")`
2. 主脚本运行时 `Env.read("script_args")` 取到“参数字符串”，再走 `parseArgs()`，逻辑与 Surge/Loon 一致。

> 这样可以做到：同一份逻辑用 `Args.XYZ` 取配置，三端体验一致；QX 只是“配置入口”换成了存储。

---

## 贡献/开发约定（写新脚本必须遵守）

- **脚本必须三端兼容**：不能只写 Surge/Loon 的 `$httpClient` 或只写 QX 的 `$task.fetch`，需要用封装或条件判断。
- **参数必须有兜底**：不能只依赖 `$argument`；必须在 QX 下可运行（默认值或存储）。
- **输出尽量统一**：日志用 `console.log`；结束用 `$done()`。
- **不要假设一定有请求/响应**：Cron/Panel 场景要能工作（无 `$request/$response`）。

---

## 免责声明

本仓库仅用于学习与交流脚本/重写规则的编写方式。请遵守所在地法律法规及相关服务条款，使用脚本造成的后果由使用者自行承担。


