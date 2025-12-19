import { createContext, RouterContextProvider } from "react-router";
import type { User } from "../types/user-types";

export const userContext = createContext<User | null>(null);
export const userContextProvider = new RouterContextProvider();

export const tokenContext = createContext<string | null>(null);
export const tokenContextProvider = new RouterContextProvider();