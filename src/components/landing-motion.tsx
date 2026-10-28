"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/**
 * Motion layer for the landing page. Elements opt in with data attributes, so the page stays a
 * server component and still renders fully (and readably) without JavaScript:
 *   data-hero="badge|title|copy|cta|checks|preview"   intro timeline
 *   data-float                                         floating cards: pop in, then bob
 *   data-count="26" data-prefix data-suffix            number counts up
 *   data-draw                                          SVG path strokes on
 *   data-reveal / data-reveal-group                    fade-up on scroll (single / staggered children)
 *   data-timeline-line, data-step                      "How it works" progress line + steps
 *   data-parallax="0.2"                                scroll parallax
 *   data-nav                                           header tightens after scrolling
 */
export function LandingMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // ---- Hero intro -------------------------------------------------------------
        gsap.set(q("[data-hero], [data-float]"), { visibility: "visible" });
        const split = SplitText.create(q("[data-hero=title]"), { type: "words", mask: "words" });
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.from(q("[data-hero=badge]"), { y: 12, autoAlpha: 0, duration: 0.6 })
          .from(split.words, { yPercent: 110, duration: 0.8, stagger: 0.045 }, "-=0.35")
          .from(q("[data-hero=copy]"), { y: 16, autoAlpha: 0, duration: 0.7 }, "-=0.55")
          .from(q("[data-hero=cta] > *"), { y: 14, autoAlpha: 0, duration: 0.6, stagger: 0.08 }, "-=0.45")
          .from(q("[data-hero=checks] > *"), { y: 8, autoAlpha: 0, duration: 0.45, stagger: 0.06 }, "-=0.35")
          .addLabel("preview", "-=0.5")
          .from(q("[data-hero=preview]"), { y: 80, autoAlpha: 0, scale: 0.96, duration: 1.2, ease: "expo.out" }, "preview")
          .from(q("[data-float]"), { y: 24, scale: 0.9, autoAlpha: 0, duration: 0.7, stagger: 0.15, ease: "back.out(1.6)" }, "-=0.6");

        // Numbers count up and sparklines draw as the preview lands.
        q("[data-count]").forEach((el) => {
          const target = Number(el.dataset.count);
          const decimals = (el.dataset.count!.split(".")[1] ?? "").length;
          const obj = { v: 0 };
          tl.to(obj, { v: target, duration: 1.2, ease: "power2.out", onUpdate: () => (el.textContent = `${el.dataset.prefix ?? ""}${obj.v.toFixed(decimals)}${el.dataset.suffix ?? ""}`) }, "preview+=0.35");
        });
        q("[data-draw]").forEach((el) => {
          const path = el as unknown as SVGPathElement;
          const len = path.getTotalLength();
          gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
          tl.to(path, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut" }, "preview+=0.4");
        });

        // Floating cards keep a gentle idle bob once they've landed.
        q("[data-float]").forEach((el, i) => {
          gsap.to(el, { y: i % 2 ? -10 : 10, duration: 3 + i * 0.4, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 2 + i * 0.3 });
        });

        // Preview tilts back slightly and flattens as you scroll into it.
        const win = q("[data-hero=window]")[0];
        if (win) {
          gsap.set(win.parentElement, { perspective: 1400 });
          gsap.fromTo(win, { rotateX: 14, transformOrigin: "50% 0%" }, { rotateX: 0, ease: "none", scrollTrigger: { trigger: win, start: "top 95%", end: "top 30%", scrub: true } });
        }

        // ---- Scroll reveals ---------------------------------------------------------
        q("[data-reveal]").forEach((el) => {
          gsap.from(el, { y: 36, autoAlpha: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%", once: true } });
        });
        q("[data-reveal-group]").forEach((group) => {
          gsap.from(group.children, { y: 40, autoAlpha: 0, duration: 0.8, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: group, start: "top 82%", once: true } });
        });

        // "How it works": the connecting line fills with scroll and each step lights up.
        const line = q("[data-timeline-line]")[0];
        if (line) {
          gsap.fromTo(line, { scaleY: 0 }, { scaleY: 1, transformOrigin: "top", ease: "none", scrollTrigger: { trigger: line.parentElement, start: "top 70%", end: "bottom 60%", scrub: 0.6 } });
        }
        q("[data-step]").forEach((step) => {
          gsap.from(step, { x: 30, autoAlpha: 0, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: step, start: "top 80%", once: true } });
          const icon = step.querySelector("[data-step-icon]");
          if (icon) gsap.from(icon, { scale: 0.6, rotate: -12, duration: 0.6, ease: "back.out(2)", scrollTrigger: { trigger: step, start: "top 80%", once: true } });
        });

        q("[data-parallax]").forEach((el) => {
          gsap.fromTo(el, { yPercent: Number(el.dataset.parallax) * 100 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom bottom", scrub: true } });
        });

        // Header tightens once you leave the top of the page.
        const nav = q("[data-nav]")[0];
        if (nav) {
          ScrollTrigger.create({
            start: 80,
            onToggle: (self) => gsap.to(nav, { maxWidth: self.isActive ? 960 : 1152, boxShadow: self.isActive ? "0 1px 2px rgba(16,24,40,0.06), 0 16px 32px -16px rgba(16,24,40,0.22)" : "0 1px 2px rgba(16,24,40,0.05), 0 8px 24px -12px rgba(16,24,40,0.12)", duration: 0.4, ease: "power2.out" }),
          });
        }

        return () => split.revert();
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="landing-motion">
      {children}
    </div>
  );
}
