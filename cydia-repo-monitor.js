// 名称: Cydia源全量监控
// 描述: 监控整个越狱源的所有包变更
// 版本: 1.0
// 
// 功能：
// - 检测源中包的新增、更新、删除、降级
// - 自动保存所有包的版本信息
// - 面板显示变更统计和详情

// 热门源配置
const knownRepos = {
  "https://repo.chariz.com/": { name: "Chariz", icon: "📦", color: "#FF6B6B" },
  "https://repo.packix.com/": { name: "Packix", icon: "📦", color: "#4ECDC4" },
  "https://havoc.app/": { name: "Havoc", icon: "📦", color: "#95E1D3" },
  "https://repo.twickd.com/": { name: "Twickd", icon: "📦", color: "#F38181" },
  "https://apt.bingner.com/": { name: "Bingner", icon: "🔧", color: "#AA96DA" },
  "https://repo.dynastic.co/": { name: "Dynastic", icon: "📦", color: "#FCBAD3" }
};

// 版本比较函数
function compareVersion(v1, v2) {
  // 将版本号分割成数字数组
  const parts1 = v1.split(/[.-]/).map(p => parseInt(p) || p);
  const parts2 = v2.split(/[.-]/).map(p => parseInt(p) || p);
  
  const maxLen = Math.max(parts1.length, parts2.length);
  
  for (let i = 0; i < maxLen; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    
    // 如果都是数字，直接比较
    if (typeof p1 === 'number' && typeof p2 === 'number') {
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    // 如果是字符串，按字典序比较
    else {
      const s1 = String(p1);
      const s2 = String(p2);
      if (s1 > s2) return 1;
      if (s1 < s2) return -1;
    }
  }
  
  return 0; // 版本相同
}

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
      else if (key === 'Author') pkg.author = value;
    }
    
    if (pkg.package && pkg.version) {
      packages[pkg.package] = pkg;
    }
  }
  
  return packages;
}

// 获取源URL
function getRepoUrlFromArgs() {
  const args = $argument || "";
  
  console.log(`🔍 接收到的完整参数: ${args}`);
  
  const repoMatch = args.match(/REPOURL="?([^"&]*)"?/);
  
  if (!repoMatch || !repoMatch[1] || repoMatch[1].trim() === '') {
    console.log('⚠️ 未配置源地址，请在模块参数中填写 REPOURL');
    return null;
  }
  
  let repoUrl = repoMatch[1].trim();
  
  // 确保以 / 结尾
  if (!repoUrl.endsWith('/')) {
    repoUrl += '/';
  }
  
  console.log(`📋 监控源: ${repoUrl}`);
  
  return repoUrl;
}

// 获取最大显示数量
function getMaxShowFromArgs() {
  const args = $argument || "";
  const maxShowMatch = args.match(/MAXSHOW="?([^"&]*)"?/);
  
  if (maxShowMatch && maxShowMatch[1]) {
    const num = parseInt(maxShowMatch[1]);
    return num > 0 ? num : 10;
  }
  
  return 10; // 默认显示10个
}

