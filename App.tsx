import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import BlogPage from './pages/BlogPage';
import ImageToolPage from './pages/ImageToolPage';
import ContentPage from './pages/ContentPage';
import { Page } from './types';
 
const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>(Page.BLOG);
  const [darkMode, setDarkMode] = useState(false);
  const [backgroundId, setBackgroundId] = useState(0);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const cycleBackground = () => setBackgroundId((prev) => prev + 1);

  const renderPage = () => {
    switch (activePage) {
      case Page.BLOG:
        return <BlogPage />;
      case Page.IMAGE_TOOL:
        return <ImageToolPage />;
      case Page.CONTENT_WRITER:
        return <ContentPage />;
      default:
        return <BlogPage />;
    }
  };

  return (
    <Layout
      activePage={activePage}
      onNavigate={setActivePage}
      darkMode={darkMode}
      toggleDarkMode={toggleDarkMode}
      backgroundId={backgroundId}
      cycleBackground={cycleBackground}
    >
      {renderPage()}
    </Layout>
  );
};

export default App;
