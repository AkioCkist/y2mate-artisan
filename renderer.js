console.log("Renderer script loaded.");
// DOM Elements
const urlInput = document.getElementById('video-url');
const btnAnalyze = document.getElementById('btn-analyze');
const btnAnalyzeText = btnAnalyze.querySelector('.btn-text');
const spinner = btnAnalyze.querySelector('.spinner');
const errorMessage = document.getElementById('error-message');

const previewSection = document.getElementById('preview-section');
const videoThumbnail = document.getElementById('video-thumbnail');
const videoDuration = document.getElementById('video-duration');
const videoTitle = document.getElementById('video-title');
const videoUploader = document.getElementById('video-uploader');

const typeVideo = document.getElementById('type-video');
const typeAudio = document.getElementById('type-audio');
const selectQuality = document.getElementById('select-quality');
const destPathDisplay = document.getElementById('dest-path-display');
const btnBrowse = document.getElementById('btn-browse');
const btnDownload = document.getElementById('btn-download');

const progressSection = document.getElementById('progress-section');
const downloadingTitle = document.getElementById('downloading-title');
const statSpeed = document.getElementById('stat-speed');
const statEta = document.getElementById('stat-eta');
const statSize = document.getElementById('stat-size');
const progressFill = document.getElementById('progress-fill');
const progressPercent = document.getElementById('progress-percent');
const btnCancel = document.getElementById('btn-cancel');

const btnToggleLog = document.getElementById('btn-toggle-log');
const logArrow = document.getElementById('log-arrow');
const logConsole = document.getElementById('log-console');

const historyList = document.getElementById('history-list');
const btnClearHistory = document.getElementById('btn-clear-history');

const playlistEntriesWrapper = document.getElementById('playlist-entries-wrapper');
const playlistEntriesList = document.getElementById('playlist-entries-list');
const btnSelectAll = document.getElementById('btn-select-all');
const btnDeselectAll = document.getElementById('btn-deselect-all');

// Settings DOM Elements
const settingsOverlay = document.getElementById('settings-overlay');
const btnOpenSettings = document.getElementById('btn-open-settings');
const btnCloseSettings = document.getElementById('btn-close-settings');
const btnSettingsBrowse = document.getElementById('btn-settings-browse');
const settingsDestPathDisplay = document.getElementById('settings-dest-path-display');


// App State
let currentVideoInfo = null;
let currentDownloadId = null;
let currentDestPath = localStorage.getItem('yt_dlp_dest_path') || '';
let history = JSON.parse(localStorage.getItem('yt_dlp_history') || '[]');
let currentPlaylistIndex = 0;
let totalPlaylistItems = 0;

// Default qualities — translated via i18n
function getVideoQualities() {
  return [
    { name: t('quality.best'), value: 'best' },
    { name: t('quality.fhd'), value: '1080p' },
    { name: t('quality.hd'), value: '720p' },
    { name: t('quality.sd'), value: '480p' }
  ];
}

function getAudioQualities() {
  return [
    { name: t('quality.mp3_320'), value: 'mp3-320' },
    { name: t('quality.mp3_192'), value: 'mp3-192' },
    { name: t('quality.wav'), value: 'wav' },
    { name: t('quality.m4a'), value: 'm4a' }
  ];
}

// Extract unique video resolutions from formats array
function getUniqueResolutions(formats) {
  if (!formats || !Array.isArray(formats)) return [];
  const heights = new Set();
  formats.forEach(f => {
    // Skip audio-only / no-video formats
    if (!f.vcodec || f.vcodec === 'none' || !f.resolution) return;
    // Parse height from resolution like "1920x1080"
    const match = f.resolution.match(/x(\d+)/);
    if (!match) return;
    const h = parseInt(match[1], 10);
    if (h > 0) heights.add(h);
  });
  return Array.from(heights).sort((a, b) => b - a);
}

// Friendly display name for resolution height
function resolutionLabel(height) {
  const labels = {
    4320: '8K',
    2160: '4K',
    1440: '1440p (2K)',
    1080: '1080p Full HD',
    720: '720p HD',
    480: '480p SD',
    360: '360p',
  };
  return labels[height] || `${height}p`;
}






