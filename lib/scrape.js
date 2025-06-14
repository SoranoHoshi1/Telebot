
import fetch from 'node-fetch';

export async function ytSearch(query, options = {}) {
  return await youtubeSearch(query, options);
}

export async function youtubeSearch(query, options = {}) {
  try {
    const { limit = 10 } = options;
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    const results = [];
    
    const videoRegex = /"videoId":"([^"]+)"/g;
    const titleRegex = /"title":{"runs":\[{"text":"([^"]+)"/g;
    
    let videoMatch, titleMatch;
    let count = 0;
    
    while ((videoMatch = videoRegex.exec(html)) && (titleMatch = titleRegex.exec(html)) && count < limit) {
      results.push({
        title: titleMatch[1],
        url: `https://www.youtube.com/watch?v=${videoMatch[1]}`,
        videoId: videoMatch[1],
        thumbnail: `https://img.youtube.com/vi/${videoMatch[1]}/maxresdefault.jpg`
      });
      count++;
    }
    
    return results;
  } catch (error) {
    return {
      error: true,
      message: error.message
    };
  }
}

export async function instagramDownload(url) {
  try {
    return {
      error: true,
      message: 'Instagram downloader sedang dalam pengembangan'
    };
  } catch (error) {
    return {
      error: true,
      message: error.message
    };
  }
}

export async function tiktokDownload(url) {
  try {
    return {
      error: true,
      message: 'TikTok downloader sedang dalam pengembangan'
    };
  } catch (error) {
    return {
      error: true,
      message: error.message
    };
  }
}
