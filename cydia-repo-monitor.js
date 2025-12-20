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

// 获取源URL列表（支持多个源）
function getRepoUrlsFromArgs() {
  const args = $argument || "";
  
  console.log(`🔍 接收到的完整参数: ${args}`);
  
  const repoMatch = args.match(/REPOURL="?([^"&]*)"?/);
  
  if (!repoMatch || !repoMatch[1] || repoMatch[1].trim() === '') {
    console.log('⚠️ 未配置源地址，请在模块参数中填写 REPOURL');
    return [];
  }
  
  const repoStr = repoMatch[1].trim();
  
  console.log(`📋 接收到的REPOURL参数: ${repoStr.substring(0, 100)}${repoStr.length > 100 ? '...' : ''}`);
  
  // 支持多种分隔符：逗号、换行符、分号
  let rawUrls;
  
  // 优先处理逗号分隔（推荐方式）
  if (repoStr.includes(',')) {
    console.log('✂️ 使用逗号分隔');
    rawUrls = repoStr.split(',');
  }
  // 处理换行符分隔（一行一个）
  else if (repoStr.includes('\n')) {
    console.log('✂️ 使用换行符分隔');
    rawUrls = repoStr.split('\n');
  }
  // 处理字面的 \n
  else if (repoStr.includes('\\n')) {
    console.log('✂️ 使用 \\n 分隔');
    rawUrls = repoStr.split('\\n');
  }
  // 处理URL编码的换行符
  else if (repoStr.includes('%0A')) {
    console.log('✂️ 使用 %0A 分隔');
    rawUrls = repoStr.split('%0A');
  }
  // 处理分号分隔
  else if (repoStr.includes(';')) {
    console.log('✂️ 使用分号分隔');
    rawUrls = repoStr.split(';');
  }
  // 处理竖线分隔
  else if (repoStr.includes('|')) {
    console.log('✂️ 使用竖线分隔');
    rawUrls = repoStr.split('|');
  }
  // 单个源
  else {
    console.log('✂️ 单个源');
    rawUrls = [repoStr];
  }
  
  // 处理每个URL：去空格、添加结尾斜杠
  const repoUrls = rawUrls.map(url => {
    let trimmed = url.trim();
    // 确保以 / 结尾
    if (trimmed && !trimmed.endsWith('/')) {
      trimmed += '/';
    }
    return trimmed;
  }).filter(url => url); // 过滤空字符串
  
  if (repoUrls.length === 0) {
    console.log('⚠️ 源地址为空');
    return [];
  }
  
  console.log(`📋 监控 ${repoUrls.length} 个源:`);
  repoUrls.forEach((url, idx) => {
    const repoInfo = knownRepos[url] || { name: '自定义源' };
    console.log(`   ${idx + 1}. ${repoInfo.name}: ${url}`);
  });
  
  return repoUrls;
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
  
  // 获取源URL列表
  const repoUrls = getRepoUrlsFromArgs();
  
  if (repoUrls.length === 0) {
    const isPanel = typeof $trigger !== 'undefined';
    
    if (isPanel) {
      $done({
        title: "⚠️ 未配置源",
        content: "请在模块参数中填写要监控的源地址\n\n单个源：\nhttps://repo.chariz.com/\n\n多个源（逗号分隔）：\nhttps://repo.chariz.com/,https://havoc.app/\n\n支持的热门源：\n• Chariz: https://repo.chariz.com/\n• Packix: https://repo.packix.com/\n• Havoc: https://havoc.app/\n• Twickd: https://repo.twickd.com/\n• Bingner: https://apt.bingner.com/\n• Dynastic: https://repo.dynastic.co/",
        style: "error"
      });
    } else {
      console.log("⚠️ 未配置源地址");
      $done();
    }
    return;
  }
  
  try {
    // 并行获取所有源的包信息
    const repoPromises = repoUrls.map(url => fetchRepoPackages(url));
    const repoResults = await Promise.allSettled(repoPromises);
    
    // 处理每个源的结果
    const allRepoData = [];
    const failedRepos = [];
    
    for (let i = 0; i < repoResults.length; i++) {
      const result = repoResults[i];
      const repoUrl = repoUrls[i];
      
      if (result.status === 'fulfilled') {
        allRepoData.push(result.value);
      } else {
        const repoInfo = knownRepos[repoUrl] || { name: '自定义源', icon: '📦' };
        failedRepos.push({
          repoUrl,
          repoInfo,
          error: result.reason.message || '获取失败'
        });
        console.log(`❌ ${repoInfo.name} 获取失败: ${result.reason.message}`);
      }
    }
    
    // 如果所有源都失败了
    if (allRepoData.length === 0) {
      throw new Error('所有源获取失败');
    }
    
    // 对每个成功获取的源进行变更检测
    const allChanges = [];
    const writePromises = [];
    
    for (const repoData of allRepoData) {
      const { repoUrl, repoInfo, packages, packageCount } = repoData;
    
      // 读取该源的历史数据
      const storageKey = `repo_packages_${encodeURIComponent(repoUrl)}`;
      const savedDataStr = $persistentStore.read(storageKey);
      
      let changes = null;
      let isFirstRun = false;
      
      if (!savedDataStr) {
        // 首次运行
        isFirstRun = true;
        console.log(`📝 ${repoInfo.name}: 首次运行，保存当前状态`);
      } else {
        // 对比变更
        try {
          const savedData = JSON.parse(savedDataStr);
          const oldPackages = savedData.packages || {};
          
          console.log(`📊 ${repoInfo.name} 对比变更: 旧=${Object.keys(oldPackages).length} vs 新=${packageCount}`);
          
          changes = comparePackageLists(oldPackages, packages);
          
          console.log(`📈 ${repoInfo.name} 变更统计: 新增=${changes.added.length}, 更新=${changes.updated.length}, 降级=${changes.downgraded.length}, 删除=${changes.removed.length}`);
        } catch (error) {
          console.log(`⚠️ ${repoInfo.name} 解析历史数据失败: ${error.message}，将重新记录`);
          isFirstRun = true;
        }
      }
      
      // 保存该源的当前状态
      const dataToSave = {
        packages,
        packageCount,
        lastCheck: new Date().toISOString(),
        repoUrl
      };
      
      writePromises.push(
        new Promise(resolve => {
          $persistentStore.write(JSON.stringify(dataToSave), storageKey);
          resolve();
        })
      );
      
      // 收集该源的变更信息
      allChanges.push({
        repoUrl,
        repoInfo,
        packageCount,
        changes,
        isFirstRun
      });
    }
    
    // 等待所有存储操作完成
    await Promise.all(writePromises);
    
    const executionTime = ((Date.now() - startTime) / 1000).toFixed(1);
    const now = new Date();
    
    // 生成面板内容
    const isPanel = typeof $trigger !== 'undefined';
    const maxShow = getMaxShowFromArgs();
    
    // 统计所有源的变更
    let totalPackageCount = 0;
    let totalNewPackages = 0;
    let totalUpdatedPackages = 0;
    let totalDowngradedPackages = 0;
    let totalRemovedPackages = 0;
    let firstRunRepos = [];
    let changedRepos = [];
    let unchangedRepos = [];
    
    for (const repoChange of allChanges) {
      totalPackageCount += repoChange.packageCount;
      
      if (repoChange.isFirstRun) {
        firstRunRepos.push(repoChange);
      } else if (repoChange.changes) {
        const changes = repoChange.changes;
        const totalChanges = changes.added.length + changes.updated.length + 
                            changes.downgraded.length + changes.removed.length;
        
        totalNewPackages += changes.added.length;
        totalUpdatedPackages += changes.updated.length;
        totalDowngradedPackages += changes.downgraded.length;
        totalRemovedPackages += changes.removed.length;
        
        if (totalChanges > 0) {
          changedRepos.push(repoChange);
        } else {
          unchangedRepos.push(repoChange);
        }
      }
    }
    
    const hasAnyChanges = totalNewPackages > 0 || totalUpdatedPackages > 0 || 
                          totalDowngradedPackages > 0 || totalRemovedPackages > 0;
    
    let panelTitle = "";
    let panelContent = "";
    let panelStyle = "info";
    
    // 生成面板标题和样式
    if (firstRunRepos.length === allChanges.length) {
      // 全部首次运行
      panelStyle = "good";
      panelTitle = `✅ 已记录 ${allChanges.length} 个源`;
    } else if (hasAnyChanges) {
      // 有变更
      panelStyle = "alert";
      const totalChanges = totalNewPackages + totalUpdatedPackages + totalDowngradedPackages + totalRemovedPackages;
      panelTitle = `🆕 发现 ${totalChanges} 个变更`;
    } else {
      // 无变更
      panelStyle = "good";
      panelTitle = `✅ 全部最新`;
    }
    
    // 生成面板内容
    if (firstRunRepos.length > 0) {
      // 显示首次运行的源
      panelContent += `📝 首次记录 ${firstRunRepos.length} 个源:\n`;
      for (const repo of firstRunRepos) {
        panelContent += `  ${repo.repoInfo.icon} ${repo.repoInfo.name}: ${repo.packageCount} 个包\n`;
      }
      panelContent += "\n";
    }
    
    if (hasAnyChanges) {
      // 显示变更统计
      panelContent += `📊 变更统计:\n`;
      if (totalNewPackages > 0) panelContent += `➕ 新增: ${totalNewPackages}\n`;
      if (totalUpdatedPackages > 0) panelContent += `⬆️ 更新: ${totalUpdatedPackages}\n`;
      if (totalDowngradedPackages > 0) panelContent += `⬇️ 降级: ${totalDowngradedPackages}\n`;
      if (totalRemovedPackages > 0) panelContent += `➖ 删除: ${totalRemovedPackages}\n`;
      panelContent += "\n";
      
      // 显示每个有变更的源
      for (const repo of changedRepos) {
        const changes = repo.changes;
        const totalChanges = changes.added.length + changes.updated.length + 
                            changes.downgraded.length + changes.removed.length;
      
        
        panelContent += `${repo.repoInfo.icon} ${repo.repoInfo.name} (${totalChanges}个变更):\n`;
        
        // 显示该源的主要变更（限制显示数量）
        let shownInRepo = 0;
        const maxPerRepo = Math.max(3, Math.floor(maxShow / changedRepos.length));
        
        if (changes.updated.length > 0 && shownInRepo < maxPerRepo) {
          const showCount = Math.min(changes.updated.length, maxPerRepo - shownInRepo);
          for (let i = 0; i < showCount; i++) {
            const pkg = changes.updated[i];
            panelContent += `  ⬆️ ${formatPackageName(pkg)}: ${pkg.oldVersion} → ${pkg.version}\n`;
            shownInRepo++;
          }
        }
        
        if (changes.added.length > 0 && shownInRepo < maxPerRepo) {
          const showCount = Math.min(changes.added.length, maxPerRepo - shownInRepo);
          for (let i = 0; i < showCount; i++) {
            const pkg = changes.added[i];
            panelContent += `  ➕ ${formatPackageName(pkg)} ${pkg.version}\n`;
            shownInRepo++;
          }
        }
        
        if (shownInRepo < totalChanges) {
          panelContent += `  ... 还有 ${totalChanges - shownInRepo} 个变更\n`;
        }
        
        panelContent += "\n";
      }
    }
    
    // 显示无变更的源
    if (unchangedRepos.length > 0) {
      panelContent += `✅ 无变更源 (${unchangedRepos.length}个):\n`;
      for (const repo of unchangedRepos) {
        panelContent += `  ${repo.repoInfo.icon} ${repo.repoInfo.name}: ${repo.packageCount} 个包\n`;
      }
      panelContent += "\n";
    }
    
    // 显示失败的源
    if (failedRepos.length > 0) {
      panelContent += `❌ 获取失败 (${failedRepos.length}个):\n`;
      for (const failed of failedRepos) {
        panelContent += `  ${failed.repoInfo.icon} ${failed.repoInfo.name}\n`;
      }
      panelContent += "\n";
    }
    
    // 总统计
    panelContent += `📦 总包数: ${totalPackageCount} | 源数: ${allChanges.length}`;
    
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
    
    const shouldNotify = isManualTrigger || alwaysNotify || hasAnyChanges || firstRunRepos.length > 0;
    
    // 发送通知
    if (shouldNotify) {
      let title;
      let body = "";
      
      if (firstRunRepos.length === allChanges.length) {
        // 全部首次运行
        title = `✅ 监控已启动 (${allChanges.length}个源)`;
        body = `📦 已记录 ${totalPackageCount} 个包\n🔔 将自动监控所有源的变更\n\n`;
        for (const repo of firstRunRepos) {
          body += `${repo.repoInfo.icon} ${repo.repoInfo.name}: ${repo.packageCount}个\n`;
        }
      } else if (hasAnyChanges) {
        // 有变更
        const totalChanges = totalNewPackages + totalUpdatedPackages + totalDowngradedPackages + totalRemovedPackages;
        title = `🚀 源更新 (${totalChanges}个变更)`;
        
        body = `📊 变更统计:\n`;
        if (totalNewPackages > 0) body += `➕ 新增: ${totalNewPackages}\n`;
        if (totalUpdatedPackages > 0) body += `⬆️ 更新: ${totalUpdatedPackages}\n`;
        if (totalDowngradedPackages > 0) body += `⬇️ 降级: ${totalDowngradedPackages}\n`;
        if (totalRemovedPackages > 0) body += `➖ 删除: ${totalRemovedPackages}\n`;
        
        body += `\n`;
        
        // 显示有变更的源
        for (const repo of changedRepos) {
          const changes = repo.changes;
          const repoTotalChanges = changes.added.length + changes.updated.length + 
                                   changes.downgraded.length + changes.removed.length;
          body += `${repo.repoInfo.icon} ${repo.repoInfo.name}: ${repoTotalChanges}个变更\n`;
        }
        
        // 显示部分更新详情
        if (totalUpdatedPackages > 0) {
          body += `\n🔥 热门更新:`;
          let shown = 0;
          for (const repo of changedRepos) {
            if (shown >= 5) break;
            for (const pkg of repo.changes.updated) {
              if (shown >= 5) break;
              body += `\n• ${formatPackageName(pkg)}: ${pkg.oldVersion} → ${pkg.version}`;
              shown++;
            }
          }
          if (totalUpdatedPackages > 5) {
            body += `\n... 还有 ${totalUpdatedPackages - 5} 个`;
          }
        }
      } else {
        // 无变更
        title = `✅ 检测完成 (${allChanges.length}个源)`;
        body = `📦 总包数: ${totalPackageCount}\n✨ 所有源均无变化`;
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
      
      // 构建源链接（如果有变更的源，跳转到第一个）
      let url = "cydia://";
      if (changedRepos.length > 0) {
        const firstChangedRepo = changedRepos[0];
        url = firstChangedRepo.repoUrl.startsWith('https://') ? 
              firstChangedRepo.repoUrl : 
              `cydia://url/${firstChangedRepo.repoUrl}`;
      } else if (allChanges.length > 0) {
        url = allChanges[0].repoUrl.startsWith('https://') ? 
              allChanges[0].repoUrl : 
              `cydia://url/${allChanges[0].repoUrl}`;
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
    console.log(`Cydia源监控完成 (${executionTime}s)`);
    console.log(`📦 监控源数: ${allChanges.length}`);
    console.log(`📦 总包数: ${totalPackageCount}`);
    
    if (firstRunRepos.length > 0) {
      console.log(`✨ 首次运行: ${firstRunRepos.length} 个源`);
      for (const repo of firstRunRepos) {
        console.log(`  ${repo.repoInfo.icon} ${repo.repoInfo.name}`);
      }
    }
    
    if (hasAnyChanges) {
      console.log("✨ 发现变更:");
      if (totalNewPackages > 0) console.log(`  ➕ 新增: ${totalNewPackages} 个`);
      if (totalUpdatedPackages > 0) console.log(`  ⬆️ 更新: ${totalUpdatedPackages} 个`);
      if (totalDowngradedPackages > 0) console.log(`  ⬇️ 降级: ${totalDowngradedPackages} 个`);
      if (totalRemovedPackages > 0) console.log(`  ➖ 删除: ${totalRemovedPackages} 个`);
      
      for (const repo of changedRepos) {
        const changes = repo.changes;
        const totalChanges = changes.added.length + changes.updated.length + 
                            changes.downgraded.length + changes.removed.length;
        console.log(`  ${repo.repoInfo.icon} ${repo.repoInfo.name}: ${totalChanges}个变更`);
      }
    } else if (firstRunRepos.length === 0) {
      console.log("✨ 无变更");
    }
    
    if (failedRepos.length > 0) {
      console.log("❌ 获取失败:");
      for (const failed of failedRepos) {
        console.log(`  ${failed.repoInfo.icon} ${failed.repoInfo.name}: ${failed.error}`);
      }
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

