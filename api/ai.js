/**
 * Vercel Serverless Function - AI情绪分析API
 * 使用 Hugging Face Inference API（免费方案）
 */

export default async function handler(req, res) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: '缺少prompt参数' });
    }

    // 从环境变量获取 Hugging Face API Token
    const hfToken = process.env.HF_API_TOKEN;

    if (!hfToken) {
      console.error('❌ HF_API_TOKEN未配置');
      return res.status(500).json({ 
        error: '服务器配置错误：HF_API_TOKEN未设置',
        message: '请联系管理员配置环境变量'
      });
    }

    console.log('🤖 开始调用 Hugging Face API...');

    // 使用 Qwen2.5-7B-Instruct 模型（中文能力强，免费）
    const modelUrl = 'https://api-inference.huggingface.co/models/Qwen/Qwen2.5-7B-Instruct/v1/chat/completions';

    // 调用 Hugging Face API
    const response = await fetch(modelUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hfToken}`
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-7B-Instruct',
        messages: [
          {
            role: 'system',
            content: '你是一个温暖专业的心理分析助手，擅长从情绪记录中发现规律并给出建设性建议。请用中文回复，语言简洁温暖，适当使用emoji。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Hugging Face API错误:', errorData);
      
      // 处理模型加载中的情况
      if (errorData.error && errorData.error.includes('loading')) {
        return res.status(503).json({
          error: '模型正在加载中',
          message: '请稍后重试（首次调用需要加载模型，约需20秒）',
          retryAfter: 20
        });
      }
      
      return res.status(response.status).json({
        error: 'AI API调用失败',
        details: errorData.error || '未知错误'
      });
    }

    const data = await response.json();
    
    // 兼容不同的响应格式
    let reportText = '';
    if (data.choices && data.choices[0] && data.choices[0].message) {
      reportText = data.choices[0].message.content;
    } else if (data.generated_text) {
      reportText = data.generated_text;
    } else {
      throw new Error('无法解析AI响应');
    }

    console.log('✅ AI报告生成成功');

    // 返回分析报告
    return res.status(200).json({
      success: true,
      report: reportText
    });

  } catch (error) {
    console.error('❌ 服务器错误:', error);
    return res.status(500).json({
      error: '服务器内部错误',
      message: error.message
    });
  }
}
