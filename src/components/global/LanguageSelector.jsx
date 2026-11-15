import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const LANGUAGES = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
];

export default function LanguageSelector({ theme }) {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const optionRefs = useRef([]);

  useEffect(() => {
    if (!open) return;
    optionRefs.current[LANGUAGES.findIndex((item) => item.id === language)]?.focus();
    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, [open, language]);

  const closeAndFocus = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeAndFocus();
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      if (!open) { setOpen(true); return; }
      const current = optionRefs.current.indexOf(document.activeElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1
        : (current + (event.key === 'ArrowDown' ? 1 : -1) + LANGUAGES.length) % LANGUAGES.length;
      optionRefs.current[next]?.focus();
    }
    if (event.key === 'Tab') setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative shrink-0" onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`${t('Change language')}: ${LANGUAGES.find((item) => item.id === language).label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="language-menu"
        onClick={() => setOpen((current) => !current)}
        className={`mission-language-button inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${theme.cardSubtleBg}`}
      >
        <Languages className={`h-4 w-4 ${theme.accentText}`} aria-hidden="true" />
        <span>{LANGUAGES.find((item) => item.id === language).label}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div
          id="language-menu"
          role="menu"
          aria-label={t('Language')}
          className={`mission-language-menu absolute left-0 top-full z-50 mt-2 min-w-40 rounded-xl border p-1.5 shadow-xl xl:left-auto xl:right-0 ${theme.isDark ? 'border-slate-600 bg-slate-950 text-slate-100' : 'border-sky-200 bg-white text-slate-900'}`}
        >
          <div className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider ${theme.textMuted}`}>{t('Language')}</div>
          {LANGUAGES.map((item, index) => (
            <button
              key={item.id}
              ref={(element) => { optionRefs.current[index] = element; }}
              type="button"
              role="menuitemradio"
              aria-checked={language === item.id}
              lang={item.id}
              tabIndex={-1}
              onClick={() => { setLanguage(item.id); closeAndFocus(); }}
              className={`flex w-full items-center justify-between gap-4 rounded-lg px-2.5 py-2 text-left text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 ${language === item.id ? theme.pillActive : theme.pillInactive}`}
            >
              <span>{item.label}</span>
              {language === item.id && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
