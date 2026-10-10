import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Video,
  Sparkles,
  ExternalLink,
  Flame,
  Music,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Copy,
  Check,
  Wand2,
  Loader2,
  Play,
  Square,
  TrendingUp,
  Hash,
  Eye,
  Sliders,
  Layers,
  ChevronRight,
  Disc
} from 'lucide-react';

interface TikTokBlueprint {
  title: string;
  hook: {
    firstThreeSeconds: string;
    hookType: string;
    onScreenText: string;
  };
  soundRecommendation: {
    vibe: string;
    bpm: number;
    suggestedTrack: string;
    soundSyncPoints: string[];
  };
  scenes: Array<{
    time: string;
    visual: string;
    audioSpeech: string;
    textOverlay: string;
    transition: string;
  }>;
  hashtags: string[];
  captionText: string;
  studioSettings: {
    aspectRatio: string;
    frameRate: string;
    safeZoneNotice: string;
  };
  viralityScore: number;
}

const DEFAULT_BLUEPRINT: TikTokBlueprint = {
  title: "AI Revolutions 2026: The Viral Creator Pipeline",
  hook: {
    firstThreeSeconds: "Перестань монтировать видео часами! Этот инструмент делает всё за 10 секунд.",
    hookType: "Pattern Interrupt & Curiosity Gap",
    onScreenText: "СТОП СКРОЛЛ! 🛑 ЭТО МЕНЯЕТ ВСЁ"
  },
  soundRecommendation: {
    vibe: "Aggressive Viral Phonk / High-Energy Synth",
    bpm: 132,
    suggestedTrack: "Phonk Night Drive - Speed Up Mix",
    soundSyncPoints: ["Drop transition at 0:03", "Beat drop impact at 0:14"]
  },
  scenes: [
    {
      time: "0:00 - 0:03",
      visual: "Быстрый зум в экран с ярким визуальным глитчем",
      audioSpeech: "95% авторов до сих пор не знают о новой связке нейросетей!",
      textOverlay: "СЕКРЕТ ТИКТОКА ⚡️",
      transition: "Whip Pan Left"
    },
    {
      time: "0:03 - 0:12",
      visual: "Показ генерации видео с динамической физикой камеры Higgsfield & Omni",
      audioSpeech: "Смотрите: загружаем фото, выбираем траекторию камеры — и кинематографичный ролик готов.",
      textOverlay: "1 КЛИК = КИНО 🎥",
      transition: "Fast Zoom In"
    },
    {
      time: "0:12 - 0:22",
      visual: "Синхронизация музыки через Flow Music и наложение нейро-аватара",
      audioSpeech: "Добавляем трек сгенерированный в Lyria 3 и говорящего виртуального спикера без съемок.",
      textOverlay: "НЕЙРО-АВАТАР + САУНД 🎧",
      transition: "Glitch Flash"
    },
    {
      time: "0:22 - 0:30",
      visual: "Финальный результат в формате 9:16 со стрелкой на комментарии",
      audioSpeech: "Сохраняй прямо сейчас, пока этот алгоритм взлетает в топ! Ссылка в профиле.",
      textOverlay: "СОХРАНИ В ЗАКЛАДКИ! 📌",
      transition: "Infinite Loop Jumpcut"
    }
  ],
  hashtags: ["#fyp", "#tiktokstudio", "#тренды", "#нейросети", "#reels", "#viralvideo", "#shortform"],
  captionText: "Как вам такой результат без съемочной группы? Сохраняй чтобы не потерять и пиши в комменты, что протестировать дальше! 👇⚡️",
  studioSettings: {
    aspectRatio: "9:16 (1080x1920)",
    frameRate: "60 fps",
    safeZoneNotice: "Текст размещен строго по безопасной зоне TikTok (Safe Area)"
  },
  viralityScore: 97
};

