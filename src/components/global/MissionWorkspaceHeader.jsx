import React from 'react';
import { ArrowUpRight, Orbit } from 'lucide-react';
import { NAV_MODULES } from './SidebarNav';
import { useLanguage } from '../../i18n/LanguageContext';

export default function MissionWorkspaceHeader({ activeModule, selectedDay }) {
  const { t } = useLanguage();
  const module = NAV_MODULES.find((item) => item.id === activeModule);

  return (
    <div className="mission-workspace-heading">
      <div>
        <div className="mission-eyebrow">
          <span className="mission-heading-marker" aria-hidden="true" />
          <span>{t('CREW HEALTH & PERFORMANCE')}</span>
          <span className="mission-heading-separator">/</span>
          <span className="font-mono">{module?.num}</span>
        </div>
        <h1>{activeModule === 'overview' ? t('Mission overview') : t(module?.label)}</h1>
        <p>{t('Autonomous health intelligence. Built for life beyond Earth.')}</p>
      </div>
      <div className="mission-orbit-label">
        <Orbit className="h-5 w-5" strokeWidth={1.25} aria-hidden="true" />
        <div>
          <span>{t('DEEP SPACE TRANSIT')}</span>
          <strong>AURA-7 <span>/</span> {t('Day')} {String(selectedDay).padStart(3, '0')}</strong>
        </div>
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </div>
    </div>
  );
}