// 下载并解析源的 Packages 文件
async function fetchRepoPackages(repoUrl) {
  const repoInfo = knownRepos[repoUrl] || { name: '自定义源', icon: '📦' };
  
  console.log(`🔍 开始获取源: ${repoInfo.name}`);
  
  // 尝试多个可能的 Packages 文件位置
  const packagesUrls = [
    `${repoUrl}Packages`,
    `${repoUrl}dists/stable/main/binary-iphoneos-arm/Packages`,
    `${repoUrl}dists/stable/main/binary-iphoneos-arm64/Packages`,
    `${repoUrl}./Packages`
  ];
  
  let lastError;
  
  for (const [index, url] of packagesUrls.entries()) {
    try {
      console.log(`🔍 尝试: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20秒超时
      
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
        const packagesText = await response.text();
        
        // 检查是否为压缩文件（简单判断）
        if (packagesText.startsWith('BZh') || packagesText.charCodeAt(0) === 0x1f) {
          console.log(`⚠️ 检测到压缩文件，跳过: ${url}`);
          continue;
        }
        
        console.log(`✅ 成功获取 Packages 文件，大小: ${(packagesText.length / 1024).toFixed(1)} KB`);
        
        const packages = parsePackages(packagesText);
        const packageCount = Object.keys(packages).length;
        
        console.log(`📦 解析出 ${packageCount} 个包`);
        
        if (packageCount === 0) {
          throw new Error('解析出的包数量为0');
        }
        
        return {
          repoUrl,
          repoInfo,
          packages,
          packageCount,
          fetchTime: new Date().toISOString()
        };
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      lastError = error;
      console.log(`⚠️ 请求失败 [${index + 1}/${packagesUrls.length}]: ${error.message}`);
    }
  }
  
  throw new Error(`所有尝试均失败: ${lastError?.message || '未知错误'}`);
}

// 对比包列表，找出变更
function comparePackageLists(oldPackages, newPackages) {
  const changes = {
    added: [],      // 新增的包
    updated: [],    // 更新的包
    downgraded: [], // 降级的包
    removed: []     // 删除的包
  };
  
  // 检查新增和更新
  for (const [packageId, newPkg] of Object.entries(newPackages)) {
    if (!oldPackages[packageId]) {
      // 新增的包
      changes.added.push(newPkg);
    } else {
      const oldPkg = oldPackages[packageId];
      const comparison = compareVersion(newPkg.version, oldPkg.version);
      
      if (comparison > 0) {
        // 版本升级
        changes.updated.push({
          ...newPkg,
          oldVersion: oldPkg.version
        });
      } else if (comparison < 0) {
        // 版本降级（罕见）
        changes.downgraded.push({
          ...newPkg,
          oldVersion: oldPkg.version
        });
      }
      // comparison === 0 表示版本相同，无变化
    }
  }
  
  // 检查删除的包
  for (const [packageId, oldPkg] of Object.entries(oldPackages)) {
    if (!newPackages[packageId]) {
      changes.removed.push(oldPkg);
    }
  }
  
  return changes;
}

// 格式化包名显示
function formatPackageName(pkg) {
  return pkg.name || pkg.package;
}

(async () => {
  const startTime = Date.now();
  
  // 获取源URL
  const repoUrl = getRepoUrlFromArgs();
  
  if (!repoUrl) {
    const isPanel = typeof $trigger !== 'undefined';
    
    if (isPanel) {
      $done({
        title: "⚠️ 未配置源",
        content: "请在模块参数中填写要监控的源地址\n\n格式：https://repo.chariz.com/\n\n支持的热门源：\n• Chariz: https://repo.chariz.com/\n• Packix: https://repo.packix.com/\n• Havoc: https://havoc.app/\n• Twickd: https://repo.twickd.com/\n• Bingner: https://apt.bingner.com/\n• Dynastic: https://repo.dynastic.co/",
        style: "error"
      });
    } else {
      console.log("⚠️ 未配置源地址");
      $done();
    }
    return;
  }
  
  try {
    // 获取当前源的所有包
    const result = await fetchRepoPackages(repoUrl);
    const { repoInfo, packages, packageCount } = result;
    
    // 读取历史数据
    const storageKey = `repo_packages_${encodeURIComponent(repoUrl)}`;
    const savedDataStr = $persistentStore.read(storageKey);
    
    let changes = null;
    let isFirstRun = false;
    
    if (!savedDataStr) {
      // 首次运行
      isFirstRun = true;
      console.log('📝 首次运行，保存当前状态');
    } else {
      // 对比变更
      try {
        const savedData = JSON.parse(savedDataStr);
        const oldPackages = savedData.packages || {};
        
        console.log(`📊 对比变更: 旧=${Object.keys(oldPackages).length} vs 新=${packageCount}`);
        
        changes = comparePackageLists(oldPackages, packages);
        
        console.log(`📈 变更统计: 新增=${changes.added.length}, 更新=${changes.updated.length}, 降级=${changes.downgraded.length}, 删除=${changes.removed.length}`);
      } catch (error) {
        console.log(`⚠️ 解析历史数据失败: ${error.message}，将重新记录`);
        isFirstRun = true;
      }
    }
    
    // 保存当前状态
    const dataToSave = {
      packages,
      packageCount,
      lastCheck: new Date().toISOString(),
      repoUrl
    };
    
    $persistentStore.write(JSON.stringify(dataToSave), storageKey);
    
    const executionTime = ((Date.now() - startTime) / 1000).toFixed(1);
    const now = new Date();
    
    // 生成面板内容
    const isPanel = typeof $trigger !== 'undefined';
    const maxShow = getMaxShowFromArgs();
    
    let panelTitle = `${repoInfo.icon} ${repoInfo.name}`;
    let panelContent = "";
    let panelStyle = "info";
    
    if (isFirstRun) {
      panelStyle = "good";
      panelTitle = `✅ ${repoInfo.name} 已记录`;
      panelContent = `📦 总包数: ${packageCount}\n🆕 首次监控，已记录当前状态`;
    } else if (changes) {
      const totalChanges = changes.added.length + changes.updated.length + 
                          changes.downgraded.length + changes.removed.length;
      
      if (totalChanges > 0) {
        panelStyle = "alert";
        panelTitle = `🆕 ${repoInfo.name} 有变更`;
        
        // 新增的包
        if (changes.added.length > 0) {
          panelContent += `➕ 新增 ${changes.added.length} 个:\n`;
          const showCount = Math.min(changes.added.length, maxShow);
          for (let i = 0; i < showCount; i++) {
            const pkg = changes.added[i];
            panelContent += `  • ${formatPackageName(pkg)} ${pkg.version}\n`;
          }
          if (changes.added.length > maxShow) {
            panelContent += `  ... 还有 ${changes.added.length - maxShow} 个\n`;
          }
        }
        
        // 更新的包
        if (changes.updated.length > 0) {
          if (panelContent) panelContent += "\n";
          panelContent += `⬆️ 更新 ${changes.updated.length} 个:\n`;
          const showCount = Math.min(changes.updated.length, maxShow);
          for (let i = 0; i < showCount; i++) {
            const pkg = changes.updated[i];
            panelContent += `  • ${formatPackageName(pkg)}\n    ${pkg.oldVersion} → ${pkg.version}\n`;
          }
          if (changes.updated.length > maxShow) {
            panelContent += `  ... 还有 ${changes.updated.length - maxShow} 个\n`;
          }
        }
        
        // 降级的包
        if (changes.downgraded.length > 0) {
          if (panelContent) panelContent += "\n";
          panelContent += `⬇️ 降级 ${changes.downgraded.length} 个:\n`;
          const showCount = Math.min(changes.downgraded.length, maxShow);
          for (let i = 0; i < showCount; i++) {
            const pkg = changes.downgraded[i];
            panelContent += `  • ${formatPackageName(pkg)}\n    ${pkg.oldVersion} → ${pkg.version}\n`;
          }
          if (changes.downgraded.length > maxShow) {
            panelContent += `  ... 还有 ${changes.downgraded.length - maxShow} 个\n`;
          }
        }
        
        // 删除的包
        if (changes.removed.length > 0) {
          if (panelContent) panelContent += "\n";
          panelContent += `➖ 删除 ${changes.removed.length} 个:\n`;
          const showCount = Math.min(changes.removed.length, maxShow);
          for (let i = 0; i < showCount; i++) {
            const pkg = changes.removed[i];
            panelContent += `  • ${formatPackageName(pkg)} ${pkg.version}\n`;
          }
          if (changes.removed.length > maxShow) {
            panelContent += `  ... 还有 ${changes.removed.length - maxShow} 个\n`;
          }
        }
        
        panelContent += `\n📦 当前总数: ${packageCount}`;
      } else {
        panelStyle = "good";
        panelTitle = `✅ ${repoInfo.name} 无变更`;
        panelContent = `📦 总包数: ${packageCount}\n✨ 所有包均无变化`;
      }
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
    
    const hasChanges = changes && 
                       (changes.added.length > 0 || changes.updated.length > 0 || 
                        changes.downgraded.length > 0 || changes.removed.length > 0);
    
    const shouldNotify = isManualTrigger || alwaysNotify || hasChanges || isFirstRun;
    
    // 发送通知
    if (shouldNotify) {
      let title;
      let body = "";
      
      if (isFirstRun) {
        title = `✅ ${repoInfo.name} 监控已启动`;
        body = `📦 已记录 ${packageCount} 个包\n🔔 将自动监控源的所有变更`;
      } else if (hasChanges) {
        title = `🚀 ${repoInfo.name} 源更新`;
        
        const totalChanges = changes.added.length + changes.updated.length + 
                            changes.downgraded.length + changes.removed.length;
        
        body = `📊 变更统计:\n`;
        
        if (changes.added.length > 0) {
          body += `➕ 新增: ${changes.added.length} 个\n`;
        }
        if (changes.updated.length > 0) {
          body += `⬆️ 更新: ${changes.updated.length} 个\n`;
        }
        if (changes.downgraded.length > 0) {
          body += `⬇️ 降级: ${changes.downgraded.length} 个\n`;
        }
        if (changes.removed.length > 0) {
          body += `➖ 删除: ${changes.removed.length} 个\n`;
        }
        
        body += `\n📦 当前总数: ${packageCount}`;
        
        // 显示部分详情
        if (changes.updated.length > 0) {
          body += `\n\n🔥 热门更新:`;
          const showCount = Math.min(changes.updated.length, 3);
          for (let i = 0; i < showCount; i++) {
            const pkg = changes.updated[i];
            body += `\n• ${formatPackageName(pkg)}: ${pkg.oldVersion} → ${pkg.version}`;
          }
          if (changes.updated.length > 3) {
            body += `\n... 还有 ${changes.updated.length - 3} 个更新`;
          }
        }
        
        if (changes.added.length > 0 && changes.updated.length < 3) {
          body += `\n\n✨ 新增包:`;
          const showCount = Math.min(changes.added.length, 3);
          for (let i = 0; i < showCount; i++) {
            const pkg = changes.added[i];
            body += `\n• ${formatPackageName(pkg)} ${pkg.version}`;
          }
          if (changes.added.length > 3) {
            body += `\n... 还有 ${changes.added.length - 3} 个`;
          }
        }
      } else {
        title = `✅ ${repoInfo.name} 检测完成`;
        body = `📦 总包数: ${packageCount}\n✨ 所有包均无变化`;
      }
      
      body += `\n⏱️ 检测耗时: ${executionTime}秒`;
      body += `\n📅 ${now.toLocaleString("zh-CN", {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })}`;
      
      if (isManualTrigger) {
        body += "\n🔄 手动刷新";
      } else if (alwaysNotify) {
        body += "\n🔔 自动检测 (总是通知)";
      } else {
        body += "\n🔔 自动检测";
      }
      
      // 构建源链接
      let url = repoUrl;
      if (url.startsWith('https://')) {
        url = url; // 保持https链接
      } else if (!url.startsWith('cydia://') && !url.startsWith('sileo://')) {
        url = `cydia://url/${url}`;
      }
      
      $notification.post(title, "", body, {
        sound: true,
        action: "open-url",
        url: url
      });
      
      console.log(`📬 已发送通知: ${title}`);
    } else {
      console.log("✅ 自动检测：源无变更，无需通知");
    }
    
    // 调试日志
    console.log("=".repeat(40));
    console.log(`${repoInfo.name} 源监控完成 (${executionTime}s)`);
    console.log(`📦 当前包数: ${packageCount}`);
    
    if (changes) {
      if (hasChanges) {
        console.log("✨ 发现变更:");
        if (changes.added.length > 0) {
          console.log(`  ➕ 新增: ${changes.added.length} 个`);
        }
        if (changes.updated.length > 0) {
          console.log(`  ⬆️ 更新: ${changes.updated.length} 个`);
        }
        if (changes.downgraded.length > 0) {
          console.log(`  ⬇️ 降级: ${changes.downgraded.length} 个`);
        }
        if (changes.removed.length > 0) {
          console.log(`  ➖ 删除: ${changes.removed.length} 个`);
        }
      } else {
        console.log("✨ 无变更");
      }
    } else if (isFirstRun) {
      console.log("✨ 首次运行，已保存初始状态");
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
    
  } catch (error) {
    console.log(`❌ 错误: ${error.message}`);
    
    const isPanel = typeof $trigger !== 'undefined';
    
    if (isPanel) {
      $done({
        title: "❌ 监控失败",
        content: `无法获取源数据\n\n错误信息:\n${error.message}\n\n请检查:\n• 源地址是否正确\n• 网络连接是否正常\n• 源是否提供未压缩的Packages文件`,
        style: "error"
      });
    } else {
      $done();
    }
  }
})();