export const TikTokStudio: React.FC = () => {
  const [topic, setTopic] = useState('Трендовое видео про нейросети и создание контента');
  const [niche, setNiche] = useState('tech');
  const [durationSec, setDurationSec] = useState(30);
  const [loading, setLoading] = useState(false);
  const [blueprint, setBlueprint] = useState<TikTokBlueprint>(DEFAULT_BLUEPRINT);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Simulation controls
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);

  // Simulate scene progression in 9:16 player
  useEffect(() => {
    if (!isPlaying || !blueprint.scenes.length) return;
    const interval = setInterval(() => {
      setActiveSceneIdx(prev => (prev + 1) % blueprint.scenes.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPlaying, blueprint.scenes.length]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/gen/tiktok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          niche,
          durationSec
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      setBlueprint(data);
      setActiveSceneIdx(0);
    } catch (err) {
      console.error('Error generating TikTok blueprint:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const activeScene = blueprint.scenes[activeSceneIdx] || blueprint.scenes[0];

  return (
    <div className="space-y-8">
      {/* Top Banner with Direct TikTok Studio Link */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-pink-950/40 border border-pink-500/30 p-6 sm:p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-pink-500/15 border border-pink-500/30 text-pink-300 mb-3">
              <Flame className="w-3.5 h-3.5 text-pink-400" />
              <span>Official TikTok Creator Studio Integration</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <span>TikTok</span>
              <span className="bg-gradient-to-r from-cyan-400 via-pink-500 to-rose-400 bg-clip-text text-transparent">
                Studio
              </span>
            </h1>
            <p className="mt-2 text-sm text-zinc-300 max-w-2xl leading-relaxed">
              Генерация вирусных 9:16 сценариев, хуков удержания первых 3 секунд, подбор трендовых треков и оптимизация для алгоритмов TikTok и Shorts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://www.tiktok.com/tiktokstudio"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 hover:from-pink-500 hover:to-rose-500 text-white text-sm font-bold shadow-lg shadow-pink-600/30 transition-all cursor-pointer group"
            >
              <span>Открыть TikTok Studio</span>
              <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Controls & Blueprint (7 cols), Right 9:16 TikTok Simulator (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Generator Form & Blueprint */}
        <div className="lg:col-span-7 space-y-6">
          {/* Controls Card */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
            <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>Генератор вирусной концепции для TikTok</span>
            </h2>

            <div>
              <label className="text-xs text-zinc-400 block mb-1.5 font-medium">Тема или идея ролика</label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Например: Как делать кинематографичные видео за 10 секунд..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5 font-medium">Ниша / Категория</label>
                <select
                  value={niche}
                  onChange={e => setNiche(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-pink-500"
                >
                  <option value="tech">ИИ & Технологии (Tech)</option>
                  <option value="business">Бизнес & Заработок</option>
                  <option value="lifestyle">Лайфстайл & Влог</option>
                  <option value="ecommerce">Товарный бизнес & Распаковки</option>
                  <option value="education">Обучение & Лайфхаки</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1.5 font-medium">Хронометраж</label>
                <div className="flex bg-zinc-950 border border-zinc-800 rounded-xl p-1">
                  {[15, 30, 60].map(s => (
                    <button
                      key={s}
                      onClick={() => setDurationSec(s)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        durationSec === s ? 'bg-pink-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {s}с
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-pink-600/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Создание сценария TikTok Studio...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Сгенерировать TikTok Blueprint</span>
                </>
              )}
            </button>
          </div>

          {/* Hook & Retention Analyzer Card */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Хук первых 3 секунд (Stop-Scroll Engine)</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                Score: {blueprint.viralityScore}/100
              </span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-semibold text-pink-400">{blueprint.hook.hookType}</span>
                <span className="text-[11px] font-mono">0:00 - 0:03</span>
              </div>
              <p className="text-sm font-bold text-zinc-100 italic">
                "{blueprint.hook.firstThreeSeconds}"
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
                <span className="text-zinc-400">Текст на экране:</span>
                <span className="font-mono font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  {blueprint.hook.onScreenText}
                </span>
              </div>
            </div>

            {/* Trending Audio Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/30 to-blue-950/30 border border-cyan-800/40 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-cyan-300">
                    {blueprint.soundRecommendation.suggestedTrack}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {blueprint.soundRecommendation.vibe} • {blueprint.soundRecommendation.bpm} BPM
                  </div>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(blueprint.soundRecommendation.suggestedTrack, 'audio')}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
              >
                {copiedText === 'audio' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Копия</span>
              </button>
            </div>
          </div>

          {/* Scene Breakdown */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
            <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-pink-400" />
              <span>Покадровый таймлайн (Storyboard)</span>
            </h2>

            <div className="space-y-3">
              {blueprint.scenes.map((sc, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveSceneIdx(idx)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    activeSceneIdx === idx
                      ? 'border-pink-500 bg-pink-500/10 shadow'
                      : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono font-bold text-pink-400">{sc.time}</span>
                    <span className="text-[11px] font-mono text-zinc-400">{sc.transition}</span>
                  </div>
                  <div className="text-xs font-semibold text-zinc-200 mb-1">
                    {sc.audioSpeech}
                  </div>
                  <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                    <span>Кадр: {sc.visual}</span>
                    <span className="font-mono text-amber-300 font-bold bg-zinc-900 px-1.5 py-0.5 rounded">
                      {sc.textOverlay}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Hashtags and Description */}
            <div className="pt-3 border-t border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium">Хэштеги и описание для TikTok:</span>
                <button
                  onClick={() => copyToClipboard(`${blueprint.captionText}\n\n${blueprint.hashtags.join(' ')}`, 'caption')}
                  className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1 cursor-pointer font-semibold"
                >
                  {copiedText === 'caption' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Скопировать всё описание</span>
                </button>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-2">
                <p>{blueprint.captionText}</p>
                <div className="flex flex-wrap gap-1">
                  {blueprint.hashtags.map((tag, i) => (
                    <span key={i} className="text-cyan-400 font-mono font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive 9:16 TikTok Vertical Phone Simulator (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="sticky top-24 w-full max-w-[340px]">
            {/* Phone Bezel */}
            <div className="relative rounded-[40px] border-4 border-zinc-700 bg-zinc-950 p-2 shadow-2xl shadow-pink-500/10">
              {/* Dynamic Island / Notch */}
              <div className="absolute top-4 inset-x-0 mx-auto w-24 h-4 bg-zinc-800 rounded-full z-30" />

              {/* 9:16 Screen Viewport */}
              <div className="relative aspect-[9/16] w-full rounded-[32px] overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-950 to-black flex flex-col justify-between p-4">
                {/* Simulated Visual Content */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60 z-10" />

                {/* Simulated dynamic background animation */}
                <div className="absolute inset-0 z-0 overflow-hidden flex items-center justify-center">
                  <div className="w-full h-full bg-gradient-to-tr from-pink-950/40 via-purple-950/30 to-cyan-950/40 animate-pulse" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-300">
                      <Video className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
                        Сцена {activeSceneIdx + 1} из {blueprint.scenes.length}
                      </div>
                      <div className="text-sm font-bold text-zinc-200">
                        {activeScene?.visual}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Overlay: Following / For You Tabs */}
                <div className="relative z-20 flex items-center justify-center gap-4 text-xs font-bold pt-6 text-zinc-400 select-none">
                  <span>Подписки</span>
                  <span className="text-white border-b-2 border-white pb-0.5">Для вас</span>
                </div>

                {/* Big Center Text Overlay (TikTok Style) */}
                <div className="relative z-20 my-auto text-center px-4">
                  <motion.div
                    key={activeSceneIdx}
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-block bg-black/80 border border-amber-400/80 px-3.5 py-2 rounded-xl text-sm font-black text-amber-300 uppercase tracking-wide shadow-2xl backdrop-blur-md"
                  >
                    {activeScene?.textOverlay}
                  </motion.div>
                </div>

                {/* Right Action Bar (TikTok UI) */}
                <div className="absolute right-3 bottom-20 z-20 flex flex-col items-center gap-4">
                  {/* Creator Profile Bubble */}
                  <div className="relative w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-zinc-800">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                      alt="creator"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 right-0 left-0 bg-pink-600 text-[8px] font-bold text-center text-white">
                      +
                    </div>
                  </div>

                  {/* Likes */}
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-zinc-800/80 backdrop-blur-md flex items-center justify-center text-rose-500">
                      <Heart className="w-5 h-5 fill-rose-500" />
                    </div>
                    <span className="text-[10px] font-bold text-white mt-1">124.8K</span>
                  </div>

                  {/* Comments */}
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-zinc-800/80 backdrop-blur-md flex items-center justify-center text-white">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-white mt-1">1,842</span>
                  </div>

                  {/* Bookmark */}
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-zinc-800/80 backdrop-blur-md flex items-center justify-center text-amber-400">
                      <Bookmark className="w-5 h-5 fill-amber-400" />
                    </div>
                    <span className="text-[10px] font-bold text-white mt-1">42.1K</span>
                  </div>

                  {/* Share */}
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-zinc-800/80 backdrop-blur-md flex items-center justify-center text-white">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-white mt-1">Share</span>
                  </div>

                  {/* Spinning Vinyl Record */}
                  <div className="w-10 h-10 rounded-full bg-zinc-950 border-2 border-zinc-700 flex items-center justify-center animate-spin">
                    <Disc className="w-6 h-6 text-pink-400" />
                  </div>
                </div>

                {/* Bottom Overlay: Handle, Caption, Sound Marquee */}
                <div className="relative z-20 space-y-2 pr-14 pb-2">
                  <div className="text-xs font-bold text-white">@genesis.creator</div>
                  <div className="text-[11px] text-zinc-200 line-clamp-2 leading-relaxed">
                    {blueprint.captionText}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-300 font-medium">
                    <Music className="w-3 h-3 text-pink-400" />
                    <span className="truncate">{blueprint.soundRecommendation.suggestedTrack}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Publish to TikTok Studio Button */}
            <div className="mt-4 text-center">
              <a
                href="https://www.tiktok.com/tiktokstudio"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-pink-500/40 text-pink-300 text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <span>Опубликовать в TikTok Studio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
