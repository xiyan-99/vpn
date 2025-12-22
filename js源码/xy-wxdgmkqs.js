// 微信mk汽水点歌自定义脚本 by 夕颜
(async () => {
  try {
    const body = JSON.parse($response.body);

    // ==== 工具函数 ====
    const fetchText = async (api) => {
      if (!api) return "";
      console.log("请求文本 API: " + api);
      return new Promise((resolve) => {
        $httpClient.get(api, (err, resp, data) => {
          if (err || !data) {
            console.log("❌ 文本请求失败: " + err);
            return resolve("");
          }
          console.log("✅ 文本 API 返回: " + data.trim());
          resolve(data.trim());
        });
      });
    };

    const fetchCoverUrl = async (api) => {
      if (!api) return "";
      const imageUrl = await fetchText(api);
      if (!imageUrl) return "";

      const uploadApi = `https://api.xiyan.pro/api/txtc.php?url=${encodeURIComponent(imageUrl)}`;
      console.log("请求封面上传接口: " + uploadApi);
      return new Promise((resolve) => {
        $httpClient.get(uploadApi, (err, resp, data) => {
          if (err || !data) {
            console.log("❌ 上传封面失败，使用原始 URL: " + imageUrl);
            return resolve(imageUrl);
          }
          try {
            const json = JSON.parse(data);
            if (json.url) {
              console.log("✅ 上传成功，返回封面 URL: " + json.url);
              return resolve(json.url);
            }
          } catch (e) {
            console.log("❌ 封面 JSON 解析失败: " + e);
          }
          resolve(imageUrl);
        });
      });
    };

    // ==== 音频链接 ====
    switch ($argument.pick_music) {
      case "使用抖音解析音频":
        body.music = $persistentStore.read("dy_music_url") || body.music;
        console.log("✅ 使用抖音音频: " + body.music);
        break;
      case "使用快捷指令音频":
        body.music = $persistentStore.read("kjzl_music_url") || body.music;
        console.log("✅ 使用快捷指令音频: " + body.music);
        break;
      case "使用自定义音频":
        body.music = $argument.music_url || body.music;
        console.log("✅ 使用自定义音频: " + body.music);
        break;
      default:
        console.log("✅ 使用原始音频: " + body.music);
        break;
    }

    // ==== 歌名 ====
    switch ($argument.pick_title) {
      case "使用自定义歌曲名":
        body.title = $argument.title || body.title;
        console.log("✅ 使用自定义歌名: " + body.title);
        break;
      case "使用自定义API":
        body.title = await fetchText($argument.api_title) || body.title;
        console.log("✅ 使用 API 歌名: " + body.title);
        break;
      default:
        console.log("✅ 使用原始歌名: " + body.title);
        break;
    }

    // ==== 歌手 ====
    switch ($argument.pick_singer) {
      case "使用自定义歌手名":
        body.singer = $argument.song_singer || body.singer;
        console.log("✅ 使用自定义歌手: " + body.singer);
        break;
      case "使用自定义API":
        body.singer = await fetchText($argument.api_singer) || body.singer;
        console.log("✅ 使用 API 歌手: " + body.singer);
        break;
      default:
        console.log("✅ 使用原始歌手: " + body.singer);
        break;
    }

    // ==== 封面 ====
    switch ($argument.pick_cover) {
      case "使用自定义封面":
        body.cover = $argument.cover || body.cover;
        console.log("✅ 使用自定义封面: " + body.cover);
        break;
      case "使用自定义API":
        body.cover = await fetchCoverUrl($argument.api_cover) || body.cover;
        break;
      default:
        console.log("✅ 使用原始封面: " + body.cover);
        break;
    }

    // ==== 歌词 ====
    switch ($argument.pick_lyric) {
      case "使用自定义歌词":
        body.lrc = $argument.lyric || body.lrc;
        console.log("✅ 使用自定义歌词");
        break;
      case "使用自定义API":
        body.lrc = await fetchText($argument.api_lyric) || body.lrc;
        console.log("✅ 使用 API 歌词");
        break;
      default:
        console.log("✅ 使用原始歌词");
        break;
    }

    // ==== 返回原始结构 ====
    console.log("🎉 最终卡片数据（原始字段结构）:");
    console.log(JSON.stringify(body, null, 2));
    $done({ body: JSON.stringify(body) });

  } catch (e) {
    console.log("❌ 处理响应体失败: " + e);
    $done({});
  }
})();