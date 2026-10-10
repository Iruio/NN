import React, { useState } from 'react';
import {
  Megaphone,
  Sparkles,
  Target,
  Video,
  Layout,
  Copy,
  Check,
  Play,
  Zap,
  TrendingUp,
  Sliders,
  DollarSign,
  Layers,
  ArrowRight,
  Eye,
  FileText,
  User,
  ShoppingBag,
  ExternalLink,
  Flame
} from 'lucide-react';

interface ViralHook {
  text: string;
  hookType: string;
  visualCue: string;
}

interface VideoScriptScene {
  sceneNumber: number;
  timing: string;
  stage: string;
  visualDirection: string;
  voiceover: string;
  onScreenText: string;
  soundEffect: string;
}

interface BannerCreative {
  format: string;
  bannerTitle: string;
  visualPrompt: string;
  backgroundStyle: string;
  mainHeadline: string;
  subText: string;
  badgeText: string;
  ctaButtonText: string;
}

interface AdCampaignResult {
  campaignOverview: {
    campaignTitle: string;
    mainAngle: string;
    targetPersona: {
      pains: string[];
      desires: string[];
      objections: string[];
      trigger: string;
    };
  };
  viralHooks: ViralHook[];
  videoScript: VideoScriptScene[];
  adCopy: {
    headlineVariants: string[];
    primaryTextVariants: string[];
    bulletPoints: string[];
    callToActions: string[];
  };
  bannerCreatives: BannerCreative[];
  ugcGuidelines: {
    creatorProfile: string;
    filmingNotes: string;
    hookDelivery: string;
  };
}

const PRESET_TEMPLATES = [
  {
    name: 'SaaS / AI Платформа',
    productName: 'Genesis AI Cloud',
    description: 'Универсальная мультимодальная нейросеть для генерации видео, музыки, аватаров и кода в один клик.',
    category: 'saas',
    audience: 'Маркетологи, видеомонтажеры, контент-мейкеры, агентства',
    benefits: 'Генерация за 10 секунд, 4K качество, безлимитный экспорт, экономия $2,000/мес на подрядчиках'
  },
  {
    name: 'E-commerce / Гаджет',
    productName: 'AeroPulse Sound Pro',
    description: 'Беспроводные наушники с адаптивным шумоподавлением 55дБ и 48 часами автономности.',
    category: 'ecommerce',
    audience: 'Студенты, офисные работники, спортсмены, путешественники',
    benefits: 'Полная изоляция от шума метро, анатомическая посадка, влагозащита IPX7, быстрая зарядка за 10 мин'
  },
  {
    name: 'Онлайн-Курс / Инфобизнес',
    productName: 'Профессия: AI Креатор 2026',
    description: '30-дневный практический курс по заработку на генерации рекламных роликов с нейросетями.',
    category: 'infobiz',
    audience: 'Фрилансеры, дизайнеры, начинающие предприниматели от 20 до 45 лет',
    benefits: 'Первые заказы во время обучения, готовые шаблоны промптов, диплом и помощь с трудоустройством'
  },
  {
    name: 'Премиум Услуги / Агентство',
    productName: 'ScaleVortex Marketing',
    description: 'Комплексный маркетинг с оплатой за реальный результат (CPA) и гарантией окупаемости.',
    category: 'services',
    audience: 'Владельцы бизнеса с оборотом от 1 млн руб/мес, e-commerce бренды',
    benefits: 'Оплата за лиды, внедрение за 48 часов, сквозная аналитика, проверенные связки'
  }
];

