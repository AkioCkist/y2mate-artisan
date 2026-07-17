// ─── i18n — Vietnamese / English ───
// Load as <script src="i18n.js"></script> before renderer.js

const LANG_STORAGE_KEY = 'yt_dlp_lang';

const dict = {
  vi: {
    header: { title: 'YT-DLP Downloader', subtitle: 'Trình tải đa phương tiện sử dụng yt-dlp' },
    input: { placeholder: 'Dán link YouTube (hoặc web khác) vào đây...' },
    btn: {
      analyze: 'Phân tích',
      analyzing: 'Đang phân tích...',
      download: 'Tải xuống ngay',
      cancel: 'Hủy tải',
      browse: 'Chọn thư mục',
      selectAll: 'Chọn tất cả',
      deselectAll: 'Bỏ chọn tất cả',
      clearHistory: 'Xóa tất cả',
      toggleLog: 'Chi tiết tiến trình (Terminal Log)',
      openFile: 'Phát tệp tin',
      copyFile: 'Sao chép tệp tin',
      openFolder: 'Mở thư mục lưu',
      deleteHistory: 'Xóa lịch sử',
      update: 'Cập nhật',
      settings: 'Cài đặt',
      close: 'Đóng',
    },
    preview: {
      configTitle: 'Cấu hình tải xuống',
      formatLabel: 'Định dạng tệp',
      video: 'Video (MP4)',
      audio: 'Audio (Nhạc)',
      qualityLabel: 'Chất lượng / Định dạng',
      destLabel: 'Nơi lưu tệp',
      noDest: 'Chưa chọn thư mục...',
      noDestSettings: 'Chưa chọn thư mục. Vui lòng bấm chọn...',
      optionsLabel: 'Tùy chọn bổ sung',
      embedMetadata: 'Nhúng Metadata đầy đủ (Tên, Tác giả...)',
      embedThumbnail: 'Nhúng ảnh Thumbnail vào file',
      tracks: 'bài',
      playlist: 'Danh sách phát',
      untitled: 'Bài hát không tên',
      unknownTitle: 'Unknown Title',
      unknownChannel: 'Unknown Channel',
    },
    quality: {
      best: 'Chất lượng tốt nhất (Best Quality)',
      fhd: '1080p Full HD (MP4)',
      hd: '720p HD (MP4)',
      sd: '480p SD (MP4)',
      mp3_320: 'MP3 320 kbps (High Quality)',
      mp3_192: 'MP3 192 kbps (Standard)',
      wav: 'WAV (Lossless Audio)',
      m4a: 'M4A (AAC Audio)',
    },
    playlist: {
      empty: 'Không có bài hát nào trong playlist này.',
      header: 'Danh sách bài hát',
    },
    progress: {
      connecting: 'Tốc độ: Đang kết nối...',
      speed: 'Tốc độ',
      eta: 'Còn lại',
      size: 'Dung lượng',
      downloading: 'Đang tải',
      downloadingPlaylist: 'Đang tải playlist',
      mb: '-- MB',
    },
    log: {
      start: 'Bắt đầu tải',
      startPlaylist: 'Bắt đầu tải playlist',
      format: 'Định dạng',
      quality: 'Chất lượng chọn',
      dest: 'Thư mục lưu',
      success: 'Tải xuống hoàn tất thành công!',
      filesFound: 'Tìm thấy tệp tin',
      noFiles: 'Cảnh báo: Không phát hiện được đường dẫn tệp tin trong nhật ký.',
      cancelling: 'Đang hủy tiến trình tải...',
      cancelled: 'Đã hủy tải xuống bởi người dùng.',
      error_prefix: 'Lỗi',
      cancel_error: 'Lỗi khi hủy',
      video: 'video',
      playlist: 'playlist',
      video_mp4: 'Video (MP4)',
      audio_mp3: 'Audio (Nhạc)',
    },
    history: {
      title: 'Lịch sử tải xuống',
      empty: 'Chưa có tệp nào được tải xuống gần đây.',
      type_video: 'Video',
      type_audio: 'Audio',
      type_playlist: 'Playlist',
      confirm_delete: 'Bạn có chắc chắn muốn xóa toàn bộ lịch sử tải xuống không?',
      copy_success: 'Đã sao chép!',
      copy_fail: 'Không thể sao chép tệp tin này (tệp tin có thể không tồn tại hoặc đã bị di chuyển).',
      saved_to: 'Lưu vào',
      items: 'bài',
      drag_tooltip: 'Kéo thả để sao chép hoặc di chuyển tệp tin/thư mục này',
    },
    settings: {
      title: 'Cài đặt Hệ thống',
      destLabel: 'Thư mục tải xuống mặc định',
      languageLabel: 'Ngôn ngữ / Language',
      vi: 'Tiếng Việt',
      en: 'English',
    },
    error: {
      emptyUrl: 'Vui lòng nhập đường dẫn video hợp lệ.',
      noInfo: 'Không lấy được thông tin video.',
      analysisFailed: 'Lỗi khi phân tích đường dẫn. Vui lòng kiểm tra lại URL hoặc cài đặt yt-dlp.',
      noDest: 'Vui lòng chọn thư mục lưu tệp trước khi tải xuống.',
      noSelection: 'Vui lòng chọn ít nhất một bài hát để tải xuống.',
      downloadFailed: 'Lỗi tải xuống',
      canceled: 'Đã hủy tải xuống.',
      ytDlpMissing: 'Không tìm thấy yt-dlp trên hệ thống. Hãy đảm bảo bạn đã cài đặt đầy đủ các thư viện.',
    },
    notification: { body: 'Đã tải xong' },
    formatName: {
      best: 'Chất lượng tốt nhất',
      '4320p': '8K',
      '2160p': '4K',
      '1440p': '1440p (2K)',
      '1080p': '1080p Full HD',
      '720p': '720p HD',
      '480p': '480p SD',
      '360p': '360p',
      'mp3-320': 'MP3 320 kbps',
      'mp3-192': 'MP3 192 kbps',
      wav: 'WAV Lossless',
      m4a: 'M4A AAC',
    },
  },

  en: {
    header: { title: 'YT-DLP Downloader', subtitle: 'Media downloader powered by yt-dlp' },
    input: { placeholder: 'Paste YouTube (or other site) link here...' },
    btn: {
      analyze: 'Analyze',
      analyzing: 'Analyzing...',
      download: 'Download Now',
      cancel: 'Cancel',
      browse: 'Choose Folder',
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
      clearHistory: 'Clear All',
      toggleLog: 'Terminal Log',
      openFile: 'Play file',
      copyFile: 'Copy file',
      openFolder: 'Open folder',
      deleteHistory: 'Delete',
      update: 'Update',
      settings: 'Settings',
      close: 'Close',
    },
    preview: {
      configTitle: 'Download Options',
      formatLabel: 'File Format',
      video: 'Video (MP4)',
      audio: 'Audio (Music)',
      qualityLabel: 'Quality / Format',
      destLabel: 'Save Location',
      noDest: 'No folder selected...',
      noDestSettings: 'No folder selected. Please choose one...',
      optionsLabel: 'Extra Options',
      embedMetadata: 'Embed full Metadata (Title, Artist...)',
      embedThumbnail: 'Embed Thumbnail into file',
      tracks: 'tracks',
      playlist: 'Playlist',
      untitled: 'Untitled track',
      unknownTitle: 'Unknown Title',
      unknownChannel: 'Unknown Channel',
    },
    quality: {
      best: 'Best Quality',
      fhd: '1080p Full HD (MP4)',
      hd: '720p HD (MP4)',
      sd: '480p SD (MP4)',
      mp3_320: 'MP3 320 kbps (High Quality)',
      mp3_192: 'MP3 192 kbps (Standard)',
      wav: 'WAV (Lossless Audio)',
      m4a: 'M4A (AAC Audio)',
    },
    playlist: {
      empty: 'No tracks in this playlist.',
      header: 'Track List',
    },
    progress: {
      connecting: 'Speed: Connecting...',
      speed: 'Speed',
      eta: 'ETA',
      size: 'Size',
      downloading: 'Downloading',
      downloadingPlaylist: 'Downloading playlist',
      mb: '-- MB',
    },
    log: {
      start: 'Started downloading',
      startPlaylist: 'Started downloading playlist',
      format: 'Format',
      quality: 'Selected quality',
      dest: 'Save directory',
      success: 'Download completed successfully!',
      filesFound: 'Files found',
      noFiles: 'Warning: Could not detect file paths in logs.',
      cancelling: 'Cancelling download...',
      cancelled: 'Download cancelled by user.',
      error_prefix: 'Error',
      cancel_error: 'Cancel error',
      video: 'video',
      playlist: 'playlist',
      video_mp4: 'Video (MP4)',
      audio_mp3: 'Audio (Music)',
    },
    history: {
      title: 'Download History',
      empty: 'No downloads yet.',
      type_video: 'Video',
      type_audio: 'Audio',
      type_playlist: 'Playlist',
      confirm_delete: 'Are you sure you want to clear all download history?',
      copy_success: 'Copied!',
      copy_fail: 'Cannot copy this file (file may not exist or was moved).',
      saved_to: 'Saved in',
      items: 'items',
      drag_tooltip: 'Drag to copy or move this file/folder',
    },
    settings: {
      title: 'System Settings',
      destLabel: 'Default Download Directory',
      languageLabel: 'Ngôn ngữ / Language',
      vi: 'Tiếng Việt',
      en: 'English',
    },
    error: {
      emptyUrl: 'Please enter a valid video URL.',
      noInfo: 'Could not fetch video information.',
      analysisFailed: 'Error analyzing URL. Please check your link or yt-dlp installation.',
      noDest: 'Please select a save directory before downloading.',
      noSelection: 'Please select at least one track to download.',
      downloadFailed: 'Download error',
      canceled: 'Download cancelled.',
      ytDlpMissing: 'yt-dlp not found on system. Make sure all libraries are installed.',
    },
    notification: { body: 'Download completed' },
    formatName: {
      best: 'Best Quality',
      '4320p': '8K',
      '2160p': '4K',
      '1440p': '1440p (2K)',
      '1080p': '1080p Full HD',
      '720p': '720p HD',
      '480p': '480p SD',
      '360p': '360p',
      'mp3-320': 'MP3 320 kbps',
      'mp3-192': 'MP3 192 kbps',
      wav: 'WAV Lossless',
      m4a: 'M4A AAC',
    },
  },
};

// ─── Globals ───
window.__lang = localStorage.getItem(LANG_STORAGE_KEY) || 'vi';
if (!dict[window.__lang]) window.__lang = 'vi';

function t(keyPath) {
  const keys = keyPath.split('.');
  let val = dict[window.__lang];
  for (const k of keys) {
    if (val == null) return keyPath;
    val = val[k];
  }
  return val != null ? val : keyPath;
}

function setLanguage(lang) {
  if (!dict[lang]) return;
  window.__lang = lang;
  localStorage.setItem(LANG_STORAGE_KEY, lang);
}

function getLanguage() { return window.__lang; }

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translated = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      if (el.getAttribute('data-i18n-type') === 'placeholder') {
        el.placeholder = translated;
      } else {
        el.value = translated;
      }
    } else {
      el.textContent = translated;
    }
  });
  const langSelect = document.getElementById('select-language');
  if (langSelect) langSelect.value = window.__lang;
}
