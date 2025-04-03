# Frame Buildathon

A Frame-based photo sharing app that lets you capture moments and mint them as Zora coins on Base.

## Features

- 📸 Capture photos directly in your browser
- ✍️ Add customizable text overlays with different colors
- 🪙 Mint your photos as Zora coins on Base
- 🖼️ Frame-ready interface for Farcaster
- 🎯 Lazy-loaded image gallery with IPFS integration
- 👤 Identity integration with Coinbase OnchainKit

## Tech Stack

- Next.js 14 with App Router
- Tailwind CSS for styling
- Zora Coins SDK for minting
- Coinbase OnchainKit for Frame & Identity
- IPFS for decentralized storage
- Wagmi for wallet connections

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/azf20/basereal.git
cd frame-buildathon
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

Add your environment variables:
```env
# OnchainKit Configuration
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=
NEXT_PUBLIC_ONCHAINKIT_API_KEY=
NEXT_PUBLIC_URL=                     # Your app's URL (e.g. https://basereal.xyz)
NEXT_PUBLIC_SPLASH_IMAGE_URL=        # $NEXT_PUBLIC_URL/basereal.png
NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR= # FFFFFF
NEXT_PUBLIC_IMAGE_URL=               # $NEXT_PUBLIC_URL/basereal.png
NEXT_PUBLIC_ICON_URL=                # $NEXT_PUBLIC_URL/basereal.png

# Zora Configuration
NEXT_PUBLIC_PLATFORM_REFERRER=       # Your Zora platform referrer address

# IPFS Configuration
BGIPFS_API_KEY=                      # Your BGIPFS API key for image storage

# Optional Redis Configuration (if using)
REDIS_URL=
REDIS_TOKEN=
```

4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start creating!

## How It Works

1. **Capture**: Take a photo using your device's camera
2. **Customize**: Add a title that appears on the photo
3. **Create**: Mint your photo as a Zora coin on Base
4. **Share**: Your creation is now ready to be shared on Farcaster

## Contributing

Feel free to open issues and pull requests!
