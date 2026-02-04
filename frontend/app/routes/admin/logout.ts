import { redirect } from "react-router";
import { userContextProvider, userContext } from "~/common/context/context";

export async function action() {
  userContextProvider.set(userContext, null);
  return redirect("/admin/login");
}
