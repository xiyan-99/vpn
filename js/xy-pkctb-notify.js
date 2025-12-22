/**
 * PKC 主题盒子兑换通知 - 三端通用
 * 兼容 Surge / Loon / Quantumult X
 * @author xiyan wx: 1418581664
 */

// ============ 环境封装 ============
const Env = (() => {
  const isSurge = typeof $httpClient !== "undefined";
  const isQX = typeof $task !== "undefined";
  const isLoon = !isSurge && !isQX && typeof $loon !== "undefined";

  const notify = (title, subtitle = "", body = "", opts = {}) => {
    if (typeof $notification !== "undefined") {
      $notification.post(title, subtitle, body, opts);
    } else if (typeof $notify !== "undefined") {
      $notify(title, subtitle, body);
    }
  };

  return { isSurge, isLoon, isQX, notify };
})();

// ============ 主逻辑 ============
try {
  const text = $response.body || "无响应内容";

  console.log("📥 拦截到 PKC 主题盒子响应:\n" + text);
  
  // 发送通知
  Env.notify("🎁 PKC 主题盒子兑换通知 - by夕颜", "", text);
  
  console.log("📤 已发送通知 ✅");

  // 返回空响应
  $done({
    status: 204,
    headers: {
      "Content-Type": "text/plain"
    },
    body: ""
  });

} catch (e) {
  console.log("❌ 错误: " + e);
  $done({
    status: 204,
    headers: {
      "Content-Type": "text/plain"
    },
    body: ""
  });
}

