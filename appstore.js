// 名称: 增强版App Store更新检测面板
// 描述: App Store更新检测脚本，支持自定义包名
// 版本: 面板增强版
// 
// 使用说明：
// 1. 在 Surge 模块界面填写应用包名，一行一个：
//    com.liguangming.Shadowrocket
//    com.nssurge.inc.surge-ios
//    com.ruikq.decar
// 2. 修改更新间隔（秒）：例如 300（5分钟）
// 3. 也支持其他分隔符：竖线|、逗号,、分号;
 
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

// 从参数获取包名列表
function getAppListFromArgs() {
  const args = $argument || "";
  
  // 支持多种分隔符：换行符\n（优先）、竖线|、逗号,、分号;
  const applistMatch = args.match(/applist=([^&]+)/);
  
  if (!applistMatch || !applistMatch[1] || applistMatch[1].trim() === '') {
    // 没有配置应用列表，返回空数组
    console.log('⚠️ 未配置应用包名列表，请在模块参数中填写 applist');
    return [];
  }
  
  // 支持多种分隔符，优先换行符
  const applistStr = applistMatch[1];
  let bundleIds;
  
  console.log(`📋 接收到的applist参数: ${applistStr}`);
  
  // 优先处理字面的 \n 字符串（Surge传递过来的换行符）
  if (applistStr.includes('\\n')) {
    console.log('✂️ 使用 \\n 分隔');
    bundleIds = applistStr.split('\\n');
  }
  // 处理真正的换行符
  else if (applistStr.includes('\n')) {
    console.log('✂️ 使用换行符分隔');
    bundleIds = applistStr.split('\n');
  } 
  // 处理URL编码的换行符
  else if (applistStr.includes('%0A')) {
    console.log('✂️ 使用 %0A 分隔');
    bundleIds = applistStr.split('%0A');
  } 
  // 处理竖线分隔
  else if (applistStr.includes('|')) {
    console.log('✂️ 使用 | 分隔');
    bundleIds = applistStr.split('|');
  } 
  // 处理分号分隔
  else if (applistStr.includes(';')) {
    console.log('✂️ 使用 ; 分隔');
    bundleIds = applistStr.split(';');
  } 
  // 处理逗号分隔
  else {
    console.log('✂️ 使用 , 分隔');
    bundleIds = applistStr.split(',');
  }
  
  // 清理并过滤空值
  const cleanedIds = bundleIds.map(id => id.trim()).filter(id => id);
  
  if (cleanedIds.length === 0) {
    console.log('⚠️ 应用包名列表为空，请填写至少一个应用包名');
    return [];
  }
  
  console.log(`📱 解析出 ${cleanedIds.length} 个应用: ${cleanedIds.join(', ')}`);
  
  return cleanedIds;
}

