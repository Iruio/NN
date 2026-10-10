import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  MessageSquare,
  Code2,
  Settings,
  Database,
  Terminal,
  Copy,
  Check,
  Zap,
  Play,
  Share2,
  Workflow,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  Cpu
} from 'lucide-react';

interface BotConfig {
  name: string;
  handle: string;
  description: string;
  welcomeMessage: string;
  systemPrompt: string;
  personalityTraits: string[];
  fallbackMessage: string;
}

interface KnowledgeItem {
  topic: string;
  answer: string;
  keywords: string[];
}

interface BotTool {
  functionName: string;
  description: string;
  parameters: Record<string, string>;
}

interface DialogStep {
  stepId: string;
  title: string;
  botMessage: string;
  options: string[];
  action: string;
}

interface BotBlueprintResult {
  botConfig: BotConfig;
  knowledgeBaseProcessed: KnowledgeItem[];
  tools: BotTool[];
  dialogFlow: DialogStep[];
  codeExports: {
    pythonAiogram: string;
    nodejsTelegraf: string;
    discordPy: string;
    envSample: string;
  };
}

const PRESET_BOTS = [
  {
    name: 'Telegram Менеджер Продаж',
    botName: 'SalesVortexBot',
    platform: 'telegram',
    role: 'sales_assistant',
    businessDescription: 'Сервис генеративного AI контента для бизнеса. Подписка $29/мес.',
    audience: 'Маркетологи, дизайнеры и малый бизнес',
    knowledge: 'Тарифы: Базовый $19, Про $49, Энтерпрайз $149. При оплате за год скидка 25%. Оплата картами РФ и криптой. Возврат в течение 7 дней.',
    tools: ['collect_lead', 'check_pricing', 'faq_lookup']
  },
  {
    name: 'Служба Поддержки 24/7',
    botName: 'SupportGenieBot',
    platform: 'telegram',
    role: 'support_agent',
    businessDescription: 'Интернет-магазин электроники и гаджетов с быстрой доставкой по РФ.',
    audience: 'Покупатели техники, статус заказа, возврат и гарантия',
    knowledge: 'Доставка СДЭК и Почтой от 2 дней. Бесплатно при заказе от 5000 руб. Гарантия 12 месяцев. Возврат товара в течение 14 дней в исходном виде.',
    tools: ['check_order_status', 'faq_lookup', 'escalate_to_human']
  },
  {
    name: 'Discord AI Модератор',
    botName: 'CommunityGuardian',
    platform: 'discord',
    role: 'community_helper',
    businessDescription: 'Discord комьюнити разработчиков и 3D аниматоров.',
    audience: 'Участники сервера, правила, роли, распределение каналов',
    knowledge: 'Правила сервера: не спамить в #general, код публиковать в #dev-chat, для поиска заказов использовать #freelance. Роли выдаются автоматически за активность.',
    tools: ['faq_lookup', 'award_role']
  },
  {
    name: 'Запись на консультацию (WhatsApp)',
    botName: 'LeadBookingBot',
    platform: 'whatsapp',
    role: 'appointment_scheduler',
    businessDescription: 'Стоматологическая клиника премиум-класса.',
    audience: 'Пациенты, запись на первичный осмотр и чистку',
    knowledge: 'Первичный осмотр и 3D-снимок бесплатно. Время работы с 9:00 до 21:00 ежедневно. Адрес: ул. Ленина 42. Врач-терапевт, хирург, ортодонт.',
    tools: ['book_appointment', 'collect_lead']
  }
];

