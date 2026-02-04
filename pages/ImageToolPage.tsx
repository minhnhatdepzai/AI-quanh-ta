import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, Upload, Download, Undo, Share2, Layers, ZoomIn, ZoomOut, Scissors, Sliders, Wand2, SmilePlus, MousePointer2, Check, X, Plus, Trash2, Globe, Sparkles, Maximize, Settings } from 'lucide-react';
import { OVERLAY_ASSETS } from '../constants';
import { editImageWithAI } from '../services/geminiService';
import { OverlayItem } from '../types';

interface CropState {
  x: number;
  y: number;
  w: number;
  h: number;
}

const ImageToolPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stickerInputRef = useRef<HTMLInputElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // State
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [customStickers, setCustomStickers] = useState<OverlayItem[]>([]);
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [filter, setFilter] = useState('none');
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeTab, setActiveTab] = useState<'tools' | 'overlays' | 'ai'>('tools');
  
  // AI Prompts
  const [aiPrompt, setAiPrompt] = useState(''); // Dropdown selection
  const [magicPrompt, setMagicPrompt] = useState(''); // Free text input
  const [aspectRatio, setAspectRatio] = useState('1:1'); // Advanced setting

  // Download Resolution State
  const [downloadScale, setDownloadScale] = useState(1);

  // Crop State
  const [isCropping, setIsCropping] = useState(false);
  const [cropRect, setCropRect] = useState<CropState>({ x: 0, y: 0, w: 0, h: 0 });

  // Interaction State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<'none' | 'move' | 'transform'>('none');
  const dragStartRef = useRef<{ x: number, y: number } | null>(null);
  const initialOverlayStateRef = useRef<OverlayItem | null>(null);
  const startPanRef = useRef<{ x: number, y: number } | null>(null);

  // Load custom stickers from local storage on mount
  useEffect(() => {
    const savedStickers = localStorage.getItem('my_stickers');
    if (savedStickers) {
      try {
        setCustomStickers(JSON.parse(savedStickers));
      } catch (e) {
        console.error("Failed to load stickers", e);
      }
    }
  }, []);

  // Save custom stickers to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('my_stickers', JSON.stringify(customStickers));
  }, [customStickers]);

  // Fit image to screen logic
  const fitImageToScreen = useCallback(() => {
    if (!baseImage || !containerRef.current) return;
    
    const containerW = containerRef.current.clientWidth;
    const containerH = containerRef.current.clientHeight;
    const imgW = baseImage.width;
    const imgH = baseImage.height;

    const scaleX = (containerW - 40) / imgW; // 40px padding
    const scaleY = (containerH - 40) / imgH;
    
    // Fit entire image
    const newZoom = Math.min(scaleX, scaleY, 1); 
    
    setZoom(newZoom);
    setOffset({ x: 0, y: 0 });
  }, [baseImage]);

  // Handle Resize
  useEffect(() => {
    window.addEventListener('resize', fitImageToScreen);
    return () => window.removeEventListener('resize', fitImageToScreen);
  }, [fitImageToScreen]);


  // Draw Function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear entire canvas (using canvas dimensions)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update canvas size to match container for UI interaction
    if (containerRef.current) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
    }

    // Apply Filter
    ctx.filter = filter;

    // Draw Base Image with Transform (Zoom/Pan)
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(offset.x, offset.y);
    
    // Draw image centered at origin
    const imgLeft = -baseImage.width / 2;
    const imgTop = -baseImage.height / 2;
    ctx.drawImage(baseImage, imgLeft, imgTop);

    // --- Crop UI (Drawn in Image Space) ---
    if (isCropping) {
       ctx.filter = 'none';
       ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
       
       // Draw overlay around crop rect
       ctx.fillRect(imgLeft, imgTop, baseImage.width, cropRect.y);
       ctx.fillRect(imgLeft, imgTop + cropRect.y + cropRect.h, baseImage.width, baseImage.height - (cropRect.y + cropRect.h));
       ctx.fillRect(imgLeft, imgTop + cropRect.y, cropRect.x, cropRect.h);
       ctx.fillRect(imgLeft + cropRect.x + cropRect.w, imgTop + cropRect.y, baseImage.width - (cropRect.x + cropRect.w), cropRect.h);

       // Draw Crop Rect Border
       const cx = imgLeft + cropRect.x;
       const cy = imgTop + cropRect.y;
       ctx.strokeStyle = '#fff';
       ctx.lineWidth = 2 / zoom;
       ctx.strokeRect(cx, cy, cropRect.w, cropRect.h);
    }
    
    ctx.restore();

    // --- Overlays (Drawn in Screen Space relative to Image Space) ---
    if (!isCropping) {
        ctx.filter = 'none'; 
        
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(offset.x, offset.y);

        overlays.forEach(ov => {
            ctx.save();
            ctx.translate(ov.x, ov.y); 
            ctx.rotate(ov.rotation);
            ctx.scale(ov.scale, ov.scale);
            
            if (ov.type === 'custom' || ov.src.startsWith('data:image')) {
                const img = new Image();
                img.src = ov.src;
                if (img.complete) {
                    const w = 100;
                    const h = 100 * (img.height / img.width);
                    ctx.drawImage(img, -w/2, -h/2, w, h);
                } else {
                     ctx.fillText("...", 0, 0);
                }
            } else {
                ctx.font = `50px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(ov.src, 0, 0);
            }

            // Selection Box
            if (selectedId === ov.id) {
                const boxSize = 60; 
                const lineWidth = 2 / ov.scale;
                ctx.strokeStyle = '#0ea5e9';
                ctx.lineWidth = lineWidth;
                ctx.strokeRect(-boxSize/2, -boxSize/2, boxSize, boxSize);
            }

            ctx.restore();
        });
        ctx.restore();
    }

  }, [baseImage, zoom, offset, overlays, filter, selectedId, isCropping, cropRect]);

  useEffect(() => {
    requestAnimationFrame(draw);
  }, [draw]);

  // --- Interaction Logic ---

  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getCanvasCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas || !baseImage) return;

    // 1. Check for Overlay interaction first (if not cropping)
    if (!isCropping) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        const imageSpaceX = (pos.x - centerX) / zoom - offset.x;
        const imageSpaceY = (pos.y - centerY) / zoom - offset.y;

        // Check Overlays (reverse order for z-index)
        for (let i = overlays.length - 1; i >= 0; i--) {
            const ov = overlays[i];
            // Rotate point to local overlay space for accurate box check
            const dx = imageSpaceX - ov.x;
            const dy = imageSpaceY - ov.y;
            const localX = dx * Math.cos(-ov.rotation) - dy * Math.sin(-ov.rotation);
            const localY = dx * Math.sin(-ov.rotation) + dy * Math.cos(-ov.rotation);
            
            const hitSize = 40 * ov.scale; // Hitbox size

            if (Math.abs(localX) < hitSize && Math.abs(localY) < hitSize) {
                setSelectedId(ov.id);
                setDragMode('move');
                dragStartRef.current = { x: imageSpaceX, y: imageSpaceY }; // Store in image space
                initialOverlayStateRef.current = { ...ov };
                return;
            }
        }
    }

    // 2. If no overlay hit, check for Panning the image
    setSelectedId(null);
    setDragMode('move'); // Reuse move for panning if no overlay selected
    startPanRef.current = { x: pos.x, y: pos.y }; // Screen space for panning
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getCanvasCoordinates(e);
    
    // Pan Logic (Moving the whole canvas view)
    if (dragMode === 'move' && !selectedId && startPanRef.current) {
        const dx = (pos.x - startPanRef.current.x) / zoom;
        const dy = (pos.y - startPanRef.current.y) / zoom;
        setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        startPanRef.current = { x: pos.x, y: pos.y };
        return;
    }

    // Overlay Move Logic
    if (dragMode === 'move' && selectedId && dragStartRef.current && initialOverlayStateRef.current) {
        const centerX = canvasRef.current!.width / 2;
        const centerY = canvasRef.current!.height / 2;
        const imageSpaceX = (pos.x - centerX) / zoom - offset.x;
        const imageSpaceY = (pos.y - centerY) / zoom - offset.y;

        const dx = imageSpaceX - dragStartRef.current.x;
        const dy = imageSpaceY - dragStartRef.current.y;

        setOverlays(prev => prev.map(ov => {
            if (ov.id === selectedId) {
                return {
                    ...ov,
                    x: initialOverlayStateRef.current!.x + dx,
                    y: initialOverlayStateRef.current!.y + dy
                };
            }
            return ov;
        }));
    }
  };

  const handlePointerUp = () => {
    setDragMode('none');
    dragStartRef.current = null;
    startPanRef.current = null;
    initialOverlayStateRef.current = null;
  };

  // Crop Handlers
  const startCrop = () => {
    if (!baseImage) return;
    setIsCropping(true);
    setSelectedId(null);
    // Init crop rect to 80% center
    const w = baseImage.width * 0.8;
    const h = baseImage.height * 0.8;
    const x = (baseImage.width - w) / 2;
    const y = (baseImage.height - h) / 2;
    setCropRect({ x, y, w, h });
    setActiveTab('tools');
    // Reset view to see crop clearly
    fitImageToScreen();
  };

  const cancelCrop = () => setIsCropping(false);

  const applyCrop = () => {
    if (!baseImage) return;
    const canvas = document.createElement('canvas');
    canvas.width = cropRect.w;
    canvas.height = cropRect.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.filter = filter;
    ctx.drawImage(
        baseImage, 
        cropRect.x, cropRect.y, cropRect.w, cropRect.h, 
        0, 0, cropRect.w, cropRect.h
    );

    const newImg = new Image();
    newImg.onload = () => {
        setBaseImage(newImg);
        setIsCropping(false);
        setFilter('none'); 
        setTimeout(fitImageToScreen, 50);
    };
    newImg.src = canvas.toDataURL();
  };

  // Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const img = new Image();
        img.onload = () => {
          setBaseImage(img);
          setImageLoaded(true);
          setOverlays([]);
          setTimeout(fitImageToScreen, 100);
        };
        img.src = evt.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStickerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const src = evt.target?.result as string;
        const newSticker: OverlayItem = {
          id: Date.now().toString(),
          type: 'custom',
          name: file.name,
          src: src,
          scale: 1,
          x: 0,
          y: 0,
          rotation: 0
        };
        setCustomStickers(prev => [...prev, newSticker]);
        if (imageLoaded) {
           addOverlay(newSticker);
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const deleteCustomSticker = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomStickers(prev => prev.filter(s => s.id !== id));
  };

  const shareSticker = (e: React.MouseEvent) => {
    e.stopPropagation();
    alert("Đã chia sẻ sticker với cộng đồng AI Quanh Ta! (Mô phỏng)");
  };

  const handleCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      video.onloadedmetadata = () => {
        setTimeout(() => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')?.drawImage(video, 0, 0);
            const img = new Image();
            img.onload = () => {
                 setBaseImage(img);
                 setImageLoaded(true);
                 setTimeout(fitImageToScreen, 100);
                 stream.getTracks().forEach(track => track.stop());
            }
            img.src = canvas.toDataURL('image/png');
        }, 1000);
      };
    } catch (err) {
      alert("Không thể truy cập camera");
    }
  };

  const addOverlay = (item: OverlayItem) => {
    const newOverlay = { ...item, id: Date.now().toString(), x: 0, y: 0, rotation: 0 };
    setOverlays([...overlays, newOverlay]);
    setSelectedId(newOverlay.id);
  };

  const downloadImage = () => {
    if (!baseImage) return;

    // Create a temporary canvas for export with applied scale
    const canvas = document.createElement('canvas');
    canvas.width = baseImage.width * downloadScale;
    canvas.height = baseImage.height * downloadScale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply scale to context
    ctx.scale(downloadScale, downloadScale);

    // Draw base (at original logical size, context scale handles zoom)
    ctx.filter = filter;
    ctx.drawImage(baseImage, 0, 0);

    // Draw overlays
    ctx.filter = 'none';
    
    // Move to logical center for overlays
    ctx.translate(baseImage.width / 2, baseImage.height / 2);

    overlays.forEach(ov => {
        ctx.save();
        ctx.translate(ov.x, ov.y);
        ctx.rotate(ov.rotation);
        ctx.scale(ov.scale, ov.scale);
        
        if (ov.type === 'custom' || ov.src.startsWith('data:image')) {
            const img = new Image();
            img.src = ov.src;
            if (img.complete) {
                const w = 100; 
                const h = 100 * (img.height / img.width);
                ctx.drawImage(img, -w/2, -h/2, w, h);
            }
        } else {
            ctx.font = `50px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ov.src, 0, 0);
        }
        ctx.restore();
    });

    const link = document.createElement('a');
    link.download = `ai-quanh-ta-edit-${downloadScale}x.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleAIEdit = async (type: 'style' | 'face', customPrompt?: string) => {
    if (!baseImage) return;

    // Validation for "Magic Edit"
    if (type === 'style' && !customPrompt && !aiPrompt) {
        alert("Vui lòng nhập mô tả hoặc chọn một phong cách!");
        return;
    }

    setLoadingAI(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = baseImage.width;
      canvas.height = baseImage.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.drawImage(baseImage, 0, 0);
          const currentData = canvas.toDataURL('image/png');

          const promptToSend = customPrompt || (type === 'face' 
            ? "Swap the face with a confident, happy professional looking face." 
            : aiPrompt);

          const resultData = await editImageWithAI(
              currentData, 
              promptToSend,
              type === 'face' ? 'swap' : 'edit',
              aspectRatio
          );
          
          const img = new Image();
          img.onload = () => {
            setBaseImage(img);
          };
          img.src = resultData;
          setOverlays([]); 
      }
    } catch (e: any) {
      console.error(e);
      alert(`Lỗi AI: ${e.message || "Không thể tạo ảnh."}`);
    } finally {
      setLoadingAI(false);
    }
  };

  const deleteSelected = () => {
    if (selectedId) {
        setOverlays(prev => prev.filter(o => o.id !== selectedId));
        setSelectedId(null);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6">
      {/* Editor Area */}
      <div ref={containerRef} className="flex-grow bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-inner border border-gray-200 dark:border-gray-700 relative overflow-hidden flex items-center justify-center p-4">
        {!imageLoaded ? (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto flex items-center justify-center text-gray-400">
                <Upload size={32} />
            </div>
            <h3 className="text-xl font-medium text-gray-500">Tải ảnh lên hoặc Chụp ảnh để bắt đầu</h3>
            <div className="flex gap-4 justify-center">
                <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition flex items-center gap-2">
                    <Upload size={18} /> Tải ảnh
                </button>
                <button onClick={handleCamera} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition flex items-center gap-2">
                    <Camera size={18} /> Chụp ảnh
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
            </div>
          </div>
        ) : (
          <canvas 
            ref={canvasRef} 
            className="shadow-2xl rounded-lg cursor-crosshair bg-white touch-none"
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />
        )}

        {/* Floating Controls */}
        {imageLoaded && (
          <>
            {/* Zoom Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur px-2 py-2 rounded-full shadow-lg flex items-center gap-2 border dark:border-gray-700">
                    <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ZoomOut size={20} /></button>
                    <span className="text-xs font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => z + 0.1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ZoomIn size={20} /></button>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                    <button onClick={fitImageToScreen} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" title="Vừa màn hình">
                        <Maximize size={20} />
                    </button>
                </div>
                
                {selectedId && !isCropping && (
                    <button onClick={deleteSelected} className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium hover:bg-red-600 transition flex items-center gap-2">
                        <Trash2 size={16} /> Xóa
                    </button>
                )}
            </div>

            {/* Crop Confirmation Controls */}
            {isCropping && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
                     <button 
                        onClick={applyCrop} 
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-medium"
                     >
                        <Check size={18} /> Áp dụng
                     </button>
                     <button 
                        onClick={cancelCrop} 
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-medium"
                     >
                        <X size={18} /> Hủy
                     </button>
                </div>
            )}
          </>
        )}
      </div>

      {/* Sidebar Controls */}
      <div className="w-full lg:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b dark:border-gray-700">
            <button onClick={() => { setActiveTab('tools'); setIsCropping(false); }} className={`flex-1 py-4 text-sm font-medium flex justify-center gap-2 ${activeTab === 'tools' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500'}`}>
                <Sliders size={16} /> Cơ Bản
            </button>
            <button onClick={() => { setActiveTab('overlays'); setIsCropping(false); }} className={`flex-1 py-4 text-sm font-medium flex justify-center gap-2 ${activeTab === 'overlays' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500'}`}>
                <Layers size={16} /> Sticker
            </button>
            <button onClick={() => { setActiveTab('ai'); setIsCropping(false); }} className={`flex-1 py-4 text-sm font-medium flex justify-center gap-2 ${activeTab === 'ai' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500'}`}>
                <Wand2 size={16} /> AI
            </button>
        </div>

        {/* Panel Content */}
        <div className="p-6 flex-grow overflow-y-auto">
            {activeTab === 'tools' && (
                <div className="space-y-6">
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Bộ lọc màu</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['none', 'grayscale(100%)', 'sepia(100%)', 'saturate(200%)', 'contrast(150%)', 'brightness(120%)'].map((f, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => setFilter(f)}
                                    className={`h-12 rounded-lg border-2 ${filter === f ? 'border-brand-600' : 'border-transparent'} bg-gray-100 dark:bg-gray-700 text-xs overflow-hidden`}
                                    style={{ filter: f !== 'none' ? f : undefined }}
                                >
                                    {f === 'none' ? 'Gốc' : f.split('(')[0]}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Công cụ</label>
                        <div className="flex gap-2">
                             <button 
                                onClick={startCrop}
                                disabled={!imageLoaded || isCropping}
                                className={`flex-1 py-3 rounded-lg text-sm flex items-center justify-center gap-2 font-medium transition ${isCropping ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-500' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200'}`}
                             >
                                <Scissors size={18} /> {isCropping ? 'Đang cắt...' : 'Cắt ảnh'}
                             </button>
                        </div>
                         <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                            {isCropping 
                                ? "Di chuyển khung để chọn vùng cần cắt. Kéo các góc để thay đổi kích thước." 
                                : "Mẹo: Dùng tính năng Cắt Ảnh để loại bỏ phần thừa. Kéo thả để di chuyển vùng nhìn."}
                         </p>
                    </div>
                </div>
            )}

            {activeTab === 'overlays' && (
                <div className="space-y-6">
                    {/* Upload Section */}
                    <div>
                         <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Của Tôi & Cộng Đồng</label>
                         <button 
                            onClick={() => stickerInputRef.current?.click()}
                            className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:border-brand-500 hover:text-brand-500 transition mb-3"
                         >
                            <Plus size={18} /> Tải Sticker lên
                         </button>
                         <input type="file" ref={stickerInputRef} onChange={handleStickerUpload} accept="image/*" className="hidden" />
                         
                         {customStickers.length > 0 && (
                             <div className="grid grid-cols-4 gap-3">
                                {customStickers.map((item) => (
                                    <div key={item.id} className="relative group">
                                        <button 
                                            onClick={() => addOverlay(item)}
                                            className="aspect-square w-full bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-600 overflow-hidden"
                                        >
                                            <img src={item.src} alt={item.name} className="w-full h-full object-contain" />
                                        </button>
                                        <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-1">
                                            <button 
                                                onClick={(e) => deleteCustomSticker(item.id, e)}
                                                className="bg-red-500 text-white p-1 rounded-full shadow-sm"
                                                title="Xóa"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                            <button 
                                                onClick={(e) => shareSticker(e)}
                                                className="bg-blue-500 text-white p-1 rounded-full shadow-sm"
                                                title="Chia sẻ cộng đồng"
                                            >
                                                <Globe size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                             </div>
                         )}
                    </div>

                    {/* System Assets */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Thư Viện Hệ Thống</label>
                        <div className="grid grid-cols-4 gap-3">
                            {OVERLAY_ASSETS.map((item) => (
                                <button 
                                    key={item.id}
                                    onClick={() => addOverlay(item)}
                                    className="aspect-square bg-gray-50 dark:bg-gray-700 rounded-xl flex flex-col items-center justify-center hover:bg-brand-50 hover:border-brand-200 border border-transparent transition text-2xl"
                                    title={item.name}
                                >
                                    {item.src}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex gap-3 items-start mt-2">
                        <MousePointer2 className="text-blue-500 mt-1 flex-shrink-0" size={16} />
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                            <strong>Hướng dẫn:</strong> Chạm vào sticker trên ảnh để chọn. Kéo sticker để di chuyển. Dùng tay nắm tròn (góc dưới phải) để xoay & chỉnh kích thước.
                        </p>
                    </div>
                </div>
            )}

            {activeTab === 'ai' && (
                <div className="space-y-6">
                    {/* Advanced Settings */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2 text-sm">
                            <Settings size={14} /> Cài đặt nâng cao (AI)
                        </h4>
                        <div>
                             <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Tỉ lệ khung hình (Aspect Ratio)</label>
                             <select 
                                value={aspectRatio}
                                onChange={(e) => setAspectRatio(e.target.value)}
                                className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                             >
                                 <option value="1:1">1:1 (Vuông)</option>
                                 <option value="3:4">3:4 (Chân dung)</option>
                                 <option value="4:3">4:3 (Phong cảnh)</option>
                                 <option value="9:16">9:16 (Story/Reel)</option>
                                 <option value="16:9">16:9 (Youtube)</option>
                             </select>
                        </div>
                    </div>

                    {/* Magic Edit - Free Text */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
                         <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                            <Sparkles size={16} /> Chỉnh Sửa Tùy Ý (Magic Edit)
                         </h4>
                         <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
                             Mô tả bất kỳ thay đổi nào bạn muốn thực hiện trên ảnh.
                         </p>
                         <textarea
                            className="w-full mb-3 p-3 rounded-lg border border-amber-200 dark:border-amber-700 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                            rows={3}
                            placeholder="Ví dụ: Thêm pháo hoa trên bầu trời, đổi màu áo thành màu đỏ, làm ảnh nét hơn..."
                            value={magicPrompt}
                            onChange={(e) => setMagicPrompt(e.target.value)}
                         />
                         <button 
                            onClick={() => handleAIEdit('style', magicPrompt)}
                            disabled={!imageLoaded || loadingAI}
                            className="w-full py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition"
                         >
                            {loadingAI ? 'Đang thực hiện phép thuật...' : 'Thực hiện'}
                         </button>
                    </div>

                    {/* Preset Styles */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                         <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
                            <Wand2 size={16} /> Biến Đổi Phong Cách (Preset)
                         </h4>
                         <select 
                            className="w-full mb-3 p-2 rounded border dark:bg-gray-700 dark:border-gray-600 text-sm"
                            onChange={(e) => setAiPrompt(e.target.value)}
                            value={aiPrompt}
                         >
                             <option value="">Chọn phong cách...</option>
                             <option value="Biến thành phong cách Mùa Đông tuyết rơi">❄️ Mùa Đông (Tuyết rơi)</option>
                             <option value="Biến thành phong cách Mùa Thu lá vàng">🍂 Mùa Thu (Lá vàng)</option>
                             <option value="Biến thành phong cách Cyberpunk neon">🌃 Cyberpunk</option>
                             <option value="Biến thành phong cách tranh sơn dầu">🎨 Tranh sơn dầu</option>
                         </select>
                         <button 
                            onClick={() => handleAIEdit('style')}
                            disabled={!imageLoaded || loadingAI || !aiPrompt}
                            className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                         >
                            {loadingAI ? 'Đang xử lý...' : 'Áp dụng Style'}
                         </button>
                    </div>

                    {/* Face Swap */}
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                         <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                            <SmilePlus size={16} /> Thay Đổi Khuôn Mặt
                         </h4>
                         <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                             Tự động nhận diện và thay thế khuôn mặt bằng AI.
                         </p>
                         <button 
                            onClick={() => handleAIEdit('face')}
                            disabled={!imageLoaded || loadingAI}
                            className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                         >
                             {loadingAI ? 'Đang xử lý...' : 'Thay Mặt AI'}
                         </button>
                    </div>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t dark:border-gray-700 flex gap-2 justify-between items-center">
            <button onClick={() => setBaseImage(null)} className="py-2 px-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200" title="Hoàn tác/Hủy bỏ">
                <Undo size={18} />
            </button>
            
            <div className="flex gap-2 items-center">
                <div className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1">
                   <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Size:</span>
                   <select 
                      value={downloadScale}
                      onChange={(e) => setDownloadScale(Number(e.target.value))}
                      className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-200 border-none focus:ring-0 cursor-pointer py-1 pr-8 pl-1"
                      disabled={!imageLoaded}
                   >
                      <option value="0.5">0.5x</option>
                      <option value="1">1x</option>
                      <option value="2">2x</option>
                      <option value="4">4x</option>
                   </select>
                </div>

                <button onClick={downloadImage} disabled={!imageLoaded} className="py-2 px-4 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium shadow-sm transition-transform active:scale-95">
                    <Download size={18} /> <span className="hidden sm:inline">Tải về</span>
                </button>
            </div>

            <button className="py-2 px-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200">
                <Share2 size={18} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ImageToolPage;