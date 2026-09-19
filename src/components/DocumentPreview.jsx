import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useInvoice } from '../context/InvoiceContext';
import { formatRupiah, formatDateIndo, angkaTerbilang } from '../utils/currency';
import { 
  Printer, 
  ArrowLeft, 
  Edit3, 
  Send, 
  CheckCircle, 
  Sparkles, 
  Share2, 
  Building2,
  Mail,
  Phone,
  MapPin,
  Download,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function DocumentPreview({ document, onBack, onEdit }) {
  const { session } = useAuth();
  const { updateInvoice, convertQuotationToInvoice } = useInvoice();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const documentRef = useRef(null);

  if (!document) return null;

  const isQuotation = document.type === 'QUO';
  const isPaid = document.status === 'PAID';
  const isAccepted = document.status === 'ACCEPTED';

  const handlePrint = () => {
    window.print();
  };

  const handleSavePdf = async () => {
    if (!documentRef.current || isGeneratingPdf) return;
    setIsGeneratingPdf(true);

    try {
      const element = documentRef.current;

      // Render elemen ke canvas resolusi tinggi (scale 2 untuk hasil tajam & jernih)
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1024,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('printable-document-sheet');
          if (el) {
            el.style.width = '800px';
            el.style.maxWidth = '800px';
            el.style.borderRadius = '0px';
            el.style.boxShadow = 'none';
            el.style.border = 'none';
            el.style.padding = '32px';
            el.style.margin = '0 auto';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');

      // Standar dokumen PDF A4 (210 x 297 mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Halaman pertama
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Halaman tambahan jika isi dokumen melebihi 1 halaman A4
      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      // Bersihkan nama file dari karakter ilegal
      const cleanDocNumber = (document.number || 'Dokumen').replace(/[/\\?%*:|"<>]/g, '-');
      const fileName = `${isQuotation ? 'Penawaran' : 'Invoice'}_${cleanDocNumber}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Gagal membuat file PDF:', error);
      alert('Terjadi kendala saat menghasilkan file PDF secara instan. Mengalihkan ke jendela cetak/PDF sistem...');
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleMarkPaid = () => {
    updateInvoice(document.id, { status: 'PAID' });
    document.status = 'PAID';
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleConvert = () => {
    const newInv = convertQuotationToInvoice(document.id);
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });
    alert(`Berhasil! Penawaran ini resmi menjadi Invoice nomor: ${newInv.number}`);
    onBack();
  };

  const handleWhatsAppShare = () => {
    const text = `Halo Bapak/Ibu di ${document.client?.name || 'Klien'},\nBerikut kami kirimkan ${isQuotation ? 'Surat Penawaran Harga' : 'Faktur Invoice'} Nomor: *${document.number}* sebesar *${formatRupiah(document.grandTotal)}*.\nJatuh tempo: ${formatDateIndo(document.dueDate || document.validUntil)}.\n\nTerima kasih,\n*${document.companyName || session?.companyName}*`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleWebShare = async () => {
    const title = `${isQuotation ? 'Surat Penawaran' : 'Faktur Invoice'} ${document.number} - ${document.companyName || session?.companyName}`;
    const text = `Halo Bapak/Ibu di ${document.client?.name || 'Klien'},\nBerikut kami kirimkan ${isQuotation ? 'Surat Penawaran Harga' : 'Faktur Invoice'} Nomor: *${document.number}* sebesar *${formatRupiah(document.grandTotal)}*.\nJatuh tempo: ${formatDateIndo(document.dueDate || document.validUntil)}.\n\nTerima kasih,\n*${document.companyName || session?.companyName}*`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: window.location.href
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Error sharing:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${title}\n\n${text}`);
        alert('Rincian invoice berhasil disalin ke clipboard!');
      } catch (e) {
        handleWhatsAppShare();
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Action Bar (Hidden on print) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3 no-print">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Native Web Share */}
          <button
            onClick={handleWebShare}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition"
            title="Bagikan via menu share perangkat / HP"
          >
            <Share2 className="w-4 h-4" />
            Bagikan
          </button>

          {/* WhatsApp Share */}
          <button
            onClick={handleWhatsAppShare}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition"
          >
            <Send className="w-4 h-4" />
            Kirim WhatsApp
          </button>

          {/* Edit */}
          <button
            onClick={() => onEdit(document)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition"
          >
            <Edit3 className="w-4 h-4" />
            Edit Dokumen
          </button>

          {/* If Quotation: Convert to Invoice */}
          {isQuotation && !isAccepted && (
            <button
              onClick={handleConvert}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Sparkles className="w-4 h-4" />
              Konversi ke Invoice
            </button>
          )}

          {/* If Invoice: Mark as Paid */}
          {!isQuotation && !isPaid && (
            <button
              onClick={handleMarkPaid}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              <CheckCircle className="w-4 h-4" />
              Tandai Lunas
            </button>
          )}

          {/* Tombol Cetak Dokumen (Printer Dialog) */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
            title="Cetak via printer fisik atau dialog cetak sistem"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak</span>
          </button>

          {/* Tombol Simpan PDF (Direct Download PDF File) */}
          <button
            onClick={handleSavePdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition active:scale-95"
            title="Download langsung dokumen sebagai file PDF"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Membuat PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Simpan PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* The Printable A4 Sheet */}
      <div 
        ref={documentRef}
        id="printable-document-sheet"
        className="print-page max-w-4xl mx-auto bg-white p-4 sm:p-8 md:p-12 rounded-2xl shadow-xl border border-slate-200 relative overflow-hidden"
      >
        
        {/* Watermark Stamp */}
        {isPaid && (
          <div className="absolute right-12 top-48 pointer-events-none rotate-[-18deg] select-none z-10">
            <div className="border-4 border-emerald-600 text-emerald-600 font-black text-3xl sm:text-4xl px-6 py-2 rounded-xl uppercase tracking-widest opacity-80 shadow-sm">
              LUNAS / PAID
            </div>
          </div>
        )}

        {isAccepted && isQuotation && (
          <div className="absolute right-12 top-48 pointer-events-none rotate-[-18deg] select-none z-10">
            <div className="border-4 border-cyan-600 text-cyan-600 font-black text-3xl sm:text-4xl px-6 py-2 rounded-xl uppercase tracking-widest opacity-80 shadow-sm">
              DISETUJUI
            </div>
          </div>
        )}

        {/* Header: Company Logo & Document Type */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-8 border-b-2 border-slate-900">
          <div className="flex items-start gap-4">
            <img 
              src={session?.logoUrl || '/logo.jpg'} 
              alt="Company Logo" 
              className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0" 
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                {document.companyName || session?.companyName}
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
                {session?.address || 'Jl. Bisnis Raya No. 101, Jakarta'}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-2">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {session?.phone || '0812-3456-7890'}</span>
                <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {session?.email || 'finance@perusahaan.com'}</span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className={`inline-block px-3 py-1 rounded-lg font-black text-xs uppercase tracking-wider mb-2 ${
              isQuotation ? 'bg-cyan-100 text-cyan-800' : 'bg-brand-100 text-brand-800'
            }`}>
              {isQuotation ? 'SURAT PENAWARAN HARGA' : 'FAKTUR INVOICE'}
            </div>
            <div className="text-lg sm:text-xl font-mono font-black text-slate-900">
              {document.number}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Kode Perusahaan: <span className="font-mono font-bold text-brand-700">{document.companyCode || session?.companyCode}</span>
            </div>
          </div>
        </div>

        {/* Metadata Section: Bill To & Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              {isQuotation ? 'DITAWARKAN KEPADA:' : 'DITUJUKAN KEPADA:'}
            </span>
            <div className="text-sm font-bold text-slate-900">{document.client?.name}</div>
            {document.client?.contactPerson && (
              <div className="text-xs text-slate-700 mt-0.5">U.p. {document.client.contactPerson}</div>
            )}
            <div className="text-xs text-slate-500 mt-1 whitespace-pre-line leading-relaxed">
              {document.client?.address || '-'}
            </div>
            {document.client?.phone && (
              <div className="text-xs text-slate-500 mt-1">Telp: {document.client.phone}</div>
            )}
          </div>

          <div className="sm:text-right space-y-1 text-xs">
            <div className="flex justify-between sm:justify-end gap-4">
              <span className="text-slate-400">Tanggal Dokumen:</span>
              <span className="font-semibold text-slate-800">{formatDateIndo(document.issueDate)}</span>
            </div>
            <div className="flex justify-between sm:justify-end gap-4">
              <span className="text-slate-400">{isQuotation ? 'Berlaku Sampai:' : 'Jatuh Tempo:'}</span>
              <span className="font-bold text-brand-700">{formatDateIndo(document.dueDate || document.validUntil)}</span>
            </div>
            <div className="flex justify-between sm:justify-end gap-4">
              <span className="text-slate-400">Status Pembayaran:</span>
              <span className="font-bold uppercase font-mono">
                {isPaid ? 'LUNAS' : isAccepted ? 'DISETUJUI' : document.status}
              </span>
            </div>
            {document.linkedQuotationNumber && (
              <div className="flex justify-between sm:justify-end gap-4 text-[11px] text-slate-500">
                <span>Ref Penawaran:</span>
                <span className="font-mono font-semibold">{document.linkedQuotationNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6 overflow-x-auto">
          <table className="w-full min-w-[550px] sm:min-w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                <th className="py-3 px-2 w-8 text-center">No</th>
                <th className="py-3 px-3">Deskripsi Barang / Layanan</th>
                <th className="py-3 px-2 text-center w-16">Qty</th>
                <th className="py-3 px-2 text-center w-16">Satuan</th>
                <th className="py-3 px-3 text-right w-28">Harga Satuan</th>
                <th className="py-3 px-2 text-center w-16">Disc</th>
                <th className="py-3 px-3 text-right w-32">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {document.items?.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="py-3 px-2 text-center text-slate-400 font-medium">{idx + 1}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800 leading-relaxed">
                    {item.description}
                  </td>
                  <td className="py-3 px-2 text-center text-slate-700 font-mono">{item.qty}</td>
                  <td className="py-3 px-2 text-center text-slate-500">{item.unit || '-'}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700">
                    {formatRupiah(item.price)}
                  </td>
                  <td className="py-3 px-2 text-center text-slate-500">
                    {item.discount ? `${item.discount}%` : '-'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {formatRupiah(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Terbilang */}
        <div className="border-t-2 border-slate-200 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Terbilang & Notes */}
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Terbilang:
              </span>
              <p className="text-xs italic font-semibold text-brand-900 leading-relaxed">
                "{angkaTerbilang(document.grandTotal)}"
              </p>
            </div>

            {/* Payment instructions */}
            <div className="text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Instruksi Pembayaran:
              </span>
              <p className="text-slate-700 font-mono text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200 whitespace-pre-line">
                {document.paymentTerms || session?.bankInfo ? `Bank: ${session.bankInfo.bankName} | No. Rek: ${session.bankInfo.accountNumber}\na.n ${session.bankInfo.accountHolder}` : 'Silakan transfer ke rekening resmi perusahaan.'}
              </p>
            </div>

            {document.notes && (
              <div className="text-xs text-slate-500 italic">
                <strong>Catatan:</strong> {document.notes}
              </div>
            )}
          </div>

          {/* Numerical Summary Box */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 py-1">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold text-slate-800">{formatRupiah(document.subtotal)}</span>
            </div>

            {document.discountAmount > 0 && (
              <div className="flex justify-between text-red-600 py-1">
                <span>Diskon ({document.discountPercent}%):</span>
                <span className="font-mono font-semibold">-{formatRupiah(document.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600 py-1">
              <span>PPN ({document.taxPercent}%):</span>
              <span className="font-mono font-semibold text-slate-800">+{formatRupiah(document.taxAmount)}</span>
            </div>

            <div className="border-t-2 border-slate-900 pt-3 flex justify-between items-baseline">
              <span className="text-sm font-extrabold text-slate-900 uppercase">Grand Total:</span>
              <span className="text-xl font-black text-brand-700 font-mono">
                {formatRupiah(document.grandTotal)}
              </span>
            </div>
          </div>

        </div>

        {/* Footer Signature Box */}
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-8">
          <div className="text-[11px] text-slate-400 max-w-sm">
            <p>Dokumen ini sah dan diterbitkan secara resmi melalui sistem <strong>Invoice Online 101</strong>.</p>
          </div>

          <div className="text-center w-56 shrink-0 relative">
            <div className="text-xs text-slate-500 mb-1">
              {document.companyName || session?.companyName},
            </div>

            {/* Container Tanda Tangan & Stempel */}
            <div className="h-24 flex items-center justify-center relative my-1">
              {session?.stampUrl && (
                <img 
                  src={session.stampUrl} 
                  alt="Stempel Perusahaan" 
                  className="absolute left-1/2 -translate-x-1/2 -top-1 w-24 h-24 object-contain opacity-80 pointer-events-none select-none z-0" 
                />
              )}
              {session?.signatureUrl ? (
                <img 
                  src={session.signatureUrl} 
                  alt="Tanda Tangan" 
                  className="h-20 w-auto max-w-[180px] object-contain relative z-10 select-none" 
                />
              ) : (
                <div className="h-16" />
              )}
            </div>

            <div className="border-b border-slate-400 font-bold text-xs text-slate-900 pb-1 relative z-10">
              {session?.signatureName || session?.userName}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {session?.signatureTitle || 'Bagian Keuangan / Direktur'}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
