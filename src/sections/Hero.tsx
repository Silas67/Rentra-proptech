import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { heroConfig } from "../config";

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
    const sectionRef = useRef<HTMLElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const modelRef = useRef<HTMLDivElement>(null);
    const overlayTextRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Store ScrollTrigger instances for cleanup
            const triggers: ScrollTrigger[] = [];

            // Parallax effect for main text
            const textTrigger = ScrollTrigger.create({
                trigger: sectionRef.current,
                start: "top top",
                end: "bottom top",
                scrub: 1,
                onUpdate: (self) => {
                    if (textRef.current) {
                        gsap.set(textRef.current, { yPercent: self.progress * 50 });
                    }
                },
            });
            triggers.push(textTrigger);

            // Parallax effect for model (slower movement = appears closer)
            const modelTrigger = ScrollTrigger.create({
                trigger: sectionRef.current,
                start: "top top",
                end: "bottom top",
                scrub: 1,
                onUpdate: (self) => {
                    if (modelRef.current) {
                        gsap.set(modelRef.current, { yPercent: self.progress * 20 });
                    }
                },
            });
            triggers.push(modelTrigger);

            // Fade out overlay text faster
            const overlayTrigger = ScrollTrigger.create({
                trigger: sectionRef.current,
                start: "top top",
                end: "30% top",
                scrub: 1,
                onUpdate: (self) => {
                    if (overlayTextRef.current) {
                        gsap.set(overlayTextRef.current, { opacity: 1 - self.progress });
                    }
                },
            });
            triggers.push(overlayTrigger);

            // Cleanup function
            return () => {
                triggers.forEach((trigger) => trigger.kill());
            };
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    if (
        !heroConfig.backgroundText &&
        !heroConfig.heroImage &&
        heroConfig.navLinks.length === 0
    )
        return null;

    return (
        <section
            ref={sectionRef}
            className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-forest-dark"
        >
            {/* Layer 1: Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-forest-dark via-forest-dark to-[#25322c] opacity-100" />

            {/* Subtle texture overlay */}
            <div
                className="absolute inset-0 opacity-[0.01] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Layer 2: Big Text */}
            <div
                ref={textRef}
                className="absolute inset-0 flex items-center justify-center z-10 will-change-transform"
            >
                <h1 className="text-[22vw] md:text-[14vw] lg:text-[20vw] Zina
                  stroke-white stroke-2 text-[#1f2c25] tracking-tighter leading-none select-none whitespace-nowrap">
                    {heroConfig.backgroundText}
                </h1>
            </div>

            {/* Layer 3: Hero Model Image (Cutout) */}
            {heroConfig.heroImage && (
                <div
                    ref={modelRef}
                    className="absolute inset-0 flex items-end justify-center z-20 will-change-transform"
                >
                    <div className="relative w-[80vw] md:w-[35vw] lg:w-[26vw] max-w-[500px]">
                        <img
                            src={heroConfig.heroImage}
                            alt={heroConfig.heroImageAlt}
                            className="w-full h-auto object-contain"
                            loading="eager"
                        />
                        {/* Gradient fade at bottom for smooth transition */}
                        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#18221E] to-transparent" />
                    </div>
                </div>
            )}

            {/* Layer 4: Overlay Text */}
            {heroConfig.overlayText && (
                <div
                    ref={overlayTextRef}
                    className="absolute  max-sm:top-[15%] bottom-[15%] right-[8%] md:right-[12%] z-30 will-change-transform"
                >
                    <div className="font-serif italic text-6xl md:text-2xl lg:text-3xl text-white/90 tracking-wide cursor-pointer inline-flex max-sm:inline-block max-sm:text-center gap-2 group">
                        Find Your{" "}
                        <a href="/" className="text-secondary">
                            Perfect{" "}
                            <p className="w-full scale-x-0 group-hover:scale-x-100 border transition-all origin-left duration-300 border-secondary "></p>
                        </a>{" "}
                        Home
                    </div>
                </div>
            )}


        </section>
    );
}
