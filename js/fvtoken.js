/**
 * FineShare Token 抓取脚本 - 三端通用
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
const tokenKey = "fineshare_token";
const title = "FV Token 抓取 - by夕颜";

// 提取 Authorization 头中的 Bearer Token
const auth = $request.headers?.Authorization || $request.headers?.authorization;

if (auth && auth.startsWith("Bearer ")) {
  const token = auth.slice(7); // 去掉 Bearer 前缀
  const saved = Env.write(token, tokenKey);

  if (saved) {
    const content = `Token: ${token}`;
    
    // 根据平台使用不同的通知选项
    const opts = Env.isLoon ? {
      clipboard: token,
      openUrl: "loon://"
    } : { "open-url": "shortcuts://" };

    Env.notify(title, "Token 已保存", content, opts);
    console.log("✅ Token 抓取并已通知");
  } else {
    console.log("❌ Token 保存失败");
  }
} else {
  console.log("⚠️ 未检测到 Bearer Token");
}

$done({});
