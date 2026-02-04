export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  category: string;
  imageUrl: string;
}

export enum Page {
  BLOG = 'blog',
  IMAGE_TOOL = 'image_tool',
  CONTENT_WRITER = 'content_writer',
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export enum SocialPlatform {
  FACEBOOK = 'Facebook',
  TIKTOK = 'TikTok',
  TWITTER = 'X (Twitter)',
  LINKEDIN = 'LinkedIn',
  INSTAGRAM = 'Instagram',
}

export enum ContentTone {
  PROFESSIONAL = 'Chuyên nghiệp',
  FUNNY = 'Hài hước',
  EMOTIONAL = 'Cảm xúc',
  TRENDY = 'Bắt trend',
  EDUCATIONAL = 'Giáo dục',
}

export interface OverlayItem {
  id: string;
  type: 'hat' | 'shirt' | 'custom';
  name: string;
  src: string; // Emoji or Image URL
  scale: number;
  x: number;
  y: number;
  rotation: number;
}