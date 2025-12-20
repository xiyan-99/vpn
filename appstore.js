// 名称: 增强版App Store更新检测面板
// 描述: App Store更新检测脚本，支持自定义包名
// 版本: 面板增强版
// 
// 使用说明：
// 1. 在 Surge 模块界面的 APPLIST 参数中填写应用包名
//    多个包名用逗号分隔，例如：
//    com.liguangming.Shadowrocket,com.nssurge.inc.surge-ios,com.loon0x00.LoonLite
// 2. 在 UPDATEINTERVAL 参数中填写更新间隔（秒）：例如 300（5分钟）
 
// 预定义应用信息（用于显示名称和图标）
const appDatabase = {
  "com.liguangming.Shadowrocket": { name: "Shadowrocket", icon: "🚀" },
  "com.nssurge.inc.surge-ios": { name: "Surge", icon: "⚡️" },
  "com.nssurge.inc.surge": { name: "Surge", icon: "⚡️" },
  "com.loon0x00.LoonLite": { name: "Loon", icon: "🎈" },  // Loon Lite版本
  "com.stairways.alfred.ios": { name: "Alfred", icon: "🎩" },
  "com.apple.mobilesafari": { name: "Safari", icon: "🧭" },
  "ph.telegra.Telegraph": { name: "Telegram", icon: "✈️" },
  "com.tencent.xin": { name: "微信", icon: "💬" },
  "com.ss.iphone.ugc.Aweme": { name: "抖音", icon: "🎵" },
  "com.zhihu.ios": { name: "知乎", icon: "📖" },
  "com.tencent.mqq": { name: "QQ", icon: "🐧" }
};

// 从App Store链接提取trackId和country
function extractTrackId(url) {
  // 匹配格式：https://apps.apple.com/.../id123456789
  const match = url.match(/\/id(\d+)/);
  const trackId = match ? match[1] : null;
  
  // 提取country（如 /cn/app 或 /us/app）
  const countryMatch = url.match(/apps\.apple\.com\/([a-z]{2})\//i);
  const country = countryMatch ? countryMatch[1].toLowerCase() : null;
  
  return { trackId, country };
}

// 判断是bundleId还是App Store链接
function parseAppIdentifier(identifier) {
  identifier = identifier.trim();
  
  // 检查是否有备注（用#分隔）
  let customName = null;
  if (identifier.includes('#')) {
    const parts = identifier.split('#');
    identifier = parts[0].trim();
    customName = parts[1].trim();
  }
  
  // 如果是链接格式
  if (identifier.startsWith('http://') || identifier.startsWith('https://')) {
    const { trackId, country } = extractTrackId(identifier);
    if (trackId) {
      return {
        type: 'trackId',
        value: trackId,
        country: country || 'us',  // 默认美国
        original: identifier,
        customName: customName
      };
    }
    console.log(`⚠️ 无法从链接中提取trackId: ${identifier}`);
    return null;
  }
  
  // 如果是bundleId格式
  if (identifier.includes('.')) {
    return {
      type: 'bundleId',
      value: identifier,
      country: null,
      original: identifier,
      customName: customName
    };
  }
  
  console.log(`⚠️ 无法识别的格式: ${identifier}`);
  return null;
}

// 从参数获取应用列表
function getAppListFromArgs() {
  const args = $argument || "";
  
  console.log(`🔍 接收到的完整参数: ${args}`);
  
  // 匹配 APPLIST 参数（大写）
  const applistMatch = args.match(/APPLIST="?([^"&]*)"?/);
  
  if (!applistMatch || !applistMatch[1] || applistMatch[1].trim() === '') {
    // 没有配置应用列表，返回空数组
    console.log('⚠️ 未配置应用包名列表，请在模块参数中填写 APPLIST');
    return [];
  }
  
  // 获取应用列表字符串
  const applistStr = applistMatch[1];
  let identifiers;
  
  console.log(`📋 接收到的APPLIST参数: ${applistStr}`);
  
  // 支持多种分隔符
  // 优先处理逗号分隔（推荐方式）
  if (applistStr.includes(',')) {
    console.log('✂️ 使用逗号分隔');
    identifiers = applistStr.split(',');
  }
  // 处理竖线分隔
  else if (applistStr.includes('|')) {
    console.log('✂️ 使用竖线分隔');
    identifiers = applistStr.split('|');
  }
  // 处理分号分隔
  else if (applistStr.includes(';')) {
    console.log('✂️ 使用分号分隔');
    identifiers = applistStr.split(';');
  }
  // 处理字面的 \n
  else if (applistStr.includes('\\n')) {
    console.log('✂️ 使用 \\n 分隔');
    identifiers = applistStr.split('\\n');
  }
  // 处理真正的换行符
  else if (applistStr.includes('\n')) {
    console.log('✂️ 使用换行符分隔');
    identifiers = applistStr.split('\n');
  }
  // 处理URL编码的换行符
  else if (applistStr.includes('%0A')) {
    console.log('✂️ 使用 %0A 分隔');
    identifiers = applistStr.split('%0A');
  }
  // 单个应用
  else {
    console.log('✂️ 单个应用');
    identifiers = [applistStr];
  }
  
  // 解析每个标识符（bundleId或链接）
  const parsedApps = identifiers
    .map(id => parseAppIdentifier(id))
    .filter(app => app !== null);
  
  if (parsedApps.length === 0) {
    console.log('⚠️ 应用列表为空或格式错误');
    return [];
  }
  
  console.log(`📱 解析出 ${parsedApps.length} 个应用:`);
  parsedApps.forEach((app, idx) => {
    if (app.type === 'bundleId') {
      // 优先使用自定义备注，其次从数据库获取
      let displayName = '';
      if (app.customName) {
        displayName = ` (${app.customName} 📝自定义)`;
      } else {
        const knownApp = appDatabase[app.value];
        if (knownApp) {
          displayName = ` (${knownApp.name})`;
        }
      }
      console.log(`   ${idx + 1}. 📦 ${app.value}${displayName}`);
    } else {
      const region = app.country === 'cn' ? '🇨🇳 中国' : app.country === 'us' ? '🇺🇸 美国' : `🌍 ${app.country?.toUpperCase()}`;
      const customNote = app.customName ? ` - ${app.customName} 📝` : '';
      console.log(`   ${idx + 1}. 🔗 id${app.value} (${region}区)${customNote}`);
    }
  });
  
  return parsedApps;
}

