import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

async function loadAsset(path: string): Promise<ArrayBuffer> {
  const res = await fetch(new URL(path, import.meta.url));
  return res.arrayBuffer();
}

// Load Geist font from Google Fonts CSS (robust URL extraction)
const geistCssUrl =
  'https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap';
async function fetchGeistFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(geistCssUrl, {
      // Some CDNs vary CSS by UA; set a generic UA to avoid minimal responses
      headers: { 'User-Agent': 'Mozilla/5.0' },
    }).then((res) => res.text());
    const urlMatches = Array.from(
      css.matchAll(/url\((['"]?)(https?:\/\/[^)]+\.woff2)\1\)/g),
    );
    const url = (urlMatches.find((m) => m[2].includes('fonts.gstatic.com')) ||
      urlMatches[0])?.[2];
    if (!url) return null;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

function toBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function getPngDimensions(buffer: ArrayBuffer): {
  width: number;
  height: number;
} {
  // PNG: 8-byte signature, then IHDR chunk: 4-byte length, 'IHDR', 13-byte data
  // Width and height are the first 8 bytes of IHDR data (big-endian 32-bit)
  const view = new DataView(buffer);
  const width = view.getUint32(16, false);
  const height = view.getUint32(20, false);
  return { width, height };
}

export default async function OGImage() {
  const [logoBuffer, ogBuffer, geistData] = await Promise.all([
    loadAsset('./icon.png'),
    loadAsset('../public/og.png'),
    fetchGeistFont(),
  ]);
  const logoSrc = `data:image/png;base64,${toBase64(logoBuffer)}`;
  const ogSrc = `data:image/png;base64,${toBase64(ogBuffer)}`;
  const ogDims = getPngDimensions(ogBuffer);
  const paddingX = 56;
  const frame = {
    width: size.width - paddingX * 2,
    height: 500,
  } as const;
  const scaledOgHeight = Math.round(
    (frame.width / ogDims.width) * ogDims.height,
  );
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          paddingLeft: paddingX,
          paddingRight: paddingX,
          paddingBottom: 56,
          paddingTop: 96,
          rowGap: 40,
          width: size.width,
          height: size.height,
          background: 'linear-gradient(180deg, #faf8f2 0%, #f3efe6 100%)',
          backgroundImage:
            'radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), radial-gradient(rgba(0,0,0,0.02) 1px, transparent 1px)',
          backgroundSize: '6px 6px, 10px 10px',
          backgroundPosition: '0 0, 2px 2px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', columnGap: 28 }}>
          <img
            src={logoSrc}
            width={192}
            height={192}
            style={{ borderRadius: 24 }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontWeight: 900,
                color: '#111827',
                fontSize: 192,
                lineHeight: 1,
                letterSpacing: -3.2,
                fontFamily: 'Geist, sans-serif',
              }}
            >
              Cadro
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            top: size.height / 2,
            left: paddingX,
            right: paddingX,
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: frame.width,
              height: frame.height,
              overflow: 'hidden',
            }}
          >
            <img
              src={ogSrc}
              style={{
                width: frame.width,
                height: scaledOgHeight,
                display: 'block',
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      width: size.width,
      height: size.height,
      fonts: geistData
        ? [
            {
              name: 'Geist',
              data: geistData,
              style: 'normal',
              weight: 400,
            },
          ]
        : undefined,
    },
  );
}
