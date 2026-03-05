import { useEffect, useRef, useState } from "react";

type CursorMode = "default" | "hover" | "scan" | "text";

/**
 * CLICursor — custom cursor system for the CLIfolio terminal theme.
 *
 * Modes:
 *  - default  : neon cyan ring (#06b6d4) that smoothly follows the pointer
 *  - hover    : blinking green terminal block (■) for buttons/links/cards
 *  - scan     : cyan crosshair (+) for avatar & skills section
 *  - text     : hidden (lets native text cursor show)
 */
export function CLICursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  // Smooth-follow positions
  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const rafRef = useRef<number>(0);

  const [mode, setMode] = useState<CursorMode>("default");
  const [blink, setBlink] = useState(true);

  // Blink timer for hover mode
  useEffect(() => {
    if (mode !== "hover") return;
    const interval = setInterval(() => setBlink((b) => !b), 530);
    return () => clearInterval(interval);
  }, [mode]);

  // Track raw mouse position
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Smooth follow loop for the ring
  useEffect(() => {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const factor = 0.18; // smoothness — lower = more lag

    const loop = () => {
      const ring = ringPos.current;
      const mouse = mousePos.current;

      ring.x = lerp(ring.x, mouse.x, factor);
      ring.y = lerp(ring.y, mouse.y, factor);

      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.x}px, ${ring.y}px) translate(-50%, -50%)`;
      }
      // Dot follows instantly
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouse.x}px, ${mouse.y}px) translate(-50%, -50%)`;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Detect what element is under cursor and set mode
  useEffect(() => {
    const isInteractive = (el: Element | null): boolean => {
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      if (["button", "a", "select"].includes(tag)) return true;
      if (el.getAttribute("role") === "button") return true;
      if (el.hasAttribute("data-interactive")) return true;
      // project cards, contact buttons
      const ocid = el.getAttribute("data-ocid") ?? "";
      if (
        ocid.startsWith("projects.item") ||
        ocid.startsWith("contact.") ||
        ocid.startsWith("hero.cta")
      )
        return true;
      return false;
    };

    const isScanTarget = (el: Element | null): boolean => {
      if (!el) return false;
      if (el.hasAttribute("data-scan")) return true;
      if (el.closest("[data-scan]")) return true;
      return false;
    };

    const isTextInput = (el: Element | null): boolean => {
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      return (
        tag === "input" ||
        tag === "textarea" ||
        (el as HTMLElement).isContentEditable
      );
    };

    const onMove = (e: MouseEvent) => {
      const target = e.target as Element | null;

      if (isTextInput(target)) {
        setMode("text");
      } else if (isScanTarget(target)) {
        setMode("scan");
      } else {
        // Walk up DOM to find interactive ancestor
        let el: Element | null = target;
        let found = false;
        while (el && el !== document.body) {
          if (isInteractive(el)) {
            found = true;
            break;
          }
          el = el.parentElement;
        }
        setMode(found ? "hover" : "default");
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // ─── Cursor shapes ────────────────────────────────────────────────────────

  // Crosshair lines for scan mode
  const CrosshairLines = () => (
    <>
      {/* Horizontal */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 28,
          height: 1,
          background: "oklch(0.695 0.155 198.5)",
          boxShadow: "0 0 6px oklch(0.695 0.155 198.5)",
        }}
      />
      {/* Vertical */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 1,
          height: 28,
          background: "oklch(0.695 0.155 198.5)",
          boxShadow: "0 0 6px oklch(0.695 0.155 198.5)",
        }}
      />
      {/* Center dot */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 4,
          height: 4,
          borderRadius: "50%",
          background: "oklch(0.695 0.155 198.5)",
          boxShadow: "0 0 8px oklch(0.695 0.155 198.5)",
        }}
      />
    </>
  );

  const ringSize = mode === "scan" ? 32 : mode === "hover" ? 20 : 32;
  const ringBorderColor =
    mode === "scan"
      ? "oklch(0.695 0.155 198.5 / 0.9)"
      : mode === "hover"
        ? "oklch(0.725 0.195 149.8 / 0.9)"
        : "oklch(0.695 0.155 198.5 / 0.7)";
  const ringGlow =
    mode === "scan"
      ? "0 0 12px oklch(0.695 0.155 198.5 / 0.7), 0 0 24px oklch(0.695 0.155 198.5 / 0.3)"
      : mode === "hover"
        ? "0 0 12px oklch(0.725 0.195 149.8 / 0.8), 0 0 24px oklch(0.725 0.195 149.8 / 0.4)"
        : "0 0 10px oklch(0.695 0.155 198.5 / 0.5), 0 0 20px oklch(0.695 0.155 198.5 / 0.2)";

  return (
    <>
      {/* Lagging outer ring */}
      <div
        ref={ringRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 99999,
          pointerEvents: "none",
          willChange: "transform",
          width: ringSize,
          height: ringSize,
          border: `1.5px solid ${ringBorderColor}`,
          borderRadius: mode === "hover" ? "2px" : "50%",
          boxShadow: ringGlow,
          transition:
            "width 0.15s ease, height 0.15s ease, border-radius 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
          opacity: mode === "text" ? 0 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Crosshair lines inside ring when in scan mode */}
        {mode === "scan" && <CrosshairLines />}

        {/* Blinking terminal block in hover mode */}
        {mode === "hover" && (
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: "oklch(0.725 0.195 149.8)",
              textShadow:
                "0 0 8px oklch(0.725 0.195 149.8), 0 0 16px oklch(0.725 0.195 149.8 / 0.5)",
              opacity: blink ? 1 : 0,
              transition: "opacity 0.05s",
              lineHeight: 1,
              userSelect: "none",
            }}
          >
            ■
          </span>
        )}
      </div>

      {/* Instant inner dot */}
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 100000,
          pointerEvents: "none",
          willChange: "transform",
          width: mode === "hover" ? 0 : 4,
          height: mode === "hover" ? 0 : 4,
          borderRadius: "50%",
          background:
            mode === "scan"
              ? "oklch(0.695 0.155 198.5)"
              : "oklch(0.695 0.155 198.5)",
          boxShadow:
            mode === "scan"
              ? "0 0 6px oklch(0.695 0.155 198.5)"
              : "0 0 6px oklch(0.695 0.155 198.5 / 0.8)",
          opacity: mode === "text" ? 0 : 1,
          transition: "width 0.1s ease, height 0.1s ease, opacity 0.1s ease",
        }}
      />
    </>
  );
}
