import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Code, Play, Download, Copy, Check, Sparkles, Wand2, Loader2, Monitor, Terminal, Layers, FileArchive, Smartphone } from 'lucide-react';
import { generateAppZip, generateAndroidApk, triggerFileDownload } from '../utils/exporter.js';

interface GeneratedApp {
  title: string;
  description: string;
  category: string;
  features: string[];
  html: string;
}

const APP_TEMPLATES = [
  {
    title: 'Канбан-доска задач',
    prompt: 'Интерактивная Kanban-доска задач (To Do, In Progress, Done) с drag-and-drop или перемещением карточек, приоритетами, добавлением и удалением задач в темной теме'
  },
  {
    title: 'Ретро-аркада Breakout',
    prompt: 'Полноценная игра Арканоид (Breakout) на Canvas: ракетка управляется мышью и стрелками, цветные кирпичи, подсчет очков, комбо, жизни и победный экран'
  },
  {
    title: 'Крипто-трекер портфеля',
    prompt: 'Панель управления крипто-портфелем с интерактивным графиком динамики активов (BTC, ETH, SOL), балансом, калькулятором PnL и симулятором транзакций'
  },
  {
    title: 'Холст частиц и гравитации',
    prompt: 'Интерактивный физический симулятор частиц на HTML5 Canvas: частицы притягиваются к курсору, настраивается гравитация, цвет, скорость и хвост свечения'
  },
  {
    title: 'Markdown Live редактор',
    prompt: 'Двухпанельный редактор Markdown с мгновенным live-превью, счетчиком слов и времени чтения, поддержкой заголовков, списков, чекбоксов и копированием HTML'
  }
];

