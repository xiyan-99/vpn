// 抖音音频解析捕获 - 第二次不再通知，点击跳转链接 - by 夕颜
try {
  const url = $request.url;
  const cacheKey = "dy_music_url";

  if (url && (url.endsWith(".mp3") || url.endsWith(".m4a"))) {
    const cached = $persistentStore.read(cacheKey);

    if (url === cached) {
      console.log("🔁 链接已缓存，跳过通知: " + url);
    } else {
      const saved = $persistentStore.write(url, cacheKey);
      if (saved) {
        console.log("✅ 新音频链接已保存: " + url);
        $notification.post("抖音音频解析捕获 by夕颜", "", url, {
          openUrl: url
        });
      } else {
        console.log("❌ 链接保存失败: " + url);
      }
    }
  } else {
    console.log("ℹ️ 非音频格式链接，跳过: " + url);
  }
} catch (e) {
  console.log("❌ 脚本错误: " + e);
}

$done({});