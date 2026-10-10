import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Globe, Smartphone, Tablet, Monitor, Download, Copy, Check, Sparkles, Wand2, Loader2, Code, Layout, FileArchive } from 'lucide-react';
import { generateAppZip, triggerFileDownload } from '../utils/exporter.js';

interface GeneratedSite {
  title: string;
  tagline: string;
  businessType: string;
  theme: string;
  sections: string[];
  html: string;
}

const BUSINESS_PRESETS = [
  { id: 'saas', label: 'AI SaaS Платформа', desc: 'Облачный сервис, метрики, интеграции' },
  { id: 'agency', label: 'Дизайн & Креатив Агентство', desc: 'Портфолио, кейсы, современная эстетика' },
  { id: 'ecommerce', label: 'Люксовый E-Commerce', desc: 'Витрина товаров, премиум бренд' },
  { id: 'startup', label: 'DeepTech Стартап', desc: 'Инновации, презентация инвесторам, дорожная карта' },
  { id: 'restaurant', label: 'Ресторан Высокой Кухни', desc: 'Меню, бронирование, атмосфера, отзывы' },
  { id: 'fintech', label: 'FinTech & Web3', desc: 'Безопасность, кошельки, транзакции' }
];

const SITE_IDEAS = [
  'Нейросетевая студия видеомонтажа следующего поколения с тарифами и интерактивным демо',
  'Архитектурное бюро органического модернизма с галереей минималистичных вилл',
  'Премиальный бренд швейцарских хронометров с калькулятором сборки на заказ',
  'Платформа квантовых вычислений для биоинженерии и создания лекарств'
];

