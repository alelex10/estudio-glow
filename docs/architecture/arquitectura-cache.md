# Arquitectura de Caché para Aplicaciones SSR Escalables

## 📋 Resumen Ejecutivo

Esta documentación describe la arquitectura de caché recomendada para aplicaciones SSR grandes, separando los datos en dos niveles fundamentales:

1. **Datos compartidos globales** (iguales para todos los usuarios)
2. **Datos personalizados por usuario** (requieren token/sesión)

Esta arquitectura es la utilizada en producción por aplicaciones enterprise y garantiza escalabilidad, seguridad y rendimiento óptimo.

---

## 🧩 1. Datos Comunes para Todos los Usuarios

### Ejemplos de Datos Públicos

- Catálogo de productos público
- Categorías y taxonomías
- Configuración del sistema
- Estadísticas globales
- Contenido CMS
- Feature flags públicas
- Menús de navegación
- Configuración de UI

### Estrategias de Caché

#### ✅ TanStack Query con Cache Persistente

**Ventajas:**
- Integración nativa con React
- Cache automática por query key
- Revalidación inteligente
- Manejo de estados (loading, error, success)
- Deshidratación/hidratación para SSR

**Implementación para Datos Públicos:**
```typescript
// Configuración global de cache para datos públicos
const publicQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
});

// Query para datos públicos globales
export const usePublicProducts = () => {
  return useQuery({
    queryKey: ['public-products'],
    queryFn: () => fetch('/api/products').then(res => res.json()),
    staleTime: 10 * 60 * 1000, // 10 minutos para productos
  });
};
```

**Implementación SSR para Datos Públicos:**
```typescript
export async function loader({ request }) {
  const queryClient = new QueryClient();
  
  // Precargar datos públicos cacheados
  await queryClient.prefetchQuery({
    queryKey: ['public-products'],
    queryFn: () => fetch('/api/products').then(res => res.json()),
    staleTime: 10 * 60 * 1000,
  });

  return json({
    dehydratedState: dehydrate(queryClient),
  });
}
```

---

## 🧩 2. Datos Específicos por Usuario

### Ejemplos de Datos Privados

- Dashboard personal
- Carrito de compras
- Pedidos del usuario
- Notificaciones
- Perfil y configuración
- Estadísticas privadas
- Contenido premium

### Flujo SSR + TanStack Query por Request

```
request → loader → prefetch → dehydrate → hydrate
```

**Por qué este enfoque:**
- Dependen de token
- No se pueden compartir
- Garantizan seguridad
- Mantienen coherencia por sesión

**Implementación Típica:**
```typescript
export async function loader({ request }) {
  const token = getToken(request);
  
  if (!token) {
    return redirect('/login');
  }

  const queryClient = new QueryClient();
  
  // Prefetch de datos del usuario
  await queryClient.prefetchQuery({
    queryKey: ['user-dashboard'],
    queryFn: () => fetchUserDashboard(token),
  });

  return json({
    dehydratedState: dehydrate(queryClient),
  });
}
```

---

## 🧠 Mental Model Correcto

```
¿Los datos cambian según el usuario?

NO → Cache global compartido
SI → SSR por request con TanStack Query
```

Esta simple regla guía toda la arquitectura.

---

## 🔥 Arquitectura Profesional Real

```
                ┌──────────────┐
                │ Server SSR    │
                └──────┬───────┘
                       │
         ┌─────────────▼─────────────┐
         │ TanStack Query            │
         │                           │
         │  ┌────────────────────┐   │
         │  │ public data cache  │   │
         │  │ (global keys)     │   │
         │  └────────────────────┘   │
         │                           │
         │  ┌────────────────────┐   │
         │  │ per-user queries   │   │
         │  │ (token-based)      │   │
         │  └────────────────────┘   │
         └───────────────────────────┘
```

---

## ⭐ Beneficios de este Enfoque

- ✅ Menos requests a la API
- ✅ SSR rápido y eficiente
- ✅ Escalabilidad horizontal
- ✅ Seguridad por usuario
- ✅ Cache eficiente y optimizado
- ✅ Menor costo de infraestructura
- ✅ UX rápida y responsiva
- ✅ SEO perfecto

---

## ⚠️ Lo CRÍTICO que NO debes hacer

**NUNCA mezcles cache global con datos autenticados.**

**Ejemplo peligroso:**
```typescript
// ❌ CATASTROFE DE SEGURIDAD
const cache = new Map();

function getUserData(token) {
  if (cache.has('dashboard')) {
    return cache.get('dashboard'); // Datos del usuario A
  }
  
  const data = fetchUserDashboard(token); // Usuario B
  cache.set('dashboard', data); // Sobrescribe datos de A
  return data; // B recibe datos de A
}
```

**Consecuencias:**
- Fuga de datos entre usuarios
- Violación de privacidad
- Problemas legales y de cumplimiento
- Pérdida de confianza del usuario

