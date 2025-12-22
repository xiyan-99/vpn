/**
 * 微信斗图接口 wxid 替换 - 三端通用
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
  wxidkx: "",      // kongxu.de
  wxidmao: "",     // apt.25mao.com
  wxidppy: "",     // dutu.iospaopaoyu.cn
  wxidxzy: "",     // dt.zyxzy.cn
  wxidaqkj: "",    // aqkj77.com
  wxid9527: "",    // dt.9527cleo.com
  wxidhai: ""      // doutu.hai6.live
};

// ============ 获取参数 ============
function getConfig() {
  // Surge/Loon: 使用 $argument
  if (typeof $argument !== "undefined" && $argument) {
    return $argument;
  }
  
  // QX: 从存储读取或使用默认值
  const stored = Env.read("xy_wechat_dt_config");
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
const url = $request.url;
const config = getConfig();

// 域名与参数名对应关系
const domainMap = {
  "kongxu.de": "wxidkx",
  "apt.25mao.com": "wxidmao",
  "dutu.iospaopaoyu.cn": "wxidppy",
  "dt.zyxzy.cn": "wxidxzy",
  "aqkj77.com": "wxidaqkj",
  "dt.9527cleo.com": "wxid9527",
  "doutu.hai6.live": "wxidhai"
};

let matched = false;

for (const [domain, paramKey] of Object.entries(domainMap)) {
  if (url.includes(domain)) {
    matched = true;
    const newWxid = config[paramKey] || "";
    
    if (newWxid) {
      const before = url.match(/wxid=[^&]+/)?.[0] || "未找到wxid";
      const modifiedUrl = url.replace(/wxid=[^&]+/, "wxid=" + newWxid);
      
      console.log(`✅ 域名匹配: ${domain}`);
      console.log(`📦 参数键: ${paramKey}`);
      console.log(`🔄 替换前: ${before}`);
      console.log(`🔄 替换后: wxid=${newWxid}`);
      console.log("🌐 修改后链接: " + modifiedUrl);
      
      $done({ url: modifiedUrl });
    } else {
      console.log(`❌ 未配置参数 ${paramKey}，跳过修改`);
      $done({});
    }
    break;
  }
}

if (!matched) {
  console.log("❌ 未匹配到任何目标域名，跳过处理");
  $done({});
}

