export default function ErrorBreakdownChart() {
  const categories = [
    { label: 'Language', count: 4, color: 'bg-error' },
    { label: 'Structure', count: 2, color: 'bg-amber-500' },
    { label: 'Marks', count: 3, color: 'bg-error' },
    { label: 'Syllabus', count: 2, color: 'bg-amber-500' },
    { label: 'Logical', count: 1, color: 'bg-error' },
  ];

  const maxCount = Math.max(...categories.map(c => c.count));

  return (
    <div className="mb-10 bg-card rounded-2xl shadow-sm border border-border p-8">
      <h2 className="text-2xl font-bold text-foreground mb-8">Error Breakdown by Category</h2>
      
      <div className="space-y-6">
        {categories.map((category, index) => (
          <div key={index}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-foreground">{category.label}</span>
              <span className="text-sm font-semibold text-gray-600">
                {category.count} error{category.count !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="w-full h-8 bg-gray-100 rounded-lg overflow-hidden">
              <div
                className={`h-full ${category.color} rounded-lg transition-all duration-500`}
                style={{ width: `${(category.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
