"use client";

import { useEffect, useState } from "react";

/** Reads a URL query param on the client without forcing a Suspense boundary. */
export function useQueryParam(name: string) {
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once after mount
    setValue(new URLSearchParams(window.location.search).get(name));
  }, [name]);
  return value;
}
