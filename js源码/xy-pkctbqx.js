try {
  const text = $response.body || "无响应内容";

  console.log("📥 拦截响应内容:\n" + text);
  $notify("🎁 主题兑换通知 by夕颜", "", text);
  console.log("📤 已发送通知 ✅");

  // 返回完全空的响应头和体
  $done({
    status: "HTTP/1.1 403 No Content",
    headers: {
      "Content-Type": "text/plain"
    },
    body: ""
  });

} catch (e) {
  console.log("❌ 错误: " + e);
  $done({
    status: "HTTP/1.1 403 No Content",
    headers: {
      "Content-Type": "text/plain"
    },
    body: ""
  });
}