---

## 🧪 Patrón Típico en Loaders

```typescript
import { json } from '@remix-run/node';
import { dehydrate, QueryClient } from '@tanstack/react-query';

export async function loader({ request }) {
  const token = getToken(request);
  const queryClient = new QueryClient();

  const [publicData, privateData] = await Promise.all([
    // 1. Datos públicos con cache global
    getCachedPublicData(), 
    
    // 2. Datos privados solo si hay token
    token
      ? queryClient.ensureQueryData(userDashboardQuery(token))
      : null
  ]);

  return json({
    publicData,
    dehydratedState: dehydrate(queryClient)
  });
}
```

---

## 🚀 Nivel Experto: Arquitectura Avanzada con TanStack Query

### Cache Strategy por Query Key Pattern

```typescript
// Patrones de query keys para diferentes tipos de datos
const queryKeys = {
  // Datos públicos globales
  public: {
    products: ['public', 'products'] as const,
    categories: ['public', 'categories'] as const,
    config: ['public', 'config'] as const,
  },
  
  // Datos por usuario
  user: (userId: string) => ({
    profile: ['user', userId, 'profile'] as const,
    dashboard: ['user', userId, 'dashboard'] as const,
    orders: ['user', userId, 'orders'] as const,
  }),
  
  // Datos mixtos (públicos con parámetros)
  mixed: {
    productDetails: (id: string) => ['public', 'product', id] as const,
    categoryProducts: (categoryId: string) => ['public', 'category', categoryId, 'products'] as const,
  }
};
```

### Configuración Avanzada de Cache

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configuración base para datos públicos
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 30 * 60 * 1000, // 30 minutos
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Reintentar solo para errores 5xx
        return failureCount < 3 && error.status >= 500;
      },
    },
  },
});

// Configuración específica por tipo de dato
export const queryConfig = {
  // Datos muy estáticos
  static: {
    staleTime: 60 * 60 * 1000, // 1 hora
    cacheTime: 24 * 60 * 60 * 1000, // 24 horas
  },
  
  // Datos dinámicos pero públicos
  dynamic: {
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  },
  
  // Datos en tiempo real
  realtime: {
    staleTime: 0, // Siempre stale
    cacheTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 30 * 1000, // Refresco cada 30s
  },
};
```

### Invalidación Inteligente

```typescript
// Invalidación por eventos
export const cacheInvalidation = {
  // Cuando se actualiza un producto
  onProductUpdate: (productId: string) => {
    queryClient.invalidateQueries({ queryKey: ['public', 'products'] });
    queryClient.invalidateQueries({ queryKey: ['public', 'product', productId] });
    
    // Invalidar categorías si afecta el catálogo
    queryClient.invalidateQueries({ queryKey: ['public', 'category'] });
  },
  
  // Cuando se actualiza el perfil de usuario
  onUserProfileUpdate: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['user', userId, 'profile'] });
    queryClient.invalidateQueries({ queryKey: ['user', userId, 'dashboard'] });
  },
  
  // Invalidación masiva de datos públicos
  onPublicDataUpdate: () => {
    queryClient.invalidateQueries({ queryKey: ['public'] });
  },
};
```

### SSR Optimizado con TanStack Query

```typescript
export async function loader({ request }) {
  const token = getToken(request);
  const queryClient = new QueryClient();
  
  // Paralelizar prefetch de datos públicos y privados
  const prefetchPromises = [
    // Datos públicos siempre
    queryClient.prefetchQuery({
      queryKey: queryKeys.public.products,
      queryFn: fetchPublicProducts,
      ...queryConfig.dynamic,
    }),
    
    queryClient.prefetchQuery({
      queryKey: queryKeys.public.categories,
      queryFn: fetchCategories,
      ...queryConfig.static,
    }),
  ];
  
  // Datos privados solo si hay token
  if (token) {
    const userId = await getUserIdFromToken(token);
    prefetchPromises.push(
      queryClient.prefetchQuery({
        queryKey: queryKeys.user(userId).dashboard,
        queryFn: () => fetchUserDashboard(userId, token),
        staleTime: 0, // Datos de usuario siempre fresh
      })
    );
  }
  
  await Promise.all(prefetchPromises);
  
  return json({
    dehydratedState: dehydrate(queryClient),
  });
}
```

### Manejo de Estados y Error Boundaries

```typescript
// Componente wrapper para manejo robusto de cache
export function CachedQuery({ children, ...queryOptions }) {
  const query = useQuery({
    ...queryOptions,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  
  if (query.isLoading) {
    return <QuerySkeleton />;
  }
  
  if (query.isError) {
    return (
      <QueryError 
        error={query.error}
        onRetry={() => query.refetch()}
      />
    );
  }
  
  return <>{children(query.data)}</>;
}
```

### Optimizaciones de Performance

```typescript
// Prefetching inteligente basado en interacciones
export const useSmartPrefetch = () => {
  const queryClient = useQueryClient();
  
  const prefetchOnHover = (queryKey, queryFn) => {
    return {
      onMouseEnter: () => {
        queryClient.prefetchQuery({ queryKey, queryFn });
      },
    };
  };
  
  const prefetchOnViewport = (queryKey, queryFn) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            queryClient.prefetchQuery({ queryKey, queryFn });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );
    
    return observer;
  };
  
  return { prefetchOnHover, prefetchOnViewport };
};
```

---

## 🏢 Referencias de Implementación

### Patrones Empresariales con TanStack Query

**Empresas que utilizan patrones similares:**
- **Vercel**: TanStack Query para datos de usuario y cache SSR
- **Shopify**: Query keys estructuradas para catálogos masivos
- **Netflix**: Invalidación inteligente por eventos

### Casos de Uso Reales

```typescript
// E-commerce: Catálogo + Carrito
const ecomQueries = {
  // Catálogo público cacheado por mucho tiempo
  catalog: {
    products: ['catalog', 'products'] as const,
    categories: ['catalog', 'categories'] as const,
  },
  
  // Carrito personalizado (siempre fresh)
  cart: (userId: string) => ({
    items: ['cart', userId, 'items'] as const,
    total: ['cart', userId, 'total'] as const,
  }),
};

