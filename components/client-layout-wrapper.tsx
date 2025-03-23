"use client";

import { ConditionalHeader } from "@/components/conditional-header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ConditionalHeader />
      <div className="flex-1 space-y-4 p-8 pt-6">{children}</div>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
