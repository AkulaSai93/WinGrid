"use client";

import { useEffect, useState } from "react";

/** Current time, refreshed every minute, so overdue/due-today states stay correct. */
export function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}
