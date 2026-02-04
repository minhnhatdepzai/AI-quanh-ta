import React, { useState } from 'react';
import { SocialPlatform, ContentTone } from '../types';
import { generateSocialContent } from '../services/geminiService';
import { Copy, PenTool, FileText, CheckCircle, Loader2 } from 'lucide-react';

const ContentPage: React.FC = () => {
  const [platform, setPlatform] = useState<string>(SocialPlatform.FACEBOOK);
  const [tone, setTone] = useState<string>(ContentTone.PROFESSIONAL);
  const [topic, setTopic] = useState('');
  const [isSummary, setIsSummary] = useState(false);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setResult('');
    try {
      const text = await generateSocialContent(platform, tone, topic, isSummary);
      setResult(text || "Không có kết quả.");
    } catch (error) {
      setResult("Lỗi khi tạo nội dung. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Trợ Lý Nội Dung Đa Nền Tảng</h1>
        <p className="text-gray-500 dark:text-gray-400">Viết caption, status hoặc tóm tắt tài liệu trong vài giây.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          
          <div className="flex gap-4 mb-6 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
             <button 
               onClick={() => setIsSummary(false)}
               className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isSummary ? 'bg-white dark:bg-gray-600 shadow text-brand-600 dark:text-white' : 'text-gray-500'}`}
             >
                <PenTool size={16} className="inline mr-2" /> Tạo Caption
             </button>
             <button 
               onClick={() => setIsSummary(true)}
               className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isSummary ? 'bg-white dark:bg-gray-600 shadow text-brand-600 dark:text-white' : 'text-gray-500'}`}
             >
                <FileText size={16} className="inline mr-2" /> Tóm Tắt
             </button>
          </div>

          {!isSummary && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nền tảng</label>
                <select 
                  value={platform} 
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-brand-500"
                >
                  {Object.values(SocialPlatform).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phong cách</label>
                <select 
                  value={tone} 
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-brand-500"
                >
                  {Object.values(ContentTone).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {isSummary ? 'Dán văn bản cần tóm tắt' : 'Chủ đề hoặc mô tả nội dung'}
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={isSummary ? "Paste văn bản dài vào đây..." : "Ví dụ: Chuyến đi du lịch Đà Lạt mùa mưa..."}
              className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm h-48 focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !topic}
            className="w-full py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : <PenTool size={20} />}
            {loading ? 'AI đang viết...' : 'Tạo Nội Dung'}
          </button>
        </div>

        {/* Output Area */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col relative min-h-[400px]">
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Kết quả:</h3>
              {result && (
                <button 
                  onClick={handleCopy}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors"
                  title="Copy"
                >
                  {copied ? <CheckCircle size={20} className="text-green-500" /> : <Copy size={20} />}
                </button>
              )}
           </div>
           
           <div className="flex-grow p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 overflow-y-auto font-medium text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {loading ? (
                <div className="flex items-center justify-center h-full text-gray-400 gap-2">
                   <Loader2 className="animate-spin" /> Đang xử lý...
                </div>
              ) : result ? (
                result
              ) : (
                <span className="text-gray-400 italic">Kết quả sẽ hiện ở đây...</span>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ContentPage;
