import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Sparkles,
  Play,
  Square,
  Volume2,
  Wand2,
  Loader2,
  Download,
  Copy,
  Check,
  Mic,
  Camera,
  Layers,
  Sliders,
  Smile,
  Globe,
  Radio,
  Share2,
  ExternalLink,
  Upload,
  RefreshCw,
  Video
} from 'lucide-react';

interface PresetAvatar {
  id: string;
  name: string;
  role: string;
  gender: 'female' | 'male';
  voiceLang: string;
  image: string;
  description: string;
  styleBadge: string;
  defaultScript: string;
}

const PRESET_AVATARS: PresetAvatar[] = [
  {
    id: 'aurora',
    name: 'Аврора',
    role: 'AI Tech Evangelist',
    gender: 'female',
    voiceLang: 'ru-RU',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    description: 'Инновационный спикер, презентации технологий, стартапы и продуктовые запуски',
    styleBadge: 'Студийный свет • 85mm',
    defaultScript: 'Приветствую! Я ваш цифровой аватар Аврора. Я готова озвучить презентацию, провести вебинар или создать вирусный рилс с идеальной синхронизацией губ и живой мимикой.'
  },
  {
    id: 'marcus',
    name: 'Маркус',
    role: 'Executive & Brand Ambassador',
    gender: 'male',
    voiceLang: 'ru-RU',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    description: 'Премиальный стиль, корпоративные отчеты, деловые обращения и инвестиционные питчи',
    styleBadge: 'Бизнес-портрет • 4K',
    defaultScript: 'Добро пожаловать в новую эру синтетических медиа. С нейро-аватарами ваши проекты говорят на любых языках с непревзойденной уверенностью и реализмом.'
  },
  {
    id: 'elena',
    name: 'Елена',
    role: 'News Anchor & Science Reporter',
    gender: 'female',
    voiceLang: 'ru-RU',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    description: 'Ведущая новостей, образовательные дайджесты, научные и финансовые обзоры',
    styleBadge: 'Телестудия • Broadcast',
    defaultScript: 'В эфире главные обновления искусственного интеллекта. Сегодня мы объединяем генерацию видео, синтез музыки и фотореалистичных виртуальных ведущих.'
  },
  {
    id: 'neon',
    name: 'Кай',
    role: 'Cyberpunk Streamer & TikTok Host',
    gender: 'male',
    voiceLang: 'ru-RU',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    description: 'Динамичный ведущий для TikTok, Shorts, игровых каналов и креативных сообществ',
    styleBadge: 'Неоновый стиль • 60fps',
    defaultScript: 'Йоу! Это новая студия генерации контента. Никаких съемочных групп и дорогих студий — только чистый креатив нейросетей за секунды.'
  }
];

