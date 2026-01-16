# AUTOPILOT

### Entrena sin pensar · by AlphaSupps

AUTOPILOT es una **Progressive Web App (PWA)** de fitness diseñada para personas que **ya entrenan en serio** y no quieren perder tiempo tomando decisiones.

La app **decide automáticamente** tu entrenamiento, progresión y nutrición según tu perfil y tu contexto real.
El usuario solo ejecuta.

---

## 🧠 Concepto

> **AUTOPILOT no motiva.
> AUTOPILOT organiza.**

No es una app de rutinas ni un contador de calorías.
Es un **sistema automático de entrenamiento** que se adapta en tiempo real.

---

## 🎯 ¿Para quién es?

AUTOPILOT está pensada para personas que:

- Entrenan 3–6 días por semana
- Van al gym, hacen calistenia o entrenamiento híbrido
- Odian improvisar
- Quieren progresar sin pensar qué hacer cada día
- Prefieren un sistema antes que motivación

No está pensada para principiantes absolutos ni para entrenamientos ocasionales.

---

## 🧩 Qué hace la app

### Entrenamiento

- Decide el entreno diario según tu perfil
- Ajusta cargas y volumen automáticamente
- Propone alternativas si una máquina está ocupada
- Progresa contigo según tu rendimiento real

### Nutrición

- Recomienda qué comer según objetivo, peso y entreno
- Respeta gustos, alergias y preferencias
- No obliga a contar calorías
- Se adapta si comes fuera del plan

### Recuperación

- Sugiere hidratación post-entreno
- Ajusta descanso y carga según fatiga
- Integra recuperación realista (vida normal incluida)

### Sistema

- El usuario no elige rutinas
- No hay decisiones innecesarias
- Todo está pensado para ejecutarse sin fricción

---

## 🧠 Tecnología

- **Frontend:** PWA moderna (React / Vite)
- **Backend:** PHP + MySQL
- **Arquitectura:** Single entry point (`app.alphasupps.es`)
- **Instalable:** iOS, Android y desktop (PWA)
- **Offline-ready:** Service Worker
- **Diseño:** oscuro, minimalista, masculino

---

## 📱 Instalación como app

AUTOPILOT se instala directamente desde el navegador:

1. Accede a `app.alphasupps.es`
2. En Android: el navegador mostrará “Añadir a pantalla de inicio”
3. En iOS: Compartir → Añadir a pantalla de inicio

La app funciona en **modo standalone**, sin barra del navegador.

---

## 🧠 Naming

- **App:** AUTOPILOT
- **Empresa:** AlphaSupps
- **Sistema interno:** AlphaCore™

Ejemplo:

> “Entreno generado por AlphaCore™”

---

## 🔒 Modelo

### Gratis

- Ver entreno del día
- Seguir rutina base
- Registro básico

### Premium

- Adaptación en tiempo real
- Progresión automática
- Nutrición inteligente
- Sustituciones dinámicas
- Recuperación avanzada

---

## 🛠️ Estructura básica del proyecto

```txt
/
├─ public/
│  ├─ icons/
│  ├─ manifest.json
│  └─ sw.js
├─ src/
│  ├─ main.tsx
│  └─ app/
├─ index.html
└─ README.md
```
