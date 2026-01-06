# 🌎 Plan de Internacionalización LATAM

## 📊 Investigación: Requisitos por País

### ✅ Matrícula Inmobiliaria (Real Estate License)

| País | ¿Obligatoria? | Nombre | Entidad Emisora |
|------|---------------|--------|-----------------|
| 🇦🇷 Argentina | **SÍ** | Matrícula Inmobiliaria | Colegio de Corredores Inmobiliarios (provincial) |
| �🇷 Brasil | **SÍ** | CRECI | Conselho Regional de Corretores de Imóveis |
| 🇨🇱 Chile | NO | Registro Voluntario | Ministerio de Vivienda y Urbanismo |
| 🇨🇴 Colombia | **SÍ** | Matrícula Lonja | Lonja de Propiedad Raíz |
| 🇪🇨 Ecuador | NO | Registro Opcional | Municipio local |
| 🇲🇽 México | NO | Cédula Profesional | SEP (Secretaría de Educación Pública) |
| 🇵🇪 Perú | NO | Registro SUNARP | SUNARP (opcional) |
| 🇺🇾 Uruguay | **SÍ** | Matrícula de Corredor | Ministerio de Economía y Finanzas |

### 📄 Documentos de Identidad

#### Personas Físicas
| País | Documento Público | Documento Fiscal/Tributario |
|------|-------------------|------------------------------|
| 🇦🇷 Argentina | DNI (7-8 dígitos) | CUIL (XX-XXXXXXXX-X) + CDI para extranjeros |
| 🇧🇷 Brasil | RG / Carteira de Identidade | CPF (XXX.XXX.XXX-XX) |
| 🇨🇱 Chile | RUN/DNI | RUT (mismo número que RUN normalmente) |
| 🇨🇴 Colombia | Cédula de Ciudadanía (CC) | NIT (tax number) |
| 🇪🇨 Ecuador | Cédula de Identidad (CI) | CI (también se usa como tax ID) |
| 🇲🇽 México | CURP / INE | RFC (tax ID) |
| 🇵🇪 Perú | DNI (8 dígitos) | RUC (tax ID) |
| 🇺🇾 Uruguay | Cédula de Identidad | RUT (tax number) |

#### Empresas / Inmobiliarias
| País | Documento Fiscal Empresarial |
|------|------------------------------|
| 🇦🇷 Argentina | CUIT (XX-XXXXXXXX-X) |
| 🇧🇷 Brasil | CNPJ (XX.XXX.XXX/XXXX-XX) |
| 🇨🇱 Chile | RUT Empresa (XX.XXX.XXX-X) |
| 🇨🇴 Colombia | NIT (XXXXXXXXX-X) |
| 🇪🇨 Ecuador | RUC (13 dígitos) |
| 🇲🇽 México | RFC (AAA000000XXX) |
| 🇵🇪 Perú | RUC (11 dígitos) |
| 🇺🇾 Uruguay | RUT (12 dígitos) |

## 🎯 Estrategia de Implementación

### Fase 1: Base Argentina (ACTUAL) ✅
- [x] CUIL/CUIT validación
- [x] Matrícula inmobiliaria obligatoria
- [x] Provincias y ciudades de Argentina
- [ ] Ejecutar migración `add-country-to-tenants.sql`
- [ ] Actualizar modelo Tenant con campo `country`
- [ ] Actualizar modelo Client para usar validación dinámica

### Fase 2: Preparación Multi-país (PRÓXIMA)
- [ ] Agregar selector de país en registro de tenant
- [ ] Actualizar CompanySettings para mostrar campos según país
- [ ] Crear componente dinámico de validación de documentos
- [ ] Agregar dropdown de provincias/estados según país
- [ ] Actualizar formulario de clientes para validación por país

### Fase 3: Expansión Internacional
- [ ] Agregar traducciones (i18n)
- [ ] Configurar monedas por país
- [ ] Integrar pasarelas de pago locales
- [ ] Documentación legal por país
- [ ] Marketing y lanzamiento por país

## 🛠️ Cambios Necesarios en el Código

### 1. Modelo Tenant (Backend)

```javascript
// back/src/data/models/Tenant.js
country: {
  type: DataTypes.STRING(2),
  allowNull: false,
  defaultValue: 'AR',
  validate: {
    isIn: [['AR', 'CL', 'MX', 'CO', 'PE']],
  },
},
countryConfig: {
  type: DataTypes.JSONB,
  allowNull: true,
  defaultValue: {},
},
```

### 2. Modelo Client (Backend)

