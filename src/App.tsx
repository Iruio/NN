import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Image as ImageIcon,
  Film,
  Music,
  Code,
  Globe,
  Brain,
  Sparkles,
  Layers,
  ChevronRight,
  Cpu,
  UserCheck,
  Flame,
  Terminal,
  ExternalLink,
  Megaphone,
  Bot,
  Clapperboard,
  Disc,
  ListMusic,
  Sliders,
  Download,
  FileArchive,
  Smartphone,
  X,
  Loader2
} from 'lucide-react';
import { downloadFullProjectZip } from './utils/exporter.js';

import { ImageStudio } from './components/ImageStudio.js';
import { VideoStudio } from './components/VideoStudio.js';
import { MusicStudio } from './components/MusicStudio.js';
import { RemixStudio } from './components/RemixStudio.js';
import { MixStudio } from './components/MixStudio.js';
import { DjControllerStudio } from './components/DjControllerStudio.js';
import { MusicVideoStudio } from './components/MusicVideoStudio.js';
import { AdStudio } from './components/AdStudio.js';
import { BotStudio } from './components/BotStudio.js';
import { AvatarStudio } from './components/AvatarStudio.js';
import { TikTokStudio } from './components/TikTokStudio.js';
import { AiStudioModule } from './components/AiStudioModule.js';
import { AppStudio } from './components/AppStudio.js';
import { WebsiteStudio } from './components/WebsiteStudio.js';
import { AiAgentStudio } from './components/AiAgentStudio.js';

type StudioModule = 'photo' | 'video' | 'music' | 'remix' | 'mix' | 'dj' | 'music_video' | 'ads' | 'bots' | 'avatar' | 'tiktok' | 'aistudio' | 'app' | 'website' | 'ai';

interface ModuleConfig {
  id: StudioModule;
  label: string;
  subLabel: string;
  icon: React.ElementType;
  badge: string;
  gradient: string;
  activeColor: string;
}

const MODULES: ModuleConfig[] = [
  {
    id: 'ads',
    label: 'Реклама',
    subLabel: 'Ads & Hooks & Banners',
    icon: Megaphone,
    badge: 'Performance Ad',
    gradient: 'from-rose-500 to-red-600',
    activeColor: 'border-rose-500 text-rose-400 bg-rose-500/10'
  },
  {
    id: 'bots',
    label: 'Боты',
    subLabel: 'Telegram & Discord AI',
    icon: Bot,
    badge: 'Bot Forge',
    gradient: 'from-emerald-500 to-teal-600',
    activeColor: 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
  },
  {
    id: 'music_video',
    label: 'Клипы',
    subLabel: 'Beat & Lip-Sync MV',
    icon: Clapperboard,
    badge: 'Style & Face Lock',
    gradient: 'from-violet-600 to-pink-600',
    activeColor: 'border-violet-500 text-violet-400 bg-violet-500/10'
  },
  {
    id: 'remix',
    label: 'Ремиксы',
    subLabel: 'AI Stem Remixing',
    icon: Disc,
    badge: 'Any Style & Stems',
    gradient: 'from-fuchsia-600 to-pink-600',
    activeColor: 'border-fuchsia-500 text-fuchsia-400 bg-fuchsia-500/10'
  },
  {
    id: 'mix',
    label: 'Миксы',
    subLabel: 'Track Mashup & Mix',
    icon: ListMusic,
    badge: 'Camelot Wheel',
    gradient: 'from-cyan-600 to-blue-600',
    activeColor: 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
  },
  {
    id: 'dj',
    label: 'DJ Контроллер',
    subLabel: 'Dual Deck Live Mixer',
    icon: Sliders,
    badge: 'DDJ Controller',
    gradient: 'from-emerald-500 to-teal-600',
    activeColor: 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
  },
  {
    id: 'photo',
    label: 'Фото',
    subLabel: 'Photo & Image',
    icon: ImageIcon,
    badge: 'Nano Banana',
    gradient: 'from-pink-500 to-rose-500',
    activeColor: 'border-pink-500 text-pink-400 bg-pink-500/10'
  },
  {
    id: 'video',
    label: 'Видео',
    subLabel: 'Video & Higgsfield',
    icon: Film,
    badge: 'Omni & Higgsfield',
    gradient: 'from-amber-500 to-orange-500',
    activeColor: 'border-amber-500 text-amber-400 bg-amber-500/10'
  },
  {
    id: 'music',
    label: 'Музыка',
    subLabel: 'AI Nano • Flow • Treblo',
    icon: Music,
    badge: 'AI Nano & Flow',
    gradient: 'from-violet-500 to-indigo-500',
    activeColor: 'border-violet-500 text-violet-400 bg-violet-500/10'
  },
  {
    id: 'avatar',
    label: 'Нейро Аватары',
    subLabel: 'Talking Digital Humans',
    icon: UserCheck,
    badge: 'Digital Twin',
    gradient: 'from-purple-500 to-pink-500',
    activeColor: 'border-purple-500 text-purple-400 bg-purple-500/10'
  },
  {
    id: 'tiktok',
    label: 'TikTok Studio',
    subLabel: '9:16 Viral Reels',
    icon: Flame,
    badge: 'TikTok Studio',
    gradient: 'from-pink-600 to-rose-600',
    activeColor: 'border-pink-600 text-pink-400 bg-pink-600/10'
  },
  {
    id: 'aistudio',
    label: 'AI Studio',
    subLabel: 'Google AI Studio IDE',
    icon: Terminal,
    badge: 'ai.studio',
    gradient: 'from-blue-500 to-cyan-500',
    activeColor: 'border-blue-500 text-blue-400 bg-blue-500/10'
  },
  {
    id: 'app',
    label: 'Приложения',
    subLabel: 'Web Apps & Games',
    icon: Code,
    badge: 'Code Engine',
    gradient: 'from-emerald-500 to-teal-500',
    activeColor: 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
  },
  {
    id: 'website',
    label: 'Сайты',
    subLabel: 'Landing & Web',
    icon: Globe,
    badge: 'Tailwind 3/4',
    gradient: 'from-blue-500 to-cyan-500',
    activeColor: 'border-blue-500 text-blue-400 bg-blue-500/10'
  },
  {
    id: 'ai',
    label: 'Новые ИИ',
    subLabel: 'AI Agent Forge',
    icon: Brain,
    badge: 'Genesis Core',
    gradient: 'from-purple-500 to-fuchsia-500',
    activeColor: 'border-purple-500 text-purple-400 bg-purple-500/10'
  }
];

