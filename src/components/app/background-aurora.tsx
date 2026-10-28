"use client";

/** پس‌زمینهٔ محیطی: هاله‌های گرادیانی شناور + شبکهٔ محو */
export function BackgroundAurora() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="blob-a absolute -top-40 -right-32 h-[34rem] w-[34rem] rounded-full bg-emerald-500/[0.13] blur-[110px]" />
      <div className="blob-b absolute top-1/3 -left-40 h-[30rem] w-[30rem] rounded-full bg-teal-400/[0.09] blur-[120px]" />
      <div className="blob-a absolute bottom-0 left-1/4 h-[26rem] w-[26rem] rounded-full bg-amber-400/[0.06] blur-[100px]" />
      <div className="grid-overlay absolute inset-0" />
    </div>
  );
}
