// src/pages/admin/acquisition/components/TransactionDetailsCard.jsx
import React from "react";
import { TransactionDescription } from "./ViewPageRenderer";
import CurvedButton from "./CurvedButton.jsx";

export default function TransactionDetailsCard({
  acquisitionType = "lending",
  transactionDescription,
  user,
  setActiveDocument,
}) {
  const isLending = acquisitionType === "lending";

  return (
    <div className={`w-full h-[32rem] ${isLending ? "bg-[#E4E4E4]" : "bg-[#1D1911]"} rounded-r-4xl flex`}>
      {isLending && <div className={`w-full max-w-10 h-full ${isLending ? "bg-white" : "bg-[#1D1911]"} rounded-r-4xl`} />}

      <div className={`w-full h-full px-13 py-10 flex flex-col space-y-5 ${isLending ? "text-[#2F0000]" : "text-white"}`}>
        <span className="text-3xl font-semibold">Transaction Details</span>

        <TransactionDescription transactionDescription={transactionDescription} user={user} />

        <CurvedButton
          text="Click To See Transaction"
          bgColor={isLending ? "#2F0000" : "#51442C"}
          textColor="#FFFFFF"
          pressedColor={isLending ? "#512727" : "#2F0000"}
          fontSize={19}
          onClick={() => setActiveDocument?.("Transaction")}
        />
      </div>
    </div>
  );
}
