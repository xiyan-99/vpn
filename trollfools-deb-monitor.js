// 名称: 巨魔注入器deb插件商店监控
// 描述: 监控巨魔注入器deb插件商店的插件更新
// 版本: 1.0

// 从参数获取源URL
function getSourceUrlFromArgs() {
  const args = $argument || "";
  const urlMatch = args.match(/SOURCEURL="?([^"&]*)"?/);
  
  if (!urlMatch || !urlMatch[1] || urlMatch[1].trim() === '') {
    console.log('⚠️ 未配置源地址，使用默认地址');
    return "https://deb.iosxy.xin/trollfools.json";
  }
  
  return urlMatch[1].trim();
}

// 获取最大单独通知数量
function getMaxNotifyFromArgs() {
  const args = $argument || "";
  const maxNotifyMatch = args.match(/MAXNOTIFY="?([^"&]*)"?/);
  
  if (maxNotifyMatch && maxNotifyMatch[1]) {
    const num = parseInt(maxNotifyMatch[1]);
    return num > 0 ? num : 10;
  }
  
  return 10;
}

// 版本比较函数
function compareVersion(v1, v2) {
  const parts1 = v1.split(/[.-]/).map(p => parseInt(p) || p);
  const parts2 = v2.split(/[.-]/).map(p => parseInt(p) || p);
  
  const maxLen = Math.max(parts1.length, parts2.length);
  
  for (let i = 0; i < maxLen; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    
    if (typeof p1 === 'number' && typeof p2 === 'number') {
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    } else {
      const s1 = String(p1);
      const s2 = String(p2);
      if (s1 > s2) return 1;
      if (s1 < s2) return -1;
    }
  }
  
  return 0;
}