// 增强版请求函数 - 优化超时和错误处理
async function enhancedFetch(app) {
  const isSurge = app.bundleId.includes("surge");
  
  // 为 Surge 添加备用 bundleId
  const surgeAlternativeBundleId = "com.nssurge.inc.surge";
  
  let urls;
  
  if (isSurge) {
    // Surge 特殊处理：尝试多个 bundleId
    urls = [
      `https://itunes.apple.com/hk/lookup?bundleId=${app.bundleId}`,
      `https://itunes.apple.com/hk/lookup?bundleId=${surgeAlternativeBundleId}`,
      `https://itunes.apple.com/cn/lookup?bundleId=${app.bundleId}`,
      `https://itunes.apple.com/cn/lookup?bundleId=${surgeAlternativeBundleId}`,
      `https://itunes.apple.com/us/lookup?bundleId=${app.bundleId}`
    ];
  } else {
    urls = [
      `https://itunes.apple.com/hk/lookup?bundleId=${app.bundleId}`,
      `https://itunes.apple.com/cn/lookup?bundleId=${app.bundleId}`,
      `https://itunes.apple.com/us/lookup?bundleId=${app.bundleId}`,
      `https://itunes.apple.com/lookup?bundleId=${app.bundleId}`,
      `https://itunes.apple.com/jp/lookup?bundleId=${app.bundleId}`
    ];
  }
  
  let lastError;
  let lastResponse;
  
  for (const [index, url] of urls.entries()) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 增加到5秒超时
      
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
        
        console.log(`🔍 ${app.icon} ${app.name} API响应: resultCount=${data.resultCount}, url=${url}`);
        
        if (data.results && data.results.length > 0) {
          const version = data.results[0].version;
          const trackName = data.results[0].trackName;
          const usedBundleId = url.includes(surgeAlternativeBundleId) ? surgeAlternativeBundleId : app.bundleId;
          console.log(`✅ ${app.icon} ${app.name} 成功获取版本: ${version} (应用名: ${trackName})`);
          return { app, version, usedBundleId };
        } else {
          console.log(`⚠️ ${app.icon} ${app.name} [${index + 1}/${urls.length}] 返回空结果，完整响应: ${JSON.stringify(data).substring(0, 200)}`);
          throw new Error(`API返回空数据 (resultCount: ${data.resultCount})`);
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      lastError = error;
      console.log(`⚠️ ${app.icon} ${app.name} 请求异常 [${index + 1}/${urls.length}]: ${error.message}`);
    }
  }
  
  // 如果所有请求都失败，给出详细的错误信息
  let errorMsg = `所有API请求失败: ${lastError?.message || '未知错误'}`;
  if (lastResponse && lastResponse.resultCount === 0) {
    errorMsg += ` | bundleId可能不正确: ${app.bundleId}`;
  }
  
  throw new Error(errorMsg);
}
  
(async () => {
  // 构建应用列表
  const bundleIds = getAppListFromArgs();
  
  // 如果没有配置应用，直接返回提示
  if (bundleIds.length === 0) {
    const isPanel = typeof $trigger !== 'undefined';
    
    if (isPanel) {
      $done({
        title: "⚠️ 未配置应用",
        content: "请在模块参数中填写要监控的应用包名\n\n一行一个，例如：\ncom.liguangming.Shadowrocket\ncom.nssurge.inc.surge-ios\ncom.loon0x00.LoonLite\n\n💡 如何获取包名：\n访问 tools.lancely.tech/apple/app-info",
        style: "error"
      });
    } else {
      console.log("⚠️ 未配置应用包名列表");
      $done();
    }
    return;
  }
  
  const appList = bundleIds.map(bundleId => {
    const appInfo = appDatabase[bundleId] || {
      name: bundleId.split('.').pop(),
      icon: "📱"
    };
    return {
      name: appInfo.name,
      bundleId: bundleId,
      icon: appInfo.icon,
      category: "应用"
    };
  });
  
  let hasUpdate = false;
  const results = {
    updated: { "应用": [] },
    failed: [],
    current: []
  };
  
  const startTime = Date.now();
  
  // 并行执行所有请求
  const promises = appList.map(app => enhancedFetch(app));
  const outcomes = await Promise.allSettled(promises);
  
  const writePromises = [];

  // 处理所有结果
  outcomes.forEach((outcome, index) => {
    const app = appList[index];
    
    if (outcome.status === 'fulfilled') {
      const { version: latest } = outcome.value;
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
      results.failed.push({
        app,
        error: outcome.reason.message
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
    // 通知模式：发送通知（只在有更新或失败时）
    if (hasUpdate || results.failed.length > 0) {
      const title = hasUpdate ? "🚀 应用更新" : "❌ 检测失败";
      let subtitle = hasUpdate ? "✨ 发现应用更新" : "⚠️ 部分应用查询失败";
      
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
      
      // 当前版本
      if (hasUpdate && results.current.length > 0) {
        if (hasContent) body += "\n\n";
        body += `✅ 最新版应用:\n`;
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
      
      // 如果没有更新但有失败，显示成功查询的应用
      if (!hasUpdate && results.failed.length > 0 && results.current.length > 0) {
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
      
      body += "\n🔔 自动检测 | 发现更新或失败时通知";
      
      $notification.post(title, subtitle, body);
    } else {
      // 没有更新且没有失败时，只记录日志
      console.log("✅ 所有应用均为最新版本且查询成功，无需通知");
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