// Dashboard: Datos mixtos
const dashboardQueries = {
  // Métricas públicas (cache largo)
  publicMetrics: ['dashboard', 'public-metrics'] as const,
  
  // Datos personales (siempre fresh)
  userMetrics: (userId: string) => ['dashboard', userId, 'metrics'] as const,
};
```

---

## 📈 Métricas y Monitoreo con TanStack Query

### KPIs Importantes

```typescript
// Métricas de cache desde TanStack Query
const getCacheMetrics = (queryClient: QueryClient) => {
  const cache = queryClient.getQueryCache();
  const queries = cache.getAll();
  
  return {
    totalQueries: queries.length,
    cachedQueries: queries.filter(q => q.state.status === 'success').length,
    staleQueries: queries.filter(q => q.isStale()).length,
    inactiveQueries: queries.filter(q => !q.hasObservers()).length,
    
    // Hit rate estimado
    hitRate: (queries.filter(q => q.state.status === 'success').length / queries.length) * 100,
    
    // Tamaño de cache en memoria
    cacheSize: JSON.stringify(queries.map(q => q.state.data)).length,
  };
};
```

### Monitoreo en Producción

```typescript
// Logger de eventos de cache
queryClient.getQueryCache().subscribe({
  onQueryAdded: (query) => {
    console.log(`Query added: ${query.queryKey.join('/')}`);
  },
  onQueryRemoved: (query) => {
    console.log(`Query removed: ${query.queryKey.join('/')}`);
  },
  onQueryUpdated: (query) => {
    console.log(`Query updated: ${query.queryKey.join('/')}`);
  },
});
```

---

## 🛠️ Implementación en Este Proyecto

### Estructura Recomendada

```
src/
├── lib/
│   ├── query-client.ts          # Configuración global de TanStack Query
│   ├── query-keys.ts            # Definición de query keys
│   └── query-configs.ts         # Configuraciones por tipo de dato
├── hooks/
│   ├── use-public-data.ts       # Hooks para datos públicos
│   └── use-user-data.ts         # Hooks para datos privados
├── loaders/
│   ├── public-loader.ts         # Loaders para datos públicos
│   └── private-loader.ts        # Loaders para datos privados
└── utils/
    ├── cache-helpers.ts         # Utilidades de cache
    └── token-utils.ts           # Gestión de tokens
```

### Próximos Pasos de Implementación

1. **Configurar TanStack Query** con settings optimizados
2. **Definir query keys** estructuradas por tipo de dato
3. **Implementar loaders** para prefetch SSR
4. **Crear hooks reutilizables** para datos públicos/privados
5. **Configurar invalidación** inteligente por eventos
6. **Agregar monitoreo** de métricas de cache
7. **Implementar error boundaries** robustos

---

## 📝 Conclusión

Esta arquitectura de caché basada en **TanStack Query** proporciona:

- **Simplicidad**: Una única librería para todo el manejo de cache
- **Consistencia**: Mismo patrón para datos públicos y privados
- **Performance**: Cache inteligente con invalidación granular
- **SSR Optimizado**: Deshidratación/hidratación perfecta
- **Escalabilidad**: Manejo eficiente de grandes volúmenes de datos
- **Mantenibilidad**: Código limpio y predecible

Al adoptar este enfoque, el proyecto se posiciona con una arquitectura moderna, mantenible y escalable que es utilizada por las aplicaciones más grandes del mundo.

---

*Esta documentación es un activo vivo del proyecto y debe actualizarse conforme evolucione la arquitectura de TanStack Query.*
