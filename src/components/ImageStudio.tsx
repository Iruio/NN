import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Download, Copy, Check, Loader2, Image as ImageIcon, Wand2, Maximize2, X } from 'lucide-react';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  aspectRatio: string;
  createdAt: string;
}

const STYLE_PRESETS = [
  { id: 'photorealistic', label: 'Фотореализм 8K', icon: '📸', desc: 'Студийный свет, Hasselblad, детали' },
  { id: 'cyberpunk', label: 'Киберпанк', icon: '🏙️', desc: 'Неон, голограммы, ночной футуризм' },
  { id: '3d_render', label: '3D Render', icon: '💎', desc: 'Octane render, глянец, объем' },
  { id: 'anime', label: 'Аниме / Макото', icon: '✨', desc: 'Живописное небо, сочные цвета' },
  { id: 'luxury', label: 'Люкс Эдиториал', icon: '🏛️', desc: 'Минимализм, журнал Vogue, мягкие тени' },
  { id: 'oil_painting', label: 'Масляная живопись', icon: '🎨', desc: 'Текстура холста, мазки кисти, Караваджо' }
];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Квадрат' },
  { id: '16:9', label: '16:9 Пейзаж' },
  { id: '9:16', label: '9:16 Сторис / Reels' },
  { id: '4:3', label: '4:3 Классика' },
  { id: '3:4', label: '3:4 Портрет' }
];

const PROMPT_IDEAS = [
  'Футуристический квантовый процессор в стеклянном павильоне на закате',
  'Люксовый парфюм с минералами сапфира на мокром черном обсидиане',
  'Кибернетическая лисица с неоновыми узорами в туманном бамбуковом лесу',
  'Космическая станция над кольцами Сатурна в лучах далекой звезды',
  'Элегантные минималистичные наушники из титана и матового ореха'
];

