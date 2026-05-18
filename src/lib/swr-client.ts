"use client";

import useSWR from "swr";
import type { Trip } from "./types";

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export function useTrip(initial?: Trip) {
  return useSWR<Trip>("/api/trip", fetcher, {
    fallbackData: initial,
    refreshInterval: 8000,
    revalidateOnFocus: true,
    keepPreviousData: true,
    errorRetryCount: 4,
    errorRetryInterval: 4000,
  });
}