export const AvatarStudio: React.FC = () => {
  const [selectedAvatar, setSelectedAvatar] = useState<PresetAvatar>(PRESET_AVATARS[0]);
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [scriptText, setScriptText] = useState(PRESET_AVATARS[0].defaultScript);
  const [language, setLanguage] = useState<'ru' | 'en'>('ru');
  const [voiceTone, setVoiceTone] = useState<string>('confident');
  const [lookStyle, setLookStyle] = useState<string>('photorealistic');

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [avatarData, setAvatarData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Playback & Animation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0);
  const [headTilt, setHeadTilt] = useState(0);
  const [eyeBlink, setEyeBlink] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle avatar switch
  const handleSelectAvatar = (av: PresetAvatar) => {
    setSelectedAvatar(av);
    setCustomPhoto(null);
    setScriptText(av.defaultScript);
    stopSpeech();
  };

  const activeImage = customPhoto || selectedAvatar.image;

  // Custom photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCustomPhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate / Enhance via AI backend
  const handleGenerate = async () => {
    if (!scriptText.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/gen/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: scriptText,
          role: selectedAvatar.role,
          voiceStyle: voiceTone,
          language,
          lookStyle
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      setAvatarData(data);
      if (data.speechScript) {
        setScriptText(data.speechScript);
      }
    } catch (err) {
      console.error('Error generating avatar data:', err);
    } finally {
      setGenerating(false);
    }
  };

  // Web Speech Synthesis talking avatar simulation with mouth viseme animation
  const startSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser');
      return;
    }
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(scriptText);
    utterance.lang = language === 'ru' ? 'ru-RU' : 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = selectedAvatar.gender === 'female' ? 1.15 : 0.9;

    // Pick voices if available
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(language === 'ru' ? 'ru' : 'en'));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      startLipSyncLoop();
    };

    utterance.onend = () => {
      stopSpeech();
    };

    utterance.onerror = () => {
      stopSpeech();
    };

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setMouthOpen(0);
    setHeadTilt(0);
    setAudioLevel(0);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  };

  // Viseme & facial animation loop
  const startLipSyncLoop = () => {
    let tick = 0;
    const animate = () => {
      tick++;
      // Simulating natural speech cadence with pseudo syllables
      const mouthCycle = Math.sin(tick * 0.35) * Math.cos(tick * 0.15);
      const intensity = Math.max(0, mouthCycle * 0.7 + 0.3);
      setMouthOpen(intensity);
      setAudioLevel(Math.min(100, Math.floor(intensity * 100)));

      // Subtle breathing & head sway
      const sway = Math.sin(tick * 0.05) * 2;
      setHeadTilt(sway);

      // Natural eye blinking every ~120 frames
      if (tick % 130 > 125) {
        setEyeBlink(true);
      } else {
        setEyeBlink(false);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950/70 via-zinc-900 to-indigo-950/60 border border-purple-800/40 p-6 sm:p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-300 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Neural Digital Twin & Talking Avatar Engine</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Создание <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-300 bg-clip-text text-transparent">Нейро-Аватаров</span>
            </h1>
            <p className="mt-2 text-sm text-zinc-300 max-w-2xl leading-relaxed">
              Генерация фотореалистичных виртуальных спикеров, цифровых двойников и говорящих ведущих с живой мимикой, естественной артикуляцией и студийным звучанием.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-sm font-medium text-zinc-200 transition-all cursor-pointer shadow-sm"
            >
              <Upload className="w-4 h-4 text-purple-400" />
              <span>Загрузить свое фото</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Preset Avatars & Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Avatar Selector */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <User className="w-4 h-4 text-purple-400" />
                <span>Выберите аватар или загрузите лицо</span>
              </h2>
              {customPhoto && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Пользовательское фото
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {PRESET_AVATARS.map(av => {
                const isSelected = selectedAvatar.id === av.id && !customPhoto;
                return (
                  <button
                    key={av.id}
                    onClick={() => handleSelectAvatar(av)}
                    className={`relative text-left p-2.5 rounded-xl border transition-all cursor-pointer group flex flex-col gap-2 ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10'
                        : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700 hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-zinc-900">
                      <img
                        src={av.image}
                        alt={av.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="text-xs font-bold text-white flex items-center justify-between">
                          <span>{av.name}</span>
                          <span className="text-[10px] text-purple-300 font-mono">
                            {av.gender === 'female' ? 'Жен' : 'Муж'}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-300 truncate">{av.role}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice & Dialect Settings */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
            <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>Параметры речи и артикуляции</span>
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5 font-medium">Язык озвучки</label>
                <div className="flex bg-zinc-950 border border-zinc-800 rounded-xl p-1">
                  <button
                    onClick={() => setLanguage('ru')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      language === 'ru' ? 'bg-purple-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Русский (RU)
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      language === 'en' ? 'bg-purple-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    English (EN)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1.5 font-medium">Тональность голоса</label>
                <select
                  value={voiceTone}
                  onChange={e => setVoiceTone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="confident">Уверенный & Харизматичный</option>
                  <option value="warm">Теплый & Дружелюбный</option>
                  <option value="professional">Деловой & Студийный</option>
                  <option value="energetic">Энергичный (TikTok / Reels)</option>
                  <option value="calm">Спокойный медитативный</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1.5 font-medium">Стиль рендеринга внешности</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'photorealistic', label: '8K Realism' },
                  { id: 'cyberpunk', label: 'Cyberpunk' },
                  { id: 'broadcast', label: 'TV Studio' }
                ].map(style => (
                  <button
                    key={style.id}
                    onClick={() => setLookStyle(style.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      lookStyle === style.id
                        ? 'border-purple-500 bg-purple-500/20 text-purple-200 font-bold'
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Talking Canvas & Script Director (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live Talking Avatar Canvas */}
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Viewport Frame */}
            <div className="relative aspect-video sm:aspect-[16/10] w-full bg-zinc-950 flex items-center justify-center overflow-hidden">
              {/* Avatar Portrait with dynamic Lip-Sync & Motion */}
              <div
                className="relative w-full h-full flex items-center justify-center transition-transform duration-100 ease-out"
                style={{
                  transform: `rotate(${headTilt}deg) scale(${isPlaying ? 1.02 : 1})`
                }}
              >
                <img
                  src={activeImage}
                  alt={selectedAvatar.name}
                  className="w-full h-full object-cover sm:object-contain object-center select-none"
                />

                {/* Subtle dynamic lighting overlay synced with voice */}
                <div
                  className="absolute inset-0 pointer-events-none transition-opacity duration-75"
                  style={{
                    background: `radial-gradient(circle at 50% 40%, rgba(168, 85, 247, ${
                      isPlaying ? 0.15 + (mouthOpen * 0.1) : 0.05
                    }) 0%, transparent 70%)`
                  }}
                />

                {/* Live Mouth Viseme Marker / Overlay during speech */}
                {isPlaying && (
                  <div
                    className="absolute pointer-events-none transition-all duration-75 ease-out rounded-full bg-purple-500/20 border border-purple-400/50 backdrop-blur-[1px]"
                    style={{
                      top: '58%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: `${34 + mouthOpen * 18}px`,
                      height: `${12 + mouthOpen * 24}px`,
                      boxShadow: `0 0 ${12 + mouthOpen * 20}px rgba(168, 85, 247, 0.4)`
                    }}
                  />
                )}

                {/* Eye Blink simulation overlay */}
                {eyeBlink && (
                  <div
                    className="absolute pointer-events-none bg-zinc-900/60 rounded-full"
                    style={{
                      top: '41%',
                      left: '42%',
                      width: '40px',
                      height: '4px'
                    }}
                  />
                )}
              </div>

              {/* Status & Live Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-black/60 border border-white/10 text-white backdrop-blur-md">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-purple-400'
                    }`}
                  />
                  <span>{isPlaying ? 'REC • LIVE TALKING' : 'STANDBY'}</span>
                </span>

                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-purple-950/80 border border-purple-700/60 text-purple-300 backdrop-blur-md">
                  Viseme: {isPlaying ? `${Math.round(mouthOpen * 100)}%` : '0%'}
                </span>
              </div>

              {/* Audio Waveform / VU Meter in canvas */}
              {isPlaying && (
                <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/60 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
                  <Volume2 className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                  <div className="flex items-end gap-0.5 h-4 w-16">
                    {[30, 80, 45, 95, 60, 100, 70, 50].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-purple-400 rounded-full transition-all duration-75"
                        style={{
                          height: `${Math.max(15, (h * audioLevel) / 100)}%`
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Canvas Controls */}
              <div className="absolute bottom-4 inset-x-4 flex items-center justify-between gap-4 bg-zinc-950/85 border border-zinc-800/80 p-3 rounded-2xl backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <button
                    onClick={isPlaying ? stopSpeech : startSpeech}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg ${
                      isPlaying
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Square className="w-4 h-4 fill-white" />
                        <span>Стоп</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>Запустить речь</span>
                      </>
                    )}
                  </button>

                  <div className="hidden sm:block text-xs text-zinc-400">
                    <span className="font-semibold text-zinc-200">
                      {customPhoto ? 'Персональный Аватар' : selectedAvatar.name}
                    </span>
                    <span className="mx-1.5">•</span>
                    <span>{language === 'ru' ? 'Русская дорожка' : 'English Track'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(scriptText)}
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 transition-all cursor-pointer"
                    title="Скопировать текст речи"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Script Editor & AI Enhancer */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <Mic className="w-4 h-4 text-purple-400" />
                <span>Текст речи виртуального спикера</span>
              </label>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Улучшение Gemini...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Улучшить речь через ИИ</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={4}
              value={scriptText}
              onChange={e => setScriptText(e.target.value)}
              placeholder="Введите текст для озвучивания нейро-аватаром..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500 leading-relaxed font-sans placeholder-zinc-600"
            />

            {/* AI Generated Avatar Specifications Breakdown */}
            {avatarData && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{avatarData.avatarName} — {avatarData.avatarTitle}</span>
                  </span>
                  <span className="text-zinc-400 font-mono">
                    Синхронизация: {avatarData.technicalSpecs?.lipSyncAccuracy || '99.8%'}
                  </span>
                </div>

                <div className="text-xs text-zinc-300 bg-zinc-950/70 p-3 rounded-lg border border-zinc-800/80 space-y-1.5">
                  <div className="text-[11px] text-zinc-400 font-mono">
                    Промпт для фотогенератора лица (Midjourney/Flux/Nano):
                  </div>
                  <p className="text-zinc-200 font-mono text-[11px] leading-relaxed">
                    {avatarData.visualPrompt}
                  </p>
                  <button
                    onClick={() => handleCopy(avatarData.visualPrompt)}
                    className="mt-1 text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Скопировать промпт генерации лица</span>
                  </button>
                </div>

                {avatarData.facialExpressions && (
                  <div className="flex flex-wrap gap-1.5">
                    {avatarData.facialExpressions.map((exp: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md text-[11px] bg-zinc-900 border border-zinc-700/60 text-zinc-300"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