export const AppStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [generatedApp, setGeneratedApp] = useState<GeneratedApp | null>(null);
  const [editableHtml, setEditableHtml] = useState('');
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSurpriseMe = () => {
    const random = APP_TEMPLATES[Math.floor(Math.random() * APP_TEMPLATES.length)];
    setPrompt(random.prompt);
  };

  const handleEnhance = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setError(null);
    try {
      const res = await fetch('/api/gen/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: 'web application' })
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
      const res = await fetch('/api/gen/app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const app = await res.json();
      if (!res.ok) throw new Error(app.error || 'Ошибка при генерации приложения');

      setGeneratedApp(app);
      setEditableHtml(app.html);
      setViewMode('preview');
    } catch (err: any) {
      setError(err.message || 'Ошибка сборки приложения');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyEditedCode = () => {
    if (!generatedApp) return;
    setGeneratedApp({ ...generatedApp, html: editableHtml });
    setViewMode('preview');
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 2000);
  };

  const handleCopyCode = () => {
    if (!generatedApp) return;
    navigator.clipboard.writeText(editableHtml || generatedApp.html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isExportingApk, setIsExportingApk] = useState(false);

  const handleDownload = () => {
    if (!generatedApp) return;
    const content = editableHtml || generatedApp.html;
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedApp.title.toLowerCase().replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    if (!generatedApp) return;
    setIsExportingZip(true);
    try {
      const content = editableHtml || generatedApp.html;
      const zipBlob = await generateAppZip(generatedApp.title, content);
      triggerFileDownload(zipBlob, `${generatedApp.title.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}-project.zip`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleDownloadApk = async () => {
    if (!generatedApp) return;
    setIsExportingApk(true);
    try {
      const content = editableHtml || generatedApp.html;
      const apkBlob = await generateAndroidApk(generatedApp.title, content);
      triggerFileDownload(apkBlob, `${generatedApp.title.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}-release.apk`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingApk(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Input Section */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Генератор Web-Приложений</h3>
              <p className="text-xs text-zinc-400">Генерация работающего ПО, утилит и игр</p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Концепция приложения
                </label>
                <button
                  type="button"
                  onClick={handleEnhance}
                  disabled={!prompt.trim() || isEnhancing || isGenerating}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-40 transition-colors"
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
                placeholder="Опишите функции, интерфейс и поведение (например: интерактивный симулятор физических частиц с гравитацией)..."
                rows={4}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 rounded-2xl p-4 text-sm text-zinc-100 placeholder-zinc-500 transition-all outline-none resize-none"
              />
            </div>

            {/* Quick Template Prompts */}
            <div>
              <span className="text-[11px] text-zinc-500 block mb-2 font-medium">Шаблоны готовых приложений:</span>
              <div className="space-y-1.5">
                {APP_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(tmpl.prompt)}
                    className="w-full text-left px-3 py-2 bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 rounded-xl transition-all group"
                  >
                    <div className="text-xs font-semibold text-zinc-200 group-hover:text-emerald-300">
                      {tmpl.title}
                    </div>
                    <div className="text-[10px] text-zinc-500 line-clamp-1">
                      {tmpl.prompt}
                    </div>
                  </button>
                ))}
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
                title="Случайный шаблон приложения"
              >
                🎲
              </button>
              <button
                type="submit"
                disabled={!prompt.trim() || isGenerating}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Пишем архитектуру и компилируем код...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Сгенерировать приложение</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Sandbox Runner & Code View */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h4 className="text-base font-semibold text-zinc-100">
                {generatedApp ? generatedApp.title : 'Интерактивная песочница'}
              </h4>
              <p className="text-xs text-zinc-400">
                {generatedApp
                  ? `${generatedApp.category} • ${generatedApp.description}`
                  : 'Запустите генератор для сборки интерактивного веб-инструмента'}
              </p>
            </div>

            {generatedApp && (
              <div className="flex items-center gap-2">
                {/* View Switcher */}
                <div className="flex bg-zinc-950 border border-zinc-800 rounded-xl p-0.5">
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                      viewMode === 'preview'
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Live App</span>
                  </button>
                  <button
                    onClick={() => setViewMode('code')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                      viewMode === 'code'
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Редактор кода</span>
                  </button>
                </div>

                {/* Actions */}
                <button
                  onClick={() => setIsFullscreen(f => !f)}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs flex items-center gap-1 transition-colors"
                  title="Во весь экран"
                >
                  <Layers className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCopyCode}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs flex items-center gap-1 transition-colors"
                  title="Копировать код"
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
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shadow-md shadow-violet-600/20"
                  title="Скачать полный ZIP архив проекта"
                >
                  {isExportingZip ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileArchive className="w-3.5 h-3.5" />}
                  <span>ZIP архив</span>
                </button>
                <button
                  onClick={handleDownloadApk}
                  disabled={isExportingApk}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
                  title="Скачать APK файл для Android"
                >
                  {isExportingApk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5" />}
                  <span>APK (Android)</span>
                </button>
              </div>
            )}
          </div>

          {/* Sandbox Body */}
          <div className="relative rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden min-h-[500px] flex items-center justify-center">
            {isGenerating ? (
              <div className="text-center p-8 space-y-4">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                  <div className="absolute inset-2 rounded-full border-2 border-cyan-500/20 border-b-cyan-500 animate-spin-reverse" />
                  <Code className="w-6 h-6 text-emerald-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">Создание программного кода приложения</p>
                  <p className="text-xs text-zinc-500 mt-1">Верстка Tailwind, обработчики событий, логика состояний...</p>
                </div>
              </div>
            ) : generatedApp ? (
              viewMode === 'preview' ? (
                <iframe
                  title="App Sandbox"
                  srcDoc={generatedApp.html}
                  sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                  className="w-full h-[540px] border-0 bg-zinc-950"
                />
              ) : (
                <div className="w-full h-[540px] flex flex-col p-3 bg-zinc-950">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-xs">
                    <span className="text-zinc-400 font-mono text-[11px]">Редактируйте HTML/JS прямо здесь:</span>
                    <button
                      onClick={handleApplyEditedCode}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs flex items-center gap-1 transition-all"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{appliedNotice ? '✓ Применено!' : 'Применить и запустить'}</span>
                    </button>
                  </div>
                  <textarea
                    value={editableHtml}
                    onChange={e => setEditableHtml(e.target.value)}
                    className="flex-1 w-full p-2 bg-transparent text-zinc-200 font-mono text-xs outline-none resize-none"
                    spellCheck={false}
                  />
                </div>
              )
            ) : (
              <div className="text-center p-8 space-y-2 text-zinc-500">
                <Terminal className="w-12 h-12 mx-auto stroke-[1.2] opacity-30" />
                <p className="text-sm text-zinc-400 font-medium">Песочница пуста</p>
                <p className="text-xs text-zinc-600 max-w-sm mx-auto">
                  Выберите шаблон слева или напишите свою идею веб-приложения для мгновенной сборки.
                </p>
              </div>
            )}
          </div>

          {/* Fullscreen Modal Overlay */}
          {isFullscreen && generatedApp && (
            <div className="fixed inset-0 z-50 bg-black/90 p-4 sm:p-8 flex flex-col backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-bold text-white">{generatedApp.title} (Fullscreen)</h4>
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold"
                >
                  ✕ Закрыть полноэкранный режим
                </button>
              </div>
              <div className="flex-1 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950">
                <iframe
                  title="Fullscreen App"
                  srcDoc={generatedApp.html}
                  sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          )}

          {/* Features pills */}
          {generatedApp?.features && (
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <span className="text-[11px] text-zinc-500 font-medium">Реализованный функционал:</span>
              {generatedApp.features.map((f, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs"
                >
                  ✓ {f}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
