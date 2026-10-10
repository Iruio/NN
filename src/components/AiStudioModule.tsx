import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ExternalLink,
  Code2,
  Play,
  Terminal,
  Copy,
  Check,
  Wand2,
  Loader2,
  Sliders,
  Cpu,
  Zap,
  Layers,
  FileCode,
  Shield,
  Clock,
  Coins
} from 'lucide-react';

interface CodeSnippets {
  python: string;
  typescript: string;
  curl: string;
}

interface TestResult {
  output: string;
  latencyMs: number;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  codeSnippets: CodeSnippets;
  portalUrl: string;
}

const PRESET_TEMPLATES = [
  {
    id: 'director',
    name: 'Режиссер Видео & Reels',
    system: 'Вы — ведущий кинематографический арт-директор. Переводите краткую идею в кинематографичный сценарий с движением камеры, фокусным расстоянием и цветокоррекцией.',
    prompt: 'Создать 15-секундный ролик для презентации премиальных наушников с футуристичным звуковым полем'
  },
  {
    id: 'code',
    name: 'TypeScript & React Архитектор',
    system: 'You are an elite Staff Frontend Engineer. Generate pristine, robust TypeScript and React code using modern hooks and Tailwind CSS.',
    prompt: 'Create a state-driven audio frequency visualizer component in React with canvas'
  },
  {
    id: 'json',
    name: 'JSON Schema Экстрактор',
    system: 'Return strictly valid JSON matching the requested schema. Never output markdown fences or explanatory text.',
    prompt: 'Extract entities: "Встреча в Токио 12 октября в 15:00 с инвесторами SoftBank на тему AI-агентов"'
  },
  {
    id: 'marketing',
    name: 'Вирусный TikTok & Ads Копирайтер',
    system: 'Вы — вирусный маркетолог с 10-летним стажем. Пишите хуки с конверсией >40% и удержанием зрителя.',
    prompt: '3 взрывных хука для продвижения нового AI-приложения для автоматизации работы'
  }
];

