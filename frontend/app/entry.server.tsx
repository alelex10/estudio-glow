import { RouterContextProvider } from "react-router";
import { userContext, tokenContext } from "~/common/context/context";

export function getLoadContext() {
  const context = new RouterContextProvider();
  context.set(userContext, null);
  context.set(tokenContext, null);
  return context;
}
