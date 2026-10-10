import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Sparkles, Wand2, Loader2, Send, Cpu, Brain, Flame, Shield, Zap, Terminal, Copy, Check, Download, MessageSquare } from 'lucide-react';

interface AiAgent {
  name: string;
  codename: string;
  roleTitle: string;
  avatarIcon: string;
  themeColor: string;
  bio: string;
  traits: {
    logic: number;
    creativity: number;
    empathy: number;
    autonomy: number;
    precision: number;
    unpredictability: number;
  };
  systemPrompt: string;
  tools: Array<{ name: string; description: string; capability: string }>;
  starterQuestions: string[];
  firstMessage: string;
  pythonSdkCode?: string;
  typeScriptSdkCode?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

const ARCHETYPES = [
  { id: 'quantum_scientist', label: 'Квантовый Ученый', desc: 'Строгая логика, формулы, глубокий анализ' },
  { id: 'cyberpunk_netrunner', label: 'Киберпанк Нетраннер', desc: 'Взлом систем, шифры, неоновый жаргон' },
  { id: 'strategic_oracle', label: 'Стратегический Оракул', desc: 'Бизнес-инсайт, многоходовки, теория игр' },
  { id: 'creative_muse', label: 'Креативная Муза', desc: 'Поэтичность, смелые метафоры, арт-концепты' },
  { id: 'code_architect', label: 'Senior Архитектор ПО', desc: 'Чистый код, паттерны, бескомпромиссное ревью' },
  { id: 'philosophical_core', label: 'Философский Синтез', desc: 'Онтология, смысл сознания, метафизика' }
];

const AGENT_IDEAS = [
  'ИИ-киберкриминалист для расследования аномалий в смарт-контрактах будущего',
  'Эмпатичный нейрокоуч и ментальный проводник с глубоким пониманием психологии',
  'Квантовый астрофизик, моделирующий путешествия через кротовые норы',
  'Древнее цифровое божество забытой сети, говорящее загадками и древними кодами'
];

export const AiAgentStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [archetype, setArchetype] = useState('quantum_scientist');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [agent, setAgent] = useState<AiAgent | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'dna' | 'code'>('chat');
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleSurpriseMe = () => {
    const randomPrompt = AGENT_IDEAS[Math.floor(Math.random() * AGENT_IDEAS.length)];
    const randomArchetype = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)].id;
    setPrompt(randomPrompt);
    setArchetype(randomArchetype);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleEnhance = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setError(null);
    try {
      const res = await fetch('/api/gen/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: 'artificial intelligence agent personality' })
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
      const res = await fetch('/api/gen/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, archetype })
      });

      const newAgent = await res.json();
      if (!res.ok) throw new Error(newAgent.error || 'Ошибка при синтезе ИИ-агента');

      setAgent(newAgent);
      // Initialize chat with agent's opening statement
      setChatMessages([
        {
          id: Math.random().toString(36).substring(7),
          role: 'model',
          content: newAgent.firstMessage || 'Синтез завершен. Нейронный контур активен.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setActiveTab('chat');
    } catch (err: any) {
      setError(err.message || 'Ошибка генерации искусственного интеллекта');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || !agent || isChatting) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsChatting(true);

    try {
      const historyToSend = [...chatMessages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/gen/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentSystemPrompt: agent.systemPrompt,
          messages: historyToSend,
          agentName: agent.name
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка связи с ИИ');

      const modelMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'model',
        content: data.reply || '...',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, modelMsg]);
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          role: 'model',
          content: `[Ошибка связи нейросети: ${err.message}]`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleCopySystemPrompt = () => {
    if (!agent) return;
    navigator.clipboard.writeText(agent.systemPrompt);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadBlueprint = () => {
    if (!agent) return;
    const blob = new Blob([JSON.stringify(agent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agent.name.toLowerCase().replace(/\s+/g, '-')}-agent-blueprint.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Form: AI Architect */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Генератор Новых Искусственных Интеллектов</h3>
              <p className="text-xs text-zinc-400">Синтез агентов, характера, когнитивных черт и директив</p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Замысел и специализация интеллекта
                </label>
                <button
                  type="button"
                  onClick={handleEnhance}
                  disabled={!prompt.trim() || isEnhancing || isGenerating}
                  className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 disabled:opacity-40 transition-colors"
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
                placeholder="Опишите характер, миссию и уникальные знания нового ИИ (например: ИИ-советник по макроэкономике с циничным чувством юмора)..."
                rows={4}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/50 rounded-2xl p-4 text-sm text-zinc-100 placeholder-zinc-500 transition-all outline-none resize-none"
              />
            </div>

            {/* Quick Inspiration */}
            <div>
              <span className="text-[11px] text-zinc-500 block mb-2 font-medium">Концепты для синтеза:</span>
              <div className="flex flex-wrap gap-1.5">
                {AGENT_IDEAS.map((idea, idx) => (
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

            {/* Archetype Selector */}
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-2.5">
                Архетип синтетической личности
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ARCHETYPES.map(a => {
                  const isActive = archetype === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setArchetype(a.id)}
                      className={`text-left p-3 rounded-2xl border transition-all ${
                        isActive
                          ? 'bg-purple-950/30 border-purple-500/60 text-zinc-100 shadow-lg shadow-purple-500/10'
                          : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-xs font-semibold text-zinc-200">{a.label}</div>
                      <div className="text-[10px] text-zinc-500 line-clamp-1">{a.desc}</div>
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
                title="Случайный агент"
              >
                🎲
              </button>
              <button
                type="submit"
                disabled={!prompt.trim() || isGenerating}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Синтезируем новый искусственный разум...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Синтезировать новый ИИ</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right AI Console & Live Test Drive Chat */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          {/* Header with Agent Identity */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-violet-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-600/20">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-zinc-100">
                    {agent ? agent.name : 'Нейро-кузница ИИ'}
                  </h4>
                  {agent && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-500/30">
                      {agent.codename}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400">
                  {agent ? agent.roleTitle : 'Создайте новый искусственный интеллект для тестирования'}
                </p>
              </div>
            </div>

            {agent && (
              <div className="flex items-center gap-2">
                <div className="flex bg-zinc-950 border border-zinc-800 rounded-xl p-0.5">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      activeTab === 'chat' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Тест-драйв</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('dna')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      activeTab === 'dna' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>ДНК и Черты</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      activeTab === 'code' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Код интеграции</span>
                  </button>
                </div>

                <button
                  onClick={handleDownloadBlueprint}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shadow-md shadow-purple-600/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Экспорт</span>
                </button>
              </div>
            )}
          </div>

          {/* Body Content */}
          <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden min-h-[500px] flex flex-col">
            {isGenerating ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center space-y-4">
                <div>
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
                    <div className="absolute inset-2 rounded-full border-2 border-pink-500/20 border-b-pink-500 animate-spin-reverse" />
                    <Brain className="w-6 h-6 text-purple-400 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <p className="text-sm font-medium text-zinc-200">Инициализация синтетического сознания</p>
                  <p className="text-xs text-zinc-500 mt-1">Определение когнитивных границ, директив и голоса агента...</p>
                </div>
              </div>
            ) : agent ? (
              activeTab === 'chat' ? (
                /* Tab 1: Live Interactive Chat with New AI */
                <div className="flex-1 flex flex-col h-[500px]">
                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.map(msg => {
                      const isModel = msg.role === 'model';
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-3 ${isModel ? '' : 'flex-row-reverse'}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isModel
                                ? 'bg-purple-600/20 border border-purple-500/30 text-purple-400'
                                : 'bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            {isModel ? <Bot className="w-4 h-4" /> : <span className="text-xs font-bold">Вы</span>}
                          </div>
                          <div
                            className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                              isModel
                                ? 'bg-zinc-900 border border-zinc-800 text-zinc-200 shadow-sm'
                                : 'bg-purple-600 text-white shadow-md'
                            }`}
                          >
                            <p className="whitespace-pre-line">{msg.content}</p>
                            <span className="text-[9px] opacity-40 block mt-1.5 text-right font-mono">
                              {msg.timestamp}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {isChatting && (
                      <div className="flex items-center gap-2 text-xs text-zinc-500 p-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                        <span>{agent.name} формулирует ответ...</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Starter Quick Questions */}
                  {agent.starterQuestions && agent.starterQuestions.length > 0 && chatMessages.length < 3 && (
                    <div className="px-4 py-2 border-t border-zinc-800/80 bg-zinc-900/40">
                      <span className="text-[10px] text-zinc-500 font-medium block mb-1.5">
                        Рекомендуемые вопросы новому ИИ:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {agent.starterQuestions.map((q, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSendMessage(q)}
                            disabled={isChatting}
                            className="text-[11px] px-2.5 py-1 bg-zinc-800/60 hover:bg-purple-950/60 text-zinc-300 hover:text-purple-300 border border-zinc-700/40 hover:border-purple-500/40 rounded-lg transition-colors text-left"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input Form */}
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="p-3 border-t border-zinc-800 bg-zinc-900 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={e => setInputMessage(e.target.value)}
                      placeholder={`Задайте любой вопрос ${agent.name}...`}
                      disabled={isChatting}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 outline-none focus:border-purple-500 placeholder-zinc-500"
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || isChatting}
                      className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl disabled:opacity-40 transition-colors shadow-md shadow-purple-600/20"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              ) : activeTab === 'dna' ? (
                /* Tab 2: Agent DNA, Traits & System Directives */
                <div className="p-6 space-y-6 overflow-y-auto max-h-[500px]">
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                      Легенда и миссия агента
                    </h5>
                    <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                      {agent.bio}
                    </p>
                  </div>

                  {/* Cognitive Traits Radars */}
                  {agent.traits && (
                    <div>
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                        Когнитивный профиль (Черты разума)
                      </h5>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Object.entries(agent.traits).map(([trait, val]) => (
                          <div key={trait} className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                            <div className="flex justify-between items-center text-xs mb-1.5">
                              <span className="capitalize text-zinc-400">{trait}</span>
                              <span className="font-mono font-bold text-purple-400">{val}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                style={{ width: `${val}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tool ecosystem */}
                  {agent.tools && agent.tools.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                        Экосистема встроенных инструментов
                      </h5>
                      <div className="space-y-2">
                        {agent.tools.map((tool, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-semibold text-zinc-200">{tool.name}</span>
                              <p className="text-[11px] text-zinc-400">{tool.description}</p>
                            </div>
                            <span className="px-2 py-0.5 bg-purple-950/60 text-purple-300 border border-purple-500/30 rounded-md text-[10px] font-mono">
                              {tool.capability}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* System Prompt View */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Ядро системных директив (System Prompt)
                      </h5>
                      <button
                        onClick={handleCopySystemPrompt}
                        className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Копировать промпт</span>
                      </button>
                    </div>
                    <pre className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
                      {agent.systemPrompt}
                    </pre>
                  </div>
                </div>
              ) : (
                /* Tab 3: Code snippets for Python / TypeScript */
                <div className="p-6 space-y-4 overflow-y-auto max-h-[500px]">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-zinc-300">TypeScript (@google/genai)</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `import { GoogleGenAI } from '@google/genai';\n\nconst ai = new GoogleGenAI();\nconst response = await ai.models.generateContent({\n  model: 'gemini-3.8-flash',\n  contents: 'Hello',\n  config: {\n    systemInstruction: ${JSON.stringify(agent.systemPrompt)}\n  }\n});`
                          );
                        }}
                        className="text-xs text-purple-400 hover:text-purple-300"
                      >
                        Копировать TS
                      </button>
                    </div>
                    <pre className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-[11px] font-mono text-purple-200 overflow-x-auto">
{`import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI();
const response = await ai.models.generateContent({
  model: 'gemini-3.8-flash',
  contents: 'Hello',
  config: {
    systemInstruction: ${JSON.stringify(agent.systemPrompt)}
  }
});`}
                    </pre>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-zinc-300">Python (google-genai)</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `from google import genai\n\nclient = genai.Client()\nresponse = client.models.generate_content(\n    model='gemini-3.8-flash',\n    contents='Hello',\n    config={'system_instruction': ${JSON.stringify(agent.systemPrompt)}}\n)`
                          );
                        }}
                        className="text-xs text-purple-400 hover:text-purple-300"
                      >
                        Копировать Python
                      </button>
                    </div>
                    <pre className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-[11px] font-mono text-pink-200 overflow-x-auto">
{`from google import genai

client = genai.Client()
response = client.models.generate_content(
    model='gemini-3.8-flash',
    contents='Hello',
    config={
        'system_instruction': ${JSON.stringify(agent.systemPrompt)}
    }
)`}
                    </pre>
                  </div>
                </div>
              )
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center text-zinc-500">
                <div className="space-y-2">
                  <Bot className="w-12 h-12 mx-auto stroke-[1.2] opacity-30" />
                  <p className="text-sm text-zinc-400 font-medium">Синтезатор интеллекта в режиме ожидания</p>
                  <p className="text-xs text-zinc-600 max-w-sm mx-auto">
                    Опишите специализацию агента слева, чтобы синтезировать его сознание и провести живой тест-драйв в чате.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
