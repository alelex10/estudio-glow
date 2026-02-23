# Estudio-Glow

Aplicación web moderna con arquitectura SSR escalable y patrones enterprise-level.

## 📚 Documentación

Consulta la documentación completa del proyecto en [`docs/`](./docs/):

- **[Arquitectura de Caché](./docs/architecture/arquitectura-cache.md)** - Guía completa de caché SSR para datos públicos y privados

## 🚀 Características

- SSR con React Router
- Arquitectura de caché de dos niveles (global + por usuario)
- TypeScript estricto
- Diseño enterprise-level

## 🏗️ Arquitectura

Este proyecto sigue patrones utilizados por empresas como Shopify, Vercel y Netflix:

- Separación clara entre datos públicos y privados
- Cache global compartido vía CDN/Edge
- SSR personalizado por usuario con TanStack Query
- Escalabilidad horizontal y seguridad por diseño

## 📋 Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar desarrollo
npm run dev
```

## 📖 Más Información

Ver [`docs/README.md`](./docs/README.md) para documentación completa.