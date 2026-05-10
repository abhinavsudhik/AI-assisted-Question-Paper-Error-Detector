export default function CleanQuestions() {
  const cleanQuestions = ['Q1', 'Q8', 'Q12', 'Q15'];

  return (
    <div className="mb-10 bg-card rounded-2xl shadow-sm border border-border p-8">
      <h2 className="text-2xl font-bold text-foreground mb-6">Questions with No Errors</h2>
      
      <div className="flex flex-wrap gap-3">
        {cleanQuestions.map((question, index) => (
          <span
            key={index}
            className="bg-success/10 border border-success text-success px-4 py-2 rounded-lg font-semibold text-sm"
          >
            ✓ {question}
          </span>
        ))}
      </div>
      
      <p className="text-gray-600 text-sm mt-6">
        These questions are well-formed and meet all requirements.
      </p>
    </div>
  );
}
