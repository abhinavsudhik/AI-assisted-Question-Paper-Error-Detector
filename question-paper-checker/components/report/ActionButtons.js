'use client';

export default function ActionButtons({ onDownloadPDF, isGeneratingPDF }) {
  const handleDownloadPDF = () => {
    if (onDownloadPDF) {
      onDownloadPDF();
    } else {
      alert('Downloading PDF report...');
    }
  };


  return (
    <div data-hide-print data-html2canvas-ignore="true" className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
      <button
        onClick={handleDownloadPDF}
        disabled={isGeneratingPDF}
        className="px-8 py-3 bg-primary hover:bg-opacity-90 text-white font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 min-w-[220px] flex items-center justify-center gap-2"
      >
        {isGeneratingPDF ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating PDF...
          </>
        ) : (
          'Download PDF Report'
        )}
      </button>


    </div>
  );
}
