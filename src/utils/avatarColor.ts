const AVATAR_COLORS = [
  '#0F6E56', '#1A8C6F', '#5DCAA5', '#085041',
  '#2E7D6B', '#3A9E84', '#4DB89A', '#6BCFB3',
  '#0D5C47', '#25A07A', '#178C6A', '#0E7A5C',
];

export function getAvatarColor(cid: string): string {
  let hash = 0;
  for (let i = 0; i < cid.length; i++) {
    hash = (hash * 31 + cid.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function getInitials(nameEn: string): string {
  if (!nameEn) return '?';
  const parts = nameEn.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
