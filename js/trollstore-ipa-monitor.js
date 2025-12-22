// 名称: 巨魔IPA软件源监控
// 描述: 监控巨魔IPA软件源的应用更新
// 版本: 1.0

// 从参数获取源URL
function getSourceUrlFromArgs() {
  const args = $argument || "";
  const urlMatch = args.match(/SOURCEURL="?([^"&]*)"?/);
  
  if (!urlMatch || !urlMatch[1] || urlMatch[1].trim() === '') {
    console.log('⚠️ 未配置源地址，使用默认地址');
    return "https://ipa.iosxy.xin/appstore";
  }
  
  const url = urlMatch[1].trim();
  
  // 如果填写了 #，表示禁用此监控
  if (url === '#') {
    console.log('⚠️ 巨魔IPA源监控已禁用（参数为 #）');
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
      console.log(`✅ 成功获取源数据，应用数: ${data.apps?.length || 0}`);
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
        content: "巨魔IPA源监控已禁用\n\n如需启用，请在模块参数中配置 SOURCEURL\n或在统一模块中将 TROLLIPA_URL 改为源地址",
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
    
    if (!sourceData.apps || sourceData.apps.length === 0) {
      throw new Error('源数据为空或格式错误');
    }
    
    // 读取历史数据
    const storageKey = 'trollstore_ipa_versions';
    const savedDataStr = $persistentStore.read(storageKey);
    
    let hasUpdate = false;
    const results = {
      updated: [],
      current: [],
      added: []
    };
    
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
    
    // 处理每个应用
    for (const app of sourceData.apps) {
      if (!app.name || !app.version) continue;
      
      newVersions[app.name] = {
        version: app.version,
        versionDate: app.versionDate,
        iconURL: app.iconURL,
        downloadURL: app.downloadURL
      };
      
      if (isFirstRun) {
        results.current.push(app);
      } else {
        const savedVersion = savedVersions[app.name];
        
        if (!savedVersion) {
          // 新增应用
          results.added.push(app);
          hasUpdate = true;
        } else if (compareVersion(app.version, savedVersion.version) > 0) {
          // 版本更新
          results.updated.push({
            ...app,
            oldVersion: savedVersion.version
          });
          hasUpdate = true;
        } else {
          results.current.push(app);
        }
      }
    }
    
    // 保存当前版本
    $persistentStore.write(JSON.stringify(newVersions), storageKey);
    
    // 发送单独通知
    const notificationPromises = [];
    let sentNotifications = 0;
    const maxIndividualNotifications = getMaxNotifyFromArgs();
    
    // 为更新的应用发送通知
    for (const app of results.updated) {
      if (sentNotifications >= maxIndividualNotifications) break;
      
      const title = `巨魔IPA源监控 - ${app.name} 已更新`;
      const body = `旧版本: ${app.oldVersion}\n新版本: ${app.version}\n\n更新时间: ${app.versionDate || '未知'}\n\n点击安装更新`;
      
      // 构建 TrollStore 安装链接
      let installUrl = sourceUrl;
      if (app.downloadURL) {
        installUrl = `apple-magnifier://install?url=${encodeURIComponent(app.downloadURL)}`;
      }
      
      const notifyOptions = {
        sound: true,
        action: "open-url",
        url: installUrl
      };
      
      if (app.iconURL) {
        notifyOptions["media-url"] = app.iconURL;
      }
      
      $notification.post(title, "", body, notifyOptions);
      console.log(`📬 已发送更新通知: ${app.name} (${app.oldVersion} → ${app.version})`);
      
      sentNotifications++;
      notificationPromises.push(new Promise(resolve => setTimeout(resolve, 500)));
    }
    
    // 为新增的应用发送通知
    for (const app of results.added) {
      if (sentNotifications >= maxIndividualNotifications) break;
      
      const title = `巨魔IPA源监控 - ${app.name} 新应用上架`;
      const body = `版本: ${app.version}\n\n上架时间: ${app.versionDate || '未知'}\n\n点击立即安装`;
      
      // 构建 TrollStore 安装链接
      let installUrl = sourceUrl;
      if (app.downloadURL) {
        installUrl = `apple-magnifier://install?url=${encodeURIComponent(app.downloadURL)}`;
      }
      
      const notifyOptions = {
        sound: true,
        action: "open-url",
        url: installUrl
      };
      
      if (app.iconURL) {
        notifyOptions["media-url"] = app.iconURL;
      }
      
      $notification.post(title, "", body, notifyOptions);
      console.log(`📬 已发送新增通知: ${app.name} (${app.version})`);
      
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
    let panelTitle = "📱 巨魔IPA源监控";
    let panelContent = "";
    let panelStyle = "info";
    
    if (isFirstRun) {
      panelStyle = "good";
      panelTitle = `✅ 已记录 ${sourceData.apps.length} 个应用`;
      panelContent = `📦 源名称: ${sourceData.name}\n📊 应用总数: ${sourceData.apps.length}\n\n`;
      panelContent += results.current.slice(0, 10).map(app => 
        `📱 ${app.name}: ${app.version}`
      ).join("\n");
      if (sourceData.apps.length > 10) {
        panelContent += `\n... 还有 ${sourceData.apps.length - 10} 个应用`;
      }
    } else if (hasUpdate) {
      panelStyle = "alert";
      const totalChanges = results.updated.length + results.added.length;
      panelTitle = `🆕 发现 ${totalChanges} 个更新`;
      
      if (results.updated.length > 0) {
        panelContent += `⬆️ 应用更新 (${results.updated.length}个):\n`;
        panelContent += results.updated.slice(0, 5).map(app => 
          `${app.name}: ${app.oldVersion} → ${app.version}`
        ).join("\n");
        if (results.updated.length > 5) {
          panelContent += `\n... 还有 ${results.updated.length - 5} 个`;
        }
      }
      
      if (results.added.length > 0) {
        if (panelContent) panelContent += "\n\n";
        panelContent += `➕ 新增应用 (${results.added.length}个):\n`;
        panelContent += results.added.slice(0, 5).map(app => 
          `${app.name}: ${app.version}`
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
      panelContent = `📦 应用总数: ${sourceData.apps.length}\n✨ 所有应用均为最新版本`;
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
        title = `巨魔IPA源监控 - 监控已启动`;
        body = `📦 源名称: ${sourceData.name}\n📊 已记录 ${sourceData.apps.length} 个应用\n🔔 将自动监控源的变更`;
      } else if (hasUpdate) {
        const totalChanges = results.updated.length + results.added.length;
        title = `巨魔IPA源监控 - 更新总结 (${totalChanges}个变更)`;
        
        if (results.updated.length > 0) {
          body += `⬆️ 应用更新 (${results.updated.length}个):\n`;
          body += results.updated.slice(0, 5).map(app => 
            `${app.name}: ${app.oldVersion} → ${app.version}`
          ).join("\n");
          if (results.updated.length > 5) {
            body += `\n... 还有 ${results.updated.length - 5} 个`;
          }
        }
        
        if (results.added.length > 0) {
          if (body) body += "\n\n";
          body += `➕ 新增应用 (${results.added.length}个):\n`;
          body += results.added.slice(0, 5).map(app => 
            `${app.name}: ${app.version}`
          ).join("\n");
          if (results.added.length > 5) {
            body += `\n... 还有 ${results.added.length - 5} 个`;
          }
        }
        
        if (results.current.length > 0) {
          body += `\n\n✅ 无更新: ${results.current.length} 个应用`;
        }
      } else {
        title = `巨魔IPA源监控 - 检测完成`;
        body = `📦 应用总数: ${sourceData.apps.length}\n✨ 所有应用均为最新版本`;
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
      
      if (results.updated.length > 0) {
        const firstUpdated = results.updated[0];
        if (firstUpdated.iconURL) {
          summaryIcon = firstUpdated.iconURL;
        }
        // 构建 TrollStore 安装链接
        if (firstUpdated.downloadURL) {
          url = `apple-magnifier://install?url=${encodeURIComponent(firstUpdated.downloadURL)}`;
        }
      } else if (results.added.length > 0) {
        const firstAdded = results.added[0];
        if (firstAdded.iconURL) {
          summaryIcon = firstAdded.iconURL;
        }
        // 构建 TrollStore 安装链接
        if (firstAdded.downloadURL) {
          url = `apple-magnifier://install?url=${encodeURIComponent(firstAdded.downloadURL)}`;
        }
      } else if (results.current.length > 0 && results.current[0].iconURL) {
        summaryIcon = results.current[0].iconURL;
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

