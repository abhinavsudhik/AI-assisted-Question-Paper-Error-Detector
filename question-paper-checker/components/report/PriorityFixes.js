export default function PriorityFixes() {
  const fixes = [
    {
      id: 1,
      title: 'Total marks tally error',
      description: 'Paper adds up to 95 but total says 100',
      category: 'Marks',
      severity: 'critical'
    },
    {
      id: 2,
      title: 'Question numbering jump',
      description: 'Question numbering jumps from Q5 to Q7',
      category: 'Structure',
      severity: 'warning'
    },
    {
      id: 3,
      title: 'MCQ with multiple correct answers',
      description: 'Q6 has two correct options (B and D)',
      category: 'Logical',
      severity: 'critical'
    }
  ];

  const getSeverityColor = (severity) => {
    if (severity === 'critical') return 'text-error bg-red-50 border-error';
    if (severity === 'warning') return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  return (
    <div className="mb-10">
      <h2 className="text-2xl font-bold text-foreground mb-6">Top 3 Priority Fixes</h2>
      <div className="space-y-3">
        {fixes.map((fix) => (
          <div
            key={fix.id}
            className={`bg-card rounded-xl border-l-4 ${
              fix.severity === 'critical' ? 'border-l-error' : 'border-l-amber-500'
            } shadow-sm border border-border p-5`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">{fix.title}</h3>
                <p className="text-gray-600 text-sm">{fix.description}</p>
              </div>
              <span
                className={`ml-4 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getSeverityColor(
                  fix.severity
                )}`}
              >
                {fix.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
