"use client";

import { Post } from "../types/post";
import LazyImage from "./LazyImage";
import { Identity, Name, Address } from "@coinbase/onchainkit/identity";

interface ZoraPostsProps {
  isLoading: boolean;
  posts: Post[];
}

export default function ZoraPosts({ isLoading, posts }: ZoraPostsProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">No posts found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {posts.map((post) => (
        <a
          key={post.contractAddress}
          href={`https://zora.co/coin/base:${post.contractAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white rounded-2xl shadow-lg overflow-hidden transition hover:shadow-xl"
        >
          <div className="aspect-square relative">
            <LazyImage
              uri={post.uri}
              alt={post.name}
              width={480}
              height={480}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-4">
            <div className="flex items-center">
              <Identity
                address={post.creator}
                className="!bg-inherit p-0 [&>div]:space-x-0"
              >
                <Name className="text-inherit font-pixel text-sm" />
                <Address className="text-inherit font-pixel text-sm" />
              </Identity>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
