# dream-draw-desktop

基于 Tauri v2 + React 19 + TypeScript 开发的 AI 图像修复桌面应用。

## ✨ 特性

- **AI 图像修复**: 使用 Google Gemini API 进行超清重绘和文字纠错
- **PDF 处理**: 支持 PDF 文档逐页提取和修复（最多 100 页）
- **多图上传**: 支持批量上传图片文件（PNG、JPEG、WebP，单文件最大 10MB）
- **多格式导出**: 支持导出为 PDF、PPTX 和 ZIP
- **安全存储**: API Key 使用系统密钥库加密存储
- **深色模式**: 支持浅色/深色/系统主题切换
- **双语支持**: 支持中文/英文界面
- **快捷键支持**: 
  - `Ctrl+O` / `⌘+O`: 打开文件
  - `Ctrl+A` / `⌘+A`: 全选页面
  - `Ctrl+,` / `⌘+,`: 打开设置
- **收藏夹**: 自动保存修复完成的图片，支持批量导出
- **导出进度**: 大文件导出时显示实时进度
- **失败重试**: 自动重试机制（最多 3 次，指数退避）

## 🛠️ 技术栈

- **前端**: React 19 + TypeScript + Tailwind CSS + Framer Motion
- **后端**: Rust + Tauri v2
- **AI**: Google Gemini 3.1 Flash Image Preview
- **数据库**: Dexie (IndexedDB) - 用于收藏夹本地存储
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
│   │   ├── useConfig.ts   # 配置管理
│   │   ├── useFiles.ts    # 文件/PDF 处理
│   │   ├── useProcessing.ts # AI 处理逻辑
│   │   ├── useExportProgress.ts # 导出进度
│   │   └── useKeyboardShortcuts.ts # 快捷键
│   ├── contexts/          # React Context
│   ├── constants/         # 常量定义
│   │   └── index.ts       # 配置常量、限制、快捷键等
│   ├── utils/             # 工具函数
│   │   ├── export.ts      # 导出功能 (PDF/PPTX/ZIP)
│   │   ├── favorites.ts   # 收藏夹管理
│   │   └── errors.ts      # 错误处理与验证
│   ├── services/          # 服务层
│   │   └── geminiService.ts # Gemini API 封装
│   ├── types.ts           # TypeScript 类型定义
│   ├── i18n.ts            # 国际化
│   └── tauri-api.ts       # Tauri 命令封装
├── src-tauri/             # Rust 后端代码
│   ├── src/lib.rs         # 主库文件（命令实现）
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

### 支持的文件格式

| 类型 | 格式 | 限制 |
|------|------|------|
| 图片 | PNG, JPEG, WebP | 单文件最大 10MB |
| PDF | PDF | 最多 100 页 |

### 快捷键

| 快捷键 | 功能 | 条件 |
|--------|------|------|
| `Ctrl+O` / `⌘+O` | 打开文件 | 未加载文件时 |
| `Ctrl+A` / `⌘+A` | 全选页面 | 已加载文件且未处理中 |
| `Ctrl+,` / `⌘+,` | 打开设置 | 随时 |

### 分辨率选项

| 选项 | 尺寸 | 说明 |
|------|------|------|
| 2K (快速) | 2048×2048 | 消耗较少 Token，处理速度快 |
| 4K (极致) | 4096×4096 | 最高画质，消耗更多 Token |

### 主题选项

- **浅色**: 明亮界面
- **深色**: 暗色界面
- **系统**: 跟随系统主题设置

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
  "productName": "dream-draw-desktop",
  "version": "2.4.2",
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

## 🔐 安全说明

### API Key 存储

- 优先使用系统密钥库存储（Windows: Credential Manager, macOS: Keychain, Linux: Secret Service）
- 降级方案：使用 Tauri Store 插件本地存储
- API Key 格式验证：必须以 `AIza` 开头，长度不超过 100 字符

### 输入验证

- 文件名消毒处理，防止路径遍历攻击
- 文件类型白名单校验
- 文件大小限制

## 📝 已知问题

1. **PDF.js Worker**: 首次加载需要从 CDN 下载 worker，可能需要翻墙
2. **Gemini API**: 需要有效的 API Key 且可能需要特定地区网络
3. **Linux 密钥库**: 某些 Linux 发行版可能需要手动安装 `libsecret`

## 📄 许可证

MIT License
