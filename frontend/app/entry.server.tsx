import { userContextProvider, tokenContextProvider } from "~/common/context/context";

export function getLoadContext() {
  // Use the existing context providers instead of creating a new one
  // This might be the issue - React Router expects a single RouterContextProvider
  // with all contexts set, not multiple providers
  
  // Let's try using the userContextProvider as the main one
  return userContextProvider;
}
