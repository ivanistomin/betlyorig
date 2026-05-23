import { CHARACTERS } from './AvatarCharacters';
import { getItem } from './AvatarItems';

/*
 * Layered avatar renderer. Layers (z-index):
 *   10 — Background gradient
 *   20 — Base character (capybara / raccoon / monkey)
 *   30 — Body item (hoodie / jacket / tee)
 *   40 — Head item (glasses / cap / headphones)
 *
 * All layers share the same 200x300 viewport so they stack pixel-perfect.
 */

export default function AvatarCanvas({ avatar, size = 220, showBackground = true, className = '' }) {
  const characterId = avatar?.character || 'capybara';
  const Character = (CHARACTERS[characterId] || CHARACTERS.capybara).Component;
  const bodyItem = getItem(avatar?.equipped?.body);
  const headItem = getItem(avatar?.equipped?.head);

  const layerStyle = { position: 'absolute', inset: 0, width: '100%', height: '100%' };

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size * 1.4, aspectRatio: '200 / 300' }}
    >
      {showBackground && (
        <div
          style={{
            ...layerStyle,
            zIndex: 10,
            borderRadius: 20,
            background:
              'radial-gradient(ellipse at top, hsl(265 90% 60% / 0.45) 0%, hsl(258 35% 12%) 55%, hsl(250 20% 6%) 100%)',
            border: '1px solid rgba(124,92,252,0.3)',
            boxShadow: '0 0 28px rgba(124,92,252,0.25)',
          }}
        />
      )}

      <div style={{ ...layerStyle, zIndex: 20 }}>
        <Character />
      </div>

      {bodyItem && (
        <div style={{ ...layerStyle, zIndex: 30 }}>
          <bodyItem.Component />
        </div>
      )}

      {headItem && (
        <div style={{ ...layerStyle, zIndex: 40 }}>
          <headItem.Component />
        </div>
      )}
    </div>
  );
}
