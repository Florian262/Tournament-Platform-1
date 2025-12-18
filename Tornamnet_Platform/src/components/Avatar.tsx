import { useState } from 'react';

interface AvatarProps {
  src?: string | null;
  username?: string | null;
  size?: number;
  className?: string;
}

const COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
  'bg-lime-500', 'bg-green-500', 'bg-teal-500', 'bg-cyan-500',
  'bg-sky-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500',
  'bg-purple-500', 'bg-pink-500', 'bg-rose-500'
];

function hashStringToIndex(s: string | undefined | null, mod: number) {
  if (!s) return 0;
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % mod;
}

function initialsFromUsername(username?: string | null) {
  if (!username) return '?';
  const parts = username.split(/\s+|_|\.|-/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function Avatar({ src, username, size = 40, className = '' }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const showFallback = !src || errored;
  const colorClass = COLORS[hashStringToIndex(username, COLORS.length)];

  if (!showFallback) {
    return (
      // eslint-disable-next-line jsx-a11y/img-redundant-alt
      <img
        src={src as string}
        alt={username || 'avatar'}
        onError={() => setErrored(true)}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-full flex items-center justify-center text-white font-semibold ${colorClass} ${className}`}
    >
      {initialsFromUsername(username)}
    </div>
  );
}
