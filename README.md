# Sitio Web de Federico Ebole — (GitHub Pages + Firebase Auth)

Sitio estático desarrollado con **HTML**, **CSS** y **JavaScript**, publicado mediante **GitHub Pages**.  
Incluye **carrito de compras** y **autenticación por email/contraseña** implementada con **Firebase Authentication**.  
El carrito queda asociado al usuario para conservar los productos entre sesiones.

---

## 🌐 Demo

**Producción:** [https://fedeebole.github.io/](https://fedeebole.github.io/)

---

## 📁 Estructura del proyecto

├─ index.html # Página principal
├─ style.css # Estilos del sitio
├─ script.js # Lógica del carrito + autenticación
├─ Imagenes/ # Carpeta con imágenes y logo
└─ README.md # Documentación del proyecto

---

## ⚙️ Requisitos

- Cuenta **GitHub** (para publicar con GitHub Pages).
- Proyecto en **Firebase** con **Authentication** habilitado (método Email/Password o Email Link).

---

## 🚀 Puesta en marcha local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/fedeebole/fedeebole.github.io.git
   cd fedeebole.github.io
   python -m http.server 5500
   http://127.0.0.1:5500/
   ```
