"use client";

import { useEffect, useState } from "react";
import ZoraPosts from "../components/ZoraPosts";
import { Post } from "../types/post";
import { base } from "viem/chains";

export default function Gallery() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://api.indexsupply.net/query?chain=${base.id}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify([
              {
                event_signatures: [
                  "CoinCreated (address indexed caller, address indexed payoutRecipient, address indexed platformReferrer, address currency, string uri, string name, string symbol, address coin, address pool, string version)",
                ],
                query: `select caller, platformReferrer, coin, uri, name
                      from coincreated
                      where platformReferrer = '${process.env.NEXT_PUBLIC_PLATFORM_REFERRER}'`,
              },
            ]),
            method: "POST",
          },
        );

        const apiResult = await response.json();
        const postsResult = apiResult?.result?.[0].slice(1) || [];
        const postsObj = postsResult
          .map((post: string[]) => ({
            contractAddress: post[2],
            uri: post[3],
            name: post[4],
            creator: post[0],
          }))
          .reverse();
        setPosts(postsObj);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          BaseReal Gallery
        </h1>
        <ZoraPosts isLoading={isLoading} posts={posts} />
      </div>
    </div>
  );
}
