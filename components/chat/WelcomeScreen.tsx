"use client"

export default function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 select-none -translate-y-10">
      {/* Knowledge AI Orb — solid dot + static middle ring + outer ring with outward glow */}
      <div className="relative flex items-center justify-center mb-5" style={{ width: 140, height: 140 }}>

        {/* Outer ring — smaller, closer to middle, glows outward */}
        <div
          className="breathe-ring-glow absolute rounded-full"
          style={{
            width: 70,
            height: 70,
            border: "0.5px solid var(--breathe-color)",
          }}
        />

        {/* Middle ring — static, no glow, slightly thicker */}
        <div
          className="absolute rounded-full"
          style={{
            width: 56,
            height: 56,
            border: "3px solid var(--breathe-color)",
            opacity: 0.5,
          }}
        />

        {/* Solid center dot — static, no glow, no animation */}
        <div
          className="absolute rounded-full"
          style={{
            width: 20,
            height: 20,
            background: "var(--breathe-color)",
          }}
        />
      </div>

      {/* Title */}
      <h1
        className="text-[11px] font-bold tracking-[0.3em] uppercase mb-2 text-center"
        style={{ color: "var(--primary)" }}
      >
        Your trusted knowledge layer
      </h1>
      <p className="text-sm text-center leading-snug max-w-xs italic">
        <span className="text-muted-foreground">Ask anything, anytime.</span>
      </p>
    </div>
  )
}
