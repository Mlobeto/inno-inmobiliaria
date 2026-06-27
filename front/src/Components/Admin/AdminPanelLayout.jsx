import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { IoArrowBackOutline, IoChevronForwardOutline } from 'react-icons/io5';
import { panelShell, backLink } from './adminPanelTheme';

export function AdminPanelLayout({
  backTo = '/panel',
  backLabel = 'Panel',
  backOnClick,
  title,
  subtitle,
  icon: Icon,
  iconClassName = 'text-brand-light',
  actions,
  children,
  wide = false,
}) {
  return (
    <div className={panelShell}>
      <div className={`${wide ? 'max-w-7xl' : 'max-w-6xl'} mx-auto px-3 sm:px-4 py-4 sm:py-5`}>
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-start gap-3 min-w-0">
            {backOnClick ? (
              <button type="button" onClick={backOnClick} className={`${backLink} mt-0.5`}>
                <IoArrowBackOutline className="w-4 h-4" />
                <span className="hidden sm:inline">{backLabel}</span>
              </button>
            ) : (
              <Link to={backTo} className={`${backLink} mt-0.5`}>
                <IoArrowBackOutline className="w-4 h-4" />
                <span className="hidden sm:inline">{backLabel}</span>
              </Link>
            )}
            <div className="min-w-0 border-l border-borderBase pl-3">
              <h1 className="text-xl font-bold flex items-center gap-2">
                {Icon && <Icon className={`w-6 h-6 shrink-0 ${iconClassName}`} />}
                <span className="truncate">{title}</span>
              </h1>
              {subtitle && <p className="text-sm text-textSecondary mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">{actions}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}

AdminPanelLayout.propTypes = {
  backTo: PropTypes.string,
  backLabel: PropTypes.string,
  backOnClick: PropTypes.func,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.elementType,
  iconClassName: PropTypes.string,
  actions: PropTypes.node,
  children: PropTypes.node.isRequired,
  wide: PropTypes.bool,
};

export function PanelActionCard({ to, icon: Icon, title, description, iconBg = 'bg-brand-muted', iconColor = 'text-brand-light' }) {
  return (
    <Link to={to} className="group flex flex-col items-center text-center rounded-xl border border-borderBase bg-bgSurface hover:border-borderStrong hover:bg-brand-subtle/60 p-5 transition-all">
      <div className={`rounded-xl p-3 mb-3 ${iconBg} group-hover:scale-105 transition-transform`}>
        <Icon className={`w-7 h-7 ${iconColor}`} />
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-textPrimary">{title}</h3>
      <p className="text-xs text-textMuted mt-1 leading-snug">{description}</p>
    </Link>
  );
}

PanelActionCard.propTypes = {
  to: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  iconBg: PropTypes.string,
  iconColor: PropTypes.string,
};

export function PanelWideLinkCard({ to, icon: Icon, title, description, accent = 'brand' }) {
  const accents = {
    brand: 'from-brand-dark to-brand border-brand/30',
    yellow: 'from-brand-muted to-brand-dark border-customYellow/30',
  };
  return (
    <Link
      to={to}
      className={`group flex items-center justify-between gap-4 rounded-xl border bg-gradient-to-r ${accents[accent] || accents.brand} p-4 sm:p-5 shadow-brandGlow hover:opacity-95 transition-all`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="rounded-xl bg-textWhite/15 p-2.5 shrink-0">
          <Icon className="w-6 h-6 text-textWhite" />
        </div>
        <div className="min-w-0 text-left">
          <h3 className="text-base sm:text-lg font-bold text-textWhite">{title}</h3>
          <p className="text-xs sm:text-sm text-textWhite/80 mt-0.5">{description}</p>
        </div>
      </div>
      <IoChevronForwardOutline className="w-5 h-5 text-textWhite/70 group-hover:translate-x-0.5 transition-transform shrink-0" />
    </Link>
  );
}

PanelWideLinkCard.propTypes = {
  to: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  accent: PropTypes.string,
};

export function PanelStatsGrid({ stats, loading, loadingLabel = 'Cargando…' }) {
  return (
    <div className={`rounded-xl border border-borderBase bg-bgSurface p-4 sm:p-5 ${loading ? '' : ''}`}>
      {loading ? (
        <div className="text-center py-6">
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-textSecondary text-sm mt-3">{loadingLabel}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-lg border border-borderBase bg-bgElevated px-3 py-2.5 text-center sm:text-left">
                {Icon && <Icon className={`w-4 h-4 mx-auto sm:mx-0 mb-1 ${stat.iconColor || 'text-brand-light'}`} />}
                <p className={`text-lg sm:text-xl font-bold leading-none ${stat.valueColor || 'text-textPrimary'}`}>{stat.value}</p>
                <p className="text-[10px] sm:text-xs text-textMuted mt-1">{stat.label}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

PanelStatsGrid.propTypes = {
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      icon: PropTypes.elementType,
      iconColor: PropTypes.string,
      valueColor: PropTypes.string,
    })
  ).isRequired,
  loading: PropTypes.bool,
  loadingLabel: PropTypes.string,
};
