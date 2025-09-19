# 🎾 AskTennis Client Assets

This directory contains all static assets for the AskTennis client application.

## 📁 Directory Structure

```
assets/
├── images/           # Image assets
│   └── tennis.png   # Tennis ball favicon and app icons
├── fonts/           # Custom fonts (if any)
├── icons/           # Icon assets (if any)
└── README.md        # This file
```

## 🖼️ Images

### **`tennis.png`**
- **Purpose**: Tennis ball favicon and app icons
- **Usage**: Browser tab icon, PWA icons, mobile home screen
- **Sizes**: Used for 16x16, 32x32, 64x64, 192x192, 512x512
- **Format**: PNG with transparency

## 📋 Asset Guidelines

- **Naming**: Use kebab-case for file names (e.g., `tennis-ball.png`)
- **Formats**: Prefer PNG for icons, JPG for photos, SVG for scalable graphics
- **Optimization**: Compress images for web performance
- **Organization**: Group related assets in subdirectories

## 🔗 Usage in Code

Assets in this folder are accessible via `%PUBLIC_URL%/assets/` in HTML files:

```html
<link rel="icon" href="%PUBLIC_URL%/assets/images/tennis.png" />
```

## 🚀 Build Process

Assets in this folder are copied to the `build/` directory during the React build process and maintain their directory structure.
