/**
 * 微信举报违规词修改 - 三端通用
 * 支持修改违规词/接口参数
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

  return { isSurge, isLoon, isQX, read };
})();

// ============ 默认配置（QX 兜底）============
const DEFAULT_CONFIG = {
  header: "520",
  referer: "520",
  wxid: "wxid",
  wg: "表扬书"
};

// ============ 获取参数 ============
function getConfig() {
  // Surge/Loon: 使用 $argument
  if (typeof $argument !== "undefined" && $argument) {
    // Loon 格式：[{header}, {referer}, {wxid}, {wg}]
    if (Array.isArray($argument)) {
      return {
        header: $argument[0] || DEFAULT_CONFIG.header,
        referer: $argument[1] || DEFAULT_CONFIG.referer,
        wxid: $argument[2] || DEFAULT_CONFIG.wxid,
        wg: $argument[3] || DEFAULT_CONFIG.wg
      };
    }
    // Surge 格式：可能是对象
    if (typeof $argument === "object") {
      return {
        header: $argument.header || DEFAULT_CONFIG.header,
        referer: $argument.referer || DEFAULT_CONFIG.referer,
        wxid: $argument.wxid || DEFAULT_CONFIG.wxid,
        wg: $argument.wg || DEFAULT_CONFIG.wg
      };
    }
  }
  
  // QX: 从存储读取或使用默认值
  const stored = Env.read("xy_wechat_report_config");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.log("⚠️ 存储配置解析失败");
    }
  }
  
  return DEFAULT_CONFIG;
}

// ============ 主逻辑 ============
try {
  const config = getConfig();
  const body = $request.body;
  
  console.log("📥 原始请求体: " + body);
  
  // 修改请求体
  let modifiedBody = body
    .replace(/wxid_[a-zA-Z0-9]+/g, config.wxid)  // 替换 wxid
    .replace(/"违规词":\s*"[^"]*"/g, `"违规词": "${config.wg}"`);  // 替换违规词
  
  // 修改请求头
  const headers = $request.headers;
  if (config.header !== "520") {
    headers["Custom-Header"] = config.header;
  }
  if (config.referer !== "520") {
    headers["Referer"] = config.referer;
  }
  
  console.log("📤 修改后请求体: " + modifiedBody);
  console.log("✅ 已修改 wxid 为: " + config.wxid);
  console.log("✅ 已修改违规词为: " + config.wg);
  
  $done({
    headers: headers,
    body: modifiedBody
  });
  
} catch (e) {
  console.log("❌ 错误: " + e);
  $done({});
}

