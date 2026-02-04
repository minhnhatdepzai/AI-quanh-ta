import React, { useState } from 'react';
import { BLOG_POSTS } from '../constants';
import ChatBot from '../components/ChatBot';
import { Calendar, User, Tag, X, MessageSquare, ArrowRight } from 'lucide-react';
import { BlogPost } from '../types';

const BlogPage: React.FC = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // Helper function to render text with markdown images
  const renderContent = (content: string) => {
    // Splits by ![alt](url) format
    const parts = content.split(/!\[(.*?)\]\((.*?)\)/g);
    
    // Result array will be: [text, alt, url, text, alt, url, ...]
    const elements = [];
    for (let i = 0; i < parts.length; i += 3) {
        // Render text part
        if (parts[i]) {
            elements.push(
                <p key={`text-${i}`} className="mb-4 whitespace-pre-line leading-relaxed">
                    {parts[i]}
                </p>
            );
        }
        // Render image part if exists
        if (i + 2 < parts.length) {
            const alt = parts[i + 1];
            const src = parts[i + 2];
            elements.push(
                <div key={`img-${i}`} className="my-8">
                    <img 
                        src={src} 
                        alt={alt} 
                        className="w-full rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300" 
                    />
                    {alt && (
                        <p className="text-center text-sm text-gray-500 mt-3 italic bg-gray-50 dark:bg-gray-800/50 py-2 rounded-lg inline-block px-4 mx-auto w-full">
                            {alt}
                        </p>
                    )}
                </div>
            );
        }
    }
    return elements;
  };

  return (
    <div className="relative">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 mb-4">
          Khám Phá AI Trong Cuộc Sống
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Cập nhật những xu hướng mới nhất về trí tuệ nhân tạo, thủ thuật prompt và ứng dụng thực tiễn.
        </p>
      </div>

      {/* Blog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {BLOG_POSTS.map((post) => (
          <article 
            key={post.id} 
            onClick={() => setSelectedPost(post)}
            className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-full cursor-pointer"
          >
            <div className="relative h-48 overflow-hidden">
              <img 
                src={post.imageUrl} 
                alt={post.title} 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400 rounded-full flex items-center gap-1">
                  <Tag size={12} /> {post.category}
                </span>
              </div>
            </div>
            
            <div className="p-6 flex flex-col flex-grow">
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                <span className="flex items-center gap-1"><User size={12} /> {post.author}</span>
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {post.title}
              </h2>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 flex-grow">
                {post.excerpt}
              </p>
              
              <div className="mt-auto flex gap-3">
                 <button className="flex-1 py-2 text-brand-600 dark:text-brand-400 font-medium text-sm flex items-center gap-1 hover:underline">
                    Đọc tiếp <ArrowRight size={14} />
                 </button>
                 <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setChatOpen(true);
                    }}
                    className="py-2 px-3 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-lg hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-gray-600 transition-colors"
                    title="Hỏi AI về bài này"
                  >
                    <MessageSquare size={16} />
                 </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           {/* Backdrop */}
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPost(null)} />
           
           {/* Content Container - Uses Flexbox to ensure footer stays at bottom but doesn't cover content */}
           <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
             
             {/* Close Button */}
             <button 
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 z-20 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur transition-colors"
             >
                <X size={24} />
             </button>

             {/* Scrollable Content Area */}
             <div className="flex-grow overflow-y-auto custom-scrollbar">
                 {/* Hero Image */}
                 <div className="h-64 sm:h-96 w-full relative shrink-0">
                   <img src={selectedPost.imageUrl} alt={selectedPost.title} className="w-full h-full object-cover" />
                   <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pt-24">
                      <span className="px-3 py-1 bg-brand-600 text-white text-xs font-bold uppercase tracking-wider rounded-full mb-3 inline-block">
                        {selectedPost.category}
                      </span>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight shadow-sm">
                        {selectedPost.title}
                      </h2>
                   </div>
                 </div>

                 {/* Text Content */}
                 <div className="p-6 sm:p-10">
                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-8 border-b dark:border-gray-700 pb-6">
                        <span className="flex items-center gap-2"><Calendar size={16} /> {selectedPost.date}</span>
                        <span className="flex items-center gap-2"><User size={16} /> {selectedPost.author}</span>
                    </div>

                    <div className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 text-lg">
                        {renderContent(selectedPost.content)}
                    </div>
                 </div>
             </div>

             {/* Footer - Static at bottom of flex container, not absolute overlay */}
             <div className="p-4 bg-white dark:bg-gray-900 border-t dark:border-gray-700 flex justify-end gap-3 shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <button 
                   onClick={() => setSelectedPost(null)}
                   className="px-6 py-3 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                   Đóng
                </button>
                <button 
                   onClick={() => {
                       setSelectedPost(null);
                       setChatOpen(true);
                   }}
                   className="px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition flex items-center gap-2"
                >
                   <MessageSquare size={18} /> Hỏi AI về bài này
                </button>
             </div>
           </div>
         </div>
       )}

      <ChatBot isOpen={chatOpen} setIsOpen={setChatOpen} />
    </div>
  );
};

export default BlogPage;