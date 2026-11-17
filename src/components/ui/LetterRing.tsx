import Image from "next/image";

const TEXT = "SMART LABS • SMART LABS • ";

/** The SMART LABS letters circling the logo, with a blue→orange wave running through them. */
export function LetterRing({ size = 176 }: { size?: number }) {
  const chars = TEXT.split("");
  const step = 360 / chars.length;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label="Loading SMART LABS">
      <div className="absolute inset-0 sl-spin" aria-hidden>
        {chars.map((c, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-0 h-1/2 origin-bottom font-display font-extrabold"
            style={{ transform: `translateX(-50%) rotate(${i * step}deg)`, fontSize: size * 0.09 }}
          >
            <span className="sl-letter inline-block" style={{ animationDelay: `${i * 0.07}s` }}>
              {c}
            </span>
          </span>
        ))}
      </div>
      <div className="absolute inset-[24%] rounded-[30%] bg-white shadow-[0_12px_30px_rgba(59,91,253,.25)] flex items-center justify-center">
        <div className="relative w-[70%] h-[70%]">
          <Image src="/logo.png" alt="" fill sizes="96px" className="object-contain" priority />
        </div>
      </div>
    </div>
  );
}
