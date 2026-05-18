"use client";

import { MapPin, ExternalLink, Copy, Check, Navigation } from "lucide-react";
import { useMemo, useState } from "react";
import type { Place } from "@/lib/types";
import { pickMapEmbed } from "@/lib/map";

export function PlaceCard({ place }: { place: Place }) {
  const [copied, setCopied] = useState(false);
  const embed = useMemo(() => pickMapEmbed(place), [place]);

  async function handleCopy() {
    if (!place.address) return;
    try {
      await navigator.clipboard.writeText(place.address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  }

  const kakaoUrl =
    place.mapUrl ??
    (place.address
      ? `https://map.kakao.com/?q=${encodeURIComponent(place.address)}`
      : null);

  const naverUrl = place.address
    ? `https://map.naver.com/p/search/${encodeURIComponent(place.address)}`
    : null;

  return (
    <div className="hanji-card hanji-card-hover overflow-hidden">
      {embed && (
        <div className="relative h-[280px] sm:h-[340px] w-full bg-ink-50 overflow-hidden border-b border-ink-900/8">
          <iframe
            src={embed}
            title={`${place.name} 지도`}
            className="absolute inset-0 w-full h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}
      <div className="relative p-7 sm:p-10">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-eyebrow mb-2">모이는 곳</p>
            <h3 className="font-serif text-3xl sm:text-4xl text-ink-900 leading-[1.1] tracking-tight">
              {place.name}
            </h3>
            {place.address && (
              <p className="mt-4 text-ink-700 text-sm sm:text-base flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-[3px] shrink-0 text-maple-700" />
                <span className="leading-relaxed">{place.address}</span>
              </p>
            )}
          </div>
          <span className="ink-seal shrink-0">集結</span>
        </div>

        <div className="ink-divider-soft my-6" />

        <div className="flex flex-wrap gap-2">
          {kakaoUrl && (
            <a
              href={kakaoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium bg-ink-900 text-hanji-50 hover:bg-ink-700 transition-colors rounded-sm"
            >
              <Navigation className="w-3.5 h-3.5" />
              카카오맵
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          )}
          {naverUrl && (
            <a
              href={naverUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium border border-ink-900/25 text-ink-900 hover:bg-ink-900/5 transition-colors rounded-sm"
            >
              네이버지도
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          )}
          {place.address && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium border border-ink-900/25 text-ink-900 hover:bg-ink-900/5 transition-colors rounded-sm"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-dancheong-600" />
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  주소 복사
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
