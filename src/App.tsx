import { useEffect, useState } from "react";
import { useSimulation } from "./state/useSimulation";
import TopBar from "./shared/TopBar";
import OperatorView from "./operator/OperatorView";
import OwnerView from "./owner/OwnerView";
import WhatsAppToast from "./shared/WhatsAppToast";
import Toast from "./shared/Toast";
import DemoBar from "./shared/DemoBar";
import { WASH } from "./theme";

/* the role is deep-linkable (#owner / #operator) so a demo can be opened
   straight onto either screen, and so the two views can be shared as links */
function roleFromHash(): "operator" | "owner" {
  return window.location.hash.replace("#", "").startsWith("owner")
    ? "owner"
    : "operator";
}

export default function App() {
  const sim = useSimulation();
  const [role, setRole] = useState<"operator" | "owner">(roleFromHash);

  useEffect(() => {
    const onHash = () => setRole(roleFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const changeRole = (r: "operator" | "owner") => {
    setRole(r);
    if (window.location.hash.replace("#", "") !== r) window.location.hash = r;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: WASH,
        // clears the floating demo bar (taller on mobile, where the disclaimer
        // occupies its own line) plus any OS chrome at the bottom edge
        paddingBottom: "calc(190px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <TopBar role={role} setRole={changeRole} />

      {role === "operator" ? (
        <OperatorView sim={sim} />
      ) : (
        <OwnerView sim={sim} />
      )}

      {sim.wa && <WhatsAppToast data={sim.wa} close={sim.closeWa} />}
      {sim.toast && <Toast msg={sim.toast} />}

      <DemoBar
        skipDays={sim.skipDays}
        tankerArrives={sim.tankerArrives}
        meterOffline={sim.meterOffline}
        nightTheft={sim.nightTheft}
        reset={sim.reset}
      />
    </div>
  );
}
