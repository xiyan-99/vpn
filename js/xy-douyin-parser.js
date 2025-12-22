/**
 * 抖音音视频解析链接捕获 - 三端通用
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

// ============ 主逻辑 ============
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

  const cached = Env.read(cacheKey);

  if (url === cached) {
    console.log(`🔁 ${mediaType}链接已缓存，跳过通知: ${url}`);
  } else {
    const saved = Env.write(url, cacheKey);
    if (saved) {
      console.log(`✅ 新${mediaType}链接已保存: ${url}`);
      
      // 通知选项：点击跳转到链接
      Env.notify(
        `抖音${mediaType}解析捕获 - by夕颜`,
        "",
        url,
        { "open-url": url }
      );
    } else {
      console.log(`❌ ${mediaType}链接保存失败: ${url}`);
    }
  }
} catch (e) {
  console.log("❌ 脚本错误: " + e);
}

$done({});

