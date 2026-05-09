import Navbar from '@/components/Navbar';
import InputForm from '@/components/InputForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Page Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-foreground mb-3 text-balance">
              Check Your Question Paper
            </h1>
            <p className="text-lg text-gray-600">
              Upload your files and let AI find the errors
            </p>
          </div>

          {/* Input Form */}
          <InputForm />
        </div>
      </main>
    </div>
  );
}
