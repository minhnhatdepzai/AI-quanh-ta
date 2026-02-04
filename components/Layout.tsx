import React from 'react';
import { Page } from '../types';
import { Bot, Image as ImageIcon, PenTool, Moon, Sun, Monitor } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activePage: Page;
  onNavigate: (page: Page) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  backgroundId: number;
  cycleBackground: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, activePage, onNavigate, darkMode, toggleDarkMode, backgroundId, cycleBackground 
}) => {
  
  const getBgClass = () => {
    // Simple dynamic backgrounds using Tailwind gradients
    switch(backgroundId % 3) {
      case 0: return 'bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-slate-900 dark:to-slate-800';
      case 1: return 'bg-gradient-to-tr from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-emerald-900';
      case 2: return 'bg-gradient-to-bl from-rose-50 to-orange-100 dark:from-slate-900 dark:to-stone-800';
      default: return 'bg-gray-50 dark:bg-gray-900';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${getBgClass()} transition-colors duration-500`}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate(Page.BLOG)}>
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                AI
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">AI Quanh Ta</span>
            </div>

            {/* Navigation Desktop */}
            <nav className="hidden md:flex space-x-8">
              <NavButton 
                active={activePage === Page.BLOG} 
                onClick={() => onNavigate(Page.BLOG)} 
                icon={<Bot size={18} />} 
                label="Blog & Chat" 
              />
              <NavButton 
                active={activePage === Page.IMAGE_TOOL} 
                onClick={() => onNavigate(Page.IMAGE_TOOL)} 
                icon={<ImageIcon size={18} />} 
                label="Chỉnh Sửa Ảnh" 
              />
              <NavButton 
                active={activePage === Page.CONTENT_WRITER} 
                onClick={() => onNavigate(Page.CONTENT_WRITER)} 
                icon={<PenTool size={18} />} 
                label="Viết Content" 
              />
            </nav>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button 
                onClick={cycleBackground}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-300"
                title="Đổi hình nền"
              >
                <Monitor size={20} />
              </button>
              <button 
                onClick={toggleDarkMode}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-300"
                title="Chế độ tối/sáng"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Nav Bar (Bottom fixed usually better, but sticking to simple top here for SPA) */}
        <div className="md:hidden flex justify-around py-2 bg-white dark:bg-gray-900 border-t dark:border-gray-800">
           <MobileNavButton active={activePage === Page.BLOG} onClick={() => onNavigate(Page.BLOG)} icon={<Bot size={20} />} />
           <MobileNavButton active={activePage === Page.IMAGE_TOOL} onClick={() => onNavigate(Page.IMAGE_TOOL)} icon={<ImageIcon size={20} />} />
           <MobileNavButton active={activePage === Page.CONTENT_WRITER} onClick={() => onNavigate(Page.CONTENT_WRITER)} icon={<PenTool size={20} />} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white/50 dark:bg-gray-900/50 backdrop-blur border-t dark:border-gray-800 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          © 2026 AI Quanh Ta. Khám phá sức mạnh trí tuệ nhân tạo.
        </div>
      </footer>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      active 
        ? 'text-brand-600 dark:text-brand-500 bg-brand-50 dark:bg-gray-800' 
        : 'text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-white'
    }`}
  >
    {icon}
    {label}
  </button>
);

const MobileNavButton = ({ active, onClick, icon }: any) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-xl transition-colors ${
      active 
        ? 'bg-brand-100 text-brand-600 dark:bg-gray-800 dark:text-brand-400' 
        : 'text-gray-500 dark:text-gray-400'
    }`}
  >
    {icon}
  </button>
);

export default Layout;