export const AiStudioModule: React.FC = () => {
  const [model, setModel] = useState('gemini-3.8-flash');
  const [systemInstruction, setSystemInstruction] = useState(PRESET_TEMPLATES[0].system);
  const [prompt, setPrompt] = useState(PRESET_TEMPLATES[0].prompt);
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.95);

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'typescript' | 'python' | 'curl'>('typescript');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleRun = async () => {
    if (!prompt.trim()) return;
    setRunning(true);
    try {
      const res = await fetch('/api/gen/ai-studio/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction,
          prompt,
          model,
          temperature,
          topP
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to execute prompt');
      setResult(data);
    } catch (err) {
      console.error('Error running prompt in AI Studio:', err);
    } finally {
      setRunning(false);
    }
  };

  const handleApplyPreset = (p: typeof PRESET_TEMPLATES[0]) => {
    setSystemInstruction(p.system);
    setPrompt(p.prompt);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Hero Header with Direct Link to ai.studio */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950/70 via-zinc-900 to-cyan-950/50 border border-blue-600/30 p-6 sm:p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 border border-blue-500/30 text-blue-300 mb-3">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>Google AI Studio • Official Developer Gateway</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Google</span>
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-300 bg-clip-text text-transparent">
                AI Studio
              </span>
            </h1>
            <p className="mt-2 text-sm text-zinc-300 max-w-2xl leading-relaxed">
              Быстрое прототипирование, проектирование системных промптов для Gemini 3.8 Flash & Pro, тестирование параметров генерации и экспорт готового кода в один клик.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://ai.studio"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer group"
            >
              <span>Открыть ai.studio</span>
              <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs text-zinc-400 whitespace-nowrap font-medium flex items-center gap-1.5 mr-1">
          <Wand2 className="w-3.5 h-3.5 text-blue-400" />
          <span>Шаблоны промптов:</span>
        </span>
        {PRESET_TEMPLATES.map(p => (
          <button
            key={p.id}
            onClick={() => handleApplyPreset(p)}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 whitespace-nowrap transition-all cursor-pointer"
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Prompt IDE & Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Model & Hyperparameter Settings */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span>Конфигурация модели Gemini</span>
              </h2>
              <span className="text-[11px] font-mono text-zinc-400">@google/genai SDK v0.1.2</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5 font-medium">Модель</label>
                <select
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                >
                  <option value="gemini-3.8-flash">gemini-3.8-flash (Быстрая)</option>
                  <option value="gemini-2.5-pro">gemini-2.5-pro (Глубокая логика)</option>
                  <option value="gemini-2.0-flash">gemini-2.0-flash (General)</option>
                  <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite (Speed)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-zinc-400 font-medium">Temperature</label>
                  <span className="text-xs font-mono text-blue-400 font-bold">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={temperature}
                  onChange={e => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-zinc-400 font-medium">Top-P</label>
                  <span className="text-xs font-mono text-blue-400 font-bold">{topP}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={topP}
                  onChange={e => setTopP(parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
          </div>

          {/* System Instructions Editor */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-2 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>System Instructions (Системная роль модели)</span>
              </label>
              <span className="text-[11px] text-zinc-500">Задает правила и тон ответа</span>
            </div>
            <textarea
              rows={3}
              value={systemInstruction}
              onChange={e => setSystemInstruction(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
              placeholder="Введите системные инструкции..."
            />
          </div>

          {/* User Prompt & Run */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                <span>User Prompt (Запрос к Gemini)</span>
              </label>
            </div>
            <textarea
              rows={4}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
              placeholder="Введите запрос для тестирования..."
            />

            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="text-xs text-zinc-500 hidden sm:block">
                Прямой вызов через официальный SDK в AI Studio
              </div>

              <button
                onClick={handleRun}
                disabled={running}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-600/25 cursor-pointer disabled:opacity-50"
              >
                {running ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Выполнение запроса...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Запустить тест (Run)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Execution Output & Code Exporter (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Output Card */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4 backdrop-blur-sm flex flex-col min-h-[340px]">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-200">Ответ модели</h2>
                {result && (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <Clock className="w-3 h-3" />
                    <span>{result.latencyMs}ms</span>
                  </span>
                )}
              </div>

              {result && (
                <button
                  onClick={() => handleCopy(result.output, 'output')}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'output' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Копия</span>
                </button>
              )}
            </div>

            {/* Output Viewport */}
            <div className="flex-1 bg-zinc-950 rounded-xl p-4 border border-zinc-800/80 overflow-y-auto max-h-[360px] text-xs font-mono text-zinc-200 whitespace-pre-wrap leading-relaxed">
              {running ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2 py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                  <span>Gemini обрабатывает системные инструкции и промпт...</span>
                </div>
              ) : result ? (
                result.output
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center py-12">
                  <Terminal className="w-8 h-8 mb-2 opacity-40" />
                  <span>Нажмите «Запустить тест» для выполнения запроса в реальном времени.</span>
                </div>
              )}
            </div>

            {/* Token Metrics */}
            {result?.tokenUsage && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800 text-center">
                <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800/80">
                  <div className="text-[10px] text-zinc-500">Входные токены</div>
                  <div className="text-xs font-mono font-bold text-zinc-200">{result.tokenUsage.promptTokens}</div>
                </div>
                <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800/80">
                  <div className="text-[10px] text-zinc-500">Выходные токены</div>
                  <div className="text-xs font-mono font-bold text-zinc-200">{result.tokenUsage.completionTokens}</div>
                </div>
                <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800/80">
                  <div className="text-[10px] text-zinc-500">Всего токенов</div>
                  <div className="text-xs font-mono font-bold text-blue-400">{result.tokenUsage.totalTokens}</div>
                </div>
              </div>
            )}
          </div>

          {/* Ready-to-use SDK Code Exporter */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-3 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <span>Экспорт кода (Get Code)</span>
              </h2>

              <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
                {(['typescript', 'python', 'curl'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveCodeTab(tab)}
                    className={`px-2 py-1 rounded text-[11px] font-mono transition-all cursor-pointer ${
                      activeCodeTab === tab ? 'bg-blue-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {tab === 'typescript' ? 'TS' : tab === 'python' ? 'Python' : 'cURL'}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative bg-zinc-950 rounded-xl p-3 border border-zinc-800/80">
              <pre className="text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed max-h-[160px]">
                {result?.codeSnippets?.[activeCodeTab] || `// Run test to generate production snippet for ${activeCodeTab}`}
              </pre>
              {result?.codeSnippets && (
                <button
                  onClick={() => handleCopy(result.codeSnippets[activeCodeTab], 'snippet')}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-all cursor-pointer"
                  title="Скопировать код"
                >
                  {copiedKey === 'snippet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
