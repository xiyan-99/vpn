// 抖音音视频解析捕获 - 第二次不再通知，点击跳转链接 - by 夕颜
try {
  const url = $request.url;

  if (!url) {
    console.log("⛔ 无效请求 URL");
    $done({});
    return;
  }

  let cacheKey = "";
  let mediaType = "";

  // 判断是否为音频
  if (url.endsWith(".mp3") || url.endsWith(".m4a")) {
    cacheKey = "dy_music_url";
    mediaType = "音频";
  }
  // 判断是否为视频
  else if (/\.douyinvod\.com\/.*\/video/.test(url)) {
    cacheKey = "dy_video_url";
    mediaType = "视频";
  } else {
    console.log("ℹ️ 非音视频链接，跳过: " + url);
    $done({});
    return;
  }

  const cached = $persistentStore.read(cacheKey);

  if (url === cached) {
    console.log(`🔁 ${mediaType}链接已缓存，跳过通知: ${url}`);
  } else {
    const saved = $persistentStore.write(url, cacheKey);
    if (saved) {
      console.log(`✅ 新${mediaType}链接已保存: ${url}`);
      $notification.post(
        `抖音${mediaType}解析捕获 by夕颜`,
        "",
        url,
        { openUrl: url }
      );
    } else {
      console.log(`❌ ${mediaType}链接保存失败: ${url}`);
    }
  }
} catch (e) {
  console.log("❌ 脚本错误: " + e);
}

$done({});