// Initialize
async function init() {
  console.log("init() started.");

  // Restore destination path or set default Downloads folder
  if (!currentDestPath) {
    try {
      currentDestPath = await window.api.getDownloadsPath();
      localStorage.setItem('yt_dlp_dest_path', currentDestPath);
    } catch (err) {
      console.error('Failed to get system downloads path:', err);
    }
  }

  if (currentDestPath) {
    destPathDisplay.textContent = currentDestPath;
    destPathDisplay.title = currentDestPath;
    if (settingsDestPathDisplay) {
      settingsDestPathDisplay.textContent = currentDestPath;
      settingsDestPathDisplay.title = currentDestPath;
    }
  } else {
    destPathDisplay.textContent = t('preview.noDest');
  }

  // Apply i18n translations to static elements
  applyI18n();

  // Populate qualities for default selection (video)
  populateQualities('video');
  renderHistory();

  // Setup Event Listeners
  btnAnalyze.addEventListener('click', analyzeUrl);
  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') analyzeUrl();
  });

  typeVideo.addEventListener('change', () => {
    if (currentVideoInfo && !currentVideoInfo.isPlaylist && currentVideoInfo.formats) {
      populateQualities('video', currentVideoInfo.formats);
    } else {
      populateQualities('video');
    }
  });
  typeAudio.addEventListener('change', () => populateQualities('audio'));

  btnBrowse.addEventListener('click', selectDestDirectory);
  btnDownload.addEventListener('click', startDownload);
  btnCancel.addEventListener('click', cancelActiveDownload);

  btnToggleLog.addEventListener('click', toggleConsoleLog);
  btnClearHistory.addEventListener('click', clearAllHistory);

  btnSelectAll.addEventListener('click', () => toggleAllEntries(true));
  btnDeselectAll.addEventListener('click', () => toggleAllEntries(false));

  // Settings Event Listeners
  if (btnOpenSettings) btnOpenSettings.addEventListener('click', openSettingsModal);
  if (btnCloseSettings) btnCloseSettings.addEventListener('click', closeSettingsModal);
  if (btnSettingsBrowse) btnSettingsBrowse.addEventListener('click', selectSettingsDestDirectory);

  // Language change handler
  const langSelect = document.getElementById('select-language');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      setLanguage(e.target.value);
      applyI18n();
      if (typeVideo.checked && currentVideoInfo && !currentVideoInfo.isPlaylist && currentVideoInfo.formats) {
        populateQualities('video', currentVideoInfo.formats);
      } else {
        populateQualities(typeVideo.checked ? 'video' : 'audio');
      }
      renderHistory();
      if (currentDestPath) {
        destPathDisplay.textContent = currentDestPath;
        if (settingsDestPathDisplay) settingsDestPathDisplay.textContent = currentDestPath;
      } else {
        destPathDisplay.textContent = t('preview.noDest');
      }
    });
  }

  // Setup IPC Subscriptions
  window.api.onDownloadProgress((data) => {
    if (data.id !== currentDownloadId) return;

    progressFill.style.width = `${data.percent}%`;
    progressPercent.textContent = `${Math.round(data.percent)}%`;
    statSpeed.textContent = `${t('progress.speed')}: ${data.speed}`;
    statEta.textContent = `${t('progress.eta')}: ${data.eta}`;
    statSize.textContent = `${t('progress.size')}: ${data.totalSize}`;

    if (data.logLine) {
      appendLog(data.logLine);
    }
  });

  window.api.onDownloadLog((data) => {
    if (data.id !== currentDownloadId) return;
    if (data.logLine) {
      appendLog(data.logLine);
    }
  });

  window.api.onDownloadItemChange((data) => {
    if (data.id !== currentDownloadId) return;
    currentPlaylistIndex = data.currentItem;
    totalPlaylistItems = data.totalItems;
    downloadingTitle.textContent = `${t('progress.downloading')} (${currentPlaylistIndex}/${totalPlaylistItems}): ${currentVideoInfo.title}`;
  });
}

// Populate quality choices
// For video: dynamic resolutions from formats; for audio: static presets
function populateQualities(type, formats) {
  selectQuality.innerHTML = '';
  let qualities;
  if (type === 'video') {
    const resolutions = formats ? getUniqueResolutions(formats) : [];
    if (resolutions.length > 0) {
      // Add "Best Quality" first, then all available resolutions
      qualities = [{ name: t('quality.best'), value: 'best' }];
      resolutions.forEach(h => {
        qualities.push({ name: resolutionLabel(h), value: `${h}p` });
      });
    } else {
      qualities = getVideoQualities();
    }
  } else {
    qualities = getAudioQualities();
  }
  qualities.forEach(q => {
    const opt = document.createElement('option');
    opt.value = q.value;
    opt.textContent = q.name;
    selectQuality.appendChild(opt);
  });
}

