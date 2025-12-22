/**
 * 主题盒子 - 气泡统计脚本 - 三端通用
 * 支持分页缓存、动态传参伪装数量、新增/删除气泡通知
 * 兼容 Surge / Loon / Quantumult X
 * @author xiyan wx: 1418581664
 */

// ============ 环境封装 ============
const Env = (() => {
  const isSurge = typeof $httpClient !== "undefined";
  const isQX = typeof $task !== "undefined";
  const isLoon = !isSurge && !isQX && typeof $loon !== "undefined";

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

  const notify = (title, subtitle = "", body = "", opts = {}) => {
    if (typeof $notification !== "undefined") $notification.post(title, subtitle, body, opts);
  };

  return { isSurge, isLoon, isQX, read, write, notify };
})();

// ============ 参数解析 ============
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

function getArgumentsString() {
  if (typeof $argument !== "undefined" && $argument) return String($argument);
  const stored = Env.read("xy_themebox_stats_args");
  return stored || "";
}

// ============ 主逻辑 ============
const cacheKey = "xy_theme_qp_cache";
const tempKey = "xy_theme_qp_temp";

try {
  const json = JSON.parse($response.body);
  const { current_page, last_page, data = [] } = json;

  // === 临时缓存读取 ===
  const rawTemp = Env.read(tempKey);
  const tempCache = rawTemp ? JSON.parse(rawTemp) : [];

  // === 合并当前页数据 ===
  const currentNames = new Set(tempCache.map(i => i.name));
  const merged = [...tempCache];

  for (const item of data) {
    if (item.name && !currentNames.has(item.name)) {
      merged.push(item);
    }
  }

  // === 写入临时缓存 ===
  Env.write(JSON.stringify(merged), tempKey);
  console.log(`✅ 缓存更新成功：第 ${current_page}/${last_page} 页，当前 ${merged.length} 个`);

  // === 最后一页：执行对比逻辑 ===
  if (current_page >= last_page) {
    const rawOld = Env.read(cacheKey);
    const oldCache = rawOld ? JSON.parse(rawOld) : [];

    const oldNames = new Set(oldCache.map(i => i.name));
    const newNames = new Set(merged.map(i => i.name));

    const added = merged.filter(i => !oldNames.has(i.name));
    const removed = oldCache.filter(i => !newNames.has(i.name));

    // === 更新主缓存并清除临时缓存 ===
    Env.write(JSON.stringify(merged), cacheKey);
    Env.write("", tempKey); // 清空临时缓存

    // === 伪装参数读取 ===
    const args = parseArgs(getArgumentsString());
    const fakeTheme = parseInt(args.theme || "") || merged.length;
    const fakeSubThemes = parseInt(args.themes || "") || merged.length;

    // === 构建通知 ===
    let notifyBody = "";

    if (added.length > 0) {
      notifyBody += `🆕 新增 ${added.length} 个气泡：\n${added.map(i => i.name).join("、")}\n\n`;
    }

    if (removed.length > 0) {
      notifyBody += `🗑️ 删除 ${removed.length} 个气泡：\n${removed.map(i => i.name).join("、")}\n\n`;
    }

    notifyBody += `🎨 总气泡：${fakeTheme} 个\n`;

    // 作者归类
    const authorMap = {};
    for (const item of merged) {
      const author = item.auth || "未知作者";
      const prefix = item.name.match(/^[\u4e00-\u9fa5_a-zA-Z0-9]+/)?.[0] || item.name;
      if (!authorMap[author]) authorMap[author] = new Set();
      authorMap[author].add(prefix);
    }

    for (const [author, prefixSet] of Object.entries(authorMap)) {
      const list = Array.from(prefixSet);
      notifyBody += `${author}：${list.length} 个（${list.join("、")}）\n`;
    }

    const title = "主题气泡统计 - by夕颜";
    Env.notify(title, "", notifyBody.trim());
    console.log("📊 通知内容：\n" + notifyBody.trim());
  }

} catch (e) {
  console.log("❌ 脚本错误：" + e.message);
}

$done({});

