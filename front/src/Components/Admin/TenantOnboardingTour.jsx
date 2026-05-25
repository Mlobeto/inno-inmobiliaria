/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react';
import {
  IoBusinessOutline,
  IoCallOutline,
  IoCheckmarkCircleOutline,
  IoCloudUploadOutline,
  IoDocumentTextOutline,
  IoImageOutline,
  IoLocationOutline,
  IoMailOutline,
  IoSparklesOutline,
} from 'react-icons/io5';
import { validateCUIT } from '../../utils/cuitValidator';
import { btnPrimary, btnSecondary, inputClass } from './adminPanelTheme';

const FIELD_STEPS = [
  {
    key: 'company_name',
    icon: IoBusinessOutline,
    title: '¿Cómo se llama tu inmobiliaria?',
    hint: 'Aparecerá en contratos, recibos y PDFs.',
    placeholder: 'Ej: Inmobiliaria Del Centro',
    type: 'text',
  },
  {
    key: 'company_cuit',
    icon: IoDocumentTextOutline,
    title: 'CUIT de la inmobiliaria',
    hint: 'Dato fiscal para recibos y documentos legales.',
    placeholder: '20-12345678-9',
    type: 'text',
    inputMode: 'numeric',
  },
  {
    key: 'company_address',
    icon: IoLocationOutline,
    title: 'Dirección comercial',
    hint: 'Calle y número de tu oficina o local.',
    placeholder: 'Av. Principal 123',
    type: 'text',
  },
  {
    key: 'company_phone',
    icon: IoCallOutline,
    title: 'Teléfono de contacto',
    hint: 'Lo verán tus clientes en documentos y fichas.',
    placeholder: '+54 9 11 1234-5678',
    type: 'tel',
  },
  {
    key: 'company_email',
    icon: IoMailOutline,
    title: 'Email de contacto',
    hint: 'Correo principal de la inmobiliaria.',
    placeholder: 'contacto@inmobiliaria.com',
    type: 'email',
  },
  {
    key: 'company_registration',
    icon: IoDocumentTextOutline,
    title: 'Matrícula profesional',
    hint: 'Aparece en contratos y autorizaciones de venta.',
    placeholder: 'Ej: Mat. CPI 1234 — Colegio de Martilleros',
    type: 'text',
  },
  {
    key: 'company_logo_url',
    icon: IoImageOutline,
    title: 'Logo de tu inmobiliaria',
    hint: 'Se usa en fichas PDF, recibos y tu página web. Podés omitirlo y subirlo después.',
    type: 'logo',
    optional: true,
  },
];

export function validateOnboardingField(key, value) {
  const v = String(value || '').trim();
  if (key === 'company_logo_url') return { valid: true };

  if (!v) return { valid: false, message: 'Este campo es obligatorio' };

  if (key === 'company_name') {
    if (v.length < 2) return { valid: false, message: 'Ingresá al menos 2 caracteres' };
    return { valid: true };
  }
  if (key === 'company_cuit') {
    const result = validateCUIT(v);
    return result.valid ? { valid: true } : { valid: false, message: result.message || 'CUIT inválido' };
  }
  if (key === 'company_address') {
    if (v.length < 3) return { valid: false, message: 'Ingresá una dirección válida' };
    return { valid: true };
  }
  if (key === 'company_phone') {
    if (!/^\+?\d{10,15}$/.test(v.replace(/[\s-]/g, ''))) {
      return { valid: false, message: 'Ingresá un teléfono válido (10-15 dígitos)' };
    }
    return { valid: true };
  }
  if (key === 'company_email') {
    if (!/\S+@\S+\.\S+/.test(v)) return { valid: false, message: 'Ingresá un email válido' };
    return { valid: true };
  }
  if (key === 'company_registration') {
    if (v.length < 3) return { valid: false, message: 'Ingresá tu matrícula o colegio profesional' };
    return { valid: true };
  }
  return { valid: true };
}

function firstIncompleteFieldIndex(settings) {
  return FIELD_STEPS.findIndex(
    (s) => !s.optional && !validateOnboardingField(s.key, settings[s.key]).valid,
  );
}

const REQUIRED_STEP_COUNT = FIELD_STEPS.filter((s) => !s.optional).length;

