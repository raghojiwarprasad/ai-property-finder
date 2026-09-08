/** Inline SVG diagrams for lesson `diagram` blocks. Each has a meaningful text alternative. */
export function Diagram({ svgKey, title, alt }: { svgKey: string; title: string; alt: string }) {
  if (svgKey === "data_split") {
    return (
      <figure className="card compact" style={{ margin: 0 }}>
        <svg viewBox="0 0 640 140" role="img" aria-labelledby="ds-title ds-desc" style={{ width: "100%", height: "auto", maxWidth: 640 }}>
          <title id="ds-title">{title}</title>
          <desc id="ds-desc">{alt}</desc>
          {Array.from({ length: 10 }).map((_, i) => {
            const group = i < 6 ? "baseline" : i < 8 ? "adjust" : "test";
            const fill = group === "baseline" ? "#175C48" : group === "adjust" ? "#164FC7" : "#79520C";
            return <rect key={i} x={20 + i * 60} y={20} width={48} height={48} rx={8} fill={fill} opacity={0.9} />;
          })}
          {Array.from({ length: 10 }).map((_, i) => (
            <text key={`t${i}`} x={44 + i * 60} y={51} textAnchor="middle" fontSize="16" fill="#fff" fontFamily="Inter, sans-serif">{i + 1}</text>
          ))}
          <text x={20} y={105} fontSize="14" fill="#172A25" fontFamily="Inter, sans-serif">1–6: build the baseline (average delay)</text>
          <text x={380} y={105} fontSize="14" fill="#172A25" fontFamily="Inter, sans-serif">7–8: choose an adjustment</text>
          <text x={380} y={128} fontSize="14" fill="#172A25" fontFamily="Inter, sans-serif">9–10: reserved for the final check</text>
        </svg>
        <figcaption className="small muted">{alt}</figcaption>
      </figure>
    );
  }
  return <figure className="card compact" style={{ margin: 0 }}><figcaption>{title}: {alt}</figcaption></figure>;
}
