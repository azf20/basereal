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
  const [showInfo, setShowInfo] = useState(false);

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
    <>
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-12">
              <div className="flex items-center space-x-4">
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
                <button
                  onClick={() => setShowInfo(true)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                    />
                  </svg>
                </button>
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

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-pixel">About BaseReal</h2>
              <button
                onClick={() => setShowInfo(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-4 text-sm font-pixel">
              <p>
                BaseReal was built for Base Builder Quest 3. Take photos, mint
                them as coins on Zora, and share them with the community.
              </p>
              <div className="space-y-2">
                <a
                  href="https://x.com/neodaoist/status/1907466549297844490"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-500 hover:text-blue-700"
                >
                  → Quest Announcement
                </a>
                <a
                  href="https://github.com/azf20/basereal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-500 hover:text-blue-700"
                >
                  → View Source Code
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
