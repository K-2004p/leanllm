export function generateFallbackImage(prompt: string, aspectRatio = '1:1'): string {
  let width = 800;
  let height = 800;

  if (aspectRatio === '16:9') {
    width = 960;
    height = 540;
  } else if (aspectRatio === '4:3') {
    width = 800;
    height = 600;
  } else if (aspectRatio === '9:16') {
    width = 540;
    height = 960;
  }

  const promptClean = prompt.replace(/"/g, "'").slice(0, 80);
  const isServer = /server|datacenter|cluster|gpu|rack/i.test(prompt);
  const isNeural = /neural|brain|ai|model|llm|intelligence/i.test(prompt);
  const isDiagram = /diagram|architecture|flow|pipeline|network/i.test(prompt);

  const primaryColor = isServer ? '#10b981' : isNeural ? '#38bdf8' : '#818cf8';
  const accentColor = isServer ? '#059669' : isNeural ? '#0284c7' : '#6366f1';

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="0.8" opacity="0.4"/>
    </pattern>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
  <rect width="${width}" height="${height}" fill="url(#grid)"/>
  <circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) * 0.45}" fill="url(#glow)"/>

  <!-- Central Graphic -->
  <g filter="url(#shadow)">
    ${
      isDiagram
        ? `
      <!-- Flow Diagram Layout -->
      <rect x="${width * 0.15}" y="${height * 0.35}" width="${width * 0.2}" height="${height * 0.28}" rx="12" fill="#090d16" stroke="${primaryColor}" stroke-width="1.5"/>
      <text x="${width * 0.25}" y="${height * 0.47}" fill="#f8fafc" font-size="14" font-family="sans-serif" font-weight="600" text-anchor="middle">Input Stream</text>
      <text x="${width * 0.25}" y="${height * 0.52}" fill="#94a3b8" font-size="11" font-family="sans-serif" text-anchor="middle">Token Batch</text>

      <path d="M ${width * 0.35} ${height * 0.49} L ${width * 0.45} ${height * 0.49}" stroke="${primaryColor}" stroke-width="2" stroke-dasharray="4 4"/>
      <circle cx="${width * 0.45}" cy="${height * 0.49}" r="4" fill="${primaryColor}"/>

      <rect x="${width * 0.45}" y="${height * 0.3}" width="${width * 0.25}" height="${height * 0.38}" rx="14" fill="#090d16" stroke="${accentColor}" stroke-width="2"/>
      <rect x="${width * 0.47}" y="${height * 0.33}" width="${width * 0.21}" height="26" rx="6" fill="#1e293b"/>
      <text x="${width * 0.575}" y="${height * 0.37}" fill="${primaryColor}" font-size="12" font-family="sans-serif" font-weight="700" text-anchor="middle">LEANLLM CORE</text>
      <text x="${width * 0.575}" y="${height * 0.46}" fill="#f8fafc" font-size="13" font-family="sans-serif" font-weight="600" text-anchor="middle">Vector Cache</text>
      <text x="${width * 0.575}" y="${height * 0.51}" fill="#94a3b8" font-size="11" font-family="sans-serif" text-anchor="middle">Adaptive Routing</text>
      <text x="${width * 0.575}" y="${height * 0.56}" fill="#94a3b8" font-size="11" font-family="sans-serif" text-anchor="middle">Context Pruner</text>

      <path d="M ${width * 0.7} ${height * 0.49} L ${width * 0.78} ${height * 0.49}" stroke="${primaryColor}" stroke-width="2" stroke-dasharray="4 4"/>
      <circle cx="${width * 0.78}" cy="${height * 0.49}" r="4" fill="${primaryColor}"/>

      <rect x="${width * 0.78}" y="${height * 0.35}" width="${width * 0.18}" height="${height * 0.28}" rx="12" fill="#090d16" stroke="${primaryColor}" stroke-width="1.5"/>
      <text x="${width * 0.87}" y="${height * 0.47}" fill="#f8fafc" font-size="14" font-family="sans-serif" font-weight="600" text-anchor="middle">Output</text>
      <text x="${width * 0.87}" y="${height * 0.52}" fill="#34d399" font-size="11" font-family="sans-serif" text-anchor="middle">0ms Latency</text>
    `
        : `
      <!-- Isometric Tech Visual -->
      <g transform="translate(${width / 2}, ${height / 2 - 30}) scale(${Math.min(width, height) / 600})">
        <!-- Central Cube / Unit -->
        <polygon points="0,-100 120,-30 0,40 -120,-30" fill="#1e293b" stroke="${primaryColor}" stroke-width="2"/>
        <polygon points="-120,-30 0,40 0,160 -120,90" fill="#0f172a" stroke="${accentColor}" stroke-width="2"/>
        <polygon points="120,-30 0,40 0,160 120,90" fill="#090d16" stroke="${primaryColor}" stroke-width="2"/>

        <!-- Optical circuits -->
        <circle cx="0" cy="-30" r="16" fill="${primaryColor}" opacity="0.8"/>
        <circle cx="-60" cy="5" r="10" fill="${primaryColor}" opacity="0.6"/>
        <circle cx="60" cy="5" r="10" fill="${accentColor}" opacity="0.6"/>

        <line x1="0" y1="-30" x2="-60" y2="5" stroke="${primaryColor}" stroke-width="2"/>
        <line x1="0" y1="-30" x2="60" y2="5" stroke="${primaryColor}" stroke-width="2"/>
        <line x1="0" y1="40" x2="0" y2="150" stroke="${primaryColor}" stroke-width="2" stroke-dasharray="6 4"/>
      </g>
    `
    }
  </g>

  <!-- Prompt Overlay Card -->
  <rect x="24" y="${height - 72}" width="${width - 48}" height="48" rx="10" fill="#020617" fill-opacity="0.85" stroke="#334155" stroke-width="1"/>
  <circle cx="44" cy="${height - 48}" r="5" fill="${primaryColor}"/>
  <text x="60" y="${height - 44}" fill="#f1f5f9" font-size="13" font-family="sans-serif" font-weight="500">
    ${promptClean}
  </text>
  <text x="${width - 36}" y="${height - 44}" fill="#64748b" font-size="11" font-family="sans-serif" text-anchor="end">
    ${aspectRatio} • LeanLLM Vision
  </text>
</svg>
`;

  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}
