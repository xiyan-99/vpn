const storageKeyPrefix = "xy_themebox_payload_";

try {
  const id = $request.id || Date.now().toString(); // 备用id
  const body = JSON.parse($request.body || "{}");

  if (body.wxid && body.code) {
    const code = body.code.startsWith("TB") ? body.code : "TB" + body.code;
    const data = JSON.stringify({ wxid: body.wxid, code });
    const key = storageKeyPrefix + id;
    $persistentStore.write(data, key);
    console.log(`✅ 请求数据已保存: ${key} -> ${data}`);
  }
} catch (e) {
  console.log("❌ 请求脚本解析失败: " + e);
}

$done({});
