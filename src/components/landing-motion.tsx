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

        // ---- Feature card micro-demos (loop only while on screen) -------------------
        const whileVisible = (el: Element, tl: gsap.core.Timeline) =>
          ScrollTrigger.create({ trigger: el, start: "top 92%", end: "bottom 8%", onToggle: (s) => (s.isActive ? tl.play() : tl.pause()) });
        const one = <T extends Element = HTMLElement>(root: Element, sel: string) => root.querySelector(sel) as T;
        const all = (root: Element, sel: string) => [...root.querySelectorAll<HTMLElement>(sel)];

        // Lead table: a new lead slides in, then gets contacted.
        q("[data-demo=table]").forEach((d) => {
          const row = one(d, "[data-new-row]");
          const inner = one(d, "[data-new-row-inner]");
          const a = one(d, "[data-status-a]");
          const b = one(d, "[data-status-b]");
          gsap.set(row, { height: 0 });
          gsap.set(inner, { autoAlpha: 0, y: -8 });
          const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.8, delay: 0.6 });
          tl.to(row, { height: "auto", duration: 0.5, ease: "power2.out" })
            .to(inner, { autoAlpha: 1, y: 0, duration: 0.4 }, "<0.1")
            .to(a, { autoAlpha: 0, y: -6, duration: 0.3 }, "+=1")
            .fromTo(b, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.3 }, "<")
            .to(inner, { backgroundColor: "rgba(255,255,255,0)", duration: 0.8 }, "<")
            .to({}, { duration: 1.6 })
            .to(inner, { autoAlpha: 0, duration: 0.3 })
            .to(row, { height: 0, duration: 0.4, ease: "power2.in" }, "<0.1")
            .set(a, { autoAlpha: 1, y: 0 })
            .set(b, { autoAlpha: 0 })
            .set(inner, { clearProps: "backgroundColor", y: -8 });
          whileVisible(d, tl);
        });

        // Follow-ups: tasks tick themselves off.
        q("[data-demo=tasks]").forEach((d) => {
          const tasks = all(d, "[data-task]");
          const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.6, delay: 0.4 });
          tasks.forEach((t) => {
            tl.to(one(t, "[data-task-fill]"), { scale: 1, duration: 0.25, ease: "back.out(2)" }, "+=0.55")
              .to(one(t, "[data-task-check]"), { opacity: 1, duration: 0.15 }, "<0.1")
              .to(one(t, "[data-task-strike]"), { scaleX: 1, duration: 0.35, ease: "power2.out" }, "<")
              .to(one(t, "[data-task-label]"), { color: "#94a3b8", duration: 0.3 }, "<")
              .to(one(t, "[data-task-due]"), { autoAlpha: 0.35, duration: 0.3 }, "<");
          });
          tl.to({}, { duration: 1.2 })
            .to(all(d, "[data-task-fill]"), { scale: 0, duration: 0.25 })
            .to(all(d, "[data-task-check]"), { opacity: 0, duration: 0.15 }, "<")
            .to(all(d, "[data-task-strike]"), { scaleX: 0, duration: 0.25 }, "<")
            .to(all(d, "[data-task-label]"), { color: "#0f172a", duration: 0.25 }, "<")
            .to(all(d, "[data-task-due]"), { autoAlpha: 1, duration: 0.25 }, "<");
          whileVisible(d, tl);
        });

        // Pipeline: a deal is dragged from Proposal to Won.
        q("[data-demo=board]").forEach((d) => {
          const card = one(d, "[data-drag-card]");
          const deal = one(card, "[data-deal]");
          const won = one(d, "[data-won-col]");
          const badge = one(d, "[data-won-badge]");
          const dx = () => won.offsetLeft - (card.parentElement as HTMLElement).offsetLeft;
          const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.8, delay: 0.5 });
          tl.to(card, { scale: 1.06, rotate: -3, duration: 0.25, ease: "power2.out" })
            .to(deal, { boxShadow: "0 14px 28px -10px rgba(16,24,40,0.35), 0 0 0 1px rgba(48,72,132,0.25)", duration: 0.25 }, "<")
            .to(card, { x: dx, duration: 0.9, ease: "power2.inOut" })
            .to(won, { backgroundColor: "rgba(236,253,245,0.95)", duration: 0.25 }, "-=0.25")
            .to(card, { scale: 1, rotate: 0, duration: 0.25, ease: "back.out(2)" })
            .to(deal, { boxShadow: "0 0 0 1px rgba(16,185,129,0.45)", duration: 0.25 }, "<")
            .to(badge, { autoAlpha: 1, duration: 0.25 }, "<")
            .to({}, { duration: 1.4 })
            .to(card, { autoAlpha: 0, duration: 0.3 })
            .to(badge, { autoAlpha: 0, duration: 0.3 }, "<")
            .to(won, { backgroundColor: "rgba(255,255,255,0.7)", duration: 0.3 }, "<")
            .set(card, { x: 0 })
            .set(deal, { clearProps: "boxShadow" })
            .to(card, { autoAlpha: 1, duration: 0.4 });
          whileVisible(d, tl);
        });

        // Analytics: a hover cursor travels the line with a live tooltip.
        q("[data-demo=chart]").forEach((d) => {
          const path = one<SVGPathElement>(d, "[data-chart-line]");
          const svg = one<SVGSVGElement>(d, "svg");
          const dot = one(d, "[data-chart-dot]");
          const cursor = one(d, "[data-chart-cursor]");
          const tip = one(d, "[data-chart-tip]");
          const value = one(d, "[data-chart-value]");
          const len = path.getTotalLength();
          const state = { p: 0.08 };
          const place = () => {
            const pt = path.getPointAtLength(len * state.p);
            const sx = svg.clientWidth / 220;
            const sy = svg.clientHeight / 90;
            dot.setAttribute("cx", String(pt.x));
            dot.setAttribute("cy", String(pt.y));
            cursor.setAttribute("x1", String(pt.x));
            cursor.setAttribute("x2", String(pt.x));
            const tx = Math.min(Math.max(pt.x * sx - tip.offsetWidth / 2, 0), svg.clientWidth - tip.offsetWidth);
            tip.style.transform = `translate(${tx}px, ${pt.y * sy - 34}px)`;
            value.textContent = String(Math.round(8 + (1 - pt.y / 90) * 40));
          };
          place();
          gsap.set([path, one(d, "[data-chart-line2]")], { strokeDasharray: (_i, el) => (el as SVGPathElement).getTotalLength(), strokeDashoffset: (_i, el) => (el as SVGPathElement).getTotalLength() });
          gsap.to([path, one(d, "[data-chart-line2]")], { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut", scrollTrigger: { trigger: d, start: "top 85%", once: true } });
          const tl = gsap.timeline({ paused: true, repeat: -1, yoyo: true, delay: 1.2 });
          tl.to(state, { p: 0.97, duration: 3.4, ease: "sine.inOut", onUpdate: place });
          whileVisible(d, tl);
        });

        // Products: people pop into IAIB.
        q("[data-demo=products]").forEach((d) => {
          const avatars = all(d, "[data-avatar]");
          const toast = one(d, "[data-product-toast]");
          const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.6, delay: 0.4 });
          tl.fromTo(avatars, { scale: 0 }, { scale: 1, stagger: 0.18, duration: 0.35, ease: "back.out(2.5)" })
            .fromTo(toast, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.3 }, "-=0.1")
            .to({}, { duration: 1.6 })
            .to(toast, { autoAlpha: 0, y: -4, duration: 0.3 })
            .to(avatars, { scale: 0, stagger: { each: 0.05, from: "end" }, duration: 0.2 }, "+=0.4");
          whileVisible(d, tl);
        });

        // Roles: highlight walks through each role's scope.
        q("[data-demo=roles]").forEach((d) => {
          const glows = all(d, "[data-role-glow]");
          const tl = gsap.timeline({ paused: true, repeat: -1 });
          glows.forEach((g, i) => {
            tl.to(g, { opacity: 1, duration: 0.35 }, i * 1.1).to(g.parentElement, { y: -2, duration: 0.35 }, "<").to(g, { opacity: 0, duration: 0.35 }, i * 1.1 + 0.85).to(g.parentElement, { y: 0, duration: 0.35 }, "<");
          });
          whileVisible(d, tl);
        });

        // Audit trail: new events stream in at the top.
        q("[data-demo=audit]").forEach((d) => {
          const list = one(d, "[data-audit-list]");
          const times = ["just now", "2m", "6m", "12m"];
          const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1.6, delay: 0.8 });
          tl.call(() => {
            list.prepend(list.lastElementChild!);
            [...list.children].forEach((li, i) => ((li.lastElementChild as HTMLElement).textContent = times[i]));
            gsap.fromTo(list, { y: -46 }, { y: 0, duration: 0.6, ease: "power2.out" });
            gsap.fromTo(list.firstElementChild, { autoAlpha: 0, scale: 0.97 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "power2.out" });
            gsap.fromTo(list.firstElementChild, { backgroundColor: "rgba(241,244,250,1)" }, { backgroundColor: "rgba(255,255,255,1)", duration: 1.4, delay: 0.4 });
          }).to({}, { duration: 0.6 });
          whileVisible(d, tl);
        });

        // Card hover: cursor spotlight + slight 3D tilt.
        q("[data-bento]").forEach((card) => {
          gsap.set(card, { transformPerspective: 900 });
          const rx = gsap.quickTo(card, "rotationX", { duration: 0.4, ease: "power3.out" });
          const ry = gsap.quickTo(card, "rotationY", { duration: 0.4, ease: "power3.out" });
          card.addEventListener("pointermove", (ev) => {
            const e = ev as PointerEvent;
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;
            card.style.setProperty("--mx", `${px * 100}%`);
            card.style.setProperty("--my", `${py * 100}%`);
            ry((px - 0.5) * 5);
            rx(-(py - 0.5) * 5);
          });
          card.addEventListener("pointerleave", () => {
            rx(0);
            ry(0);
          });
        });

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
