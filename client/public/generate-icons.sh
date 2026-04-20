#!/bin/bash
# Generate app icons for PWA

# Create SVG icon template
cat > /tmp/fodderflow-icon.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- Background -->
  <rect width="512" height="512" fill="#16a34a"/>
  
  <!-- Leaf shape (simplified) -->
  <path d="M 256 80 Q 320 120 320 200 Q 320 280 256 320 Q 192 280 192 200 Q 192 120 256 80 Z" fill="#ffffff" opacity="0.9"/>
  
  <!-- Barn/storage -->
  <rect x="140" y="280" width="232" height="160" fill="#ffffff" opacity="0.8"/>
  <polygon points="140,280 256,200 372,280" fill="#ffffff" opacity="0.9"/>
  
  <!-- Door -->
  <rect x="216" y="320" width="80" height="120" fill="#16a34a" opacity="0.6"/>
  
  <!-- Window -->
  <rect x="160" y="300" width="40" height="40" fill="#fbbf24" opacity="0.8"/>
  <rect x="312" y="300" width="40" height="40" fill="#fbbf24" opacity="0.8"/>
</svg>
EOF

echo "Icon template created at /tmp/fodderflow-icon.svg"
echo "Note: Convert this SVG to PNG using an image tool for production use"
