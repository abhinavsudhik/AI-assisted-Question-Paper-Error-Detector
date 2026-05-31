import InputForm from '@/components/InputForm';

export default function Home() {
  return (
    <main className="flex-1">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-foreground mb-3 text-balance">
            Check Your Question Paper
          </h1>
          <p className="text-lg text-gray-600">
            Upload your question paper and reference files to detect errors
          </p>
        </div>

        {/* Input Form */}
        <InputForm />
      </div>
    </main>
  );
}
