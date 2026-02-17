import { redirect } from "react-router";
import { authService } from "~/common/services/authService";
import { contextProvider, userContext, tokenContext } from "~/common/context/context";

export async function loader({ request }: { request: Request }) {
  const tokenInContext = contextProvider.get(tokenContext);
  
  try {
    const response = await authService.isAuthenticated();
    
    let user = null;
    if (response && response.user) {
      contextProvider.set(userContext, response.user);
      user = response.user;
    }
    
    const contextUser = contextProvider.get(userContext);
    
    if (response && response.user) {
      return {
        authenticated: true,
        user: response.user,
        contextUser: contextUser,
        tokenInContext: tokenInContext,
        message: "Usuario autenticado correctamente",
        cookies: request.headers.get("Cookie"),
        headers: Object.fromEntries(request.headers.entries())
      };
    } else {
      return {
        authenticated: false,
        user: null,
        contextUser: contextUser,
        tokenInContext: tokenInContext,
        message: "Usuario no autenticado",
        cookies: request.headers.get("Cookie"),
        headers: Object.fromEntries(request.headers.entries())
      };
    }
  } catch (error) {
    return {
      authenticated: false,
      user: null,
      contextUser: contextProvider.get(userContext),
      tokenInContext: tokenInContext,
      message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      cookies: request.headers.get("Cookie"),
      headers: Object.fromEntries(request.headers.entries())
    };
  }
}

export default function TestAuthPage({ loaderData }: any) {
  const { authenticated, user, contextUser, tokenInContext, message, cookies, headers } = loaderData;
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Test de Autenticación</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Estado: {authenticated ? '✅ AUTENTICADO' : '❌ NO AUTENTICADO'}</h2>
        <p><strong>Mensaje:</strong> {message}</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>🔑 Token en Contexto:</h3>
        <pre style={{ background: '#f5f5f5', padding: '10px', fontSize: '12px' }}>
          {tokenInContext || 'No hay token en contexto'}
        </pre>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>🍪 Cookies:</h3>
        <pre style={{ background: '#f5f5f5', padding: '10px', fontSize: '12px' }}>
          {cookies || 'No cookies'}
        </pre>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>📋 Headers Relevantes:</h3>
        <pre style={{ background: '#f5f5f5', padding: '10px', fontSize: '12px' }}>
          {JSON.stringify({
            'cookie': headers.cookie,
            'authorization': headers.authorization,
            'content-type': headers['content-type']
          }, null, 2)}
        </pre>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Usuario de la API:</h3>
        <pre style={{ background: '#f5f5f5', padding: '10px' }}>
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Usuario del Contexto:</h3>
        <pre style={{ background: '#f5f5f5', padding: '10px' }}>
          {JSON.stringify(contextUser, null, 2)}
        </pre>
      </div>
      
      <div style={{ marginBottom: '20px', padding: '10px', background: '#fff3cd', border: '1px solid #ffeaa7' }}>
        <h3>🔍 INVESTIGACIÓN:</h3>
        <p>Si ves un token en el contexto pero no en cookies/headers, significa que:</p>
        <ul>
          <li>El token se guardó en una solicitud anterior</li>
          <li>El contexto persiste entre solicitudes</li>
          <li>apiClient está usando ese token para autenticarse</li>
        </ul>
      </div>
      
      <div>
        <a href="/auth/login">Ir a Login</a> | 
        <a href="/admin">Ir a Admin</a> | 
        <a href="/">Ir a Home</a>
      </div>
    </div>
  );
}
