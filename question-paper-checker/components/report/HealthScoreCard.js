export default function HealthScoreCard() {
  const score = 72;
  const maxScore = 100;
  const percentage = (score / maxScore) * 100;

  // Determine color based on score
  const getColorClass = () => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-amber-500';
    return 'text-error';
  };

  const getStatusBadge = () => {
    if (score >= 80) return { text: 'Good', color: 'bg-success text-white' };
    if (score >= 60) return { text: 'Needs Revision', color: 'bg-error text-white' };
    return { text: 'Critical', color: 'bg-error text-white' };
  };

  const status = getStatusBadge();

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
      <p className="text-gray-600 text-sm font-medium mb-6">Paper Health Score</p>
      
      {/* Score Circle */}
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="relative w-32 h-32 mb-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#4F46E5"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - percentage / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className={`text-4xl font-bold ${getColorClass()}`}>{score}</p>
              <p className="text-sm text-gray-500">/ {maxScore}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex justify-center mb-2">
        <span className={`${status.color} px-4 py-2 rounded-full text-sm font-semibold`}>
          {status.text}
        </span>
      </div>

      <p className="text-center text-gray-600 text-sm">
        Review and fix the errors below
      </p>
    </div>
  );
}
