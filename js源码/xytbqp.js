// 主题气泡统计 by夕颜

const cacheKey = "xy_theme_box_qp";
const body = $response.body;

try {
  const json = JSON.parse(body);
  const { current_page, last_page, data = [] } = json;

  // 读取缓存
  const rawCache = $persistentStore.read(cacheKey);
  let cache = rawCache ? JSON.parse(rawCache) : [];

  // 构建唯一键集合（auth + name）
  const existingKeys = new Set(cache.map(item => `${item.auth || "未知"}|${item.name || ""}`));
  const newThemes = [];

  // 合并新数据
  for (const item of data) {
    const key = `${item.auth || "未知"}|${item.name || ""}`;
    if (!existingKeys.has(key)) {
      cache.push(item);
      existingKeys.add(key);
      if (item.name) newThemes.push(item.name);
    }
  }

  // 保存更新后的缓存
  $persistentStore.write(JSON.stringify(cache), cacheKey);
  console.log(`✅ 缓存第 ${current_page}/${last_page} 页，共计 ${cache.length} 条`);

  // 最后一页时统计
  if (current_page >= last_page) {
    let totalThemes = 0;
    let totalSubThemes = 0;
    const authorMap = {};

    for (const item of cache) {
      if (item.name) {
        totalThemes++;
        const author = item.auth || "未知作者";
        if (!authorMap[author]) authorMap[author] = [];
        authorMap[author].push(item.name);
      }

      if (Array.isArray(item.themes)) {
        totalSubThemes += item.themes.length;
      }
    }

    // 如果传入了伪造参数，覆盖真实值（仅影响通知标题的数字）
    const fakeTheme = parseInt($argument.theme);
    const fakeSubThemes = parseInt($argument.themes);

    const finalThemeCount = isNaN(fakeTheme) ? totalThemes : fakeTheme;
    const finalSubThemeCount = isNaN(fakeSubThemes) ? totalSubThemes : fakeSubThemes;

    // 构建通知内容
    let notifyBody = "";

    if (newThemes.length > 0) {
      notifyBody += `🎉 新增 ${newThemes.length} 个气泡：${newThemes.join("、")}\n`;
    }

    notifyBody += `🎨 总气泡：${finalThemeCount} 个，子包：${finalSubThemeCount} 个\n\n`;

    for (const [author, names] of Object.entries(authorMap)) {
      const list = Array.from(new Set(names));
      const line = `${author}：${list.length}个（${list.join("、")}）`;
      notifyBody += line + "\n";
    }

    const notifyTitle = "主题气泡统计-by夕颜";
    $notification.post(notifyTitle, "", notifyBody.trim());
    console.log("📊 通知已发送 by夕颜\n" + notifyBody);
  }

} catch (e) {
  console.log("❌ 脚本错误: " + e.message);
}

$done({});