import { redirect } from "react-router";
import { userContextProvider, userContext } from "~/common/context";

export async function action() {
    userContextProvider.set(userContext, null);
    return redirect("/admin/login");
}