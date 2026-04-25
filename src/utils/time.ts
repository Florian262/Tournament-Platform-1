export function formatInUserTZ(dateString: string | null) {
  if (!dateString) return 'TBD';
  try {
    const date = new Date(dateString);
    const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' };
    return new Intl.DateTimeFormat(undefined, opts).format(date);
  } catch {
    return dateString;
  }
}

export function formatTimeOnlyInUserTZ(dateString: string | null) {
  if (!dateString) return 'TBD';
  try {
    const date = new Date(dateString);
    const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' };
    return new Intl.DateTimeFormat(undefined, opts).format(date);
  } catch {
    return dateString;
  }
}

export function relativeTimeFromNow(dateString: string | null) {
  if (!dateString) return '';
  const target = new Date(dateString).getTime();
  const now = Date.now();
  const diff = target - now;
  const abs = Math.abs(diff);

  const minutes = Math.floor(abs / 60000) % 60;
  const hours = Math.floor(abs / 3600000) % 24;
  const days = Math.floor(abs / 86400000);

  if (diff > 0) {
    if (days > 0) return `Starts in ${days}d ${hours}h`;
    if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
    if (minutes > 0) return `Starts in ${minutes}m`;
    return `Starts soon`;
  } else {
    if (days > 0) return `Started ${days}d ago`;
    if (hours > 0) return `Started ${hours}h ago`;
    if (minutes > 0) return `Started ${minutes}m ago`;
    return `Started just now`;
  }
}
