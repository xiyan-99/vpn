// 名称: Cydia源更新检测面板
// 描述: 检测越狱源deb包更新
// 版本: 1.0
// 
// 使用说明：
// 1. 在 REPOLIST 参数中填写要监控的源和包
//    格式：源地址#包名#备注
//    例如：https://repo.chariz.com/#com.ex.substitute#Substitute
// 2. 多个包用逗号分隔

// 预定义热门源和插件
const popularRepos = {
  "https://repo.chariz.com/": { name: "Chariz", icon: "📦" },
  "https://repo.packix.com/": { name: "Packix", icon: "📦" },
  "https://havoc.app/": { name: "Havoc", icon: "📦" },
  "https://repo.twickd.com/": { name: "Twickd", icon: "📦" },
  "https://apt.bingner.com/": { name: "Bingner", icon: "📦" },
  "https://repo.dynastic.co/": { name: "Dynastic", icon: "📦" }
};

const popularPackages = {
  "com.ex.substitute": { name: "Substitute", icon: "🔧" },
  "com.opa334.altlist": { name: "AltList", icon: "📋" },
  "com.opa334.ccsupport": { name: "CCSupport", icon: "🎛" },
  "ws.hbang.common": { name: "Cephei", icon: "⚙️" },
  "com.spark.libsparkapplist": { name: "libSparkAppList", icon: "📱" }
};

// 解析 Packages 文件
function parsePackages(packagesText) {
  const packages = {};
  const entries = packagesText.split('\n\n');
  
  for (const entry of entries) {
    if (!entry.trim()) continue;
    
    const lines = entry.split('\n');
    const pkg = {};
    
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;
      
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      
      if (key === 'Package') pkg.package = value;
      else if (key === 'Version') pkg.version = value;
      else if (key === 'Name') pkg.name = value;
      else if (key === 'Description') pkg.description = value;
      else if (key === 'Section') pkg.section = value;
    }
    
    if (pkg.package) {
      packages[pkg.package] = pkg;
    }
  }
  
  return packages;
}

// 解析仓库配置
function parseRepoConfig(config) {
  const parts = config.split('#');
  
  // 格式：源地址#包名#备注
  let repoUrl = parts[0].trim();
  const packageId = parts[1] ? parts[1].trim() : null;
  const customName = parts[2] ? parts[2].trim() : null;
  
  // 确保源地址以 / 结尾
  if (!repoUrl.endsWith('/')) {
    repoUrl += '/';
  }
  
  return {
    repoUrl,
    packageId,
    customName,
    original: config
  };
}

// 获取仓库列表
function getRepoListFromArgs() {
  const args = $argument || "";
  
  console.log(`🔍 接收到的完整参数: ${args}`);
  
  const repolistMatch = args.match(/REPOLIST="?([^"&]*)"?/);
  
  if (!repolistMatch || !repolistMatch[1] || repolistMatch[1].trim() === '') {
    console.log('⚠️ 未配置源列表，请在模块参数中填写 REPOLIST');
    return [];
  }
  
  const repolistStr = repolistMatch[1];
  console.log(`📋 接收到的REPOLIST参数: ${repolistStr}`);
  
  // 支持逗号分隔
  const configs = repolistStr.split(',').map(c => c.trim()).filter(c => c);
  
  const parsedRepos = configs
    .map(config => parseRepoConfig(config))
    .filter(repo => repo.repoUrl && repo.packageId);
  
  if (parsedRepos.length === 0) {
    console.log('⚠️ 源列表为空或格式错误');
    return [];
  }
  
  console.log(`📦 解析出 ${parsedRepos.length} 个包:`);
  parsedRepos.forEach((repo, idx) => {
    const repoName = popularRepos[repo.repoUrl]?.name || '自定义源';
    const pkgName = repo.customName || popularPackages[repo.packageId]?.name || repo.packageId;
    console.log(`   ${idx + 1}. ${pkgName} @ ${repoName}`);
  });
  
  return parsedRepos;
}