```javascript
// back/src/data/models/Client.js
// Cambiar de "cuil" específico a "document"
document: {
  type: DataTypes.STRING,
  allowNull: false,
  unique: true,
  // Validación dinámica según país del tenant
},
documentType: {
  type: DataTypes.STRING(10),
  allowNull: false,
  // CUIL, CUIT, RUT, RFC, NIT, DNI, etc.
},
```

### 3. Componente de Registro (Frontend)

```jsx
// Durante registro del tenant, agregar selector de país
<select name="country">
  <option value="AR">🇦🇷 Argentina</option>
  <option value="CL">🇨🇱 Chile</option>
  <option value="MX">🇲🇽 México</option>
  <option value="CO">🇨🇴 Colombia</option>
  <option value="PE">🇵🇪 Perú</option>
</select>
```

### 4. Validación Dinámica

```javascript
// shared/src/utils/validateDocument.js
import { getCountryConfig } from '@shared/constants/countryConfigs';

export const validatePersonDocument = (value, countryCode) => {
  const config = getCountryConfig(countryCode);
  return config.documentTypes.person.format.test(value);
};

export const getDocumentLabel = (countryCode) => {
  const config = getCountryConfig(countryCode);
  return config.documentTypes.person.label;
};
```

## 💡 Recomendaciones

### Para Ahora (Fase 1)
1. **Mantener CUIL para Argentina** como está
2. **Agregar campo `country` a Tenant** (ya está la migración)
3. **Usar provincias estáticas** desde `argentinLocations.js`
4. **No complicar el MVP** con multi-país todavía

### Para Más Adelante (Fase 2-3)
1. **Selector de país en registro** cuando haya demanda
2. **Contratar consultores legales** de cada país para:
   - Requisitos de contratos
   - Impuestos locales
   - Regulaciones inmobiliarias
3. **Usar APIs de validación** (ej: API de AFIP para CUIL en Argentina)
4. **Internacionalización (i18n)** con react-i18next

## 📦 Librerías Útiles

### Provincias/Ciudades
```bash
npm install argentina-datos  # Solo Argentina
```

O usar JSON estático (más recomendado para performance)

### Validación de Documentos
- **Argentina**: Implementación manual (ya la tienes en Client.js)
- **Chile**: Usar librería `rut.js` o `validar-rut`
- **México**: Validar con algoritmo CURP/RFC

### Teléfonos Internacionales
```bash
npm install libphonenumber-js
```

### Monedas
```bash
npm install currency.js
```

## ⚠️ Consideraciones Importantes

1. **GDPR/Protección de Datos**: Cada país tiene leyes diferentes
2. **Contratos Legales**: Deben ser revisados por abogados locales
3. **Impuestos**: IVA varía por país (19% Chile, 21% Argentina, etc.)
4. **Pasarelas de Pago**: MercadoPago solo funciona en algunos países
   - Argentina: MercadoPago ✅
   - Chile: MercadoPago, Flow, Transbank
   - México: MercadoPago, Conekta, Stripe
   - Colombia: MercadoPago, PayU
   - Perú: Culqi, Niubiz

## 🎯 Respuesta a tu Pregunta

### ¿Es muy complicado?

**No es extremadamente complicado**, pero requiere:

1. **Planificación**: 2-3 semanas de diseño
2. **Implementación**: 1-2 meses por país adicional
3. **Testing**: 2 semanas por país
4. **Legal**: Consultoría externa necesaria

### Estrategia Recomendada

```
Año 1: Solo Argentina (MVP) 🇦🇷
↓Brasil, México y Uruguay 🇧🇷 🇲🇽 🇺🇾
↓
Año 4: + Perú y Ecuador 🇵🇪 🇪🇨
Año 2: + Chile y Colombia 🇨🇱 🇨🇴
↓
Año 3: + México y Perú 🇲🇽 🇵🇪
```

### Lo Que YA Puedes Hacer Ahora

1. ✅ Ejecutar migración `add-country-to-tenants.sql`
2. ✅ Usar `argentinLocations.js` para provincias
3. ✅ Mantener CUIL/CUIT como está
4. ✅ Agregar campo `country` al registro (defaultValue: 'AR')
5. ✅ Documentar en código "// TODO: Multi-country support"

### Lo Que Debes EVITAR Ahora

- ❌ No implementar multi-país sin demanda real
- ❌ No complicar el MVP con configuraciones que no vas a usar
- ❌ No agregar 5 países si no tienes clientes allá

## 📝 Próximos Pasos

1. **Ejecutar migración** de country en Tenants
2. **Usar selector de provincias** con `argentinLocations.js`
3. **Mantener foco en Argentina** hasta tener tracción
4. **Revisar este documento** cuando tengas 50+ clientes argentinos

---

**Conclusión**: Empieza simple con Argentina, prepara la estructura para escalar, expande cuando tengas demanda real. 🚀
