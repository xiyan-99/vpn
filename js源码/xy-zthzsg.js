// ==Script==
// @name         主题盒子统计 - by夕颜
// @description  支持分页缓存、动态传参伪装数量，新增/删除主题通知
// ==/Script==

const cacheKey = "xy_theme_box_cache";
const tempKey = "xy_theme_box_temp"; // 临时合并缓存

try {
  const json = JSON.parse($response.body);
  const { current_page, last_page, data = [] } = json;

  // === 临时缓存读取 ===
  const rawTemp = $persistentStore.read(tempKey);
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
  $persistentStore.write(JSON.stringify(merged), tempKey);
  console.log(`✅ 缓存更新成功：第 ${current_page}/${last_page} 页，当前 ${merged.length} 个`);

  // === 最后一页：执行对比逻辑 ===
  if (current_page >= last_page) {
    const rawOld = $persistentStore.read(cacheKey);
    const oldCache = rawOld ? JSON.parse(rawOld) : [];

    const oldNames = new Set(oldCache.map(i => i.name));
    const newNames = new Set(merged.map(i => i.name));

    const added = merged.filter(i => !oldNames.has(i.name));
    const removed = oldCache.filter(i => !newNames.has(i.name));

    // === 更新主缓存并清除临时缓存 ===
    $persistentStore.write(JSON.stringify(merged), cacheKey);
    $persistentStore.write("", tempKey); // 清空临时缓存

    // === 伪装参数读取 ===
    const query = typeof $argument === "string" ? Object.fromEntries(new URLSearchParams($argument)) : {};
    const fakeTheme = parseInt(query.theme || "") || merged.length;
    const fakeSubThemes = parseInt(query.themes || "") || merged.length;

    // === 构建通知 ===
    let notifyBody = "";

    if (added.length > 0) {
      notifyBody += `🆕 新增 ${added.length} 个主题：\n${added.map(i => i.name).join("、")}\n\n`;
    }

    if (removed.length > 0) {
      notifyBody += `🗑️ 删除 ${removed.length} 个主题：\n${removed.map(i => i.name).join("、")}\n\n`;
    }

    notifyBody += `🎨 总主题：${fakeTheme} 个}\n`;

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

    const title = "主题盒子统计 - by夕颜";
    $notification.post(title, "", notifyBody.trim());
    console.log("📊 通知内容：\n" + notifyBody.trim());
  }

} catch (e) {
  console.log("❌ 脚本错误：" + e.message);
}

$done({});

