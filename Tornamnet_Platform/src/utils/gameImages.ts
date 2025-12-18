export const GAME_IMAGE_MAP: Record<string, string> = {
  // keys are lowercase normalized names
  'cs2': 'https://images.pexels.com/photos/279024/pexels-photo-279024.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'counter-strike 2': 'https://images.pexels.com/photos/279024/pexels-photo-279024.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'csgo': 'https://community.skin.club/wp-content/uploads/2025/09/cs2.jpg.webp',
  'dota 2': 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'dota2': 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'valorant': 'https://images.pexels.com/photos/132037/pexels-photo-132037.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'league of legends': 'https://images.pexels.com/photos/205316/pexels-photo-205316.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'lol': 'https://images.pexels.com/photos/205316/pexels-photo-205316.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'default': 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=1200',
};

export function getGameImage(key?: string | null) {
  if (!key) return GAME_IMAGE_MAP['default'];
  const normalized = key.trim().toLowerCase();
  return GAME_IMAGE_MAP[normalized] || GAME_IMAGE_MAP['default'];
}
