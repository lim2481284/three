"use client";

import { useEffect, useRef, type ReactNode, type MouseEvent } from "react";
import gsap from "gsap";
import { sfx } from "@/lib/audio";

interface Props {
  children: ReactNode;
  href?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  solid?: boolean;
  className?: string;
  external?: boolean;
  magnetic?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  cursor?: string;
}

/** [ BRACKET ] button with magnetic pull, fill sweep and scramble-free crisp label. */
export function HudButton({ children, href, onClick, solid, className = "", external, magnetic = true, disabled, ariaLabel, cursor }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !magnetic || !window.matchMedia("(pointer: fine)").matches) return;
    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy);
      const R = Math.max(r.width, 120) * 0.9;
      if (d < R) {
        xTo(dx * 0.32);
        yTo(dy * 0.4);
      } else {
        xTo(0);
        yTo(0);
      }
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [magnetic]);

  const inner = (
    <>
      <span className="bb-frame" aria-hidden="true" />
      <span className="bb-fill" aria-hidden="true" />
      <span className="bb-l" aria-hidden="true">
        [
      </span>
      <span>{children}</span>
      <span className="bb-r" aria-hidden="true">
        ]
      </span>
    </>
  );

  const common = {
    className: `bracket-btn ${solid ? "solid" : ""} ${className}`,
    onMouseEnter: () => sfx.play("hover"),
    "aria-label": ariaLabel,
    "data-cursor": cursor ?? "OPEN",
  };

  if (href) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        {...common}
        onClick={(e) => {
          sfx.play("click");
          onClick?.(e);
        }}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {inner}
      </a>
    );
  }
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type="button"
      disabled={disabled}
      {...common}
      onClick={(e) => {
        sfx.play("click");
        onClick?.(e);
      }}
    >
      {inner}
    </button>
  );
}
