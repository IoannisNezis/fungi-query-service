import { searchFungi } from './lib/api';
import type { FungiResult, Language } from './types';
import './style.css';

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
];

const EDIBILITY_MAP: Record<string, { label: string; color: string }> = {
  'psychoactive mushroom': { label: 'psychoactive', color: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' },
  'medicinal mushrooms': { label: 'medicinal', color: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' },
  'choice mushroom': { label: 'choice', color: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' },
  'caution mushroom': { label: 'caution', color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' },
  'allergenic mushroom': { label: 'allergenic', color: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300' },
  'deadly mushroom': { label: 'deadly', color: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' },
  'poisonous mushroom': { label: 'poisonous', color: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' },
  'inedible mushroom': { label: 'inedible', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
  'edible when cooked': { label: 'edible when cooked', color: 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300' },
  'edible mushroom': { label: 'edible', color: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' },
};

function getStoredTheme(): 'dark' | 'light' {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return 'dark';
}

function setTheme(theme: 'dark' | 'light') {
  document.documentElement.classList.remove('dark', 'light');
  document.documentElement.classList.add(theme);
  localStorage.setItem('theme', theme);
}

class App {
  private searchInput!: HTMLInputElement;
  private languageSelect!: HTMLSelectElement;
  private resultsContainer!: HTMLDivElement;
  private loadingIndicator!: HTMLDivElement;
  private themeToggle!: HTMLButtonElement;
  private queryTimeDisplay!: HTMLSpanElement;
  private resultCountDisplay!: HTMLSpanElement;

  constructor() {
    this.render();
    this.attachEventListeners();
    setTheme(getStoredTheme());
  }

  private render() {
    const app = document.getElementById('app')!;

    app.innerHTML = `
      <div class="min-h-screen p-6 md:p-10 max-w-3xl mx-auto">
        <header class="mb-8 flex items-center justify-between">
          <h1 class="text-3xl">
            🍄 <span class="font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-green-400">Fungi Search</span>
          </h1>
          <button
            id="theme-toggle"
            class="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            <svg id="sun-icon" class="w-5 h-5 hidden dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg id="moon-icon" class="w-5 h-5 block dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
        </header>

        <div class="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            id="search-input"
            placeholder="Search for fungi (e.g. duftender, champignon, agaricus)"
            class="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
          <select
            id="language-select"
            class="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
          >
            ${LANGUAGE_OPTIONS.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join('')}
          </select>
        </div>

        <div id="results-container" class="space-y-3"></div>

        <div id="loading" class="hidden">
          <div class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            <span class="ml-3 text-gray-500 dark:text-gray-400">Searching...</span>
          </div>
        </div>

        <footer class="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between text-sm text-gray-500 dark:text-gray-400">
          <span id="query-time"></span>
          <span id="result-count"></span>
        </footer>
      </div>
    `;

    this.searchInput = document.getElementById('search-input') as HTMLInputElement;
    this.languageSelect = document.getElementById('language-select') as HTMLSelectElement;
    this.resultsContainer = document.getElementById('results-container') as HTMLDivElement;
    this.loadingIndicator = document.getElementById('loading') as HTMLDivElement;
    this.themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement;
    this.queryTimeDisplay = document.getElementById('query-time') as HTMLSpanElement;
    this.resultCountDisplay = document.getElementById('result-count') as HTMLSpanElement;
  }

  private attachEventListeners() {
    let debounceTimer: ReturnType<typeof setTimeout>;

    this.searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => this.performSearch(), 300);
    });

    this.languageSelect.addEventListener('change', () => this.performSearch());

    this.themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'light' : 'dark');
    });

    this.searchInput.focus();
  }

  private async performSearch() {
    const query = this.searchInput.value.trim();
    const language = this.languageSelect.value as Language;

    if (!query) {
      this.resultsContainer.innerHTML = '';
      this.queryTimeDisplay.textContent = '';
      this.resultCountDisplay.textContent = '';
      return;
    }

    this.loadingIndicator.classList.remove('hidden');
    this.resultsContainer.innerHTML = '';

    try {
      const results = await searchFungi(query, language);

      this.displayResults(results, query);
    } catch (error) {
      console.error('Search error:', error);
      this.resultsContainer.innerHTML = `
        <div class="text-center py-8 text-red-500 dark:text-red-400">
          Error performing search. Please try again.
        </div>
      `;
    } finally {
      this.loadingIndicator.classList.add('hidden');
    }
  }

  private highlightQuery(text: string, query: string): string {
    if (!query.trim()) return this.escapeHtml(text);
    const escaped = this.escapeHtml(text);
    const terms = query.trim().split(/\s+/).filter(t => t.length > 0);
    let result = escaped;
    for (const term of terms) {
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      result = result.replace(regex, '<mark>$1</mark>');
    }
    return result;
  }

  private displayResults(results: FungiResult[], query: string) {
    if (results.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
          No results found. Try a different search term.
        </div>
      `;
      this.queryTimeDisplay.textContent = '';
      this.resultCountDisplay.textContent = '0 results';
      return;
    }

    this.resultsContainer.innerHTML = results
      .map(
        (result, index) => `
      <div class="results-enter p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors" style="animation-delay: ${index * 50}ms">
        <div class="flex items-start gap-4">
          ${result.image ? `<img src="${this.escapeHtml(result.image)}" alt="${this.escapeHtml(result.latName)}" class="w-20 h-20 object-cover rounded-lg shrink-0" loading="lazy" />` : ''}
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-lg font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                ${this.highlightQuery(result.latName, query)}
              </h3>
              ${result.edibility && result.edibility.length > 0 ? result.edibility.map(e => `<span class="px-2 py-0.5 text-xs rounded-full ${EDIBILITY_MAP[e]?.color ?? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}">${EDIBILITY_MAP[e]?.label ?? e}</span>`).join('') : ''}
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-300 mt-1 break-words">
              ${this.highlightQuery(result.synonym, query)}
            </p>
          </div>
          <a
            href="https://www.wikidata.org/wiki/${result.qId}"
            target="_blank"
            rel="noopener noreferrer"
            class="shrink-0 px-3 py-1 text-sm rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
          >
            ${result.qId}
          </a>
        </div>
      </div>
    `
      )
      .join('');

    this.queryTimeDisplay.textContent = 'Powered by QLever Wikidata';
    this.resultCountDisplay.textContent = `${results.length} result${results.length !== 1 ? 's' : ''}`;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

new App();
