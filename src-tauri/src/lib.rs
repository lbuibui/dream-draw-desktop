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

#[tauri::command]
async fn save_api_key(app: tauri::AppHandle, apiKey: String) -> Result<(), String> {
    println!("[save_api_key] 开始保存 API Key...");
    
    // 安全验证
    validate_api_key(&apiKey)?;
    println!("[save_api_key] 验证通过");
    
    use tauri_plugin_store::StoreExt;
    println!("[save_api_key] 正在打开 store...");
    
    let store = app
        .store_builder("secrets.json")
        .build()
        .map_err(|e| {
            println!("[save_api_key] 打开存储失败: {}", e);
            format!("打开存储失败: {}", e)
        })?;
    
    println!("[save_api_key] store 已打开，正在设置值...");
    store.set("gemini_api_key", apiKey.trim());
    
    println!("[save_api_key] 正在保存...");
    store.save().map_err(|e| {
        println!("[save_api_key] 保存失败: {}", e);
        format!("保存 API Key 失败: {}", e)
    })?;
    
    println!("[save_api_key] 保存成功！");
    Ok(())
}

#[tauri::command]
async fn getApiKey(app: tauri::AppHandle) -> Result<Option<String>, String> {
    println!("[getApiKey] 正在读取 API Key...");
    
    use tauri_plugin_store::StoreExt;
    let store = app
        .store_builder("secrets.json")
        .build()
        .map_err(|e| {
            println!("[getApiKey] 打开存储失败: {}", e);
            format!("打开存储失败: {}", e)
        })?;
    
    let api_key = store
        .get("gemini_api_key")
        .and_then(|v| v.as_str().map(|s| s.to_string()));
    
    println!("[getApiKey] 读取结果: {}", if api_key.is_some() { "有值" } else { "无值" });
    Ok(api_key)
}

#[tauri::command]
async fn clearApiKey(app: tauri::AppHandle) -> Result<(), String> {
    println!("[clearApiKey] 正在清除 API Key...");
    use tauri_plugin_store::StoreExt;
    let store = app
        .store_builder("secrets.json")
        .build()
        .map_err(|e| format!("打开存储失败: {}", e))?;
    store.delete("gemini_api_key");
    store.save().map_err(|e| format!("清除 API Key 失败: {}", e))?;
    println!("[clearApiKey] 清除成功");
    Ok(())
}

use std::time::Duration;

const SYSTEM_PROMPT: &str = "你是一个专业的图像修复专家。";

#[tauri::command]
async fn call_gemini_api(
    apiKey: String,
    base64Image: String,
    prompt: String,
    imageSize: String,
    aspectRatio: String,
) -> Result<String, String> {
    // 设置 180 秒超时，图像生成可能需要较长时间
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(180))
        .build()
        .map_err(|e| format!("创建 HTTP 客户端失败: {}", e))?;
    
    // 使用 gemini-3.1-flash-image-preview 模型
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key={}",
        apiKey
    );

    // 清理 base64 数据，移除 data URL 前缀
    let clean_base64 = base64Image
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
            save_api_key,
            getApiKey,
            clearApiKey,
            call_gemini_api,
            get_app_version,
            get_app_name,
            is_dev,
        ])
        .run(tauri::generate_context!())
        .expect("运行 Tauri 应用时出错");
}
