// 主题盒子统计  by夕颜

const cacheKey = "xy_theme_box_cache";
const body = $response.body;

try {
  const json = JSON.parse(body);
  const { current_page, last_page, data = [] } = json;

  // === 缓存读取 + 去重 ===
  const rawCache = $persistentStore.read(cacheKey);
  let cache = rawCache ? JSON.parse(rawCache) : [];

  const existingNames = new Set(cache.map(item => item.name || ""));
  const newThemes = [];

  for (const item of data) {
    const name = item.name || "";
    if (name && !existingNames.has(name)) {
      cache.push(item);
      existingNames.add(name);
      newThemes.push(name);
    }
  }

  $persistentStore.write(JSON.stringify(cache), cacheKey);
  console.log(`✅ 缓存第 ${current_page}/${last_page} 页，共计 ${cache.length} 条`);

  // === 最后一页统计 ===
  if (current_page >= last_page) {
    const prefixMap = {}; // 主主题名 → 子主题数组
    const authorMap = {}; // 作者 → 主主题列表（不重复）

    for (const item of cache) {
      const name = item.name || "";
      const author = item.auth || "未知作者";

      // 前缀：取前面中文或英文 + 数字，直到第一个非字母数字或空格为止
      const prefix = name.match(/^[\u4e00-\u9fa5_a-zA-Z0-9]+/)?.[0] || name;

      if (!prefixMap[prefix]) prefixMap[prefix] = [];
      prefixMap[prefix].push(name);

      if (!authorMap[author]) authorMap[author] = new Set();
      authorMap[author].add(prefix);
    }

    const totalThemes = Object.keys(prefixMap).length;
    const totalSubThemes = cache.length;

    // === 伪造数量处理 ===
    let fakeTheme = parseInt(typeof $argument?.theme === "string" ? $argument.theme.trim() : "");
    let fakeSubThemes = parseInt(typeof $argument?.themes === "string" ? $argument.themes.trim() : "");
    if (isNaN(fakeTheme)) fakeTheme = totalThemes;
    if (isNaN(fakeSubThemes)) fakeSubThemes = totalSubThemes;

    // === 构建通知内容 ===
    let notifyBody = "";

    if (newThemes.length > 0) {
      notifyBody += `🎉 新增 ${newThemes.length} 个主题：${newThemes.join("、")}\n`;
    }

    notifyBody += `🎨 总主题：${fakeTheme} 个，子包：${fakeSubThemes} 个\n\n`;

    for (const [author, prefixSet] of Object.entries(authorMap)) {
      const list = Array.from(prefixSet);
      const line = `${author}：${list.length} 个（${list.join("、")}）`;
      notifyBody += line + "\n";
    }

    const notifyTitle = "主题盒子统计 - by夕颜";
    $notification.post(notifyTitle, "", notifyBody.trim());
    console.log("📊 通知已发送 by夕颜\n" + notifyBody);
  }

} catch (e) {
  console.log("❌ 脚本错误: " + e.message);
}

$done({});