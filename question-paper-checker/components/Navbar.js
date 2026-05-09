export default function Navbar() {
  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold text-primary">PaperCheck AI</div>
        <button className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-opacity-90 transition-all">
          Dashboard
        </button>
      </div>
    </nav>
  );
}
