"use client";

import { useFormStatus } from "react-dom";

export function RefreshPipelineButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="form-button"
      disabled={pending}
      type="submit"
    >
      {pending ? "Refreshing pipeline..." : "Refresh pipeline"}
    </button>
  );
}
