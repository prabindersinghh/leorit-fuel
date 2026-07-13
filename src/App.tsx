import { useState } from "react";
import { useSimulation } from "./state/useSimulation";
import TopBar from "./shared/TopBar";
import OperatorView from "./operator/OperatorView";
import OwnerView from "./owner/OwnerView";
import WhatsAppToast from "./shared/WhatsAppToast";
import Toast from "./shared/Toast";
import DemoBar from "./shared/DemoBar";
import { WASH } from "./theme";

export default function App() {
  const sim = useSimulation();
  const [role, setRole] = useState<"operator" | "owner">("operator");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: WASH,
        paddingBottom: 84,
      }}
    >
      <TopBar role={role} setRole={setRole} />

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
