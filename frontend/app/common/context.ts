import { createContext, RouterContextProvider } from "react-router";
import type { User } from "./types";

export const userContext = createContext<User | null>(null);
export const contextProvider = new RouterContextProvider();

export const getUserContext = () => contextProvider.get(userContext);
//  ^ User | null
