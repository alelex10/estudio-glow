
const AUTH_BASE_ROUTE = "/auth";
export const AUTH = {
    RUTE: AUTH_BASE_ROUTE,
    LOGIN: (RUTE = AUTH_BASE_ROUTE) => `${RUTE}/login`,
    LOGIN_ACTION: (RUTE = AUTH_BASE_ROUTE) => `${RUTE}/login-action`,
};

export const ADMIN = {
    RUTE: "/admin",
    LOGOUT: "/admin/logout",
};
