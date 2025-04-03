import { createUploader } from "ipfs-uploader";
import { NextResponse } from "next/server";

if (!process.env.PINATA_JWT) {
  throw new Error("Missing PINATA_JWT environment variable");
}

if (!process.env.BGIPFS_API_KEY) {
  throw new Error("Missing BGIPFS_API_KEY environment variable");
}

const uploader = createUploader([
  {
    id: "bgipfs",
    options: {
      url: "http://upload.bgipfs.com",
      headers: {
        "X-API-Key": process.env.BGIPFS_API_KEY,
      },
    },
  },
]);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File;
    const title = formData.get("title") as string;

    if (!image || !title) {
      return NextResponse.json(
        { error: "Image and title are required" },
        { status: 400 },
      );
    }

    // Convert File to buffer
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const imageResult = await uploader.add.buffer(imageBuffer);

    if (!imageResult.success) {
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 },
      );
    }

    // Create and upload metadata
    const metadata = {
      name: title,
      description: `${title}, created with BaseReal`,
      image: `ipfs://${imageResult.cid}`,
      properties: {
        category: "social",
      },
    };

    const metadataResult = await uploader.add.json(metadata);

    if (!metadataResult.success) {
      return NextResponse.json(
        { error: "Failed to upload metadata" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      image: {
        cid: imageResult.cid,
        url: `ipfs://${imageResult.cid}`,
      },
      metadata: {
        cid: metadataResult.cid,
        url: `ipfs://${metadataResult.cid}`,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