const TenantOnboardingTour = ({
  settings,
  onFieldChange,
  onLogoUpload,
  isUploadingLogo = false,
  onComplete,
  isSaving = false,
  showIntro = true,
  trialDays = 7,
}) => {
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const totalSteps = (showIntro ? 1 : 0) + FIELD_STEPS.length + 1;
  const [step, setStep] = useState(() => {
    const incompleteIdx = firstIncompleteFieldIndex(settings);
    if (showIntro && incompleteIdx === 0 && !settings.company_name?.trim()) return 0;
    if (incompleteIdx >= 0) return (showIntro ? 1 : 0) + incompleteIdx;
    return totalSteps - 1;
  });
  const [error, setError] = useState('');

  const introOffset = showIntro ? 1 : 0;
  const isIntro = showIntro && step === 0;
  const isFinish = step === totalSteps - 1;
  const fieldIndex = step - introOffset;
  const currentField = fieldIndex >= 0 && fieldIndex < FIELD_STEPS.length
    ? FIELD_STEPS[fieldIndex]
    : null;
  const isLogoStep = currentField?.type === 'logo';

  const progress = Math.round(((step + 1) / totalSteps) * 100);

  useEffect(() => {
    if (!isIntro && !isFinish && !isLogoStep) {
      inputRef.current?.focus();
    }
  }, [step, isIntro, isFinish, isLogoStep]);

  const handleFieldInput = (e) => {
    const { name, value } = e.target;
    onFieldChange(name, value);
    if (error) setError('');
  };

  const goNext = () => {
    if (isIntro) {
      setStep(1);
      setError('');
      return;
    }
    if (isFinish) {
      onComplete();
      return;
    }
    if (currentField?.optional) {
      setError('');
      setStep((s) => s + 1);
      return;
    }
    const validation = validateOnboardingField(currentField.key, settings[currentField.key]);
    if (!validation.valid) {
      setError(validation.message);
      inputRef.current?.focus();
      return;
    }
    setError('');
    setStep((s) => s + 1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLogoStep) {
      e.preventDefault();
      goNext();
    }
  };

  const fieldValidation = currentField && !currentField.optional
    ? validateOnboardingField(currentField.key, settings[currentField.key])
    : { valid: true };
  const canAdvance = isIntro || isFinish || currentField?.optional || fieldValidation.valid;

  const FieldIcon = currentField?.icon;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-borderStrong bg-bgSurface shadow-brandGlow overflow-hidden">
        <div className="h-1 bg-bgElevated">
          <div
            className="h-full bg-brand transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-8">
          <p className="text-xs font-medium text-textMuted uppercase tracking-wider mb-6">
            Paso {step + 1} de {totalSteps}
          </p>

          {isIntro && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-muted text-brand-light mb-5">
                <IoSparklesOutline className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-textPrimary mb-2">
                Bienvenido a GestProp
              </h2>
              <p className="text-textSecondary text-sm leading-relaxed mb-1">
                Tenés <strong className="text-brand-light">{trialDays} días</strong> de prueba gratuita.
              </p>
              <p className="text-textMuted text-sm">
                Configurá tu inmobiliaria en {REQUIRED_STEP_COUNT} pasos — menos de 3 minutos.
              </p>
            </div>
          )}

          {currentField && currentField.type !== 'logo' && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-brand-muted text-brand-light">
                  <FieldIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-textPrimary">{currentField.title}</h2>
                  <p className="text-sm text-textMuted mt-0.5">{currentField.hint}</p>
                </div>
              </div>
              <input
                ref={inputRef}
                type={currentField.type}
                name={currentField.key}
                value={settings[currentField.key] || ''}
                onChange={handleFieldInput}
                onKeyDown={handleKeyDown}
                placeholder={currentField.placeholder}
                inputMode={currentField.inputMode}
                autoComplete="off"
                className={`${inputClass} py-3.5 text-base ${error ? 'border-customRed/50 ring-customRed/30' : ''}`}
              />
              {error && <p className="mt-2 text-sm text-customRed">{error}</p>}
            </div>
          )}

          {isLogoStep && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-brand-muted text-brand-light">
                  <IoImageOutline className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-textPrimary">{currentField.title}</h2>
                  <p className="text-sm text-textMuted mt-0.5">{currentField.hint}</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 p-6 rounded-xl border border-dashed border-borderStrong bg-bgElevated">
                {settings.company_logo_url ? (
                  <img
                    src={settings.company_logo_url}
                    alt="Logo"
                    className="max-h-24 max-w-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-brand-muted flex items-center justify-center">
                    <IoImageOutline className="w-10 h-10 text-brand-light/50" />
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onLogoUpload}
                />
                <button
                  type="button"
                  disabled={isUploadingLogo}
                  onClick={() => fileRef.current?.click()}
                  className={`${btnSecondary} gap-2`}
                >
                  <IoCloudUploadOutline className="w-4 h-4" />
                  {isUploadingLogo ? 'Subiendo...' : settings.company_logo_url ? 'Cambiar logo' : 'Subir logo'}
                </button>
              </div>
            </div>
          )}

          {isFinish && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-muted text-brand-light mb-5">
                <IoCheckmarkCircleOutline className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-textPrimary mb-2">
                ¡Todo listo!
              </h2>
              <p className="text-textSecondary text-sm">
                Te mostramos un recorrido rápido por el panel para que empieces en segundos.
              </p>
              <div className="mt-5 p-4 rounded-xl bg-bgElevated border border-borderBase text-left text-sm space-y-1.5">
                <p className="text-textPrimary font-medium">{settings.company_name}</p>
                {settings.company_registration && (
                  <p className="text-textMuted text-xs">{settings.company_registration}</p>
                )}
                <p className="text-textMuted">{settings.company_address}</p>
                <p className="text-textMuted">{settings.company_phone} · {settings.company_email}</p>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={goNext}
              disabled={!canAdvance || isSaving || isUploadingLogo}
              className={`${btnPrimary} w-full justify-center py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {isSaving
                ? 'Guardando...'
                : isFinish
                  ? 'Ir al panel'
                  : isIntro
                    ? 'Empezar'
                    : isLogoStep
                      ? 'Continuar'
                      : fieldIndex === FIELD_STEPS.length - 1
                        ? 'Revisar'
                        : 'Siguiente'}
            </button>
            {isLogoStep && (
              <button
                type="button"
                onClick={goNext}
                disabled={isSaving || isUploadingLogo}
                className={`${btnSecondary} w-full justify-center py-2.5 text-sm text-textMuted`}
              >
                Omitir por ahora
              </button>
            )}
            {!isIntro && !isFinish && !isLogoStep && (
              <p className="text-center text-xs text-textMuted">
                Completá el campo para continuar
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantOnboardingTour;
