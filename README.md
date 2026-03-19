# 绘梦桌面版 (Dream Draw Desktop)

基于 Tauri v2 + React + TypeScript 开发的 AI 图像修复桌面应用。

## ✨ 特性

- **AI 图像修复**: 使用 Google Gemini API 进行超清重绘和文字纠错
- **PDF 处理**: 支持 PDF 文档逐页提取和修复
- **多格式导出**: 支持导出为 PDF、PPTX 和 ZIP
- **安全存储**: API Key 使用系统密钥库加密存储
- **深色模式**: 支持浅色/深色主题切换，自适应系统主题
- **双语支持**: 支持中文/英文界面
- **快捷键支持**: Ctrl+O(打开)、Ctrl+S(导出)、Ctrl+A(全选)、Ctrl+,(设置)
- **收藏夹**: 自动保存修复完成的图片，支持批量导出
- **导出进度**: 大文件导出时显示实时进度

## 🛠️ 技术栈

- **前端**: React 19 + TypeScript + Tailwind CSS
- **后端**: Rust + Tauri v2
- **AI**: Google Gemini 3.1 Flash Image Preview
- **PDF**: PDF.js + jsPDF
- **PPTX**: PptxGenJS
- **安全**: keyring (系统密钥库)

## 🚀 快速开始

### 环境要求

- **Node.js** ≥ 18
- **Rust** ≥ 1.70 (通过 [rustup](https://rustup.rs/) 安装)
- **系统依赖**:
  - Linux: `sudo apt install libgtk-3-dev libwebkit2gtk-4.0-dev`
  - macOS: Xcode Command Line Tools
  - Windows: WebView2 Runtime

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 启动开发服务器（前端 + Tauri 桌面窗口）
npm run tauri:dev
```

### 构建生产版本

```bash
# 构建桌面应用
npm run tauri:build

# 输出目录: src-tauri/target/release/bundle/
```

## 📁 项目结构

```
dream-draw-desktop/
├── src/                    # 前端代码
│   ├── components/        # React 组件
│   │   ├── Header.tsx     # 顶部导航
│   │   ├── UploadZone.tsx # 上传区域
│   │   ├── EditorView.tsx # 编辑主界面
│   │   ├── PageGrid.tsx   # 图片网格
│   │   └── modals/        # 弹窗组件
│   │       ├── SettingsModal.tsx
│   │       ├── FavoritesModal.tsx
│   │       └── ImagePreviewModal.tsx
│   ├── hooks/             # React Hooks
│   ├── contexts/          # React Context
│   ├── constants/         # 常量定义
│   ├── utils/             # 工具函数
│   ├── services/          # 服务层
│   ├── types.ts           # TypeScript 类型
│   └── i18n.ts            # 国际化
├── src-tauri/             # Rust 后端代码
│   ├── src/lib.rs         # 主库文件
│   ├── capabilities/      # 权限配置
│   └── Cargo.toml         # Rust 依赖
└── package.json
```

## ⚙️ 配置说明

### API Key

1. 点击右上角设置图标
2. 输入 Google Gemini API Key
3. 点击保存

> **注意**: API Key 使用系统密钥库加密存储，不会上传到任何服务器。

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+O / ⌘+O | 打开文件 |
| Ctrl+S / ⌘+S | 导出文件 |
| Ctrl+A / ⌘+A | 全选 |
| Ctrl+, / ⌘+, | 打开设置 |

### 分辨率选项

- **2K (快速)**: 消耗较少 Token，处理速度快
- **4K (极致)**: 最高画质，消耗更多 Token

## 🔧 开发指南

### 添加新的 Tauri 命令

1. 在 `src-tauri/src/lib.rs` 中添加命令函数:

```rust
#[tauri::command]
pub async fn my_command(app: tauri::AppHandle, arg: String) -> Result<String, String> {
    // 实现逻辑
    Ok(result)
}
```

2. 注册到 `invoke_handler`:

```rust
.invoke_handler(tauri::generate_handler![
    // ... 其他命令
    my_command,
])
```

3. 在前端 `src/tauri-api.ts` 中封装:

```typescript
export async function myCommand(arg: string): Promise<string> {
  return await invoke('my_command', { arg });
}
```

### 添加插件

```bash
npm run tauri add <plugin-name>
```

常用插件:
- `dialog` - 文件对话框
- `store` - 本地存储
- `http` - HTTP 请求
- `fs` - 文件系统

## 📦 打包配置

### 修改应用信息

编辑 `src-tauri/tauri.conf.json`:

```json
{
  "productName": "DreamDraw",
  "version": "2.4.0",
  "identifier": "com.dreamdraw.app"
}
```

### 添加图标

替换 `src-tauri/icons/` 目录下的图标文件:
- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `icon.icns` (macOS)
- `icon.ico` (Windows)

## 📝 已知问题

1. **PDF.js Worker**: 首次加载需要从 CDN 下载 worker，可能需要翻墙
2. **Gemini API**: 需要有效的 API Key 且可能需要特定地区网络

## 📄 许可证

MIT License
