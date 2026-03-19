use serde::{Deserialize, Serialize};
use std::fs;
use tauri_plugin_dialog::FilePath;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub resolution: String,
    pub theme: String,
    pub language: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            resolution: "2K".to_string(),
            theme: "light".to_string(),
            language: "cn".to_string(),
        }
    }
}

fn file_path_to_string(path: FilePath) -> String {
    match path {
        FilePath::Path(p) => p.to_string_lossy().to_string(),
        FilePath::Url(u) => u.to_string(),
    }
}

#[tauri::command]
async fn select_save_directory(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let folder_path = app.dialog().file().blocking_pick_folder();
    Ok(folder_path.map(file_path_to_string))
}

#[tauri::command]
async fn select_save_path(
    app: tauri::AppHandle,
    default_name: String,
    extension: String,
) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let file_path = app
        .dialog()
        .file()
        .add_filter(&extension, &[&extension])
        .set_file_name(&default_name)
        .blocking_save_file();
    Ok(file_path.map(file_path_to_string))
}

#[tauri::command]
async fn save_file_bytes(file_path: String, data: Vec<u8>) -> Result<(), String> {
    fs::write(&file_path, data).map_err(|e| format!("保存文件失败: {}", e))?;
    Ok(())
}

const CONFIG_KEY: &str = "app_config";

#[tauri::command]
async fn load_config(app: tauri::AppHandle) -> Result<AppConfig, String> {
    use tauri_plugin_store::StoreExt;
    let store = app
        .store("config.json")
        .map_err(|e| format!("打开存储失败: {}", e))?;
    let config = store
        .get(CONFIG_KEY)
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();
    Ok(config)
}

#[tauri::command]
async fn save_config(app: tauri::AppHandle, config: AppConfig) -> Result<(), String> {
    use tauri_plugin_store::StoreExt;
    let store = app
        .store("config.json")
        .map_err(|e| format!("打开存储失败: {}", e))?;
    let value = serde_json::to_value(&config)
        .map_err(|e| format!("序列化配置失败: {}", e))?;
    store.set(CONFIG_KEY, value);
    store.save().map_err(|e| format!("保存配置失败: {}", e))?;
    Ok(())
}

// ==================== API Key 安全存储 ====================

const KEYRING_SERVICE: &str = "com.dreamdraw.app";
const KEYRING_USERNAME: &str = "gemini_api_key";

// API Key 安全验证
fn validate_api_key(api_key: &str) -> Result<(), String> {
    let trimmed = api_key.trim();
    
    // 长度检查
    if trimmed.is_empty() {
        return Err("API Key 不能为空".to_string());
    }
    if trimmed.len() > 100 {
        return Err("API Key 长度不能超过 100 字符".to_string());
    }
    
    // 格式检查：必须以 AIza 开头
    if !trimmed.starts_with("AIza") {
        return Err("API Key 格式错误，应以 AIza 开头".to_string());
    }
    
    // 字符白名单：只允许字母、数字、下划线、连字符
    let valid_pattern = regex::Regex::new(r"^[A-Za-z0-9_-]+$").unwrap();
    if !valid_pattern.is_match(trimmed) {
        return Err("API Key 包含非法字符".to_string());
    }
    
    Ok(())
}

/// 使用系统密钥库安全存储 API Key
#[tauri::command]
async fn save_api_key_secure(api_key: String) -> Result<(), String> {
    println!("[save_api_key_secure] 开始保存 API Key...");
    
    // 安全验证
    validate_api_key(&api_key)?;
    println!("[save_api_key_secure] 验证通过");
    
    // 使用 keyring 存储到系统密钥库
    let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USERNAME)
        .map_err(|e| format!("创建密钥库条目失败: {}", e))?;
    
    entry.set_password(&api_key.trim())
        .map_err(|e| format!("保存 API Key 到系统密钥库失败: {}", e))?;
    
    println!("[save_api_key_secure] 已保存到系统密钥库");
    Ok(())
}

/// 从系统密钥库读取 API Key
#[tauri::command]
async fn get_api_key_secure() -> Result<Option<String>, String> {
    println!("[get_api_key_secure] 正在从系统密钥库读取 API Key...");
    
    let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USERNAME)
        .map_err(|e| format!("创建密钥库条目失败: {}", e))?;
    
    match entry.get_password() {
        Ok(password) => {
            println!("[get_api_key_secure] 读取成功");
            Ok(Some(password))
        }
        Err(keyring::Error::NoEntry) => {
            println!("[get_api_key_secure] 未找到 API Key");
            Ok(None)
        }
        Err(e) => {
            println!("[get_api_key_secure] 读取失败: {}", e);
            Err(format!("读取 API Key 失败: {}", e))
        }
    }
}