export default function App() {
  const [activeModule, setActiveModule] = useState<StudioModule>('photo');
  const [showExportModal, setShowExportModal] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [isDownloadingApk, setIsDownloadingApk] = useState(false);

  const activeConfig = MODULES.find(m => m.id === activeModule) || MODULES[0];

  const handleDownloadZip = () => {
    setIsDownloadingZip(true);
    const a = document.createElement('a');
    a.href = '/genesis-studio-project.zip';
    a.download = 'genesis-studio-project.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setIsDownloadingZip(false), 1200);
  };

  const handleDownloadApk = () => {
    setIsDownloadingApk(true);
    const a = document.createElement('a');
    a.href = '/genesis-studio.apk';
    a.download = 'genesis-studio.apk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setIsDownloadingApk(false), 1200);
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-violet-500/30 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-violet-600 to-cyan-400 p-[1.5px] shadow-lg shadow-violet-500/20">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                  GENESIS <span className="text-zinc-500 font-medium">STUDIO</span>
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-900 border border-zinc-700/60 text-zinc-300">
                  v3.8 Multi-Gen
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Студия генерации рекламы, ботов, музыкальных клипов, фото, видео, музыки и приложений
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Export ZIP / APK Button */}
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-fuchsia-600/20 cursor-pointer transition-all active:scale-95 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Экспорт ZIP / APK</span>
            </button>

            {/* Module Selector Navigation Tabs */}
            <nav className="flex items-center gap-1.5 overflow-x-auto p-1 bg-zinc-900/90 border border-zinc-800 rounded-2xl max-w-full">
              {MODULES.map(m => {
                const Icon = m.icon;
                const isActive = activeModule === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveModule(m.id)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? `bg-zinc-100 text-zinc-950 shadow-md font-bold scale-[1.02]`
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Quick Portal Shortcuts Bar */}
        <div className="max-w-7xl mx-auto pt-2.5 mt-2 border-t border-zinc-800/40 flex items-center gap-2 overflow-x-auto text-[11px] text-zinc-400">
          <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-wider">Интегрированные платформы:</span>
          <a
            href="https://www.flowmusic.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 hover:bg-cyan-900/50 transition-colors whitespace-nowrap"
          >
            <span>Flow Music (flowmusic.app)</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <a
            href="https://ai.studio"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-950/40 border border-blue-800/40 text-blue-300 hover:bg-blue-900/50 transition-colors whitespace-nowrap"
          >
            <span>Google AI Studio (ai.studio)</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <a
            href="https://higgsfield.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-950/40 border border-orange-800/40 text-orange-300 hover:bg-orange-900/50 transition-colors whitespace-nowrap"
          >
            <span>Higgsfield AI (higgsfield.ai)</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <a
            href="https://www.tiktok.com/tiktokstudio"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-950/40 border border-pink-800/40 text-pink-300 hover:bg-pink-900/50 transition-colors whitespace-nowrap"
          >
            <span>TikTok Studio (tiktokstudio)</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <a
            href="https://ainanomusic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 hover:bg-emerald-900/50 transition-colors whitespace-nowrap"
          >
            <span>AI Nano Music (ainanomusic.com)</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {activeModule === 'ads' && <AdStudio />}
            {activeModule === 'bots' && <BotStudio />}
            {activeModule === 'music_video' && <MusicVideoStudio />}
            {activeModule === 'remix' && <RemixStudio />}
            {activeModule === 'mix' && <MixStudio />}
            {activeModule === 'dj' && <DjControllerStudio />}
            {activeModule === 'photo' && <ImageStudio />}
            {activeModule === 'video' && <VideoStudio />}
            {activeModule === 'music' && <MusicStudio />}
            {activeModule === 'avatar' && <AvatarStudio />}
            {activeModule === 'tiktok' && <TikTokStudio />}
            {activeModule === 'aistudio' && <AiStudioModule />}
            {activeModule === 'app' && <AppStudio />}
            {activeModule === 'website' && <WebsiteStudio />}
            {activeModule === 'ai' && <AiAgentStudio />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="border-t border-zinc-800/60 bg-zinc-950/80 px-6 py-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Все генеративные модули активны и готовы к работе</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <a href="https://www.flowmusic.app" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Flow Music (flowmusic.app)</a>
            <span>•</span>
            <a href="https://ai.studio" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">AI Studio (ai.studio)</a>
            <span>•</span>
            <a href="https://higgsfield.ai" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">Higgsfield AI (higgsfield.ai)</a>
            <span>•</span>
            <a href="https://www.tiktok.com/tiktokstudio" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors">TikTok Studio</a>
            <span>•</span>
            <a href="https://ainanomusic.com" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">AI Nano Music (ainanomusic.com)</a>
          </div>
        </div>
      </footer>

      {/* Export ZIP & APK Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Экспорт Проекта: ZIP & APK</h3>
                  <p className="text-xs text-zinc-400">Скачивание полного исходного кода и мобильного приложения</p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Export Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Full ZIP */}
              <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-4 hover:border-violet-500/50 transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
                    <FileArchive className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">ZIP Архив Проекта</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Полный архив со всеми исходными файлами, компонентами React 19, сервером Express, Tailwind CSS, аудио-движком и конфигурацией.
                  </p>
                </div>
                <button
                  onClick={handleDownloadZip}
                  disabled={isDownloadingZip}
                  className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDownloadingZip ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Сборка ZIP...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Скачать ZIP (.zip)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Option 2: Android APK */}
              <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-4 hover:border-emerald-500/50 transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Android APK Пакет</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Мобильный пакет приложения (.apk) с AndroidManifest.xml, нативной WebView обвязкой, ресурсами и готовым Android Studio Gradle проектом.
                  </p>
                </div>
                <button
                  onClick={handleDownloadApk}
                  disabled={isDownloadingApk}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDownloadingApk ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Генерация APK...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Скачать APK (.apk)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Android APK Guide */}
            <div className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-800/80 space-y-1.5 text-xs text-zinc-400">
              <h5 className="font-bold text-zinc-200 flex items-center gap-1.5 text-xs">
                <span>📱 Инструкция по установке APK на Android:</span>
              </h5>
              <ol className="list-decimal list-inside space-y-0.5 text-[11px] leading-relaxed text-zinc-400">
                <li>Нажмите <strong>«Скачать APK»</strong> и сохраните файл на телефон.</li>
                <li>Разрешите <em>«Установку из этого источника / неизвестных приложений»</em> в настройках Android.</li>
                <li>Нажмите на загруженный файл и подтвердите <strong>«Установить»</strong>.</li>
              </ol>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
