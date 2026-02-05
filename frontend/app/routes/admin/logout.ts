import { redirect } from "react-router";
import { contextProvider, userContext } from "~/common/context/context";

export async function action() {
  contextProvider.set(userContext, null);
  return redirect("/admin/login");
}