/// 从系统密钥库删除 API Key
#[tauri::command]
async fn clear_api_key_secure() -> Result<(), String> {
    println!("[clear_api_key_secure] 正在清除 API Key...");
    
    let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USERNAME)
        .map_err(|e| format!("创建密钥库条目失败: {}", e))?;
    
    entry.delete_credential()
        .map_err(|e| format!("清除 API Key 失败: {}", e))?;
    
    println!("[clear_api_key_secure] 清除成功");
    Ok(())
}

// 兼容旧版本的 API (使用文件存储作为降级方案)
#[tauri::command]
async fn save_api_key(app: tauri::AppHandle, api_key: String) -> Result<(), String> {
    // 优先尝试使用系统密钥库
    match save_api_key_secure(api_key.clone()).await {
        Ok(_) => Ok(()),
        Err(_) => {
            // 降级到文件存储
            println!("[save_api_key] 降级到文件存储");
            use tauri_plugin_store::StoreExt;
            validate_api_key(&api_key)?;
            let store = app
                .store_builder("secrets.json")
                .build()
                .map_err(|e| format!("打开存储失败: {}", e))?;
            store.set("gemini_api_key", api_key.trim());
            store.save().map_err(|e| format!("保存 API Key 失败: {}", e))?;
            Ok(())
        }
    }
}

#[tauri::command]
async fn get_api_key(app: tauri::AppHandle) -> Result<Option<String>, String> {
    // 优先尝试从系统密钥库读取
    match get_api_key_secure().await {
        Ok(Some(key)) => Ok(Some(key)),
        Ok(None) | Err(_) => {
            // 降级到文件存储
            println!("[get_api_key] 降级到文件存储读取");
            use tauri_plugin_store::StoreExt;
            let store = app
                .store_builder("secrets.json")
                .build()
                .map_err(|e| format!("打开存储失败: {}", e))?;
            let api_key = store
                .get("gemini_api_key")
                .and_then(|v| v.as_str().map(|s| s.to_string()));
            Ok(api_key)
        }
    }
}

#[tauri::command]
async fn clear_api_key(app: tauri::AppHandle) -> Result<(), String> {
    // 尝试清除系统密钥库
    let _ = clear_api_key_secure().await;
    
    // 同时清除文件存储
    use tauri_plugin_store::StoreExt;
    let store = app
        .store_builder("secrets.json")
        .build()
        .map_err(|e| format!("打开存储失败: {}", e))?;
    store.delete("gemini_api_key");
    store.save().map_err(|e| format!("清除 API Key 失败: {}", e))?;
    Ok(())
}

// ==================== Gemini API 调用 ====================

use std::time::Duration;

const SYSTEM_PROMPT: &str = "你是一个专业的图像修复专家。";

#[tauri::command]
async fn call_gemini_api(
    api_key: String,
    base64_image: String,
    prompt: String,
    image_size: String,
    aspect_ratio: String,
) -> Result<String, String> {
    // 设置 180 秒超时，图像生成可能需要较长时间
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(180))
        .build()
        .map_err(|e| format!("创建 HTTP 客户端失败: {}", e))?;
    
    // 使用 gemini-3.1-flash-image-preview 模型
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key={}",
        api_key
    );

    // 清理 base64 数据，移除 data URL 前缀
    let clean_base64 = base64_image
        .replace("data:image/png;base64,", "")
        .replace("data:image/jpeg;base64,", "")
        .replace("data:image/webp;base64,", "");

    // 参考 geminiService.ts 的请求结构 (与 @google/genai SDK 一致)
    let request_body = serde_json::json!({
        "systemInstruction": {
            "parts": [{"text": SYSTEM_PROMPT}]
        },
        "contents": {
            "parts": [
                {"text": prompt},
                {
                    "inlineData": {
                        "mimeType": "image/png",
                        "data": clean_base64
                    }
                }
            ]
        },
        "generationConfig": {
            "responseModalities": ["Text", "Image"]
        }
    });

    println!("[API] 发送请求到 Gemini...");
    
    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    let status = response.status();
    let text = response
        .text()
        .await
        .map_err(|e| format!("读取响应失败: {}", e))?;

    println!("[API] 响应状态: {}", status);
    
    if !status.is_success() {
        println!("[API] 错误响应: {}", text);
        return Err(format!("API 错误 ({}): {}", status, text));
    }

    Ok(text)
}

// ==================== 应用信息 ====================

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
fn get_app_name() -> String {
    "绘梦".to_string()
}

#[tauri::command]
fn is_dev() -> bool {
    cfg!(debug_assertions)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            select_save_directory,
            select_save_path,
            save_file_bytes,
            load_config,
            save_config,
            // API Key 管理 (新版本使用系统密钥库)
            save_api_key_secure,
            get_api_key_secure,
            clear_api_key_secure,
            // 兼容旧版本
            save_api_key,
            get_api_key,
            clear_api_key,
            call_gemini_api,
            get_app_version,
            get_app_name,
            is_dev,
        ])
        .run(tauri::generate_context!())
        .expect("运行 Tauri 应用时出错");
}