// 获取源数据
async function fetchSourceData(sourceUrl) {
  try {
    console.log(`🔍 开始获取源数据: ${sourceUrl}`);
    
    const response = await fetch(sourceUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
      }
    });
    
    if (response.status === 200) {
      const data = await response.json();
      console.log(`✅ 成功获取源数据，插件数: ${data.packages?.length || 0}`);
      return data;
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ 获取源数据失败: ${error.message}`);
    throw error;
  }
}

(async () => {
  const startTime = Date.now();
  const sourceUrl = getSourceUrlFromArgs();
  
  const isPanel = typeof $trigger !== 'undefined';
  
  try {
    // 获取源数据
    const sourceData = await fetchSourceData(sourceUrl);
    
    if (!sourceData.packages || sourceData.packages.length === 0) {
      throw new Error('源数据为空或格式错误');
    }
    
    // 读取历史数据
    const storageKey = 'trollfools_deb_versions';
    const savedDataStr = $persistentStore.read(storageKey);
    
    let hasUpdate = false;
    const results = {
      updated: [],
      current: [],
      added: []
    };
    
    // 按section分类统计
    const sectionStats = {};
    
    let savedVersions = {};
    if (savedDataStr) {
      try {
        savedVersions = JSON.parse(savedDataStr);
      } catch (e) {
        console.log('⚠️ 解析历史数据失败，将重新记录');
      }
    }
    
    const isFirstRun = Object.keys(savedVersions).length === 0;
    const newVersions = {};
    
    // 处理每个插件
    for (const pkg of sourceData.packages) {
      if (!pkg.name || !pkg.version) continue;
      
      const section = pkg.section || '其他';
      if (!sectionStats[section]) {
        sectionStats[section] = { total: 0, updated: 0, added: 0 };
      }
      sectionStats[section].total++;
      
      newVersions[pkg.name] = {
        version: pkg.version,
        section: pkg.section,
        icon_url: pkg.icon_url,
        dylib: pkg.dylib
      };
      
      if (isFirstRun) {
        results.current.push(pkg);
      } else {
        const savedVersion = savedVersions[pkg.name];
        
        if (!savedVersion) {
          // 新增插件
          results.added.push(pkg);
          hasUpdate = true;
          sectionStats[section].added++;
        } else if (compareVersion(pkg.version, savedVersion.version) > 0) {
          // 版本更新
          results.updated.push({
            ...pkg,
            oldVersion: savedVersion.version
          });
          hasUpdate = true;
          sectionStats[section].updated++;
        } else {
          results.current.push(pkg);
        }
      }
    }
    
    // 保存当前版本
    $persistentStore.write(JSON.stringify(newVersions), storageKey);
    
    // 发送单独通知
    const notificationPromises = [];
    let sentNotifications = 0;
    const maxIndividualNotifications = getMaxNotifyFromArgs();
    
    // 为更新的插件发送通知
    for (const pkg of results.updated) {
      if (sentNotifications >= maxIndividualNotifications) break;
      
      const sectionIcon = pkg.section === '微信插件' ? '💬' : pkg.section === '抖音插件' ? '🎵' : pkg.section === '应用增强' ? '⚡️' : '📦';
      const title = `${sectionIcon} ${pkg.name} 已更新`;
      const body = `旧版本: ${pkg.oldVersion}\n新版本: ${pkg.version}\n\n分类: ${pkg.section || '未知'}\n作者: ${pkg.author || '未知'}\n\n点击查看详情`;
      
      const notifyOptions = {
        sound: true,
        action: "open-url",
        url: pkg.dylib || sourceUrl
      };
      
      if (pkg.icon_url) {
        notifyOptions["media-url"] = pkg.icon_url;
      }
      
      $notification.post(title, "", body, notifyOptions);
      console.log(`📬 已发送更新通知: ${pkg.name} (${pkg.oldVersion} → ${pkg.version})`);
      
      sentNotifications++;
      notificationPromises.push(new Promise(resolve => setTimeout(resolve, 500)));
    }
    
    // 为新增的插件发送通知
    for (const pkg of results.added) {
      if (sentNotifications >= maxIndividualNotifications) break;
      
      const sectionIcon = pkg.section === '微信插件' ? '💬' : pkg.section === '抖音插件' ? '🎵' : pkg.section === '应用增强' ? '⚡️' : '📦';
      const title = `${sectionIcon} ${pkg.name} 新插件上架`;
      const body = `版本: ${pkg.version}\n\n分类: ${pkg.section || '未知'}\n作者: ${pkg.author || '未知'}\n描述: ${pkg.description || '无'}\n\n点击查看详情`;
      
      const notifyOptions = {
        sound: true,
        action: "open-url",
        url: pkg.dylib || sourceUrl
      };
      
      if (pkg.icon_url) {
        notifyOptions["media-url"] = pkg.icon_url;
      }
      
      $notification.post(title, "", body, notifyOptions);
      console.log(`📬 已发送新增通知: ${pkg.name} (${pkg.version})`);
      
      sentNotifications++;
      notificationPromises.push(new Promise(resolve => setTimeout(resolve, 500)));
    }
    
    if (sentNotifications >= maxIndividualNotifications) {
      console.log(`⚠️ 已达到单独通知上限 (${maxIndividualNotifications}个)`);
    }
    
    // 等待通知延迟
    await Promise.all(notificationPromises);
    
    const executionTime = ((Date.now() - startTime) / 1000).toFixed(1);
    const now = new Date();
    
    // 生成面板内容
    let panelTitle = "📦 巨魔deb插件商店监控";
    let panelContent = "";
    let panelStyle = "info";
    
    if (isFirstRun) {
      panelStyle = "good";
      panelTitle = `✅ 已记录 ${sourceData.packages.length} 个插件`;
      panelContent = `📦 源名称: ${sourceData.repository_name}\n📊 插件总数: ${sourceData.packages.length}\n\n`;
      
      // 显示分类统计
      const sortedSections = Object.entries(sectionStats).sort((a, b) => b[1].total - a[1].total);
      panelContent += sortedSections.slice(0, 5).map(([section, stats]) => 
        `${section}: ${stats.total}个`
      ).join("\n");
      
      if (sortedSections.length > 5) {
        panelContent += `\n... 还有 ${sortedSections.length - 5} 个分类`;
      }
    } else if (hasUpdate) {
      panelStyle = "alert";
      const totalChanges = results.updated.length + results.added.length;
      panelTitle = `🆕 发现 ${totalChanges} 个更新`;
      
      if (results.updated.length > 0) {
        panelContent += `⬆️ 插件更新 (${results.updated.length}个):\n`;
        panelContent += results.updated.slice(0, 5).map(pkg => 
          `${pkg.name}: ${pkg.oldVersion} → ${pkg.version}`
        ).join("\n");
        if (results.updated.length > 5) {
          panelContent += `\n... 还有 ${results.updated.length - 5} 个`;
        }
      }
      
      if (results.added.length > 0) {
        if (panelContent) panelContent += "\n\n";
        panelContent += `➕ 新增插件 (${results.added.length}个):\n`;
        panelContent += results.added.slice(0, 5).map(pkg => 
          `${pkg.name}: ${pkg.version}`
        ).join("\n");
        if (results.added.length > 5) {
          panelContent += `\n... 还有 ${results.added.length - 5} 个`;
        }
      }
      
      if (results.current.length > 0) {
        panelContent += `\n\n✅ 无更新: ${results.current.length} 个`;
      }
    } else {
      panelStyle = "good";
      panelTitle = `✅ 全部最新`;
      panelContent = `📦 插件总数: ${sourceData.packages.length}\n✨ 所有插件均为最新版本`;
    }
    
    panelContent += `\n\n⏱️ 耗时: ${executionTime}s | 📅 ${now.toLocaleTimeString("zh-CN", { 
      hour: '2-digit',
      minute: '2-digit'
    })}`;
    
    // 判断是否发送总结通知
    const args = $argument || "";
    const triggerType = typeof $trigger !== 'undefined' ? $trigger : 'cron';
    const isManualTrigger = isPanel && $trigger === '按钮';
    const alwaysNotifyMatch = args.match(/ALWAYSNOTIFY="?([^"&]*)"?/);
    const alwaysNotify = alwaysNotifyMatch && alwaysNotifyMatch[1] === 'true';
    
    const shouldNotify = isManualTrigger || alwaysNotify || hasUpdate || isFirstRun;
    
    if (shouldNotify) {
      if (hasUpdate || isFirstRun) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      let title;
      let body = "";
      
      if (isFirstRun) {
        title = `✅ 巨魔deb插件商店监控已启动`;
        body = `📦 源名称: ${sourceData.repository_name}\n📊 已记录 ${sourceData.packages.length} 个插件\n🔔 将自动监控插件的变更`;
      } else if (hasUpdate) {
        const totalChanges = results.updated.length + results.added.length;
        title = `📊 更新总结 (${totalChanges}个变更)`;
        
        if (results.updated.length > 0) {
          body += `⬆️ 插件更新 (${results.updated.length}个):\n`;
          body += results.updated.slice(0, 5).map(pkg => 
            `${pkg.name}: ${pkg.oldVersion} → ${pkg.version}`
          ).join("\n");
          if (results.updated.length > 5) {
            body += `\n... 还有 ${results.updated.length - 5} 个`;
          }
        }
        
        if (results.added.length > 0) {
          if (body) body += "\n\n";
          body += `➕ 新增插件 (${results.added.length}个):\n`;
          body += results.added.slice(0, 5).map(pkg => 
            `${pkg.name}: ${pkg.version}`
          ).join("\n");
          if (results.added.length > 5) {
            body += `\n... 还有 ${results.added.length - 5} 个`;
          }
        }
        
        if (results.current.length > 0) {
          body += `\n\n✅ 无更新: ${results.current.length} 个插件`;
        }
      } else {
        title = `✅ 检测完成`;
        body = `📦 插件总数: ${sourceData.packages.length}\n✨ 所有插件均为最新版本`;
      }
      
      body += `\n\n⏱️ 检测耗时: ${executionTime}秒`;
      body += `\n📅 ${now.toLocaleString("zh-CN", {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })}`;
      
      // 获取图标和链接
      let summaryIcon = null;
      let url = sourceUrl;
      
      if (results.updated.length > 0 && results.updated[0].icon_url) {
        summaryIcon = results.updated[0].icon_url;
        url = results.updated[0].dylib || sourceUrl;
      } else if (results.added.length > 0 && results.added[0].icon_url) {
        summaryIcon = results.added[0].icon_url;
        url = results.added[0].dylib || sourceUrl;
      } else if (results.current.length > 0 && results.current[0].icon_url) {
        summaryIcon = results.current[0].icon_url;
      }
      
      const summaryOptions = {
        sound: true,
        action: "open-url",
        url: url,
        "auto-dismiss": 10
      };
      
      if (summaryIcon) {
        summaryOptions["media-url"] = summaryIcon;
      }
      
      $notification.post(title, "", body, summaryOptions);
      console.log(`📬 已发送总结通知: ${title}`);
    }
    
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
    
    if (isPanel) {
      $done({
        title: "❌ 监控失败",
        content: `无法获取源数据\n\n错误信息:\n${error.message}\n\n请检查:\n• 源地址是否正确\n• 网络连接是否正常`,
        style: "error"
      });
    } else {
      $done();
    }
  }
})();