// 增强版请求函数 - 优化超时和错误处理
async function enhancedFetch(appIdentifier) {
  const { type, value, country, original, customName } = appIdentifier;
  
  // 从数据库获取应用信息（仅bundleId有预定义）
  let appInfo;
  if (type === 'bundleId') {
    const dbInfo = appDatabase[value];
    appInfo = {
      name: customName || (dbInfo ? dbInfo.name : value.split('.').pop()),
      icon: dbInfo?.icon || "📱",
      bundleId: value,
      isCustomName: !!customName
    };
  } else {
    // trackId模式，先使用占位信息
    appInfo = {
      name: customName || `App-${value}`,
      icon: "📱",
      trackId: value,
      isCustomName: !!customName
    };
  }
  
  let urls = [];
  
  if (type === 'bundleId') {
    const isSurge = value.includes("surge");
    const surgeAlternativeBundleId = "com.nssurge.inc.surge";
    
    if (isSurge) {
      // Surge 特殊处理：尝试多个 bundleId
      urls = [
        `https://itunes.apple.com/hk/lookup?bundleId=${value}`,
        `https://itunes.apple.com/hk/lookup?bundleId=${surgeAlternativeBundleId}`,
        `https://itunes.apple.com/cn/lookup?bundleId=${value}&lang=zh_CN`,
        `https://itunes.apple.com/cn/lookup?bundleId=${surgeAlternativeBundleId}&lang=zh_CN`,
        `https://itunes.apple.com/us/lookup?bundleId=${value}`
      ];
    } else {
      urls = [
        `https://itunes.apple.com/hk/lookup?bundleId=${value}`,
        `https://itunes.apple.com/cn/lookup?bundleId=${value}&lang=zh_CN`,
        `https://itunes.apple.com/us/lookup?bundleId=${value}`,
        `https://itunes.apple.com/lookup?bundleId=${value}`,
        `https://itunes.apple.com/jp/lookup?bundleId=${value}`
      ];
    }
  } else {
    // trackId 模式：根据链接的country决定语言
    const langParam = country === 'cn' ? '&lang=zh_CN' : '';
    const countryPrefix = country || 'us';
    
    console.log(`🌍 检测到区域: ${country === 'cn' ? '中国(CN)' : country?.toUpperCase() || 'US'}, 使用${country === 'cn' ? '中文' : '英文'}返回`);
    
    urls = [
      `https://itunes.apple.com/lookup?id=${value}${langParam}`,
      `https://itunes.apple.com/${countryPrefix}/lookup?id=${value}${langParam}`,
      `https://itunes.apple.com/cn/lookup?id=${value}&lang=zh_CN`,
      `https://itunes.apple.com/us/lookup?id=${value}`,
      `https://itunes.apple.com/hk/lookup?id=${value}`
    ];
  }
  
  let lastError;
  let lastResponse;
  
  for (const [index, url] of urls.entries()) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
      
      // 增加请求间隔，避免被限流
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 400));
      }
      
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
        }
      });
      clearTimeout(timeoutId);
      
      if (response.status === 200) {
        const data = await response.json();
        lastResponse = data;
        
        console.log(`🔍 ${appInfo.icon} ${appInfo.name} API响应: resultCount=${data.resultCount}, url=${url}`);
        
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          const version = result.version;
          const trackName = result.trackName;
          const bundleId = result.bundleId;
          const trackId = result.trackId;
          
          // 更新应用信息（使用实际获取到的数据）
          // 如果有自定义名称，保留自定义名称；否则使用API返回的名称
          const finalAppInfo = {
            name: customName || trackName,
            icon: appDatabase[bundleId]?.icon || appInfo.icon,
            bundleId: bundleId,
            trackId: trackId,
            category: "应用",
            inputFormat: type === 'bundleId' ? `📦 ${value}` : `🔗 id${value}`,
            isCustomName: !!customName,
            apiName: trackName  // 保存API返回的原始名称
          };
          
          const nameDisplay = customName ? `${customName} (API: ${trackName})` : trackName;
          console.log(`✅ ${finalAppInfo.icon} ${nameDisplay} 成功获取版本: ${version} (输入: ${finalAppInfo.inputFormat})`);
          return { app: finalAppInfo, version };
        } else {
          console.log(`⚠️ ${appInfo.icon} ${appInfo.name} [${index + 1}/${urls.length}] 返回空结果`);
          throw new Error(`API返回空数据 (resultCount: ${data.resultCount})`);
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      lastError = error;
      console.log(`⚠️ ${appInfo.icon} ${appInfo.name} 请求异常 [${index + 1}/${urls.length}]: ${error.message}`);
    }
  }
  
  // 如果所有请求都失败，给出详细的错误信息
  let errorMsg = `所有API请求失败: ${lastError?.message || '未知错误'}`;
  if (lastResponse && lastResponse.resultCount === 0) {
    errorMsg += ` | ${type}可能不正确: ${value}`;
  }
  
  // 返回错误但保留应用信息用于显示
  appInfo.inputFormat = type === 'bundleId' ? `📦 ${value}` : `🔗 id${value}`;
  throw { error: errorMsg, app: appInfo };
}
  
