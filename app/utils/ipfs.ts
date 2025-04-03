export const getFetchableUrl = (uri: string) => {
  if (!uri) return "";

  // Handle ipfs:// URIs
  if (uri.startsWith("ipfs://")) {
    const cid = uri.replace(/^ipfs:\/\//, "").replace(/\/$/, "");
    return `https://${cid}.ipfs.community.bgipfs.com/`;
  }

  // Return as is if it's already an HTTP URL
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    return uri;
  }

  // Handle bare IPFS CIDs
  return `https://${uri}.ipfs.community.bgipfs.com/`;
};
