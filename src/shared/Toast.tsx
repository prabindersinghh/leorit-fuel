import { INK } from "../theme";

export default function Toast({ msg }: { msg: string }) {
  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 96,
        transform: "translateX(-50%)",
        background: INK,
        color: "#fff",
        padding: "11px 20px",
        borderRadius: 4,
        fontSize: 13,
        fontWeight: 600,
        zIndex: 70,
        boxShadow: "0 8px 26px rgba(0,0,0,.3)",
        animation: "toastIn .24s ease",
      }}
    >
      <style>{`@keyframes toastIn{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}
        @media (prefers-reduced-motion: reduce){div{animation:none!important}}`}</style>
      {msg}
    </div>
  );
}
