import { createCookieSessionStorage } from "react-router";


// 7 días en milisegundos
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000; 

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secrets: [process.env.SESSION_SECRET || "super-secret"],
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;
