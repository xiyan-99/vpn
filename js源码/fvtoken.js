// 抓取 fineshare.com Token 并通知（by 夕颜）

const tokenKey = "fineshare_token";
const title = "FV Token 抓取- by夕颜";

// 只在包含 Bearer 的 Authorization 头中提取
const auth = $request.headers?.Authorization || $request.headers?.authorization;

if (auth && auth.startsWith("Bearer ")) {
  const token = auth.slice(7); // 去掉 Bearer 前缀
  const saved = $persistentStore.write(token, tokenKey);

  if (saved) {
    const content = `Token: ${token}`;
    const attach = {
      clipboard: token,
      openUrl: "loon://",
    };

    $notification.post(title, "FV token 点击复制", content, attach);
    console.log("✅ Token 抓取并已通知");
  } else {
    console.log("❌ Token 保存失败");
  }
} else {
  console.log("⚠️ 未检测到 Bearer Token");
}

$done({});