export const WebsiteStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [businessType, setBusinessType] = useState('saas');
  const [theme, setTheme] = useState('dark');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [generatedSite, setGeneratedSite] = useState<GeneratedSite | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSurpriseMe = () => {
    const randomIdea = SITE_IDEAS[Math.floor(Math.random() * SITE_IDEAS.length)];
    const randomBiz = BUSINESS_PRESETS[Math.floor(Math.random() * BUSINESS_PRESETS.length)].id;
    setPrompt(randomIdea);
    setBusinessType(randomBiz);
  };

  const handleEnhance = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setError(null);
    try {
      const res = await fetch('/api/gen/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: 'landing page website' })
      });
      const data = await res.json();
      if (data.enhancedPrompt) setPrompt(data.enhancedPrompt);
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
      const res = await fetch('/api/gen/website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, businessType, theme })
      });

      const site = await res.json();
      if (!res.ok) throw new Error(site.error || 'Ошибка при генерации сайта');

      setGeneratedSite(site);
      setViewMode('preview');
    } catch (err: any) {
      setError(err.message || 'Ошибка сборки сайта');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = () => {
    if (!generatedSite) return;
    navigator.clipboard.writeText(generatedSite.html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedSite) return;
    const blob = new Blob([generatedSite.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedSite.title.toLowerCase().replace(/\s+/g, '-')}-website.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const [isExportingZip, setIsExportingZip] = useState(false);

  const handleDownloadZip = async () => {
    if (!generatedSite) return;
    setIsExportingZip(true);
    try {
      const zipBlob = await generateAppZip(generatedSite.title, generatedSite.html);
      triggerFileDownload(zipBlob, `${generatedSite.title.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}-website.zip`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Input Column */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Генератор Сайтов и Лендингов</h3>
              <p className="text-xs text-zinc-400">Верстка Tailwind, адаптивность, конверсионные блоки</p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Тематика и задача сайта
                </label>
                <button
                  type="button"
                  onClick={handleEnhance}
                  disabled={!prompt.trim() || isEnhancing || isGenerating}
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-40 transition-colors"
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
                placeholder="Опишите продукт, компанию, уникальные преимущества и целевую аудиторию..."
                rows={4}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/50 rounded-2xl p-4 text-sm text-zinc-100 placeholder-zinc-500 transition-all outline-none resize-none"
              />
            </div>

            {/* Quick Inspiration */}
            <div>
              <span className="text-[11px] text-zinc-500 block mb-2 font-medium">Примеры сайтов:</span>
              <div className="flex flex-wrap gap-1.5">
                {SITE_IDEAS.map((idea, idx) => (
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

            {/* Business Preset */}
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-2.5">
                Тип бизнеса / Индустрия
              </label>
              <div className="grid grid-cols-2 gap-2">
                {BUSINESS_PRESETS.map(b => {
                  const isActive = businessType === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBusinessType(b.id)}
                      className={`text-left p-3 rounded-2xl border transition-all ${
                        isActive
                          ? 'bg-blue-950/30 border-blue-500/60 text-zinc-100 shadow-lg shadow-blue-500/10'
                          : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-xs font-semibold text-zinc-200">{b.label}</div>
                      <div className="text-[10px] text-zinc-500 line-clamp-1">{b.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-red-300 text-xs">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSurpriseMe}
                className="px-3.5 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl text-xs font-semibold flex items-center justify-center transition-colors"
                title="Случайная идея сайта"
              >
                🎲
              </button>
              <button
                type="submit"
                disabled={!prompt.trim() || isGenerating}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Создаем дизайн и верстаем веб-сайт...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Сгенерировать сайт</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Browser Viewport Simulator */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          {/* Viewport & Options Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h4 className="text-base font-semibold text-zinc-100">
                {generatedSite ? generatedSite.title : 'Интерактивный просмотр'}
              </h4>
              <p className="text-xs text-zinc-400">
                {generatedSite
                  ? `${generatedSite.tagline} • ${generatedSite.businessType.toUpperCase()}`
                  : 'Запустите генерацию для создания полноценной адаптивной страницы'}
              </p>
            </div>

            {generatedSite && (
              <div className="flex items-center gap-2">
                {/* Device Viewport Selector */}
                <div className="flex bg-zinc-950 border border-zinc-800 rounded-xl p-0.5">
                  <button
                    onClick={() => setViewport('desktop')}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${
                      viewport === 'desktop' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    title="Десктоп 100%"
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewport('tablet')}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${
                      viewport === 'tablet' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    title="Планшет 768px"
                  >
                    <Tablet className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewport('mobile')}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${
                      viewport === 'mobile' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    title="Смартфон 375px"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>

                {/* View Code / Preview */}
                <button
                  onClick={() => setViewMode(v => v === 'preview' ? 'code' : 'preview')}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>{viewMode === 'preview' ? 'Код' : 'Превью'}</span>
                </button>

                <button
                  onClick={() => setIsFullscreen(f => !f)}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs transition-colors"
                  title="Во весь экран"
                >
                  <Monitor className="w-4 h-4" />
                </button>

                <button
                  onClick={handleCopyCode}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs transition-colors"
                  title="Копировать HTML"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>

                <button
                  onClick={handleDownload}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                  title="Скачать один HTML файл"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                  <span>HTML</span>
                </button>

                <button
                  onClick={handleDownloadZip}
                  disabled={isExportingZip}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shadow-md shadow-blue-600/20"
                  title="Скачать сайт как готовый ZIP архив"
                >
                  {isExportingZip ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileArchive className="w-3.5 h-3.5" />}
                  <span>ZIP архив</span>
                </button>
              </div>
            )}
          </div>

          {/* Fullscreen Website Modal */}
          {isFullscreen && generatedSite && (
            <div className="fixed inset-0 z-50 bg-black/95 p-4 sm:p-6 flex flex-col backdrop-blur-md">
              <div className="flex items-center justify-between mb-3 px-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{generatedSite.title}</span>
                  <span className="text-xs text-zinc-400 font-mono">({generatedSite.businessType})</span>
                </div>
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  ✕ Закрыть полноэкранный режим
                </button>
              </div>
              <div className="flex-1 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950">
                <iframe
                  title="Fullscreen Website"
                  srcDoc={generatedSite.html}
                  sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          )}

          {/* Browser Mockup Window */}
          <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden min-h-[520px] flex flex-col">
            {/* Browser Address Bar */}
            <div className="bg-zinc-900 border-b border-zinc-800/80 px-4 py-2.5 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 max-w-sm mx-auto bg-zinc-950/80 rounded-lg px-3 py-1 text-[11px] text-zinc-400 font-mono text-center truncate border border-zinc-800/50">
                https://{generatedSite ? generatedSite.title.toLowerCase().replace(/[^a-z0-9]/g, '') : 'genesis'}.studio/preview
              </div>
            </div>

            {/* Frame Body */}
            <div className="flex-1 flex items-center justify-center p-2 bg-zinc-950/50 overflow-auto">
              {isGenerating ? (
                <div className="text-center p-8 space-y-4">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                    <div className="absolute inset-2 rounded-full border-2 border-indigo-500/20 border-b-indigo-500 animate-spin-reverse" />
                    <Globe className="w-6 h-6 text-blue-400 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Генерация адаптивного веб-сайта</p>
                    <p className="text-xs text-zinc-500 mt-1">Hero-секция, интерактивные карточки, Tailwind стили, мобильное меню...</p>
                  </div>
                </div>
              ) : generatedSite ? (
                viewMode === 'preview' ? (
                  <div
                    className={`transition-all duration-300 mx-auto bg-black shadow-2xl rounded-lg overflow-hidden ${
                      viewport === 'mobile'
                        ? 'w-[375px] h-[540px] border-4 border-zinc-800 rounded-3xl'
                        : viewport === 'tablet'
                        ? 'w-[768px] h-[540px] border-4 border-zinc-800 rounded-2xl'
                        : 'w-full h-[540px]'
                    }`}
                  >
                    <iframe
                      title="Website Preview"
                      srcDoc={generatedSite.html}
                      sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                      className="w-full h-full border-0 bg-zinc-950"
                    />
                  </div>
                ) : (
                  <div className="w-full h-[540px] overflow-auto p-4 bg-zinc-950 text-zinc-300 font-mono text-xs">
                    <pre>{generatedSite.html}</pre>
                  </div>
                )
              ) : (
                <div className="text-center p-8 space-y-2 text-zinc-500">
                  <Layout className="w-12 h-12 mx-auto stroke-[1.2] opacity-30" />
                  <p className="text-sm text-zinc-400 font-medium">Сайт не сгенерирован</p>
                  <p className="text-xs text-zinc-600 max-w-sm mx-auto">
                    Опишите проект и выберите индустрию для мгновенной генерации сайта с версткой под ключ.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
