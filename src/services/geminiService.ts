import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = "你是一个专业的图像修复专家。";

const USER_PROMPT = `【任务目标】：对附件图片进行超清重绘并执行精准文字纠错。【核心要求】：1. 画质重塑：使用最高分辨率重建图像，确保所有线条、背景及元素边缘极尽清晰，消除所有噪点。2. 精准纠错：检查每一个文字，若该文字模糊或错别字或错乱，必须结合字形字样、所属「段落、句子或词组」的上下文语境等，精准推断出正确文字。修复后的文字所属「段落、句子或词组」须符合中文语法逻辑，严禁产生乱码或无意义字符。3. 字体要求：所有中文字体统一采用思源黑体（Source Han Sans），确保字体风格一致、清晰易读。4. 视觉一致性：必须严格保持原图的构图、色彩分布、UI布局及元素相对位置，禁止进行任何结构性重构；同时尽可能还原原图的字体颜色及字号大小，确保视觉观感与原图高度统一。`;

const getClosestAspectRatio = (width: number, height: number): string => {
  const ratio = width / height;
  const supported = [
    { label: "1:1", value: 1.0 },
    { label: "3:4", value: 0.75 },
    { label: "4:3", value: 1.33 },
    { label: "9:16", value: 0.5625 },
    { label: "16:9", value: 1.77 },
  ];
  const closest = supported.reduce((prev, curr) =>
    Math.abs(curr.value - ratio) < Math.abs(prev.value - ratio) ? curr : prev
  );
  return closest.label;
};

export const processImageWithGemini = async (
  apiKey: string,
  base64Image: string,
  width: number,
  height: number,
  imageSize: '2K' | '4K' = '2K'
): Promise<string> => {
  // 清理 base64 数据
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  const aspectRatio = getClosestAspectRatio(width, height);
  const ai = new GoogleGenAI({ apiKey });

  try {
    console.log('[GeminiSDK] 开始调用，图片尺寸:', width, 'x', height, '比例:', aspectRatio);
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [
          { text: USER_PROMPT },
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanBase64,
            },
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: imageSize,
        }
      }
    });

    console.log('[GeminiSDK] 响应 received');
    
    // 检查响应结构
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          console.log('[GeminiSDK] 找到图像数据');
          // 返回带 data URL 前缀的 base64
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("响应中未找到图像数据");
  } catch (error) {
    console.error("[GeminiSDK] 调用失败:", error);
    throw error;
  }
};