export function BotStudio() {
  const [botName, setBotName] = useState('SalesVortexBot');
  const [platform, setPlatform] = useState('telegram');
  const [botRole, setBotRole] = useState('sales_assistant');
  const [businessDescription, setBusinessDescription] = useState('Сервис генеративного AI контента для бизнеса. Подписка $29/мес.');
  const [targetAudience, setTargetAudience] = useState('Маркетологи, дизайнеры и малый бизнес');
  const [knowledgeBase, setKnowledgeBase] = useState('Тарифы: Базовый $19, Про $49, Энтерпрайз $149. При оплате за год скидка 25%. Оплата картами РФ и криптой. Возврат в течение 7 дней.');
  const [tone, setTone] = useState('friendly_expert');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BotBlueprintResult | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'system_prompt' | 'flow' | 'knowledge' | 'code'>('chat');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [codeLanguage, setCodeLanguage] = useState<'python' | 'nodejs' | 'discord' | 'env'>('python');

  // Interactive Live Chat Simulator State
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'model'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

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

  const handleApplyPreset = (preset: typeof PRESET_BOTS[0]) => {
    setBotName(preset.botName);
    setPlatform(preset.platform);
    setBotRole(preset.role);
    setBusinessDescription(preset.businessDescription);
    setTargetAudience(preset.audience);
    setKnowledgeBase(preset.knowledge);
  };

  const handleGenerate = async () => {
    if (!botName.trim()) {
      setError('Введите имя бота');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/gen/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botName,
          platform,
          botRole,
          businessDescription,
          targetAudience,
          knowledgeBase,
          tone
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Ошибка при генерации бота');
      }

      const botData: BotBlueprintResult = await res.json();
      setResult(botData);
      // Pre-seed chat simulator with welcome message
      setChatMessages([
        { role: 'model', content: botData.botConfig.welcomeMessage }
      ]);
      setActiveTab('chat');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Сбой при создании бота');
    } finally {
      setLoading(false);
    }
  };

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatLoading || !result) return;

    const userText = chatInput.trim();
    const updatedMessages: Array<{ role: 'user' | 'model'; content: string }> = [
      ...chatMessages,
      { role: 'user', content: userText }
    ];

    setChatMessages(updatedMessages);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/gen/bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: result.botConfig.systemPrompt,
          botName: result.botConfig.name,
          knowledgeBase,
          messages: updatedMessages
        })
      });

      if (!res.ok) {
        throw new Error('Ошибка связи с ботом');
      }

      const data = await res.json();
      setChatMessages(prev => [
        ...prev,
        { role: 'model', content: data.reply || result.botConfig.fallbackMessage }
      ]);
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        { role: 'model', content: `[Ошибка связи с ИИ]: ${err.message}` }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-teal-900/20 to-zinc-900 border border-emerald-800/40 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-emerald-400" />
                AI Bot Forge
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-zinc-900 border border-zinc-700/60 text-zinc-300">
                Telegram • Discord • WhatsApp • Web
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Генератор Умных ИИ-Ботов & Ассистентов
            </h2>
            <p className="text-zinc-400 text-sm max-w-2xl">
              Проектируйте автоворонки, системные промпты, базы знаний и готовый серверный код (Python aiogram / Node.js Telegraf) с встроенным тестированием прямо в браузере.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-bold text-sm shadow-xl shadow-emerald-900/40 hover:from-emerald-500 hover:to-cyan-500 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Создаем архитектуру бота...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Сгенерировать Бот-Систему</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mt-6 pt-5 border-t border-zinc-800/60 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-zinc-500 font-medium whitespace-nowrap">Быстрые шаблоны ботов:</span>
          {PRESET_BOTS.map(p => (
            <button
              key={p.name}
              onClick={() => handleApplyPreset(p)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 hover:text-white hover:border-emerald-500/50 hover:bg-emerald-950/30 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Parameters */}
        <div className="lg:col-span-4 space-y-5 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-400" />
              Конфигурация Бота
            </h3>
            <span className="text-[11px] text-zinc-400">Gemini 3.8 Flash</span>
          </div>

          {/* Bot Name & Handle */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Имя и юзернейм бота</label>
            <input
              type="text"
              value={botName}
              onChange={e => setBotName(e.target.value)}
              placeholder="Например: SalesPro_AI_bot"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-white placeholder-zinc-500 outline-none transition-all"
            />
          </div>

          {/* Platform Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Целевая платформа</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'telegram', label: 'Telegram (aiogram)' },
                { id: 'discord', label: 'Discord (discord.py)' },
                { id: 'whatsapp', label: 'WhatsApp Cloud' },
                { id: 'web_widget', label: 'Web Виджет / API' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all cursor-pointer ${
                    platform === p.id
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-semibold'
                      : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bot Role */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Роль и специализация</label>
            <select
              value={botRole}
              onChange={e => setBotRole(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:border-emerald-500 outline-none"
            >
              <option value="sales_assistant">Менеджер по продажам & Лидогенератор</option>
              <option value="support_agent">Техподдержка 24/7 & Ответы на FAQ</option>
              <option value="appointment_scheduler">Запись на консультацию / Бронирование</option>
              <option value="community_helper">Модератор & Помощник сообщества</option>
              <option value="personal_tutor">Личный наставник & Обучающий бот</option>
            </select>
          </div>

          {/* Business Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">О компании / продукте</label>
            <textarea
              rows={2}
              value={businessDescription}
              onChange={e => setBusinessDescription(e.target.value)}
              placeholder="Чем занимается проект? Каковы ключевые офферы?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Knowledge Base */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">База Знаний (FAQ, Цены, Правила)</label>
            <textarea
              rows={4}
              value={knowledgeBase}
              onChange={e => setKnowledgeBase(e.target.value)}
              placeholder="Укажите цены, сроки, условия гарантии, телефон, адрес"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Tone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Тон общения</label>
            <select
              value={tone}
              onChange={e => setTone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:border-emerald-500 outline-none"
            >
              <option value="friendly_expert">Дружелюбный эксперт (с эмодзи)</option>
              <option value="corporate">Деловой & Лаконичный B2B</option>
              <option value="enthusiastic">Энергичный промоутер</option>
              <option value="empathetic">Эмпатичный и заботливый</option>
            </select>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Генерация архитектуры...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Сгенерировать Бота & Код</span>
              </>
            )}
          </button>
        </div>

        {/* Right Output: Interactive Workspace */}
        <div className="lg:col-span-8 space-y-4">
          {!result && !loading && (
            <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[480px]">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <Bot className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Создайте автономного ИИ-бота за пару кликов
              </h3>
              <p className="text-zinc-400 text-sm max-w-md mb-6">
                Выберите шаблон, настройте базу знаний и получите протестированный системный промпт с готовым кодом для Telegram или Discord.
              </p>
              <button
                onClick={handleGenerate}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Быстрый тест: SalesVortexBot</span>
              </button>
            </div>
          )}

          {loading && (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[480px] space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-white">Проектируем логику и функции бота...</h3>
              <p className="text-zinc-400 text-xs max-w-md">
                Синтезируем системную инструкцию, обучаем на базе знаний, генерируем сценарии диалогов и компилируем продакшн-код с aiogram/telegraf.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Output Sub-Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-zinc-900/90 border border-zinc-800 rounded-2xl">
                {[
                  { id: 'chat', label: 'Тестовый Чат', icon: MessageSquare },
                  { id: 'system_prompt', label: 'Системный Промпт', icon: ShieldCheck },
                  { id: 'flow', label: 'Воронка Диалога', icon: Workflow },
                  { id: 'knowledge', label: 'База Знаний & Инструменты', icon: Database },
                  { id: 'code', label: 'Экспорт Кода', icon: Code2 }
                ].map(t => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id as any)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500 text-zinc-950 font-bold shadow-md shadow-emerald-900/40'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab 1: Interactive Chat Simulator */}
              {activeTab === 'chat' && (
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col h-[520px] overflow-hidden shadow-xl">
                  {/* Chat Header */}
                  <div className="p-3.5 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">{result.botConfig.name}</h4>
                          <span className="text-[10px] text-zinc-400 font-mono">{result.botConfig.handle}</span>
                        </div>
                        <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Онлайн • Живой тест Gemini 3.8</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setChatMessages([{ role: 'model', content: result.botConfig.welcomeMessage }])}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors cursor-pointer"
                    >
                      Сброс чата
                    </button>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.map((m, i) => (
                      <div
                        key={i}
                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                            m.role === 'user'
                              ? 'bg-emerald-600 text-white rounded-br-none shadow-md shadow-emerald-950/40'
                              : 'bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-bl-none shadow'
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-zinc-950 border border-zinc-800 text-zinc-400 rounded-2xl px-4 py-2.5 text-xs flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                          <span>Бот печатает ответ...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleSendChatMessage} className="p-3 bg-zinc-950/90 border-t border-zinc-800 flex items-center gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Напишите вопрос боту (например: Сколько стоит тариф Про?)..."
                      className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-emerald-500 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={chatLoading || !chatInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Отправить</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Tab 2: System Prompt */}
              {activeTab === 'system_prompt' && (
                <div className="space-y-4">
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          Системная Инструкция (System Prompt)
                        </h4>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Полноценный промпт для внедрения в OpenAI API, Gemini, Claude или LangChain
                        </p>
                      </div>

                      <button
                        onClick={() => handleCopy(result.botConfig.systemPrompt, 'sys-prompt')}
                        className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedKey === 'sys-prompt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Копировать</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="text-zinc-500 self-center">Характер:</span>
                      {result.botConfig.personalityTraits.map((t, i) => (
                        <span key={i} className="px-2.5 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-800/40 text-emerald-300">
                          {t}
                        </span>
                      ))}
                    </div>

                    <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {result.botConfig.systemPrompt}
                    </pre>

                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1">
                      <span className="font-bold text-amber-400">Фолбек сообщение (когда бот не знает ответа):</span>
                      <p className="text-zinc-300 italic">{result.botConfig.fallbackMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Dialog Flow */}
              {activeTab === 'flow' && (
                <div className="space-y-3">
                  <div className="text-xs text-zinc-400">
                    Пошаговая логика автоворонки и ветвления сценариев:
                  </div>

                  <div className="space-y-3">
                    {result.dialogFlow.map((step, i) => (
                      <div
                        key={i}
                        className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4.5 space-y-3 hover:border-emerald-500/40 transition-all"
                      >
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center font-mono">
                              {i + 1}
                            </span>
                            <span className="text-xs font-bold text-white">{step.title}</span>
                          </div>
                          <span className="text-[10px] font-mono bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                            Действие: {step.action}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-zinc-950 text-xs text-zinc-200 border border-zinc-800/80">
                          <span className="text-emerald-400 font-semibold text-[10px] uppercase block mb-1">Реплика бота:</span>
                          <p className="italic">«{step.botMessage}»</p>
                        </div>

                        <div className="flex items-center gap-2 pt-1 text-xs">
                          <span className="text-zinc-500 text-[11px]">Кнопки / Опции:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {step.options.map((opt, optIdx) => (
                              <span key={optIdx} className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-200 text-xs border border-zinc-700">
                                🔘 {opt}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: Knowledge Base & Tools */}
              {activeTab === 'knowledge' && (
                <div className="space-y-4">
                  {/* Knowledge Base */}
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Обработанная база знаний (FAQ Grounding):
                    </h5>
                    <div className="space-y-2.5">
                      {result.knowledgeBaseProcessed.map((k, i) => (
                        <div key={i} className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{k.topic}</span>
                            <div className="flex gap-1">
                              {k.keywords.map((kw, kwIdx) => (
                                <span key={kwIdx} className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400">
                                  #{kw}
                                </span>
                              ))}
                            </div>
                          </div>
                          <p className="text-zinc-300 leading-relaxed">{k.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Function Tools */}
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                      Подключенные функции / Tool Calls:
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {result.tools.map((t, i) => (
                        <div key={i} className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-2">
                          <span className="font-mono font-bold text-cyan-300">{t.functionName}()</span>
                          <p className="text-zinc-300">{t.description}</p>
                          <div className="text-[11px] font-mono text-zinc-500 bg-zinc-900 p-2 rounded border border-zinc-800">
                            Параметры: {JSON.stringify(t.parameters)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Code Export */}
              {activeTab === 'code' && (
                <div className="space-y-4">
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                      <div className="flex items-center gap-2">
                        {[
                          { id: 'python', label: 'Python (aiogram 3.x)' },
                          { id: 'nodejs', label: 'Node.js (Telegraf)' },
                          { id: 'discord', label: 'Discord.py' },
                          { id: 'env', label: '.env Конфиг' }
                        ].map(lang => (
                          <button
                            key={lang.id}
                            onClick={() => setCodeLanguage(lang.id as any)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                              codeLanguage === lang.id
                                ? 'bg-emerald-500 text-zinc-950 font-bold'
                                : 'bg-zinc-800 text-zinc-300 hover:text-white'
                            }`}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          const code =
                            codeLanguage === 'python'
                              ? result.codeExports.pythonAiogram
                              : codeLanguage === 'nodejs'
                              ? result.codeExports.nodejsTelegraf
                              : codeLanguage === 'discord'
                              ? result.codeExports.discordPy
                              : result.codeExports.envSample;
                          handleCopy(code, 'export-code');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                      >
                        {copiedKey === 'export-code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Скопировать код</span>
                      </button>
                    </div>

                    <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-emerald-400 text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {codeLanguage === 'python' && result.codeExports.pythonAiogram}
                      {codeLanguage === 'nodejs' && result.codeExports.nodejsTelegraf}
                      {codeLanguage === 'discord' && result.codeExports.discordPy}
                      {codeLanguage === 'env' && result.codeExports.envSample}
                    </pre>

                    <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs text-zinc-400 flex items-center justify-between">
                      <span>Для запуска: установите зависимости и укажите токен бота из BotFather</span>
                      <span className="font-mono text-emerald-400">pip install aiogram google-genai</span>
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