// 获取包信息
async function fetchPackageInfo(repoConfig) {
  const { repoUrl, packageId, customName } = repoConfig;
  
  const repoInfo = popularRepos[repoUrl] || { name: '自定义源', icon: '📦' };
  const pkgInfo = popularPackages[packageId] || { name: packageId, icon: '📦' };
  
  const displayName = customName || pkgInfo.name;
  const icon = pkgInfo.icon;
  
  // 尝试多个可能的 Packages 文件位置
  const packagesUrls = [
    `${repoUrl}Packages`,
    `${repoUrl}Packages.bz2`,
    `${repoUrl}Packages.gz`,
    `${repoUrl}dists/stable/main/binary-iphoneos-arm/Packages`
  ];
  
  let lastError;
  
  for (const [index, url] of packagesUrls.entries()) {
    try {
      console.log(`🔍 尝试获取: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Cydia/1.1.32 CFNetwork/978.0.7 Darwin/18.7.0'
        }
      });
      clearTimeout(timeoutId);
      
      if (response.status === 200) {
        let packagesText = await response.text();
        
        // 简单处理（不支持bz2/gz解压，需要源提供未压缩版本）
        if (url.endsWith('.bz2') || url.endsWith('.gz')) {
          console.log(`⚠️ ${displayName} 遇到压缩文件，跳过`);
          continue;
        }
        
        const packages = parsePackages(packagesText);
        
        if (packages[packageId]) {
          const pkg = packages[packageId];
          console.log(`✅ ${icon} ${displayName} 成功获取版本: ${pkg.version}`);
          
          return {
            packageId,
            name: displayName,
            icon,
            version: pkg.version,
            repo: repoInfo.name,
            repoUrl,
            description: pkg.description,
            section: pkg.section
          };
        } else {
          console.log(`⚠️ ${displayName} 在源中未找到该包`);
          throw new Error(`包 ${packageId} 不存在于该源`);
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      lastError = error;
      console.log(`⚠️ ${displayName} 请求异常 [${index + 1}/${packagesUrls.length}]: ${error.message}`);
    }
  }
  
  throw {
    error: `所有尝试均失败: ${lastError?.message || '未知错误'}`,
    packageId,
    name: displayName,
    icon,
    repo: repoInfo.name
  };
}

(async () => {
  // 获取仓库列表
  const repoConfigs = getRepoListFromArgs();
  
  // 如果没有配置
  if (repoConfigs.length === 0) {
    const isPanel = typeof $trigger !== 'undefined';
    
    if (isPanel) {
      $done({
        title: "⚠️ 未配置源",
        content: "请在模块参数中填写要监控的源和包\n\n格式：源地址#包名#备注\n\n示例：\nhttps://repo.chariz.com/#com.ex.substitute#Substitute\n\n多个用逗号分隔",
        style: "error"
      });
    } else {
      console.log("⚠️ 未配置源列表");
      $done();
    }
    return;
  }
  
  let hasUpdate = false;
  const results = {
    updated: [],
    failed: [],
    current: []
  };
  
  const startTime = Date.now();
  
  // 并行执行所有请求
  const promises = repoConfigs.map(config => fetchPackageInfo(config));
  const outcomes = await Promise.allSettled(promises);
  
  const writePromises = [];
  
  // 处理所有结果
  outcomes.forEach((outcome, index) => {
    const config = repoConfigs[index];
    
    if (outcome.status === 'fulfilled') {
      const pkg = outcome.value;
      const key = `cydia_ver_${pkg.packageId}`;
      const savedVersion = $persistentStore.read(key);
      
      if (!savedVersion) {
        writePromises.push($persistentStore.write(pkg.version, key));
        results.current.push({
          ...pkg,
          status: '首次记录'
        });
      } else if (savedVersion !== pkg.version) {
        hasUpdate = true;
        results.updated.push({
          ...pkg,
          oldVersion: savedVersion,
          newVersion: pkg.version
        });
        writePromises.push($persistentStore.write(pkg.version, key));
      } else {
        results.current.push({
          ...pkg,
          status: '最新版'
        });
      }
    } else {
      const error = outcome.reason;
      results.failed.push({
        packageId: error.packageId || config.packageId,
        name: error.name || config.customName || config.packageId,
        icon: error.icon || '📦',
        repo: error.repo || '未知源',
        error: error.error || error.message || '查询失败'
      });
    }
  });
  
  // 等待所有存储操作完成
  await Promise.all(writePromises);
  
  // 生成面板内容和通知
  const now = new Date();
  const executionTime = ((Date.now() - startTime) / 1000).toFixed(1);
  
  const isPanel = typeof $trigger !== 'undefined';
  
  // 面板内容
  let panelTitle = "📦 Cydia 源检测";
  let panelContent = "";
  let panelStyle = "info";
  
  if (hasUpdate) {
    panelStyle = "alert";
    panelTitle = "🆕 发现deb更新";
    
    if (results.updated.length > 0) {
      panelContent += results.updated.map(p =>
        `${p.icon} ${p.name}: ${p.oldVersion} → ${p.newVersion}`
      ).join("\n");
    }
    
    if (results.current.length > 0) {
      panelContent += "\n\n✅ 最新版:\n";
      panelContent += results.current.map(p =>
        `${p.icon} ${p.name}: ${p.version}`
      ).join("\n");
    }
  } else if (results.failed.length > 0) {
    panelStyle = "error";
    panelTitle = "❌ 检测异常";
    
    panelContent += "❌ 查询失败:\n";
    panelContent += results.failed.map(p =>
      `${p.icon} ${p.name}`
    ).join("\n");
    
    if (results.current.length > 0) {
      panelContent += "\n\n✅ 查询成功:\n";
      panelContent += results.current.map(p =>
        `${p.icon} ${p.name}: ${p.version}`
      ).join("\n");
    }
  } else {
    panelStyle = "good";
    panelTitle = "✅ 全部最新";
    
    panelContent += results.current.map(p =>
      `${p.icon} ${p.name}: ${p.version}${p.status === '首次记录' ? ' 🆕' : ''}`
    ).join("\n");
  }
  
  panelContent += `\n\n⏱️ 耗时: ${executionTime}s | 📅 ${now.toLocaleTimeString("zh-CN", {
    hour: '2-digit',
    minute: '2-digit'
  })}`;
  
  // 通知处理
  const isManualTrigger = isPanel && $trigger === '按钮';
  
  const args = $argument || "";
  const alwaysNotifyMatch = args.match(/ALWAYSNOTIFY="?([^"&]*)"?/);
  const alwaysNotify = alwaysNotifyMatch && alwaysNotifyMatch[1] === 'true';
  
  console.log(`🔔 触发方式: ${isPanel ? $trigger : '非面板模式'}`);
  console.log(`🔔 总是通知: ${alwaysNotify ? '开启' : '关闭'}`);
  
  const shouldNotify = isManualTrigger || alwaysNotify || hasUpdate || results.failed.length > 0;
  
  // 发送通知
  if (shouldNotify) {
    let title;
    
    if (hasUpdate) {
      title = "🚀 Cydia 源更新";
    } else if (results.failed.length > 0) {
      title = "❌ Cydia 检测失败";
    } else {
      title = "✅ Cydia 检测完成";
    }
    
    let body = "";
    let hasContent = false;
    
    // 更新详情
    if (hasUpdate) {
      const updates = results.updated;
      if (updates.length > 0) {
        body += `🆕 deb更新:\n`;
        body += updates.map(p =>
          `${p.icon} ${p.name}: ${p.oldVersion} → ${p.newVersion}`
        ).join("\n");
        hasContent = true;
      }
    }
    
    // 当前版本
    if ((isManualTrigger || hasUpdate) && results.current.length > 0) {
      if (hasContent) body += "\n";
      body += `✅ ${isManualTrigger && !hasUpdate ? '当前版本' : '最新版'}:\n`;
      body += results.current.map(p =>
        `${p.icon} ${p.name}: ${p.version}${p.status === '首次记录' ? ' (首次记录)' : ''}`
      ).join("\n");
      hasContent = true;
    }
    
    // 失败包
    if (results.failed.length > 0) {
      if (hasContent) body += "\n";
      body += `❌ 查询失败:\n`;
      body += results.failed.map(p =>
        `${p.icon} ${p.name}: 请检查网络或源状态`
      ).join("\n");
      hasContent = true;
    }
    
    // 统计信息
    body += `\n⏱️ 检测耗时: ${executionTime}秒`;
    body += `\n📅 ${now.toLocaleString("zh-CN", {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })}`;
    
    // 提示
    if (results.failed.length > 0) {
      body += `\n💡 提示: ${results.failed.length}个包查询失败`;
    }
    
    // 标记触发方式
    if (isManualTrigger) {
      body += "\n🔄 手动刷新";
    } else if (alwaysNotify) {
      body += "\n🔔 自动检测 (总是通知)";
    } else {
      body += "\n🔔 自动检测";
    }
    
    // 构建Cydia链接
    let cydiaUrl = "cydia://";
    if (hasUpdate && results.updated.length > 0) {
      const firstUpdated = results.updated[0];
      cydiaUrl = `cydia://package/${firstUpdated.packageId}`;
    } else if (results.current.length > 0) {
      const firstPkg = results.current[0];
      cydiaUrl = `cydia://package/${firstPkg.packageId}`;
    }
    
    // 发送通知
    $notification.post(title, "", body, {
      sound: true,
      action: "open-url",
      url: cydiaUrl
    });
    
    console.log(`📬 已发送通知: ${title}`);
  } else {
    console.log("✅ 自动检测：所有包均为最新版本，无需通知");
  }
  
  // 调试日志
  console.log("=".repeat(40));
  console.log(`Cydia源检测完成 (${executionTime}s)`);
  
  if (results.updated.length > 0) {
    console.log("✨ 发现以下更新:");
    results.updated.forEach(p => {
      console.log(`  ${p.icon} ${p.name}: ${p.oldVersion} → ${p.newVersion}`);
    });
  } else {
    console.log("✨ 未发现更新");
  }
  
  if (results.current.length > 0) {
    console.log("✅ 检查成功的包:");
    results.current.forEach(p => {
      console.log(`  ${p.icon} ${p.name}: ${p.version}${p.status === '首次记录' ? ' (首次记录)' : ''}`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log("❌ 查询失败的包:");
    results.failed.forEach(p => {
      console.log(`  ${p.icon} ${p.name}: ${p.error}`);
    });
  }
  
  console.log("=".repeat(40));
  
  // 返回面板内容
  if (isPanel) {
    $done({
      title: panelTitle,
      content: panelContent,
      style: panelStyle
    });
  } else {
    $done();
  }
})();

