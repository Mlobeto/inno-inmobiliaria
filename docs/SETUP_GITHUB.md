# 🚀 Conectar Repositorio con GitHub

## 📋 Pasos para subir a GitHub

### 1️⃣ Crear repositorio en GitHub

Ve a: https://github.com/new

**Configuración recomendada:**
- **Repository name:** `inno-inmobiliaria` (o el nombre que prefieras)
- **Description:** Sistema de gestión inmobiliaria multi-tenant SaaS
- **Visibility:** Private (recomendado por contener lógica de negocio)
- ❌ **NO** marcar "Initialize with README" (ya tenemos archivos locales)
- ❌ **NO** agregar .gitignore (ya existe)
- ❌ **NO** elegir licencia todavía

### 2️⃣ Conectar repositorio local con GitHub

Después de crear el repo, GitHub te mostrará comandos. Usa estos:

```bash
# Agregar el repositorio remoto
git remote add origin https://github.com/TU-USUARIO/inno-inmobiliaria.git

# Verificar que se agregó correctamente
git remote -v

# Debería mostrar:
# origin  https://github.com/TU-USUARIO/inno-inmobiliaria.git (fetch)
# origin  https://github.com/TU-USUARIO/inno-inmobiliaria.git (push)
```

### 3️⃣ Subir código a GitHub

```bash
# Subir rama main
git push -u origin main

# Subir rama develop
git push -u origin develop
```

### 4️⃣ Configurar rama develop como predeterminada (Opcional pero recomendado)

En GitHub:
1. Ve a: Settings → Branches
2. Default branch: Cambiar de `main` a `develop`
3. Update

**¿Por qué?** Desarrollarás en `develop` y solo mergearás a `main` cuando esté listo para producción.

---

## 🔐 Autenticación (si GitHub pide contraseña)

### Opción 1: Personal Access Token (Recomendado)

1. **Generar token:**
   - Ve a: https://github.com/settings/tokens
   - Click: "Generate new token (classic)"
   - **Scopes:** Marca `repo` (acceso completo a repositorios privados)
   - **Expiration:** 90 days o No expiration
   - Click: Generate token
   - **COPIA EL TOKEN** (no podrás verlo después)

2. **Usar token:**
   ```bash
   # Cuando git pida usuario/password:
   # Username: tu-usuario-github
   # Password: ghp_xxxxxxxxxxxx (el token que copiaste)
   ```

3. **Guardar credenciales (opcional):**
   ```bash
   # Para no ingresar el token cada vez
   git config --global credential.helper store
   
   # Próximo push pedirá token una vez, luego lo recordará
   ```

### Opción 2: SSH (Más seguro, requiere configuración)

Si prefieres SSH:

```bash
# Generar clave SSH
ssh-keygen -t ed25519 -C "tu-email@example.com"

# Agregar a ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copiar clave pública
cat ~/.ssh/id_ed25519.pub

# Pegar en GitHub:
# Settings → SSH and GPG keys → New SSH key
```

Luego cambiar URL remota:
```bash
git remote set-url origin git@github.com:TU-USUARIO/inno-inmobiliaria.git
```

---

## 🌿 Flujo de Trabajo con Git

### Desarrollo diario:

```bash
# Trabajar en develop
git checkout develop

# Hacer cambios...

# Ver qué cambió
git status

# Agregar cambios
git add .

# Commit
git commit -m "feat: nueva funcionalidad"

# Subir a GitHub
git push origin develop
```

### Crear nueva feature:

```bash
# Crear rama desde develop
git checkout -b feature/nombre-feature

# Hacer cambios...
git add .
git commit -m "feat: implementación de X"

# Subir rama a GitHub
git push origin feature/nombre-feature

# En GitHub: Crear Pull Request hacia develop
```

### Pasar a producción:

```bash
# Cuando develop esté estable
git checkout main
git merge develop
git push origin main

# Tag de versión (opcional)
git tag v1.0.0
git push origin v1.0.0
```

---

## 📦 Proteger archivos sensibles

### Verificar que .gitignore está funcionando:

```bash
# Ver qué archivos se están trackeando
git ls-files

# NO deberían aparecer:
# - back/.env (solo .env.example)
# - node_modules/
# - .DS_Store
```

### Si .env fue commiteado por error:

```bash
# Remover del tracking (NO lo borra del disco)
git rm --cached back/.env

# Commit
git commit -m "chore: remove .env from git"

# Ahora .gitignore lo ignorará
```

---

## ✅ Checklist Final

Antes de continuar:

- [ ] Repositorio creado en GitHub (private recomendado)
- [ ] Remoto configurado: `git remote -v` muestra origin
- [ ] Código subido: `git push -u origin main`
- [ ] Rama develop subida: `git push -u origin develop`
- [ ] .env NO está en GitHub (verificar en web)
- [ ] Token guardado o SSH configurado
- [ ] Rama develop como default (opcional)

---

## 🆘 Troubleshooting

### Error: "remote origin already exists"
```bash
# Remover y volver a agregar
git remote remove origin
git remote add origin https://github.com/TU-USUARIO/inno-inmobiliaria.git
```

### Error: "failed to push some refs"
```bash
# Si el remoto tiene commits que no tienes local
git pull origin develop --rebase
git push origin develop
```

### Error: "Permission denied (publickey)"
Si usas SSH y falla:
```bash
# Verificar que la clave está en GitHub
ssh -T git@github.com

# Debería decir: "Hi usuario! You've successfully authenticated"
```

---

**Estado:** ✅ Commit listo para push  
**Próximo paso:** Conectar con GitHub y hacer push  
**Última actualización:** Diciembre 29, 2025
