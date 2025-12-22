// 微信点歌自定义脚本 by 夕颜
(async () => {
  try {
    const body = JSON.parse($response.body);
    const res = body.data || {};

    // ==== 外层字段 ====
    const code = body.code || 0;
    const msg = body.msg || "";
    const type = body.type || "";

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

      const uploadApi = `https://api.iosxy.xin/api/txtc.php?url=${encodeURIComponent(imageUrl)}`;
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
    let musicLink = res.music || "";
    console.log("🎵 原始音频链接: " + musicLink);
    switch ($argument.pick_music) {
      case "使用抖音解析音频":
        musicLink = $persistentStore.read("dy_music_url") || musicLink;
        console.log("✅ 使用抖音音频: " + musicLink);
        break;
      case "使用快捷指令音频":
        musicLink = $persistentStore.read("kjzl_music_url") || musicLink;
        console.log("✅ 使用快捷指令音频: " + musicLink);
        break;
      case "使用自定义音频":
        musicLink = $argument.music_url || musicLink;
        console.log("✅ 使用插件音频: " + musicLink);
        break;
      default:
        console.log("✅ 使用原始音频: " + musicLink);
        break;
    }

    // ==== 歌名 ====
    let song = res.song || "";
    switch ($argument.pick_title) {
      case "使用自定义歌曲名":
        song = $argument.title || song;
        console.log("✅ 使用自定义歌名: " + song);
        break;
      case "使用自定义API":
        song = await fetchText($argument.api_title) || song;
        console.log("✅ 使用 API 歌名: " + song);
        break;
      default:
        console.log("✅ 使用原始歌名: " + song);
        break;
    }

    // ==== 歌手 ====
    let singer = res.singer || "";
    switch ($argument.pick_singer) {
      case "使用自定义歌手名":
        singer = $argument.song_singer || singer;
        console.log("✅ 使用自定义歌手: " + singer);
        break;
      case "使用自定义API":
        singer = await fetchText($argument.api_singer) || singer;
        console.log("✅ 使用 API 歌手: " + singer);
        break;
      default:
        console.log("✅ 使用原始歌手: " + singer);
        break;
    }

    // ==== 封面 ====
    let cover = res.cover || "";
    switch ($argument.pick_cover) {
      case "使用自定义封面":
        cover = $argument.cover || cover;
        console.log("✅ 使用自定义封面: " + cover);
        break;
      case "使用自定义API":
        cover = await fetchCoverUrl($argument.api_cover) || cover;
        break;
      default:
        console.log("✅ 使用原始封面: " + cover);
        break;
    }

    // ==== 歌词 ====
    let lyric = res.lyric || "";
    switch ($argument.pick_lyric) {
      case "使用自定义歌词":
        lyric = $argument.lyric || lyric;
        console.log("✅ 使用自定义歌词");
        break;
      case "使用自定义API":
        lyric = await fetchText($argument.api_lyric) || lyric;
        console.log("✅ 使用 API 歌词");
        break;
      default:
        console.log("✅ 使用原始歌词");
        break;
    }

    // ==== 其他字段（来自 data） ====
    const album = res.album_name || "";
    const mid = res.mid || "";
    const mv_vid = res.mv_vid || "";
    const media_mid = res.media_mid || "";
    const album_mid = res.album_mid || "";

const result = {
  code,
  msg,
  type,
  data: {
    song,
    singer,
    music: musicLink,
    cover,
    lyric,
    album,
    mid,
    mv_vid,
    media_mid,
    album_mid
  }
};

    console.log("🎉 最终卡片数据: ");
    console.log(JSON.stringify(result, null, 2));
    $done({ body: JSON.stringify(result) });

  } catch (e) {
    console.log("❌ 处理响应体失败: " + e);
    $done({});
  }
})();