// Render playlist items checklist
function renderPlaylistEntries(entries) {
  playlistEntriesList.innerHTML = '';
  if (!entries || entries.length === 0) {
    playlistEntriesList.innerHTML = `<div class="empty-history">${t('playlist.empty')}</div>`;
    return;
  }
  
  entries.forEach((entry, idx) => {
    const itemEl = document.createElement('div');
    itemEl.className = 'playlist-entry-item';
    
    const durationText = entry.duration ? formatDuration(entry.duration) : '--:--';
    
    const thumbHtml = entry.thumbnail 
      ? `<img src="${entry.thumbnail}" class="playlist-entry-thumb" alt="Thumb" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
      : '';
      
    const placeholderHtml = `<div class="playlist-entry-thumb-placeholder" style="${entry.thumbnail ? 'display: none;' : ''}">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18V5l12-2v13"></path>
          <circle cx="6" cy="18" r="3"></circle>
          <circle cx="18" cy="16" r="3"></circle>
        </svg>
       </div>`;

    itemEl.innerHTML = `
      <input type="checkbox" class="playlist-entry-checkbox" data-index="${idx}" checked>
      <span class="playlist-entry-index">${idx + 1}</span>
      <div class="playlist-entry-thumb-wrapper" style="position: relative; width: 48px; height: 27px; flex-shrink: 0;">
        ${thumbHtml}
        ${placeholderHtml}
      </div>
      <span class="playlist-entry-title" title="${entry.title}">${entry.title}</span>
      <span class="playlist-entry-duration">${durationText}</span>
    `;
    playlistEntriesList.appendChild(itemEl);
  });
}

// Toggle checkboxes helper
function toggleAllEntries(checked) {
  const checkboxes = playlistEntriesList.querySelectorAll('.playlist-entry-checkbox');
  checkboxes.forEach(cb => cb.checked = checked);
}

// Convert seconds to format HH:MM:SS
function formatDuration(seconds) {
  if (!seconds) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Helper: Show/Hide Error
function showError(msg) {
  if (msg) {
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
  } else {
    errorMessage.classList.add('hidden');
    errorMessage.textContent = '';
  }
}

// IPC call to get video information
async function analyzeUrl() {
  const url = urlInput.value.trim();
  if (!url) {
    showError(t('error.emptyUrl'));
    return;
  }

  showError(null);
  btnAnalyze.disabled = true;
  btnAnalyzeText.textContent = t('btn.analyzing');
  spinner.classList.remove('hidden');
  previewSection.classList.add('hidden');

  try {
    const result = await window.api.getVideoInfo(url);
    if (result.success) {
      currentVideoInfo = {
        ...result.info,
        isPlaylist: result.isPlaylist || false
      };
      
      // Update UI
      videoThumbnail.src = currentVideoInfo.thumbnail || '';
      if (currentVideoInfo.isPlaylist) {
        videoDuration.textContent = `${currentVideoInfo.entriesCount} ${t('preview.tracks')}`;
        videoTitle.textContent = `[${t('preview.playlist')}] ${currentVideoInfo.title || ''}`;

        // Render playlist tracks
        renderPlaylistEntries(currentVideoInfo.entries);
        playlistEntriesWrapper.classList.remove('hidden');
        // Playlist: use static video qualities (no per-video format data)
        populateQualities('video', null);
      } else {
        videoDuration.textContent = formatDuration(currentVideoInfo.duration);
        videoTitle.textContent = currentVideoInfo.title || t('preview.unknownTitle');
        playlistEntriesWrapper.classList.add('hidden');
        playlistEntriesList.innerHTML = '';
        // Single video: populate qualities from actual available resolutions
        const currentType = typeVideo.checked ? 'video' : 'audio';
        if (currentType === 'video') {
          populateQualities('video', currentVideoInfo.formats);
        } else {
          populateQualities('audio');
        }
      }
      videoUploader.textContent = currentVideoInfo.uploader || t('preview.unknownChannel');

      previewSection.classList.remove('hidden');
    } else {
      showError(t('error.noInfo'));
    }
  } catch (error) {
    console.error(error);
    showError(error.message || t('error.analysisFailed'));
  } finally {
    btnAnalyze.disabled = false;
    btnAnalyzeText.textContent = t('btn.analyze');
    spinner.classList.add('hidden');
  }
}

// Select Destination Folder dialog
async function selectDestDirectory() {
  try {
    const path = await window.api.selectDirectory();
    if (path) {
      currentDestPath = path;
      localStorage.setItem('yt_dlp_dest_path', path);
      if (destPathDisplay) {
        destPathDisplay.textContent = path;
        destPathDisplay.title = path;
      }
      if (settingsDestPathDisplay) {
        settingsDestPathDisplay.textContent = path;
        settingsDestPathDisplay.title = path;
      }
      showError(null);
    }
  } catch (err) {
    console.error(err);
  }
}

// Start Download process
async function startDownload() {
  if (!currentVideoInfo) return;

  if (!currentDestPath) {
    showError(t('error.noDest'));
    btnBrowse.focus();
    return;
  }

  showError(null);
  const formatType = typeVideo.checked ? 'video' : 'audio';
  const quality = selectQuality.value;
  const url = currentVideoInfo.webpage_url;

  let playlistItemsArg = null;
  let selectedCount = 0;

  if (currentVideoInfo.isPlaylist) {
    const checkboxes = playlistEntriesList.querySelectorAll('.playlist-entry-checkbox:checked');
    if (checkboxes.length === 0) {
      showError(t('error.noSelection'));
      return;
    }
    
    const selectedIndices = Array.from(checkboxes).map(cb => {
      const idx = parseInt(cb.getAttribute('data-index'), 10);
      return idx + 1; // 1-based index for yt-dlp
    });
    
    selectedCount = selectedIndices.length;
    playlistItemsArg = selectedIndices.join(',');
  }

  currentDownloadId = Date.now().toString();
  currentPlaylistIndex = 0;
  totalPlaylistItems = 0;

  // Update Progress UI
  downloadingTitle.textContent = (currentVideoInfo.isPlaylist ? t('progress.downloadingPlaylist') : t('progress.downloading')) + ': ' + currentVideoInfo.title;
  progressFill.style.width = '0%';
  progressPercent.textContent = '0%';
  statSpeed.textContent = t('progress.connecting');
  statEta.textContent = `${t('progress.eta')}: --:--`;
  statSize.textContent = `${t('progress.size')}: ${t('progress.mb')}`;
  logConsole.innerHTML = '';
  
  progressSection.classList.remove('hidden');
  previewSection.classList.add('hidden');
  btnAnalyze.disabled = true;

  const mediaType = currentVideoInfo.isPlaylist ? t('log.playlist') : t('log.video');
  appendLog(`[${t('log.start')}] ${mediaType}: ${currentVideoInfo.title}`);
  appendLog(`[${t('log.format')}] ${formatType === 'video' ? t('log.video_mp4') : t('log.audio_mp3')}`);
  appendLog(`[${t('log.quality')}] ${quality}`);
  appendLog(`[${t('log.dest')}] ${currentDestPath}`);

  try {
    const embedMetadata = document.getElementById('chk-embed-metadata')?.checked || false;
    const embedThumbnail = document.getElementById('chk-embed-thumbnail')?.checked || false;

    const result = await window.api.downloadVideo({
      id: currentDownloadId,
      url,
      formatType,
      quality,
      destDir: currentDestPath,
      isPlaylist: currentVideoInfo.isPlaylist || false,
      playlistTitle: currentVideoInfo.title,
      playlistItems: playlistItemsArg,
      embedMetadata,
      embedThumbnail
    });

    if (result.success) {
      appendLog(`[${t('log.success')}]`);
      if (result.files && result.files.length > 0) {
        appendLog(`[${t('log.filesFound')}] ${result.files.join(', ')}`);
      } else {
        appendLog(`[${t('log.noFiles')}]`);
      }
      
      // Save item to history
      const historyItem = {
        id: currentDownloadId,
        title: currentVideoInfo.title,
        type: formatType,
        isPlaylist: currentVideoInfo.isPlaylist || false,
        entriesCount: currentVideoInfo.isPlaylist ? selectedCount : 0,
        quality: selectQuality.options[selectQuality.selectedIndex].text,
        destDir: result.destDir || currentDestPath,
        filePath: result.files && result.files.length > 0 ? result.files[result.files.length - 1] : null,
        date: new Date().toLocaleString('vi-VN')
      };
      
      history.unshift(historyItem);
      localStorage.setItem('yt_dlp_history', JSON.stringify(history));
      renderHistory();

      // Show notification/alert
      new Notification('YT-DLP Downloader', {
        body: `${t('notification.body')}: ${currentVideoInfo.title}`
      });

      // Clear URL and reset UI after a delay
      setTimeout(() => {
        progressSection.classList.add('hidden');
        urlInput.value = '';
        currentVideoInfo = null;
        btnAnalyze.disabled = false;
      }, 1500);

    }
  } catch (error) {
    appendLog(`[${t('log.error_prefix')}] ${error.message}`);
    showError(`${t('error.downloadFailed')}: ${error.message}`);
    progressSection.classList.add('hidden');
    previewSection.classList.remove('hidden');
    btnAnalyze.disabled = false;
  }
}

// Cancel current download
async function cancelActiveDownload() {
  if (!currentDownloadId) return;

    appendLog(`[${t('log.cancelling')}]`);
  try {
    const canceled = await window.api.cancelDownload(currentDownloadId);
    if (canceled) {
      appendLog(`[${t('log.cancelled')}]`);
      showError(t('error.canceled'));
      
      setTimeout(() => {
        progressSection.classList.add('hidden');
        previewSection.classList.remove('hidden');
        btnAnalyze.disabled = false;
      }, 1000);
    }
  } catch (err) {
    console.error(err);
    appendLog(`[${t('log.cancel_error')}] ${err.message}`);
  }
}

// Append logs to terminal element
function appendLog(line) {
  const lineEl = document.createElement('div');
  lineEl.textContent = line;
  logConsole.appendChild(lineEl);
  // Auto scroll to bottom
  logConsole.scrollTop = logConsole.scrollHeight;
}

// Toggle Logs collapsible
function toggleConsoleLog() {
  logConsole.classList.toggle('hidden');
  logArrow.classList.toggle('open');
}

// Render history
function renderHistory() {
  if (history.length === 0) {
    historyList.innerHTML = `<div class="empty-history">${t('history.empty')}</div>`;
    return;
  }

  historyList.innerHTML = '';
  history.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'history-item';
    
    const isAudio = item.type === 'audio';
    const isPlaylist = !!item.isPlaylist;

    let iconHtml = '';
    let iconClass = '';

    if (isPlaylist) {
      iconClass = 'playlist';
      iconHtml = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <circle cx="4" cy="6" r="1" fill="currentColor"></circle>
          <circle cx="4" cy="12" r="1" fill="currentColor"></circle>
          <circle cx="4" cy="18" r="1" fill="currentColor"></circle>
        </svg>
      `;
    } else if (isAudio) {
      iconClass = 'audio';
      iconHtml = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18V5l12-2v13"></path>
          <circle cx="6" cy="18" r="3"></circle>
          <circle cx="18" cy="16" r="3"></circle>
        </svg>
      `;
    } else {
      iconClass = 'video';
      iconHtml = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
          <line x1="7" y1="2" x2="7" y2="22"></line>
          <line x1="17" y1="2" x2="17" y2="22"></line>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <line x1="2" y1="7" x2="7" y2="7"></line>
          <line x1="2" y1="17" x2="7" y2="17"></line>
          <line x1="17" y1="17" x2="22" y2="17"></line>
          <line x1="17" y1="7" x2="22" y2="7"></line>
        </svg>
      `;
    }

    const typeLabel = isPlaylist ? `${t('history.type_playlist')} (${item.entriesCount} ${t('history.items')})` : (isAudio ? t('history.type_audio') : t('history.type_video'));
    const hasFile = !isPlaylist && item.filePath;
    const isDraggable = !!(hasFile || item.destDir);

    const dragHandleHtml = isDraggable ? `
      <div class="drag-handle" title="${t('history.drag_tooltip')}">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="5" r="1.5" fill="currentColor"></circle>
          <circle cx="9" cy="12" r="1.5" fill="currentColor"></circle>
          <circle cx="9" cy="19" r="1.5" fill="currentColor"></circle>
          <circle cx="15" cy="5" r="1.5" fill="currentColor"></circle>
          <circle cx="15" cy="12" r="1.5" fill="currentColor"></circle>
          <circle cx="15" cy="19" r="1.5" fill="currentColor"></circle>
        </svg>
      </div>
    ` : '';

    const fileActionsHtml = hasFile ? `
      <button class="btn btn-secondary btn-action-icon btn-open-file" title="Phát tệp tin" data-file="${item.filePath}">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      </button>
      <button class="btn btn-secondary btn-action-icon btn-copy-file" title="${t('btn.copyFile')}" data-file="${item.filePath}">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    ` : '';

    itemEl.innerHTML = `
      <div class="history-item-left">
        ${dragHandleHtml}
        <div class="history-icon-wrapper ${iconClass}">
          ${iconHtml}
        </div>
        <div class="history-item-details">
          <div class="history-item-title" title="${item.title}">${item.title}</div>
          <div class="history-item-meta">${typeLabel} • ${item.quality} • ${t('history.saved_to')}: ${item.destDir} • ${item.date}</div>
        </div>
      </div>
      <div class="history-item-actions">
        ${fileActionsHtml}
        <button class="btn btn-secondary btn-action-icon btn-open-folder" title="${t('btn.openFolder')}" data-dir="${item.destDir}">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
        <button class="btn btn-danger btn-action-icon btn-delete-history" title="${t('btn.deleteHistory')}" data-id="${item.id}">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    // Bind drag events
    if (isDraggable) {
      const historyLeft = itemEl.querySelector('.history-item-left');
      if (historyLeft) {
        historyLeft.setAttribute('draggable', 'true');
        historyLeft.classList.add('draggable');
        historyLeft.addEventListener('dragstart', (event) => {
          event.preventDefault();
          const dragPath = item.filePath || item.destDir;
          if (dragPath) {
            window.api.startDrag(dragPath);
          }
        });
      }
    }

    // Bind item actions
    if (hasFile) {
      const btnOpenFile = itemEl.querySelector('.btn-open-file');
      if (btnOpenFile) {
        btnOpenFile.addEventListener('click', () => {
          window.api.openFile(item.filePath);
        });
      }

      const btnCopyFile = itemEl.querySelector('.btn-copy-file');
      if (btnCopyFile) {
        btnCopyFile.addEventListener('click', async () => {
          const success = await window.api.copyFile(item.filePath);
          if (success) {
            // Temporary feedback effect
            const originalColor = btnCopyFile.style.color;
            btnCopyFile.style.color = '#10b981'; // Green
            const originalTitle = btnCopyFile.title;
            btnCopyFile.title = t('history.copy_success');
            
            setTimeout(() => {
              btnCopyFile.style.color = originalColor;
              btnCopyFile.title = originalTitle;
            }, 1500);
          } else {
            alert(t('history.copy_fail'));
          }
        });
      }
    }

    itemEl.querySelector('.btn-open-folder').addEventListener('click', () => {
      window.api.openFolder(item.destDir);
    });

    itemEl.querySelector('.btn-delete-history').addEventListener('click', () => {
      deleteHistoryItem(item.id);
    });

    historyList.appendChild(itemEl);
  });
}

// Delete single history item
function deleteHistoryItem(id) {
  history = history.filter(item => item.id !== id);
  localStorage.setItem('yt_dlp_history', JSON.stringify(history));
  renderHistory();
}

// Clear all history
function clearAllHistory() {
  if (confirm(t('history.confirm_delete'))) {
    history = [];
    localStorage.removeItem('yt_dlp_history');
    renderHistory();
  }
}

// Settings Functions
function openSettingsModal() {
  if (settingsOverlay) {
    settingsOverlay.classList.remove('hidden');
    if (settingsDestPathDisplay) {
      settingsDestPathDisplay.textContent = currentDestPath || t('preview.noDestSettings');
      settingsDestPathDisplay.title = currentDestPath || '';
    }
  }
}

function closeSettingsModal() {
  if (settingsOverlay) {
    settingsOverlay.classList.add('hidden');
  }
}

async function selectSettingsDestDirectory() {
  try {
    const path = await window.api.selectDirectory();
    if (path) {
      currentDestPath = path;
      localStorage.setItem('yt_dlp_dest_path', path);
      
      if (destPathDisplay) {
        destPathDisplay.textContent = path;
        destPathDisplay.title = path;
      }
      if (settingsDestPathDisplay) {
        settingsDestPathDisplay.textContent = path;
        settingsDestPathDisplay.title = path;
      }
      showError(null);
    }
  } catch (err) {
    console.error(err);
  }
}

// Run init
document.addEventListener('DOMContentLoaded', init);