export const ImageStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [style, setStyle] = useState('photorealistic');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [refImage, setRefImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSurpriseMe = () => {
    const randomPrompt = PROMPT_IDEAS[Math.floor(Math.random() * PROMPT_IDEAS.length)];
    const randomStyle = STYLE_PRESETS[Math.floor(Math.random() * STYLE_PRESETS.length)].id;
    const randomAspect = ASPECT_RATIOS[Math.floor(Math.random() * ASPECT_RATIOS.length)].id;
    setPrompt(randomPrompt);
    setStyle(randomStyle);
    setAspectRatio(randomAspect);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setRefImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEnhance = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setError(null);
    try {
      const res = await fetch('/api/gen/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: 'image' })
      });
      const data = await res.json();
      if (data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/gen/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style,
          aspectRatio,
          imageBase64: refImage || undefined,
          negativePrompt: negativePrompt.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка при генерации изображения');

      const newImg: GeneratedImage = {
        id: Math.random().toString(36).substring(7),
        url: data.imageUrl,
        prompt: prompt.trim(),
        style,
        aspectRatio,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setImages(prev => [newImg, ...prev]);
      setSelectedImage(newImg);
    } catch (err: any) {
      setError(err.message || 'Сбой генерации изображения');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (img: GeneratedImage) => {
    const a = document.createElement('a');
    a.href = img.url;
    a.download = `genesis-photo-${img.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Input Control Column */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-pink-500/10 text-pink-400 rounded-xl border border-pink-500/20">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-100">Генератор Фото и Изображений</h3>
                <p className="text-xs text-zinc-400">Nano Banana Flash Image • Высокое разрешение</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-5">
            {/* Prompt textarea */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Текстовый промпт
                </label>
                <button
                  type="button"
                  onClick={handleEnhance}
                  disabled={!prompt.trim() || isEnhancing || isGenerating}
                  className="inline-flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 disabled:opacity-40 transition-colors"
                >
                  {isEnhancing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5" />
                  )}
                  <span>Улучшить с ИИ</span>
                </button>
              </div>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Опишите желаемое фото во всех деталях (например: стеклянная флакон духов на базальтовом камне в лучах рассвета)..."
                rows={4}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-pink-500/60 focus:ring-1 focus:ring-pink-500/50 rounded-2xl p-4 text-sm text-zinc-100 placeholder-zinc-500 transition-all outline-none resize-none"
              />
            </div>

            {/* Quick Inspiration Pills */}
            <div>
              <span className="text-[11px] text-zinc-500 block mb-2 font-medium">Быстрые идеи:</span>
              <div className="flex flex-wrap gap-1.5">
                {PROMPT_IDEAS.map((idea, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(idea)}
                    className="text-[11px] px-2.5 py-1 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700/40 rounded-lg transition-colors truncate max-w-[260px]"
                  >
                    {idea}
                  </button>
                ))}
              </div>
            </div>

            {/* Style Selector */}
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-2.5">
                Художественный стиль
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {STYLE_PRESETS.map(s => {
                  const isActive = style === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStyle(s.id)}
                      className={`text-left p-3 rounded-2xl border transition-all ${
                        isActive
                          ? 'bg-pink-950/30 border-pink-500/60 text-zinc-100 shadow-lg shadow-pink-500/10'
                          : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-lg mb-1">{s.icon}</div>
                      <div className="text-xs font-semibold text-zinc-200">{s.label}</div>
                      <div className="text-[10px] text-zinc-500 line-clamp-1">{s.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-2.5">
                Соотношение сторон
              </label>
              <div className="flex flex-wrap gap-2">
                {ASPECT_RATIOS.map(ar => (
                  <button
                    key={ar.id}
                    type="button"
                    onClick={() => setAspectRatio(ar.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      aspectRatio === ar.id
                        ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    {ar.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Negative Prompt */}
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-2">
                Исключить из кадра (Негативный промпт)
              </label>
              <input
                type="text"
                value={negativePrompt}
                onChange={e => setNegativePrompt(e.target.value)}
                placeholder="размытие, деформации, водяные знаки, текст..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-pink-500 placeholder-zinc-600"
              />
            </div>

            {/* Optional Reference Image Upload */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Референс или эскиз (Опционально)
                </label>
                {refImage && (
                  <button
                    type="button"
                    onClick={() => setRefImage(null)}
                    className="text-[11px] text-red-400 hover:text-red-300"
                  >
                    Удалить
                  </button>
                )}
              </div>
              {refImage ? (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-pink-500/50">
                  <img src={refImage} alt="Ref" className="w-full h-full object-cover" />
                </div>
              ) : (
                <label className="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
                  <ImageIcon className="w-4 h-4 text-pink-400" />
                  <span>Загрузить изображение-референс</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-red-300 text-xs">
                {error}
              </div>
            )}

            {/* Submit Action & Surprise Me */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSurpriseMe}
                className="px-3.5 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl text-xs font-semibold flex items-center justify-center transition-colors"
                title="Случайная идея фото"
              >
                🎲
              </button>
              <button
                type="submit"
                disabled={!prompt.trim() || isGenerating}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-400 hover:to-amber-400 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Генерируем визуальный шедевр...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Сгенерировать фото</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Preview & Gallery Column */}
      <div className="lg:col-span-7 space-y-6">
        {/* Main Display / Preview Card */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-zinc-300">Холст генерации</h4>
            {selectedImage && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyPrompt(selectedImage.prompt, selectedImage.id)}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                >
                  {copiedId === selectedImage.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Промпт</span>
                </button>
                <button
                  onClick={() => handleDownload(selectedImage)}
                  className="px-2.5 py-1 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Скачать JPG</span>
                </button>
              </div>
            )}
          </div>

          <div className="relative w-full aspect-square sm:aspect-[4/3] rounded-2xl bg-zinc-950/80 border border-zinc-800/80 overflow-hidden flex items-center justify-center">
            {isGenerating ? (
              <div className="text-center p-8 space-y-4">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin" />
                  <div className="absolute inset-2 rounded-full border-2 border-amber-500/20 border-b-amber-500 animate-spin-reverse" />
                  <Sparkles className="w-6 h-6 text-pink-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">Синтез изображения через нейросеть</p>
                  <p className="text-xs text-zinc-500 mt-1">Отрисовка текстур, моделирование света и глубина...</p>
                </div>
              </div>
            ) : selectedImage ? (
              <div className="relative w-full h-full group flex items-center justify-center bg-black">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.prompt}
                  className="max-w-full max-h-full object-contain"
                />
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-zinc-200 line-clamp-2">{selectedImage.prompt}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-400">
                    <span className="capitalize">{selectedImage.style.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>{selectedImage.aspectRatio}</span>
                    <span>•</span>
                    <span>{selectedImage.createdAt}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 space-y-2 text-zinc-600">
                <ImageIcon className="w-12 h-12 mx-auto stroke-[1.2] opacity-40" />
                <p className="text-sm text-zinc-400 font-medium">Здесь появится сгенерированное фото</p>
                <p className="text-xs text-zinc-600 max-w-sm mx-auto">
                  Введите запрос слева или воспользуйтесь быстрыми идеями, чтобы запустить генератор.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Gallery of generations */}
        {images.length > 0 && (
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
              Галерея текущей сессии ({images.length})
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {images.map(img => {
                const isCurrent = selectedImage?.id === img.id;
                return (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img)}
                    className={`group relative aspect-square rounded-xl overflow-hidden border transition-all ${
                      isCurrent
                        ? 'border-pink-500 ring-2 ring-pink-500/30 shadow-lg'
                        : 'border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.prompt}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="w-4 h-4 text-white" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
