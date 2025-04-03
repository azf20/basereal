"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectWallet, ConnectWalletText } from "@coinbase/onchainkit/wallet";
import { Identity, Name, Badge, Address } from "@coinbase/onchainkit/identity";
import { useAddFrame, useMiniKit } from "@coinbase/onchainkit/minikit";
import { useCallback, useState } from "react";
import Check from "../svg/Check";

const SCHEMA_UID =
  "0x7889a09fb295b0a0c63a3d7903c4f00f7896cca4fa64d2c1313f8547390b7d39";

export default function Nav() {
  const pathname = usePathname();
  const { address, status } = useAccount();
  const { disconnect } = useDisconnect();
  const { context } = useMiniKit();
  const addFrame = useAddFrame();
  const [frameAdded, setFrameAdded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleAddFrame = useCallback(async () => {
    const frameAdded = await addFrame();
    setFrameAdded(Boolean(frameAdded));
  }, [addFrame]);

  const saveFrameButton = pathname === "/" && (
    <div className="fixed bottom-4 right-4 z-50">
      {context && !context.client.added && (
        <button
          type="button"
          onClick={handleAddFrame}
          className="text-xs font-pixel text-gray-900"
        >
          + SAVE FRAME
        </button>
      )}
      {frameAdded && (
        <div className="flex items-center space-x-1 text-xs font-pixel animate-fade-out">
          <Check />
          <span>SAVED</span>
        </div>
      )}
    </div>
  );

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-12">
            <div className="flex space-x-4">
              <Link
                href="/"
                className={`inline-flex items-center border-b-2 text-xs font-pixel ${
                  pathname === "/"
                    ? "border-blue-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Create
              </Link>
              <Link
                href="/gallery"
                className={`inline-flex items-center border-b-2 text-xs font-pixel ${
                  pathname === "/gallery"
                    ? "border-blue-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Gallery
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {status === "connected" && address ? (
              <div className="flex items-center relative">
                <div
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center hover:opacity-80 cursor-pointer"
                >
                  <Identity
                    address={address}
                    schemaId={SCHEMA_UID}
                    className="!bg-inherit p-0 [&>div]:space-x-2"
                  >
                    <Name className="text-inherit font-pixel text-xs">
                      <Badge
                        tooltip="High Scorer"
                        className="!bg-inherit high-score-badge"
                      />
                    </Name>
                    <Address />
                  </Identity>
                  <span className="ml-2 text-xs font-pixel text-gray-500">
                    •••
                  </span>
                </div>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          disconnect();
                          setMenuOpen(false);
                        }}
                        className="block w-full px-4 py-2 text-left text-xs font-pixel text-red-500 hover:bg-gray-100"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <ConnectWallet className="inline-flex items-center px-3 py-1.5 text-xs font-pixel text-white bg-[#0052FF] hover:bg-[#0052FF]/90 rounded">
                <ConnectWalletText>Connect Wallet</ConnectWalletText>
              </ConnectWallet>
            )}
          </div>
        </div>
      </div>
      {saveFrameButton}
    </nav>
  );
}
