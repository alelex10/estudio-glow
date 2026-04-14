
export class AUTH {
  static BASE_ROUTE = "auth";
  static LOGIN = (RUTE = AUTH.BASE_ROUTE) => `/login`;
  static LOGIN_ACTION = (RUTE = AUTH.BASE_ROUTE) => `${RUTE}/login-action`;
  static REGISTER = () => `${AUTH.BASE_ROUTE}/register`;
}

export class ADMIN {
  static BASE_ROUTE = "/admin";
  static LOGOUT = (RUTE = ADMIN.BASE_ROUTE) => `${RUTE}/logout`;
}