export function AdStudio() {
  const [productName, setProductName] = useState('Genesis AI Cloud');
  const [productDescription, setProductDescription] = useState('Универсальная мультимодальная нейросеть для генерации видео, музыки, аватаров и кода в один клик.');
  const [category, setCategory] = useState('saas');
  const [targetAudience, setTargetAudience] = useState('Маркетологи, видеомонтажеры, контент-мейкеры, агентства');
  const [keyBenefits, setKeyBenefits] = useState('Генерация за 10 секунд, 4K качество, безлимитный экспорт, экономия $2,000/мес на подрядчиках');
  const [format, setFormat] = useState('full_pack');
  const [tone, setTone] = useState('high_energy');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AdCampaignResult | null>(null);
  const [activeTab, setActiveTab] = useState<'strategy' | 'hooks' | 'video' | 'banners' | 'copy' | 'ugc'>('strategy');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch (e) {
      console.warn('Clipboard copy error:', e);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApplyPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setProductName(preset.productName);
    setProductDescription(preset.description);
    setCategory(preset.category);
    setTargetAudience(preset.audience);
    setKeyBenefits(preset.benefits);
  };

  const handleGenerate = async () => {
    if (!productName.trim()) {
      setError('Введите название продукта');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const benefitsArray = keyBenefits
        .split(/[,;\n]+/)
        .map(b => b.trim())
        .filter(Boolean);

      const res = await fetch('/api/gen/ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          productDescription,
          category,
          targetAudience,
          keyBenefits: benefitsArray,
          format,
          tone
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Ошибка при генерации рекламной кампании');
      }

      const campaignData: AdCampaignResult = await res.json();
      setResult(campaignData);
      setActiveTab('strategy');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Сбой генерации рекламы');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-rose-950/40 via-red-900/20 to-zinc-900 border border-rose-800/40 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5 text-rose-400" />
                Performance Ad Studio
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-zinc-900 border border-zinc-700/60 text-zinc-300">
                Meta • TikTok • YouTube • Google
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Генератор Рекламы & Performance Креативов
            </h2>
            <p className="text-zinc-400 text-sm max-w-2xl">
              Создавайте вирусные хуки за 3 секунды, сценарии видеорекламы для Reels/TikTok/Shorts, цепляющие рекламные баннеры, офферы и тексты с высокой конверсией.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-pink-600 text-white font-bold text-sm shadow-xl shadow-rose-900/40 hover:from-rose-500 hover:to-pink-500 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Генерируем кампанию...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Создать Рекламную Кампанию</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="mt-6 pt-5 border-t border-zinc-800/60 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-zinc-500 font-medium whitespace-nowrap">Быстрые шаблоны:</span>
          {PRESET_TEMPLATES.map(p => (
            <button
              key={p.name}
              onClick={() => handleApplyPreset(p)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 hover:text-white hover:border-rose-500/50 hover:bg-rose-950/30 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3 h-3 text-rose-400" />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Form Left, Results Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Parameters */}
        <div className="lg:col-span-4 space-y-5 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-rose-400" />
              Параметры Оффера
            </h3>
            <span className="text-[11px] text-zinc-400">Gemini 3.8 Flash</span>
          </div>

          {/* Product Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Название продукта / Бренда</label>
            <input
              type="text"
              value={productName}
              onChange={e => setProductName(e.target.value)}
              placeholder="Например: AeroPulse 3D, Курс AI Creator"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm text-white placeholder-zinc-500 outline-none transition-all"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Категория Бизнеса</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'saas', label: 'SaaS & ИИ' },
                { id: 'ecommerce', label: 'E-commerce' },
                { id: 'infobiz', label: 'Инфобизнес' },
                { id: 'services', label: 'Услуги & B2B' },
                { id: 'mobile_app', label: 'Мобильное прил.' },
                { id: 'local_biz', label: 'Локальный бизнес' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all cursor-pointer ${
                    category === cat.id
                      ? 'bg-rose-500/15 border-rose-500 text-rose-300 font-semibold'
                      : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Описание Продукта / Оффера</label>
            <textarea
              rows={3}
              value={productDescription}
              onChange={e => setProductDescription(e.target.value)}
              placeholder="В чем суть вашего предложения? Какую проблему решает?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Target Audience */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Целевая Аудитория (ЦА)</label>
            <input
              type="text"
              value={targetAudience}
              onChange={e => setTargetAudience(e.target.value)}
              placeholder="Кто покупает? Возраст, боли, статус"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none transition-all"
            />
          </div>

          {/* Key Benefits */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Главные Преимущества & УТП</label>
            <textarea
              rows={2}
              value={keyBenefits}
              onChange={e => setKeyBenefits(e.target.value)}
              placeholder="Через запятую: Быстро, Гарантия результата, Скидка 50%"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Format & Tone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Формат</label>
              <select
                value={format}
                onChange={e => setFormat(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:border-rose-500 outline-none"
              >
                <option value="full_pack">Все форматы (Full Pack)</option>
                <option value="video_short">TikTok / Reels (9:16)</option>
                <option value="video_commercial">YouTube (16:9)</option>
                <option value="banner_display">Баннеры & Карусель</option>
                <option value="ugc_story">UGC Видеоселфи</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Тональность</label>
              <select
                value={tone}
                onChange={e => setTone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:border-rose-500 outline-none"
              >
                <option value="high_energy">Энергичный & Динамичный</option>
                <option value="problem_agitation">Боль & Решение (PAS)</option>
                <option value="luxury">Премиум & Экспертный</option>
                <option value="humor">Юмор & Провокация</option>
                <option value="fomo">Срочность & Скидка (FOMO)</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold text-sm shadow-lg shadow-rose-900/30 hover:from-rose-500 hover:to-red-500 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Генерация кампании...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Сгенерировать Рекламу</span>
              </>
            )}
          </button>
        </div>

        {/* Right Output: Campaign Dashboard */}
        <div className="lg:col-span-8 space-y-4">
          {!result && !loading && (
            <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[480px]">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
                <Megaphone className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Готовы создать вирусную рекламную связку?
              </h3>
              <p className="text-zinc-400 text-sm max-w-md mb-6">
                Выберите один из готовых шаблонов выше или укажите ваш продукт и нажмите кнопку «Создать Рекламную Кампанию».
              </p>
              <button
                onClick={handleGenerate}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-rose-400" />
                <span>Быстрый тест: Genesis AI Cloud</span>
              </button>
            </div>
          )}

          {loading && (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[480px] space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 animate-pulse">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-white">Нейросеть проектирует рекламную стратегию...</h3>
              <p className="text-zinc-400 text-xs max-w-md">
                Анализируем боли целевой аудитории, формулируем 3-секундные хуки, пишем покадровый видео-сценарий и генерируем рекламные баннеры.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Output Sub-Navigation Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-zinc-900/90 border border-zinc-800 rounded-2xl">
                {[
                  { id: 'strategy', label: 'Стратегия & ЦА', icon: Target },
                  { id: 'hooks', label: 'Вирусные Хуки (3s)', icon: Flame },
                  { id: 'video', label: 'Видео-Сценарий', icon: Video },
                  { id: 'banners', label: 'Баннеры & Промпты', icon: Layout },
                  { id: 'copy', label: 'Тексты & Офферы', icon: FileText },
                  { id: 'ugc', label: 'UGC Бриф', icon: User }
                ].map(t => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id as any)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-900/40 font-bold'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab 1: Strategy & Target Audience */}
              {activeTab === 'strategy' && (
                <div className="space-y-4">
                  <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded border border-rose-800/50">
                          {result.campaignOverview.targetPersona.trigger}
                        </span>
                        <h4 className="text-lg font-bold text-white mt-1.5">
                          {result.campaignOverview.campaignTitle}
                        </h4>
                        <p className="text-zinc-300 text-xs mt-1">
                          <strong className="text-zinc-100">Главный угол подачи:</strong> {result.campaignOverview.mainAngle}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCopy(JSON.stringify(result.campaignOverview, null, 2), 'strategy')}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        {copiedKey === 'strategy' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Копировать</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-red-950/80">
                        <div className="text-xs font-bold text-red-400 mb-2 flex items-center gap-1.5">
                          <span>Боль аудитории</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-zinc-300">
                          {result.campaignOverview.targetPersona.pains.map((p, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-red-500">•</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-emerald-950/80">
                        <div className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                          <span>Желаемый результат</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-zinc-300">
                          {result.campaignOverview.targetPersona.desires.map((d, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-500">•</span>
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-blue-950/80">
                        <div className="text-xs font-bold text-blue-400 mb-2 flex items-center gap-1.5">
                          <span>Закрытие возражений</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-zinc-300">
                          {result.campaignOverview.targetPersona.objections.map((o, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-blue-500">•</span>
                              <span>{o}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Viral Hooks */}
              {activeTab === 'hooks' && (
                <div className="space-y-3">
                  <div className="text-xs text-zinc-400">
                    Первые 3 секунды определяют 80% успеха видеорекламы. Вот хуки, оптимизированные для удержания внимания:
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {result.viralHooks.map((h, i) => (
                      <div
                        key={i}
                        className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start justify-between gap-4 hover:border-rose-500/40 transition-all"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center justify-center">
                              {i + 1}
                            </span>
                            <span className="text-[11px] font-semibold text-rose-300 px-2 py-0.5 rounded-md bg-rose-950/40 border border-rose-800/40">
                              {h.hookType}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-white tracking-wide">
                            «{h.text}»
                          </p>
                          <p className="text-xs text-zinc-400 flex items-center gap-1.5 pt-1">
                            <Eye className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="text-zinc-500">Визуальный ряд:</span> {h.visualCue}
                          </p>
                        </div>

                        <button
                          onClick={() => handleCopy(`«${h.text}»\nВизуал: ${h.visualCue}`, `hook-${i}`)}
                          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          {copiedKey === `hook-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>Копировать</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Video Script */}
              {activeTab === 'video' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Покадровый сценарий для Veo 3.1 / Higgsfield / Sora / Runway:</span>
                    <button
                      onClick={() => handleCopy(
                        result.videoScript.map(s => `[${s.timing}] ${s.stage}\nВизуал: ${s.visualDirection}\nГолос: ${s.voiceover}\nТекст: ${s.onScreenText}\nSFX: ${s.soundEffect}`).join('\n\n'),
                        'full-video-script'
                      )}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedKey === 'full-video-script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Скопировать весь сценарий</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {result.videoScript.map((scene, i) => (
                      <div
                        key={i}
                        className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4.5 space-y-3 hover:border-zinc-700 transition-all"
                      >
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-xs font-mono font-bold">
                              Сцена {scene.sceneNumber} • {scene.timing}
                            </span>
                            <span className="text-xs font-bold text-white">
                              {scene.stage}
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            SFX: {scene.soundEffect}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="space-y-1 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                            <span className="text-zinc-500 font-semibold uppercase text-[10px]">Визуальная директива (Промпт для видео ИИ):</span>
                            <p className="text-zinc-200 leading-relaxed">{scene.visualDirection}</p>
                          </div>

                          <div className="space-y-2 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                            <div>
                              <span className="text-rose-400 font-semibold uppercase text-[10px]">Озвучка (Voiceover):</span>
                              <p className="text-zinc-100 font-medium italic">«{scene.voiceover}»</p>
                            </div>
                            <div className="pt-1 border-t border-zinc-800/60">
                              <span className="text-amber-400 font-semibold uppercase text-[10px]">Текст на экране (Overlay):</span>
                              <p className="text-amber-200 font-bold">{scene.onScreenText}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: Banner Creatives */}
              {activeTab === 'banners' && (
                <div className="space-y-4">
                  <div className="text-xs text-zinc-400">
                    Готовые концепты рекламных баннеров для таргетированной рекламы и контекста:
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {result.bannerCreatives.map((b, i) => (
                      <div
                        key={i}
                        className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-rose-500/40 transition-all"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-zinc-800 text-zinc-300">
                              {b.format}
                            </span>
                            <span className="text-[11px] font-bold text-rose-400">
                              {b.bannerTitle}
                            </span>
                          </div>

                          {/* Visual Banner Preview Card Simulation */}
                          <div className="aspect-square w-full rounded-xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-rose-950/40 border border-zinc-700/60 p-4 flex flex-col justify-between relative overflow-hidden shadow-inner">
                            <div className="flex justify-between items-start">
                              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[9px] uppercase tracking-wider shadow">
                                {b.badgeText}
                              </span>
                              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                            </div>

                            <div className="space-y-1 text-center my-auto">
                              <h5 className="text-sm font-black text-white leading-tight">
                                {b.mainHeadline}
                              </h5>
                              <p className="text-[11px] text-zinc-300 line-clamp-2">
                                {b.subText}
                              </p>
                            </div>

                            <button className="w-full py-1.5 rounded-lg bg-white text-zinc-950 font-bold text-[11px] flex items-center justify-center gap-1 shadow cursor-default">
                              <span>{b.ctaButtonText}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-mono text-zinc-500">Промпт для генерации фона (Nano Banana / Midjourney):</span>
                            <p className="text-xs text-zinc-400 line-clamp-3 bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                              {b.visualPrompt}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleCopy(b.visualPrompt, `banner-${i}`)}
                          className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {copiedKey === `banner-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>Скопировать промпт</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 5: Ad Copy & CTAs */}
              {activeTab === 'copy' && (
                <div className="space-y-4">
                  {/* Headlines */}
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-rose-400">
                      Варианты Заголовков с высоким CTR:
                    </h5>
                    <div className="space-y-2">
                      {result.adCopy.headlineVariants.map((h, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                        >
                          <span className="font-semibold">{h}</span>
                          <button
                            onClick={() => handleCopy(h, `headline-${i}`)}
                            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          >
                            {copiedKey === `headline-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Primary Text Variants */}
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-rose-400">
                      Основной Рекламный Текст (Primary Text):
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {result.adCopy.primaryTextVariants.map((p, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between space-y-3 text-xs"
                        >
                          <p className="text-zinc-200 leading-relaxed whitespace-pre-line">{p}</p>
                          <button
                            onClick={() => handleCopy(p, `primary-${i}`)}
                            className="self-end px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            {copiedKey === `primary-${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>Копировать</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bullet Points & CTAs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-2 text-xs">
                      <h5 className="font-bold text-white mb-2">Продающие буллеты:</h5>
                      <ul className="space-y-1.5 text-zinc-300">
                        {result.adCopy.bulletPoints.map((b, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="text-rose-400">✓</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-2 text-xs">
                      <h5 className="font-bold text-white mb-2">Кнопки Призыва к действию (CTA):</h5>
                      <div className="flex flex-wrap gap-2">
                        {result.adCopy.callToActions.map((cta, i) => (
                          <span
                            key={i}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-semibold cursor-pointer hover:bg-rose-500/20"
                            onClick={() => handleCopy(cta, `cta-${i}`)}
                          >
                            {cta}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 6: UGC Guidelines */}
              {activeTab === 'ugc' && (
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-rose-400" />
                      Техническое Задание для UGC Кретора
                    </h4>
                    <button
                      onClick={() => handleCopy(
                        `Креатор: ${result.ugcGuidelines.creatorProfile}\nСъемка: ${result.ugcGuidelines.filmingNotes}\nПодача хука: ${result.ugcGuidelines.hookDelivery}`,
                        'ugc-guide'
                      )}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedKey === 'ugc-guide' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Копировать ТЗ</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                      <span className="font-bold text-rose-400">Профиль блогера:</span>
                      <p className="text-zinc-300 leading-relaxed">{result.ugcGuidelines.creatorProfile}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                      <span className="font-bold text-amber-400">Условия съемки:</span>
                      <p className="text-zinc-300 leading-relaxed">{result.ugcGuidelines.filmingNotes}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                      <span className="font-bold text-emerald-400">Энергетика и подача:</span>
                      <p className="text-zinc-300 leading-relaxed">{result.ugcGuidelines.hookDelivery}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
