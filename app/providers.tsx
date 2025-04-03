"use client";

import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { base } from "wagmi/chains";
import { type ReactNode } from "react";

export function Providers(props: { children: ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY;

  return (
    <MiniKitProvider
      apiKey={apiKey}
      chain={base}
      config={{
        wallet: {
          display: "modal",
        },
        appearance: {
          mode: "auto",
          theme: "snake",
          name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
          logo: process.env.NEXT_PUBLIC_ICON_URL,
        },
      }}
    >
      {props.children}
    </MiniKitProvider>
  );
}
