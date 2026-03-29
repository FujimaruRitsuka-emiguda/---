import express from 'express';
import cors from 'cors';
import multer from 'multer';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Multer setup for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 提高到 10MB，因为 base64 会增加体积
});

const ARK_API_KEY = process.env.ARK_API_KEY;
const ARK_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const MODEL_ID = process.env.MODEL_ID || 'doubao-seed-1-6-thinking-250615'; 

app.post('/api/analyze', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length < 5) {
      return res.status(400).json({ error: '请至少上传 5 张图片' });
    }

    if (!ARK_API_KEY) {
      return res.status(500).json({ error: 'API Key 未配置' });
    }

    // 构造符合用户提供的 curl 示例的消息结构
    const userContent = [
      { 
        type: 'text', 
        text: '这是我追求对象的几张朋友圈截图。请作为追求高手，洞察对方的心理、性格及喜好，并给出简短但极其有效的追求分析和建议。' 
      }
    ];

    // 将上传的图片转换为 Base64 格式并添加到 userContent 中
    req.files.forEach(file => {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
        }
      });
    });

    const messages = [
      {
        role: 'system',
        content: '你是一个追求异性的高手，对于青春男女生的心理和外在表现，有非常强的洞察，也有一套很厉害的追求异性的技巧！擅长于输出简短但有效的分析和建议。'
      },
      {
        role: 'user',
        content: userContent
      }
    ];

    console.log(`Calling Ark API with model: ${MODEL_ID}, images count: ${req.files.length}`);

    const response = await axios.post(`${ARK_BASE_URL}/chat/completions`, {
      model: MODEL_ID,
      messages: messages,
    }, {
      headers: {
        'Authorization': `Bearer ${ARK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000 // 增加超时时间到 2 分钟，thinking 模型可能很慢
    });

    const analysis = response.data.choices[0].message.content;
    res.json({ analysis });

  } catch (error) {
    console.error('Error calling Ark API:', error.response?.data || error.message);
    const apiError = error.response?.data?.error;
    let errorMessage = '分析过程中出错';
    let details = error.message;

    if (apiError) {
      if (apiError.code === 'InvalidEndpointOrModel.NotFound') {
        details = `模型或推理终端 ID "${MODEL_ID}" 未找到。请确保你在火山引擎控制台创建了推理终端，并使用了正确的 Endpoint ID (格式如 ep-xxxx)。`;
      } else {
        details = apiError.message || JSON.stringify(apiError);
      }
    }
    
    res.status(500).json({ error: errorMessage, details: details });
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
