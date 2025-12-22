const storageKeyPrefix = "xy_themebox_payload_";

function debugLog(msg) {
  const now = new Date();
  console.log(`[主题盒子通知] ${now.toISOString()} - ${msg}`);
}

function parseArguments() {
  const params = {};
  try {
    if (typeof $argument === "string") {
      $argument.split("&").forEach(item => {
        const [k,v] = item.split("=");
        if(k && v) params[k] = decodeURIComponent(v);
      });
    } else if (typeof $argument === "object") {
      Object.assign(params, $argument);
    }
  } catch (e) {
    debugLog("参数解析失败: " + e);
  }
  return {
    SURGE: params.SURGE === "true" || params.SURGE === "开启通知",
    BARK: params.BARK === "true" || params.BARK === "开启通知",
    BARK_KEY: params.BARK_KEY || "",
    TITLE: params.TITLE || "盒子兑换通知",
    TIME: parseInt(params.TIME) || 0,
    BARK_ICON: params.BARK_ICON || "",
    MSG: params.MSG || null  // 新增 MSG 参数，默认 null
  };
}

function notifySurge(title, content) {
  $notification.post(title, "", content);
  debugLog("Surge通知已发送");
}

function notifyBark(title, content, keys, icon) {
  const barkKeys = (keys || "").split(/\n+/).map(k => k.trim()).filter(Boolean);
  if (!barkKeys.length) {
    debugLog("无Bark密钥，跳过通知");
    return;
  }
  if (!icon) icon = "https://img.xiyan.pro/i/u/2025/04/17/IMG_7887.png";
  if (icon.includes("?")) icon += `&t=${Date.now()}`;
  else icon += `?t=${Date.now()}`;
  const iconEncoded = encodeURIComponent(icon);

  barkKeys.forEach(key => {
    const url = `https://api.day.app/${key}/${encodeURIComponent(title)}/${encodeURIComponent(content)}?icon=${iconEncoded}`;
    $httpClient.get(url, (err, resp, data) => {
      if (err) debugLog(`Bark推送失败 [${key}]: ${err}`);
      else debugLog(`Bark推送成功 [${key}]: ${resp.status}`);
    });
  });
}

(async () => {
const args = parseArguments();

let responseBody = {};
try {
  responseBody = JSON.parse($response.body || "{}");
  debugLog("响应体解析成功");
} catch (e) {
  debugLog("响应体解析失败: " + e);
}

const id = $request.id || "";
if (!id) {
  debugLog("无$request.id，无法匹配请求缓存");
  $done({ body: $response.body });
  return;
}

const cacheKey = storageKeyPrefix + id;
const cacheStr = $persistentStore.read(cacheKey);

if (!cacheStr) {
  debugLog(`未找到请求缓存: ${cacheKey}`);
  $done({ body: $response.body });
  return;
}

let cacheData = {};
try {
  cacheData = JSON.parse(cacheStr);
  debugLog(`从缓存恢复: wxid=${cacheData.wxid}, code=${cacheData.code}`);
} catch {
  debugLog("缓存数据解析失败");
  $done({ body: $response.body });
  return;
}

// 只有当 MSG 存在且不等于 "不修改" 时才覆盖 message
if (args.MSG && args.MSG !== "不修改") {
  responseBody.message = args.MSG;
  debugLog(`响应消息被参数 MSG 覆盖为: ${args.MSG}`);
} else {
  debugLog("未传入有效 MSG，响应消息保持不变");
}


  const message = responseBody.message || "无返回信息";

  const title = "主题盒子兑换通知 by夕颜";
  const content = [
    `推送: ${args.TITLE} 延迟: ${args.TIME}ms`,
    `wxid: ${cacheData.wxid}`,
    `兑换码: ${cacheData.code}`,
    `返回信息: ${message}`
  ].join("\n");

  if (args.SURGE) notifySurge(title, content);
  if (args.BARK && args.BARK_KEY) notifyBark(title, content, args.BARK_KEY, args.BARK_ICON);

  // 发送完通知，清理缓存
  $persistentStore.write("", cacheKey);
  debugLog(`清理缓存: ${cacheKey}`);

  function finish() {
    debugLog("脚本执行完成");
    $done({ body: JSON.stringify(responseBody) });
  }

  if (args.TIME > 0) {
    setTimeout(finish, args.TIME);
  } else {
    finish();
  }
})();
