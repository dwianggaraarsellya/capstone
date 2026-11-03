export function formatRupiah(number) {
  if (number === null || number === undefined || isNaN(number)) return 'Rp 0';
  const num = Math.round(Number(number));
  if (!Number.isFinite(num)) return 'Rp 0';
  const formatted = Math.abs(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return num < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

export function formatPrice(number) {
  return formatRupiah(number);
}

export function formatDate(date, options = {}) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const defaultOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
    ...options
  };
  return new Intl.DateTimeFormat('id-ID', defaultOptions).format(d);
}

export function formatDateTime(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta'
  }).format(d);
}
