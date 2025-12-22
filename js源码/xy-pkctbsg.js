try {
  const text = $response.body || "无响应内容";

  console.log("📥 拦截到响应内容:\n" + text);

  $notification.post("🎁 主题兑换通知 by 夕颜", "", text);
  console.log("📤 已发送通知 ✅");

  // 拦截并返回一个空响应
  $done({
    status: 204,  // 正确用法是数字
    headers: {
      "Content-Type": "text/plain"
    },
    body: ""
  });

} catch (e) {
  console.log("❌ 脚本出错: " + (e.stack || e));
  $notification.post("❌ 主题兑换通知脚本出错", "", String(e));

  $done({
    status: 204,
    headers: {
      "Content-Type": "text/plain"
    },
    body: ""
  });
}