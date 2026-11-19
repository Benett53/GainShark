import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useStoreSelector } from "@sharkord/plugin-sdk/client";
import { MAX_MASTER, MIN_MASTER } from "../constants";
import { setMaster } from "../settings";
import { useSettings } from "./hooks";
import { hint } from "./styles";

/**
 * One slider that scales every voice down together. It sits beside Sharkord's
 * own volume button in the top bar, so it is where people already look for
 * volume, and it stays away until the user is actually in a voice channel.
 *
 * The panel is positioned from the button's own rectangle with `position:
 * fixed`: the top bar clips its children, so an absolutely positioned panel
 * would be cut off at the bottom of the bar.
 */
const MasterVolumeControl = memo(() => {
  const settings = useSettings();
  const inVoice = useStoreSelector(
    (state) => state.currentVoiceChannelId !== undefined,
  );
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; right: number }>();
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;

      close();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  if (!inVoice) return null;

  const master = settings.master;

  const onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();

    setAnchor({
      top: Math.round(rect.bottom + 6),
      right: Math.round(window.innerWidth - rect.right),
    });
    setOpen((value) => !value);
  };

  return (
    <div ref={rootRef} style={{ display: "inline-flex" }}>
      <button
        type="button"
        title="Master voice volume"
        aria-label={`Master voice volume, ${master} percent`}
        aria-expanded={open}
        onClick={onClick}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          height: 24,
          padding: "0 8px",
          border: 0,
          borderRadius: "var(--radius, 8px)",
          background: "transparent",
          color: "var(--foreground)",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M11 5 6 9H3v6h3l5 4V5z" />
          <path d="M16 9a4 4 0 0 1 0 6" />
          <path d="M18 6.5a8 8 0 0 1 0 11" />
        </svg>
        <span>{master}%</span>
      </button>

      {open && (
        <div
          role="group"
          aria-label="Master voice volume"
          style={{
            position: "fixed",
            top: anchor?.top ?? 48,
            right: anchor?.right ?? 12,
            zIndex: 60,
            display: "grid",
            gap: 8,
            padding: 12,
            minWidth: 220,
            background: "var(--popover, var(--background))",
            color: "var(--popover-foreground, var(--foreground))",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius, 8px)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <span>All voices</span>
            <span>{master}%</span>
          </div>

          <input
            type="range"
            min={MIN_MASTER}
            max={MAX_MASTER}
            step={1}
            value={master}
            aria-label="Master voice volume slider"
            onChange={(event) => setMaster(Number(event.target.value))}
            style={{ width: 192, accentColor: "var(--primary)" }}
          />

          <p style={hint}>
            Scales every voice together. Each person's own volume stays as set.
          </p>
        </div>
      )}
    </div>
  );
});

export { MasterVolumeControl };
