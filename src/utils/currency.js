/**
 * Formats a number as Indonesian Rupiah
 */
export function formatRupiah(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Converts a number to Indonesian Terbilang words
 */
export function angkaTerbilang(nilai) {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 
    'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];

  const n = Math.floor(Math.abs(Number(nilai) || 0));
  if (n === 0) return 'Nol Rupiah';

  function terbilangHelper(num) {
    if (num < 12) {
      return bilangan[num];
    } else if (num < 20) {
      return terbilangHelper(num - 10) + ' Belas';
    } else if (num < 100) {
      return terbilangHelper(Math.floor(num / 10)) + ' Puluh ' + terbilangHelper(num % 10);
    } else if (num < 200) {
      return 'Seratus ' + terbilangHelper(num - 100);
    } else if (num < 1000) {
      return terbilangHelper(Math.floor(num / 100)) + ' Ratus ' + terbilangHelper(num % 100);
    } else if (num < 2000) {
      return 'Seribu ' + terbilangHelper(num - 1000);
    } else if (num < 1000000) {
      return terbilangHelper(Math.floor(num / 1000)) + ' Ribu ' + terbilangHelper(num % 1000);
    } else if (num < 1000000000) {
      return terbilangHelper(Math.floor(num / 1000000)) + ' Juta ' + terbilangHelper(num % 1000000);
    } else if (num < 1000000000000) {
      return terbilangHelper(Math.floor(num / 1000000000)) + ' Miliar ' + terbilangHelper(num % 1000000000);
    } else {
      return terbilangHelper(Math.floor(num / 1000000000000)) + ' Triliun ' + terbilangHelper(num % 1000000000000);
    }
  }

  return (terbilangHelper(n).replace(/\s+/g, ' ').trim()) + ' Rupiah';
}

export function formatDateIndo(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}
