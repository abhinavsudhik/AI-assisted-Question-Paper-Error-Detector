export default function StatsGrid() {
  const stats = [
    { label: 'Total Errors Found', value: '12', color: 'text-error' },
    { label: 'Critical', value: '3', color: 'text-error' },
    { label: 'Warnings', value: '6', color: 'text-amber-500' },
    { label: 'Suggestions', value: '3', color: 'text-blue-500' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-card rounded-xl shadow-sm border border-border p-6"
        >
          <p className="text-gray-600 text-sm font-medium mb-2">{stat.label}</p>
          <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
