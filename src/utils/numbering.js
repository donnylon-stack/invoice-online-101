/**
 * Helper to generate smart acronyms from company name.
 * Examples:
 * - "PT Artha Tri Hanjaya" -> "PATH"
 * - "PT Sukses Mekar Abadi" -> "PSMA"
 * - "CV Sumber Rejeki" -> "CSR"
 * - "Google" -> "GOOG"
 */
export function generateCompanyAcronym(companyName) {
  if (!companyName || typeof companyName !== 'string') return 'IO101';
  
  // Clean special characters but keep spaces and words
  const words = companyName
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return 'IO101';

  if (words.length === 1) {
    return words[0].slice(0, 4).toUpperCase();
  }

  // Take the first letter of each word
  const acronym = words.map(w => w[0]).join('').toUpperCase();
  return acronym;
}

/**
 * Generates the next sequential document number
 * @param {'INV' | 'QUO'} type 
 * @param {string} companyCode 
 * @param {number} sequenceNumber 
 * @param {number} year 
 */
export function formatDocumentNumber(type, companyCode, sequenceNumber, year = new Date().getFullYear()) {
  const prefix = type === 'QUO' ? 'QUO' : 'INV';
  const code = (companyCode || 'IO101').toUpperCase().trim();
  const seq = String(sequenceNumber).padStart(6, '0');
  return `${prefix}-${code}-${year}-${seq}`;
}
