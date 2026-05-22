import  { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectCurrentUser,
  logout as logoutAction,
  useGetCurrentSubscriptionQuery,
  useGetAllClientsQuery,
  useGetAllPropertiesQuery,
  useGetAllLeasesQuery,
  useGetAllPaymentsQuery,
  useGetCurrentTenantQuery,
} from '@shared/redux';
import {
  IoLogOutOutline,
  IoPeopleOutline,
  IoHomeOutline,
  IoDocumentTextOutline,
  IoReceiptOutline,
  IoStatsChartOutline,
  IoSettingsOutline,
  IoRocketOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoHelpCircleOutline,
  IoCardOutline,
  IoGlobeOutline,
  IoFunnelOutline,
  IoChatbubblesOutline,
  IoMapOutline,
  IoPeopleOutline as IoPeopleSharpOutline,
  IoCashOutline,
  IoChevronForwardOutline,
} from 'react-icons/io5';
import Logo from '../Logo';
import UpcomingExpiryPopup from '../Contratos/UpcomingExpiryPopup';
import TipsModal from '../TipsModal';

const Panel = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showTipsModal, setShowTipsModal] = useState(false);

  const currentUser = useSelector(selectCurrentUser);

  const { data: subscriptionData, isLoading: loadingSubscription } = useGetCurrentSubscriptionQuery(
    undefined,
    { skip: !currentUser?.tenantId }
  );

  const { data: tenantData } = useGetCurrentTenantQuery(
    undefined,
    { skip: !currentUser?.tenantId }
  );

  const tenantSubdomain = tenantData?.data?.subdomain || null;
  const planFeatures = subscriptionData?.subscription?.Plan?.features || {};
  const tenantFeatures = tenantData?.data?.features || {};
  const effectiveFeatures = { ...planFeatures, ...tenantFeatures };
  const hasLandingFeature = effectiveFeatures.landingPage === true;
  const hasLeadsFeature = effectiveFeatures.leads === true;
  const hasLoteosFeature = effectiveFeatures.loteos === true;
  const hasAgentRoleFeature = effectiveFeatures.agentRole === true;

  const { data: clients = [], isLoading: loadingClients } = useGetAllClientsQuery(
    undefined,
    { skip: !currentUser?.tenantId }
  );

  const { data: properties = [], isLoading: loadingProperties } = useGetAllPropertiesQuery(
    undefined,
    { skip: !currentUser?.tenantId }
  );

  const { data: leases = [], isLoading: loadingLeases } = useGetAllLeasesQuery(
    undefined,
    { skip: !currentUser?.tenantId }
  );

  const { data: payments = [], isLoading: loadingPayments } = useGetAllPaymentsQuery(
    undefined,
    { skip: !currentUser?.tenantId }
  );

  const loading = loadingClients || loadingProperties || loadingLeases || loadingPayments;

  const stats = useMemo(() => ({
    clientesActivos: clients.length,
    totalPropiedades: properties.length,
    contratosActivos: leases.filter((lease) => lease.status === 'active').length,
    totalRecibos: payments.length,
  }), [clients, properties, leases, payments]);

  const handleLogout = () => {
    dispatch(logoutAction());
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    const hideTips = localStorage.getItem('hideTipsModal');
    if (!hideTips && currentUser) {
      localStorage.setItem('hideTipsModal', 'true');
      const timer = setTimeout(() => setShowTipsModal(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  const subscription = subscriptionData?.subscription;

  const getPlanName = (planId) => {
    const plans = {
      free: 'Gratis',
      basic: 'Básico',
      professional: 'Profesional',
      enterprise: 'Empresarial',
      FREE: 'Gratis',
      BASIC: 'Básico',
      PROFESSIONAL: 'Profesional',
      ENTERPRISE: 'Empresarial',
    };
    return plans[planId] || planId?.toUpperCase();
  };

  const getPlanGradient = (planId) => {
    const colors = {
      free: 'from-brand-muted to-brand-dark',
      basic: 'from-brand-dark to-brand',
      professional: 'from-brand to-brand-light',
      enterprise: 'from-brand-light to-brand-dark',
      FREE: 'from-brand-muted to-brand-dark',
      BASIC: 'from-brand-dark to-brand',
      PROFESSIONAL: 'from-brand to-brand-light',
      ENTERPRISE: 'from-brand-light to-brand-dark',
    };
    return colors[planId] || 'from-brand-muted to-brand-dark';
  };

  const getStatusBadge = (status) => {
    const badges = {
      trialing: { text: 'Periodo de prueba', color: 'bg-customBlue' },
      active: { text: 'Activo', color: 'bg-brand-dark' },
      past_due: { text: 'Vencido', color: 'bg-customRed' },
      canceled: { text: 'Cancelado', color: 'bg-brand-muted' },
    };
    return badges[status] || { text: status, color: 'bg-brand-muted' };
  };

  const menuItems = [
    {
      title: 'Clientes',
      path: '/panelClientes',
      icon: IoPeopleOutline,
      iconBg: 'bg-brand-muted',
      iconColor: 'text-brand-light',
      description: 'Gestionar clientes',
    },
    {
      title: 'Propiedades',
      path: '/panelPropiedades',
      icon: IoHomeOutline,
      iconBg: 'bg-brand-muted',
      iconColor: 'text-brand-light',
      description: 'Administrar propiedades',
    },
    {
      title: 'Contratos',
      path: '/panelContratos',
      icon: IoDocumentTextOutline,
      iconBg: 'bg-customYellowMuted',
      iconColor: 'text-customYellow',
      description: 'Gestionar contratos',
    },
    {
      title: 'Recibos',
      path: '/create-payment',
      icon: IoReceiptOutline,
      iconBg: 'bg-brand-subtle',
      iconColor: 'text-brand',
      description: 'Generar recibos',
    },
    {
      title: 'Leads / CRM',
      path: '/panelLeads',
      icon: IoFunnelOutline,
      iconBg: 'bg-customBlueMuted',
      iconColor: 'text-customBlue',
      description: 'Seguimiento de prospectos',
      feature: 'leads',
    },
    {
      title: 'Soporte',
      path: '/soporte',
      icon: IoChatbubblesOutline,
      iconBg: 'bg-brand-muted',
      iconColor: 'text-brand-light',
      description: 'Tickets de ayuda',
    },
    {
      title: 'Loteos',
      path: '/panelLoteos',
      icon: IoMapOutline,
      iconBg: 'bg-brand-muted',
      iconColor: 'text-brand-light',
      description: 'Venta de lotes',
      feature: 'loteos',
    },
    {
      title: 'Agentes',
      path: '/panelAgentes',
      icon: IoPeopleSharpOutline,
      iconBg: 'bg-brand-subtle',
      iconColor: 'text-brand',
      description: 'Gestionar equipo',
      feature: 'agentRole',
    },
    {
      title: 'Comisiones',
      path: '/panelComisiones',
      icon: IoCashOutline,
      iconBg: 'bg-customYellowMuted',
      iconColor: 'text-customYellow',
      description: 'Liquidar comisiones',
      feature: 'agentRole',
    },
    {
      title: 'Liquidaciones',
      path: '/liquidaciones',
      icon: IoReceiptOutline,
      iconBg: 'bg-brand-muted',
      iconColor: 'text-brand-light',
      description: 'Liquidar al propietario',
    },
  ];

  const visibleMenuItems = menuItems.filter((item) => {
    if (item.feature === 'leads') return hasLeadsFeature;
    if (item.feature === 'loteos') return hasLoteosFeature;
    if (item.feature === 'agentRole') return hasAgentRoleFeature;
    return true;
  });

  const quickStats = [
    { label: 'Clientes', value: loading ? '…' : stats.clientesActivos, icon: IoPeopleOutline, iconColor: 'text-brand-light' },
    { label: 'Propiedades', value: loading ? '…' : stats.totalPropiedades, icon: IoHomeOutline, iconColor: 'text-brand-light' },
    { label: 'Contratos', value: loading ? '…' : stats.contratosActivos, icon: IoDocumentTextOutline, iconColor: 'text-customYellow' },
    { label: 'Recibos', value: loading ? '…' : stats.totalRecibos, icon: IoReceiptOutline, iconColor: 'text-brand' },
  ];

  const navBtn =
    'inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs sm:text-sm text-textSecondary hover:text-textPrimary border border-borderBase hover:border-borderStrong hover:bg-brand-subtle transition-colors';

  return (
    <div className="min-h-screen bg-[#0B0E0C] font-Montserrat text-textPrimary">
      <UpcomingExpiryPopup />

      {/* Header compacto */}
      <header className="sticky top-0 z-20 border-b border-borderBase bg-[#0B0E0C]/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 flex justify-between items-center gap-2">
          <Link to="/panel" className="flex items-center gap-2 min-w-0 shrink-0">
            <Logo color="#5A8C72" size={28} />
            <div className="min-w-0 hidden sm:block">
              <p className="text-sm font-semibold text-textPrimary truncate leading-tight">
                {currentUser?.username || 'Panel'}
              </p>
              {currentUser?.email && (
                <p className="text-[10px] text-textMuted truncate max-w-[140px] lg:max-w-[200px]">
                  {currentUser.email}
                </p>
              )}
            </div>
          </Link>

          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
            <button type="button" onClick={() => setShowTipsModal(true)} className={navBtn} title="Ver guía de uso">
              <IoHelpCircleOutline className="w-4 h-4 shrink-0 text-customYellow" />
              <span className="hidden lg:inline">Ayuda</span>
            </button>
            <Link to="/subscription" className={navBtn} title="Mi suscripción">
              <IoCardOutline className="w-4 h-4 shrink-0 text-brand-light" />
              <span className="hidden lg:inline">Mi plan</span>
            </Link>
            {tenantSubdomain && hasLandingFeature && (
              <Link
                to={`/${tenantSubdomain}`}
                target="_blank"
                className={navBtn}
                title="Ver mi landing pública"
              >
                <IoGlobeOutline className="w-4 h-4 shrink-0 text-brand-light" />
                <span className="hidden xl:inline">Mi landing</span>
              </Link>
            )}
            <Link to="/company-settings" className={navBtn} title="Configuración">
              <IoSettingsOutline className="w-4 h-4 shrink-0 text-brand-light" />
              <span className="hidden lg:inline">Config</span>
            </Link>
            <button type="button" onClick={handleLogout} className={`${navBtn} hover:border-customRed/40 hover:bg-customRedMuted`} title="Cerrar sesión">
              <IoLogOutOutline className="w-4 h-4 shrink-0 text-customRed" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-5 sm:py-6">
        {/* Bienvenida + stats en fila */}
        <div className="mb-5 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-textPrimary">
            Bienvenido, {currentUser?.username || 'Usuario'}
          </h1>
          <p className="text-sm text-textSecondary mt-0.5">
            Automatizá tu inmobiliaria desde un solo lugar
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-5 sm:mb-6">
          {quickStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-xl border border-borderBase bg-bgSurface px-3 py-2.5 sm:py-3 flex items-center gap-2.5"
              >
                <Icon className={`w-4 h-4 shrink-0 ${stat.iconColor}`} />
                <div className="min-w-0">
                  <p className="text-lg sm:text-xl font-bold text-textPrimary leading-none">{stat.value}</p>
                  <p className="text-[10px] sm:text-xs text-textMuted truncate">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Suscripción — barra compacta */}
        {currentUser?.tenantId && (
          <div className="mb-5 sm:mb-6">
            {loadingSubscription ? (
              <div className="rounded-xl border border-borderBase bg-bgSurface p-4 animate-pulse h-16" />
            ) : subscription ? (
              <div className={`rounded-xl border border-borderStrong bg-gradient-to-r ${getPlanGradient(subscription.planId)} p-4 shadow-brandGlow`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <IoRocketOutline className="w-6 h-6 text-textWhite shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-textWhite">
                          Plan {getPlanName(subscription.planId)}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold text-textWhite ${getStatusBadge(subscription.status).color}`}>
                          {getStatusBadge(subscription.status).text}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-textWhite/85">
                        <span className="inline-flex items-center gap-1">
                          <IoCalendarOutline className="w-3.5 h-3.5" />
                          Vence:{' '}
                          {subscription.currentPeriodEnd
                            ? new Date(subscription.currentPeriodEnd).toLocaleDateString('es-AR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Sin fecha'}
                        </span>
                        {subscription.Plan && (
                          <span className="inline-flex items-center gap-1">
                            <IoCheckmarkCircleOutline className="w-3.5 h-3.5" />
                            {subscription.Plan.name || 'Plan activo'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/subscription')}
                    className="shrink-0 self-start sm:self-center px-3 py-1.5 text-xs font-semibold bg-textWhite/15 hover:bg-textWhite/25 text-textWhite rounded-lg border border-textWhite/25 transition-colors"
                  >
                    Gestionar
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-borderBase bg-bgSurface p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <IoRocketOutline className="w-6 h-6 text-textMuted shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-textPrimary">Sin suscripción activa</h3>
                    <p className="text-xs text-textSecondary mt-0.5">
                      Activá un plan para acceder a todas las funcionalidades
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/subscriptions/plans')}
                  className="shrink-0 px-4 py-2 text-xs font-semibold bg-brand hover:bg-brand-dark text-textWhite rounded-lg transition-colors"
                >
                  Ver planes
                </button>
              </div>
            )}
          </div>
        )}

        {/* Módulos */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-textMuted mb-3">
            Módulos
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="group flex flex-col items-center text-center rounded-xl border border-borderBase bg-bgSurface hover:border-borderStrong hover:bg-brand-subtle/60 p-3 sm:p-4 transition-all"
                >
                  <div className={`rounded-xl p-2.5 mb-2 ${item.iconBg} group-hover:scale-105 transition-transform`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${item.iconColor}`} />
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-textPrimary leading-tight">{item.title}</h3>
                  <p className="text-[10px] sm:text-xs text-textMuted mt-0.5 line-clamp-2 hidden sm:block">
                    {item.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Informes */}
        <section className="mt-5 sm:mt-6">
          <Link
            to="/PanelInformes"
            className="group flex items-center justify-between gap-4 rounded-xl border border-borderStrong bg-gradient-to-r from-brand-dark to-brand p-4 sm:p-5 shadow-brandGlow hover:from-brand hover:to-brand-light transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="rounded-xl bg-textWhite/15 p-2.5 shrink-0">
                <IoStatsChartOutline className="w-6 h-6 text-textWhite" />
              </div>
              <div className="min-w-0 text-left">
                <h3 className="text-base sm:text-lg font-bold text-textWhite">Informes y estadísticas</h3>
                <p className="text-xs sm:text-sm text-textWhite/80 mt-0.5 truncate sm:whitespace-normal">
                  Analizá el rendimiento de tu negocio con reportes detallados
                </p>
              </div>
            </div>
            <IoChevronForwardOutline className="w-5 h-5 text-textWhite/70 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </Link>
        </section>
      </main>

      <TipsModal isOpen={showTipsModal} onClose={() => setShowTipsModal(false)} />
    </div>
  );
};

export default Panel;
