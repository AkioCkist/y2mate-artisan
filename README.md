# YT-DLP Premium Downloader

<p align="center">
  <img src="https://media.thuvien.org/photo/3929/image/71d0e35d391ee4323089fd1b97d45835.jpg" alt="anime girl, kimono, katana, sakura blossom, profile view, traditional building" width=auto/>
</p>

A modern, high-performance, and beautiful desktop application for downloading media from YouTube and other platforms. Built with **Electron** and powered by **yt-dlp**.

## ✨ Features

- **Modern & Premium UI**: Built with a sleek dark mode theme, Outfit typography, custom title bar, glassmorphism cards, and interactive hover effects.
- **Dynamic Link Analysis**: Fetches rich metadata (thumbnail, title, duration, uploader, and all available stream formats) using `yt-dlp --dump-json` before downloading.
- **Automated Dependency Setup & Updater**: On first startup, the app automatically checks, downloads, and configures local `yt-dlp`, `ffmpeg`, and `ffprobe` binaries. An in-app "Update" button allows upgrading `yt-dlp` to its latest release with a single click.
- **Full Playlist Support**: Supports downloading entire playlists/sets (especially optimized for SoundCloud playlists using direct API v2 resolution with high-speed chunked fetching). Users can preview playlist items and selectively check/uncheck tracks to download.
- **Flexible Formats & Quality Presets**:
  - **Video (MP4)**: Support for `Best Quality`, `1080p`, `720p`, and `480p`.
  - **Audio (Music Extraction)**: Convert to high-quality `MP3 (320kbps)`, `MP3 (192kbps)`, lossless `WAV`, or native `M4A`.
- **Metadata & Thumbnail Embedding**: Option to embed full media metadata (title, artist, album, etc.) and cover artwork (automatically converted to JPG) directly into download files.
- **Real-Time Progress Tracking**: Displays active progress percentage, current download speed, estimated total file size, and Estimated Time of Arrival (ETA).
- **Live Logs Console**: Keep track of the actual command-line output from the running `yt-dlp` child process.
- **Rich Download History & File Operations**: Keep track of downloaded videos and audios. Open files directly or copy their absolute paths to the clipboard with platform-optimized formats.
- **Drag and Drop Files**: Drag downloaded items directly from the History list into other applications (e.g., file explorer, video editor, chat window) for instant use.
- **Robust Path Resolution**: Auto-detects final target file paths from logs, with a smart fallback directory scan for recently modified files (last 15 seconds) if log format changes.
- **Local Application Cache**: Sandboxed `userData` directory configured inside the application folder (`electron_user_data`), preventing folder write permission issues and keeping the application fully portable.
- **Interactive Download Management**:
  - Choose custom saving directory through native system dialogs.
  - Abort/Cancel active downloads cleanly at any time (sends `SIGTERM` to the process).
  - Open target download directory directly from the app interface after completion.
- **Optimized for VMs/Sandboxes**: Hardware acceleration and GPU sandbox disabled by default to ensure flawless running on remote desktop connections, virtual environments, and sandbox tools.

## 📋 Prerequisites

The application features an **automated setup wizard** that downloads and configures its own local copies of `yt-dlp`, `ffmpeg`, and `ffprobe` on first launch. 

Therefore, **manual installation is optional**. If you prefer to use system-wide installations, ensure:
1. **Node.js** (v16.x or newer recommended) and **npm** are installed.
2. `yt-dlp`, `ffmpeg`, and `ffprobe` are available in your system's `PATH` (optional fallback).

## 🚀 Getting Started

Follow these steps to run the application locally:

### 1. Clone or Extract the Project
Open your terminal in the project directory:
```bash
cd yt-downloader-electron
```

### 2. Install Dependencies
```bash
npm install
```

*Note: If Electron download fails due to network/cache restrictions in your environment, you can run the manual extraction script provided:*
```bash
node install_electron.js
```

### 3. Start the Application
```bash
npm start
```

### 4. Package/Build for Production (Optional)
To package the application into a zip distribution:
```bash
npm run build
```
To package the application and build the **custom setup installer** (`YT-DLP Downloader Setup 1.0.1.exe`) with auto-downloads of dependencies:
```bash
npm run build:installer
```
To run and test the installer in development mode:
```bash
npm run start:installer
```

### 5. Build Portable Executable (Single .exe, No Installation)
Build a standalone `y2mate.exe` and auto-register it in PATH — then launch by typing `y2mate` anywhere:
```bash
npm run build:portable
```
This will:
1. Compile the app into a portable `.exe` (`dist/y2mate.exe`)
2. Copy it to `C:\Users\<You>\bin\`
3. Auto-add that folder to your User PATH (if not already there)

After building, **restart your terminal** and run:
```bash
y2mate
```

The packaged outputs will be saved in `dist/` and `dist-installer/` respectively.

---

## 📂 Project Structure

```
yt-downloader-electron/
├── index.html            # Main UI Layout (HTML5)
├── styles.css            # Custom Styling (Dark Mode, Glassmorphism, Animations)
├── main.js               # Electron Main Process (IPC Handlers, Process Spawning)
├── preload.js            # Electron Preload Script (Secure IPC Bridge)
├── renderer.js           # Frontend Logic & UI Event Handlers
├── build-installer.js    # Integrated installer build pipeline script
├── installer/            # Custom Electron-based installer sub-project
└── package.json          # Node.js Project Configuration & Dependencies
```

---

## 🛠️ Usage Guide

1. **Enter URL**: Paste a valid video/playlist link from YouTube or other supported platforms in the input bar.
2. **Analyze**: Click the **Analyze (Phân tích)** button. The app will fetch details and display the video thumbnail, title, and length.
3. **Configure Options**:
   - Choose whether you want **Video (MP4)** or **Audio**.
   - Select the desired quality option from the dropdown menu.
   - Click the folder icon next to **Save Location** to choose where the downloaded file should be saved.
4. **Download**: Click the **Download** button. Monitor progress, speed, and logs in the download queue.
5. **Manage**: Use the **Cancel (Hủy)** button to abort if needed. Once finished, click **Open Folder (Mở thư mục)** to view your file!