(async () => {
  // 获取应用列表
  const appIdentifiers = getAppListFromArgs();
  
  // 如果没有配置应用，直接返回提示
  if (appIdentifiers.length === 0) {
    const isPanel = typeof $trigger !== 'undefined';
    
    if (isPanel) {
      $done({
        title: "⚠️ 未配置应用",
        content: "请在模块参数中填写应用信息\n\n支持两种格式：\n\n1️⃣ Bundle ID（推荐）\ncom.tencent.xin\n\n2️⃣ App Store链接\nhttps://apps.apple.com/cn/app/微信/id414478124\n\n多个应用用逗号分隔\n\n💡 如何获取：\n• Bundle ID: tools.lancely.tech/apple/app-info\n• App Store链接: 在App Store中分享应用",
        style: "error"
      });
    } else {
      console.log("⚠️ 未配置应用列表");
      $done();
    }
    return;
  }
  
  let hasUpdate = false;
  const results = {
    updated: { "应用": [] },
    failed: [],
    current: []
  };
  
  const startTime = Date.now();
  
  // 并行执行所有请求
  const promises = appIdentifiers.map(appId => enhancedFetch(appId));
  const outcomes = await Promise.allSettled(promises);
  
  const writePromises = [];

  // 处理所有结果
  outcomes.forEach((outcome, index) => {
    const appIdentifier = appIdentifiers[index];
    
    if (outcome.status === 'fulfilled') {
      const { app, version: latest } = outcome.value;
      const key = `app_ver_${app.bundleId}`;
      const savedVersion = $persistentStore.read(key);
      
      if (!savedVersion) {
        writePromises.push($persistentStore.write(latest, key));
        results.current.push({
          app,
          version: latest,
          status: '首次记录'
        });
      } else if (savedVersion !== latest) {
        hasUpdate = true;
        results.updated[app.category].push({
          app,
          oldVersion: savedVersion,
          newVersion: latest
        });
        writePromises.push($persistentStore.write(latest, key));
      } else {
        results.current.push({
          app,
          version: latest,
          status: '最新版'
        });
      }
    } else {
      // 处理错误
      const error = outcome.reason;
      const app = error.app || {
        name: appIdentifier.value,
        icon: "📱",
        bundleId: appIdentifier.value
      };
      results.failed.push({
        app,
        error: error.error || error.message || '查询失败'
      });
    }
  });

  // 等待所有存储操作完成
  await Promise.all(writePromises);

  // 生成面板内容
  const now = new Date();
  const executionTime = ((Date.now() - startTime) / 1000).toFixed(1);
  
  // 判断是否为面板调用
  const isPanel = typeof $trigger !== 'undefined';
  
  if (isPanel) {
    // 面板模式：返回面板内容
    let title = "📱 App Store 更新检测";
    let content = "";
    let style = "info";
    
    if (hasUpdate) {
      style = "alert";
      title = "🆕 发现应用更新";
      
      const updates = results.updated["应用"];
      if (updates.length > 0) {
        content += updates.map(u => 
          `${u.app.icon} ${u.app.name}: ${u.oldVersion} → ${u.newVersion}`
        ).join("\n");
      }
      
      if (results.current.length > 0) {
        content += "\n\n✅ 最新版:\n";
        content += results.current.map(c => 
          `${c.app.icon} ${c.app.name}: ${c.version}`
        ).join("\n");
      }
    } else if (results.failed.length > 0) {
      style = "error";
      title = "❌ 检测异常";
      
      if (results.failed.length > 0) {
        content += "❌ 查询失败:\n";
        content += results.failed.map(f => 
          `${f.app.icon} ${f.app.name}`
        ).join("\n");
      }
      
      if (results.current.length > 0) {
        content += "\n\n✅ 查询成功:\n";
        content += results.current.map(c => 
          `${c.app.icon} ${c.app.name}: ${c.version}`
        ).join("\n");
      }
    } else {
      style = "good";
      title = "✅ 全部最新";
      
      content += results.current.map(c => 
        `${c.app.icon} ${c.app.name}: ${c.version}${c.status === '首次记录' ? ' 🆕' : ''}`
      ).join("\n");
    }
    
    content += `\n\n⏱️ 耗时: ${executionTime}s | 📅 ${now.toLocaleTimeString("zh-CN", { 
      hour: '2-digit',
      minute: '2-digit'
    })}`;
    
    $done({
      title: title,
      content: content,
      style: style
    });
    
  } else {
    // 通知模式
    // 判断是否为手动刷新
    // $trigger 可能的值: "按钮" (手动刷新) 或 "自动音程" (自动刷新)
    const isManualTrigger = typeof $trigger !== 'undefined' && $trigger === '按钮';
    
    console.log(`🔔 触发方式: ${typeof $trigger !== 'undefined' ? $trigger : '未知'}`);
    
    // 手动刷新时总是发送通知，自动刷新时只在有更新或失败时发送
    const shouldNotify = isManualTrigger || hasUpdate || results.failed.length > 0;
    
    if (shouldNotify) {
      let title, subtitle;
      
      if (hasUpdate) {
        title = "🚀 应用更新";
        subtitle = "✨ 发现应用更新";
      } else if (results.failed.length > 0) {
        title = "❌ 检测失败";
        subtitle = "⚠️ 部分应用查询失败";
      } else {
        // 手动刷新且没有更新
        title = "✅ 检测完成";
        subtitle = "🔍 所有应用均为最新版本";
      }
      
      let body = "";
      let hasContent = false;
      
      // 更新详情
      if (hasUpdate) {
        const updates = results.updated["应用"];
        if (updates.length > 0) {
          body += `🆕 应用更新:\n`;
          body += updates.map(u => 
            `${u.app.icon} ${u.app.name}: ${u.oldVersion} → ${u.newVersion}`
          ).join("\n");
          hasContent = true;
        }
      }
      
      // 当前版本（手动刷新时总是显示，自动刷新只在有更新时显示）
      if ((isManualTrigger || hasUpdate) && results.current.length > 0) {
        if (hasContent) body += "\n\n";
        body += `✅ ${isManualTrigger && !hasUpdate ? '当前版本' : '最新版应用'}:\n`;
        body += results.current.map(c => 
          `${c.app.icon} ${c.app.name}: ${c.version}${c.status === '首次记录' ? ' (首次记录)' : ''}`
        ).join("\n");
        hasContent = true;
      }
      
      // 失败应用
      if (results.failed.length > 0) {
        if (hasContent) body += "\n\n";
        body += `❌ 查询失败:\n`;
        body += results.failed.map(f => 
          `${f.app.icon} ${f.app.name}: 请检查网络或应用状态`
        ).join("\n");
        hasContent = true;
      }
      
      // 如果没有更新但有失败，显示成功查询的应用（仅在自动刷新时）
      if (!isManualTrigger && !hasUpdate && results.failed.length > 0 && results.current.length > 0) {
        if (hasContent) body += "\n\n";
        body += `✅ 成功查询:\n`;
        body += results.current.map(c => 
          `${c.app.icon} ${c.app.name}: ${c.version}`
        ).join("\n");
        hasContent = true;
      }
      
      // 统计信息
      body += `\n\n⏱️ 检测耗时: ${executionTime}秒`;
      body += `\n📅 ${now.toLocaleString("zh-CN", { 
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })}`;
      
      // 添加提示
      if (results.failed.length > 0) {
        body += `\n\n💡 提示: ${results.failed.length}个应用查询失败，可能因区域限制或网络问题`;
      }
      
      // 标记触发方式
      if (isManualTrigger) {
        body += "\n🔄 手动刷新";
      } else {
        body += "\n🔔 自动检测";
      }
      
      // 发送通知（添加声音提示）
      $notification.post(title, subtitle, body, {
        sound: true  // 启用通知音效
      });
    } else {
      // 自动刷新且没有更新也没有失败时，只记录日志
      console.log("✅ 自动检测：所有应用均为最新版本且查询成功，无需通知");
    }
    
    // 调试日志
    console.log("=".repeat(40));
    console.log(`应用更新检测完成 (${executionTime}s)`);
    
    if (results.updated["应用"].length > 0) {
      console.log("✨ 发现以下更新:");
      results.updated["应用"].forEach(u => {
        console.log(`  ${u.app.icon} ${u.app.name}: ${u.oldVersion} → ${u.newVersion}`);
      });
    } else {
      console.log("✨ 未发现应用更新");
    }
    
    if (results.current.length > 0) {
      console.log("✅ 检查成功的应用:");
      results.current.forEach(c => {
        console.log(`  ${c.app.icon} ${c.app.name}: ${c.version}${c.status === '首次记录' ? ' (首次记录)' : ''}`);
      });
    }
    
    if (results.failed.length > 0) {
      console.log("❌ 查询失败的应用:");
      results.failed.forEach(f => {
        console.log(`  ${f.app.icon} ${f.app.name}: ${f.error}`);
      });
    }
    
    console.log("=".repeat(40));
    $done();
  }
})();