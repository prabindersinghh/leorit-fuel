import { INK } from "../theme";

function Lion() {
  return (
    <svg width="30" height="30" viewBox="0 0 100 100" aria-hidden="true">
      <path
        d="M50 8c14 0 25 7 30 18 4 8 4 18 1 27-3 10-10 18-18 24-4 3-9 6-13 8-4-2-9-5-13-8-8-6-15-14-18-24-3-9-3-19 1-27C25 15 36 8 50 8z"
        fill="#fff"
      />
      <path
        d="M50 20c-9 0-16 5-19 12 4-3 9-4 14-4-3 3-5 7-5 11 3-3 7-5 11-5-2 3-3 6-3 10 0 8 5 14 12 17-2-5-3-10-2-15 2 5 6 9 11 11-3-6-4-13-2-19-4-11-10-18-17-18z"
        fill={INK}
      />
      <circle cx="41" cy="44" r="3" fill={INK} />
    </svg>
  );
}

export default function TopBar({
  role,
  setRole,
}: {
  role: "operator" | "owner";
  setRole: (r: "operator" | "owner") => void;
}) {
  return (
    <div
      style={{
        background: INK,
        color: "#fff",
        padding: "0 22px",
        height: 58,
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <Lion />
      <div style={{ lineHeight: 1 }}>
        <div
          style={{
            fontWeight: 700,
            letterSpacing: 3,
            fontSize: 15,
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          LEORIT
        </div>
        <div
          style={{
            fontSize: 8,
            letterSpacing: 2.4,
            color: "#8A9098",
            marginTop: 3,
          }}
        >
          FUEL MODULE
        </div>
      </div>
      <div
        style={{
          marginLeft: 14,
          paddingLeft: 16,
          borderLeft: "1px solid #2E3238",
          fontSize: 12,
          color: "#A9AEB5",
        }}
      >
        Modern Colors Pvt Ltd · Ludhiana · Tank 1
      </div>

      <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
        {(["operator", "owner"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            style={{
              background: role === r ? "#fff" : "transparent",
              color: role === r ? INK : "#A9AEB5",
              border: "1px solid " + (role === r ? "#fff" : "#3A3F47"),
              borderRadius: 4,
              padding: "7px 15px",
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: 0.8,
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            {r === "operator" ? "Operator" : "Owner"}
          </button>
        ))}
      </div>
    </div>
  );
}
