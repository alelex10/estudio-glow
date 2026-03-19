import { useEffect } from "react";
import { toast } from "../components/Toast";

interface ActionData {
  errors?: string[];
}

export function useActionErrors(actionData: ActionData | undefined) {
  useEffect(() => {
    if (actionData?.errors && actionData.errors.length > 0) {
      actionData.errors.forEach((error: string) => {
        toast("error", error);
      });
    }
  }, [actionData]);
}
