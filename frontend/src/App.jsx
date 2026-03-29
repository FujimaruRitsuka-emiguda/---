import React, { useState, useRef } from 'react';
import { Upload, X, Send, Heart, Sparkles, Loader2, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const App = () => {
  const [images, setImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    console.log('Selected files:', files);

    if (images.length + files.length > 10) {
      alert('最多只能上传 10 张图片哦');
      e.target.value = ''; // 重置 input
      return;
    }

    const newImages = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }));

    setImages(prev => [...prev, ...newImages]);
    e.target.value = ''; // 重置 input，允许重复上传同一张图或修复连续点击问题
  };

  const removeImage = (id) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      // 清理不再需要的 URL
      const removed = prev.find(img => img.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return filtered;
    });
  };

  const startAnalysis = async () => {
    if (images.length < 5) {
      alert('请至少上传 5 张截图以获得精准分析');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    const formData = new FormData();
    images.forEach(img => {
      formData.append('images', img.file);
    });

    try {
      console.log('Starting analysis with', images.length, 'images...');
      // 这里的地址改为相对路径，这样无论部署在哪里都能通过 vercel.json 找到后端
      const response = await axios.post('/api/analyze', formData);
      console.log('Analysis response:', response.data);
      setAnalysisResult(response.data.analysis);
    } catch (err) {
      console.error('Analysis failed:', err);
      const errorMsg = err.response?.data?.details || err.response?.data?.error || err.message || '未知错误';
      setError(`分析失败：${errorMsg}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-pink-200">
            <Heart size={24} fill="currentColor" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-indigo-600 bg-clip-text text-transparent">
            朋友圈脱单神助攻
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-8">
        {/* Intro */}
        <div className="text-center mb-8">
          <p className="text-slate-600 text-lg">
            上传 5-10 张对方的朋友圈截图，<br />
            让“追求高手”为你深度拆解对方心理！
          </p>
        </div>

        {/* Upload Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-8">
          <div 
            className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center hover:border-pink-300 hover:bg-pink-50 transition-all group"
          >
            <input 
              type="file" 
              multiple 
              accept="image/png, image/jpeg, image/webp" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-white group-hover:scale-110 transition-transform">
                <Camera size={24} className="text-slate-400 group-hover:text-pink-500" />
              </div>
              <p className="text-slate-500 font-medium text-sm">点击或拖拽上传截图</p>
              <p className="text-slate-400 text-xs mt-1">支持 JPG, PNG, WebP (5-10张)</p>
            </button>
          </div>

          {/* Image Previews - Compact Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-4">
            <AnimatePresence>
              {images.map((img) => (
                <motion.div 
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative aspect-[3/4] rounded-lg overflow-hidden border border-slate-200"
                >
                  <img src={img.url} alt="preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm"
                  >
                    <X size={12} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Action Button */}
          <button 
            disabled={images.length < 5 || isAnalyzing}
            onClick={startAnalysis}
            className={`w-full mt-6 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg ${
              images.length >= 5 && !isAnalyzing
              ? 'bg-gradient-to-r from-pink-500 to-indigo-600 text-white hover:opacity-90 active:scale-95 shadow-pink-200'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin" />
                正在深度拆解中...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                立即分析 (已上传 {images.length} 张)
              </>
            )}
          </button>
          {images.length > 0 && images.length < 5 && (
            <p className="text-center text-xs text-pink-500 mt-3 font-medium">还需上传 {5 - images.length} 张图片即可开始分析</p>
          )}
        </section>

        {/* Results Section */}
        <AnimatePresence>
          {analysisResult && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-pink-100 p-8"
            >
              <div className="flex items-center gap-2 mb-6 text-pink-600 font-bold text-lg border-b border-pink-50 pb-4">
                <Sparkles />
                <h2>高手深度分析报告</h2>
              </div>
              
              <div className="prose prose-slate max-w-none whitespace-pre-wrap leading-relaxed text-slate-700">
                {analysisResult}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
                <button 
                  onClick={() => { setAnalysisResult(null); setImages([]); }}
                  className="text-slate-400 text-sm font-medium hover:text-pink-500"
                >
                  重新分析新朋友
                </button>
              </div>
            </motion.section>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 text-red-600 p-4 rounded-xl text-center text-sm font-medium"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Disclaimer */}
      <footer className="mt-12 text-center text-slate-400 text-xs px-4">
        仅供娱乐，请尊重他人隐私，理性对待分析结果。
      </footer>
    </div>
  );
};

export default App;
