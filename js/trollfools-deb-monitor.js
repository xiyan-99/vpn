// 名称: 巨魔注入器deb插件商店监控
// 描述: 监控巨魔注入器deb插件商店的插件更新
// 版本: 1.0

// 从参数获取源URL
function getSourceUrlFromArgs() {
  const args = $argument || "";
  const urlMatch = args.match(/SOURCEURL="?([^"&]*)"?/);
  
  if (!urlMatch || !urlMatch[1] || urlMatch[1].trim() === '') {
    console.log('⚠️ 未配置源地址，使用默认地址');
    return "https://deb.iosxy.xin/trollpackages.json";
  }
  
  const url = urlMatch[1].trim();
  
  // 如果填写了 #，表示禁用此监控
  if (url === '#') {
    console.log('⚠️ 巨魔DEB插件商店监控已禁用（参数为 #）');
    return null;
  }
  
  return url;
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
    
    let sourceText;
    
    try {
      // 优先尝试使用 fetch
      const response = await fetch(sourceUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
        }
      });
      
      if (response.status === 200) {
        sourceText = await response.text();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (fetchError) {
      console.log(`⚠️ fetch 失败: ${fetchError.message}，尝试使用 $httpClient`);
      
      // 使用 Surge 原生的 $httpClient 作为备用
      sourceText = await new Promise((resolve, reject) => {
        $httpClient.get({
          url: sourceUrl,
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
          },
          timeout: 30
        }, (error, response, data) => {
          if (error) {
            console.log(`⚠️ $httpClient 也失败: ${error}`);
            reject(new Error(error));
          } else if (response.status === 200) {
            console.log(`✅ $httpClient 成功获取数据`);
            resolve(data);
          } else {
            reject(new Error(`HTTP ${response.status}`));
          }
        });
      });
    }
    
    if (sourceText) {
      const data = JSON.parse(sourceText);
      console.log(`✅ 成功获取源数据，插件数: ${data.packages?.length || 0}`);
      return data;
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
  
  // 如果返回 null，说明监控已禁用
  if (sourceUrl === null) {
    if (isPanel) {
      $done({
        title: "⚠️ 监控已禁用",
        content: "巨魔DEB插件商店监控已禁用\n\n如需启用，请在模块参数中配置 SOURCEURL\n或在统一模块中将 TROLLDEB_URL 改为源地址",
        style: "info"
      });
    } else {
      $done();
    }
    return;
  }
  
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
      
      if (isFirstRun) {
        // 首次运行，记录所有版本
        newVersions[pkg.name] = {
          version: pkg.version,
          section: pkg.section,
          icon_url: pkg.icon_url,
          dylib: pkg.dylib
        };
        results.current.push(pkg);
      } else {
        const savedVersion = savedVersions[pkg.name];
        
        if (!savedVersion) {
          // 新增插件，保存新版本
          newVersions[pkg.name] = {
            version: pkg.version,
            section: pkg.section,
            icon_url: pkg.icon_url,
            dylib: pkg.dylib
          };
          results.added.push(pkg);
          hasUpdate = true;
          sectionStats[section].added++;
        } else if (compareVersion(pkg.version, savedVersion.version) > 0) {
          // 版本更新，保存新版本
          newVersions[pkg.name] = {
            version: pkg.version,
            section: pkg.section,
            icon_url: pkg.icon_url,
            dylib: pkg.dylib
          };
          results.updated.push({
            ...pkg,
            oldVersion: savedVersion.version
          });
          hasUpdate = true;
          sectionStats[section].updated++;
        } else {
          // API 返回的版本 <= 已保存版本，保持使用已保存的版本
          newVersions[pkg.name] = savedVersion;
          results.current.push({
            ...pkg,
            version: savedVersion.version  // 使用已保存的版本
          });
        }
      }
    }
    
    // 保存版本信息
    $persistentStore.write(JSON.stringify(newVersions), storageKey);
    
    // 发送单独通知
    const notificationPromises = [];
    let sentNotifications = 0;
    const maxIndividualNotifications = getMaxNotifyFromArgs();
    
    // 为更新的插件发送通知
    for (const pkg of results.updated) {
      if (sentNotifications >= maxIndividualNotifications) break;
      
      const sectionIcon = pkg.section === '微信插件' ? '💬' : pkg.section === '抖音插件' ? '🎵' : pkg.section === '应用增强' ? '⚡️' : '📦';
      const title = "巨魔DEB插件监控";
      const subtitle = `${pkg.name} 已更新`;
      const body = `${pkg.oldVersion} → ${pkg.version}`;
      
      const notifyOptions = {
        sound: true,
        action: "open-url",
        url: pkg.dylib || sourceUrl
      };
      
      if (pkg.icon_url) {
        notifyOptions["media-url"] = pkg.icon_url;
      }
      
      $notification.post(title, subtitle, body, notifyOptions);
      console.log(`📬 已发送更新通知: ${pkg.name} (${pkg.oldVersion} → ${pkg.version})`);
      
      sentNotifications++;
      notificationPromises.push(new Promise(resolve => setTimeout(resolve, 500)));
    }
    
    // 为新增的插件发送通知
    for (const pkg of results.added) {
      if (sentNotifications >= maxIndividualNotifications) break;
      
      const sectionIcon = pkg.section === '微信插件' ? '💬' : pkg.section === '抖音插件' ? '🎵' : pkg.section === '应用增强' ? '⚡️' : '📦';
      const title = "巨魔DEB插件监控";
      const subtitle = `${pkg.name} 新插件上架`;
      const body = `版本: ${pkg.version}`;
      
      const notifyOptions = {
        sound: true,
        action: "open-url",
        url: pkg.dylib || sourceUrl
      };
      
      if (pkg.icon_url) {
        notifyOptions["media-url"] = pkg.icon_url;
      }
      
      $notification.post(title, subtitle, body, notifyOptions);
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
      
      let title = "巨魔DEB插件监控";
      let subtitle = "";
      let body = "";
      
      if (isFirstRun) {
        subtitle = `监控已启动 (${sourceData.packages.length}个插件)`;
        body = `📦 ${sourceData.repository_name}`;
      } else if (hasUpdate) {
        const totalChanges = results.updated.length + results.added.length;
        subtitle = `发现 ${totalChanges} 个变更`;
        
        if (results.updated.length > 0) {
          body += results.updated.slice(0, 5).map(pkg => 
            `⬆️ ${pkg.name}: ${pkg.oldVersion} → ${pkg.version}`
          ).join("\n");
          if (results.updated.length > 5) {
            body += `\n... 还有 ${results.updated.length - 5} 个更新`;
          }
        }
        
        if (results.added.length > 0) {
          if (body) body += "\n";
          body += results.added.slice(0, 5).map(pkg => 
            `➕ ${pkg.name}: ${pkg.version}`
          ).join("\n");
          if (results.added.length > 5) {
            body += `\n... 还有 ${results.added.length - 5} 个新增`;
          }
        }
      } else {
        subtitle = `检测完成 (${sourceData.packages.length}个插件)`;
        body = `✨ 所有插件均为最新版本`;
      }
      
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
        "auto-dismiss": 0
      };
      
      if (summaryIcon) {
        summaryOptions["media-url"] = summaryIcon;
      }
      
      $notification.post(title, subtitle, body, summaryOptions);
      console.log(`📬 已发送总结通知: ${title} - ${subtitle}`);
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

