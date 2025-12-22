try {
  const json = JSON.parse($response.body);
  const url = json?.url;

  if (url && (url.endsWith(".mp3") || url.endsWith(".m4a"))) {
    const saved = $persistentStore.write(url, "kjzl_music_url");
    if (saved) {
      console.log("✅ 捕获音频链接: " + url);
      $notification.post("快捷指令音频捕获 by夕颜", "点击打开链接", url);
    } else {
      console.log("❌ 保存音频链接失败");
    }
  } else {
    console.log("⛔ 未发现有效音频链接: " + url);
  }
} catch (e) {
  console.log("❌ JSON 解析失败: " + e.message);
}

// 原样返回 JSON 响应体
$done({ body: $response.body });