"use client";

import { useParams } from "next/navigation";
import LazyImage from "../../components/LazyImage";
import { useReadContract } from "wagmi";

const abi = [
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

export default function PostPage() {
  const params = useParams();
  const contractAddress = `${params.id}`;

  const { data: uri, isLoading } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi,
    functionName: "tokenURI",
  });

  console.log(uri, isLoading, contractAddress);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!uri) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500 font-pixel">Post not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="aspect-square relative">
          <LazyImage
            uri={uri}
            alt="BaseReal"
            width={480}
            height={480}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-4">
          <div className="flex justify-end">
            <a
              href={`https://zora.co/coin/base:${params.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0052FF] hover:text-[#0052FF]/90 text-sm font-pixel"
            >
              View on Zora
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
