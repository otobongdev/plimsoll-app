import Link from "next/link";

export interface BadgeProps {
  sac: string;
  code: string;
  ratio: string;
  tier: string;
  age: string;
}

export function Badge({ sac, code, ratio, tier, age }: BadgeProps) {
  return (
    <Link
      href={`/asset/?sac=${sac}`}
      className="badge-card"
      aria-label={`${code} reserve coverage`}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <div className="card" style={{ display: "grid", gap: 6, padding: 12, maxWidth: 260 }}>
        <div className="spread">
          <strong style={{ fontSize: "1.1rem" }}>{code}</strong>
          <span className="pill pill-covered" style={{ fontSize: "0.72rem" }}>
            {ratio}
          </span>
        </div>
        <div className="sub" style={{ fontSize: "0.8rem" }}>
          {tier} · {age}
        </div>
        <div className="sub" style={{ fontSize: "0.72rem" }}>
          Plimsoll reserve coverage
        </div>
      </div>
    </Link>
  );
}

export const BadgeCard = Badge;
export default Badge;
