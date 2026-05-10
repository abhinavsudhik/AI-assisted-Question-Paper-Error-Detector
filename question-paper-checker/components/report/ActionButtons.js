'use client';   

export default function ActionButtons() {
  const handleDownloadPDF = () => {
    alert('Downloading PDF report...');
  };

  const handleShareWithHOD = () => {
    alert('Opening share dialog...');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
      <button
        onClick={handleDownloadPDF}
        className="px-8 py-3 bg-primary hover:bg-opacity-90 text-white font-semibold rounded-xl transition-all active:scale-95"
      >
        Download PDF Report
      </button>
      
      <button
        onClick={handleShareWithHOD}
        className="px-8 py-3 border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary/5 transition-all active:scale-95"
      >
        Share with HOD
      </button>
    </div>
  );
}
