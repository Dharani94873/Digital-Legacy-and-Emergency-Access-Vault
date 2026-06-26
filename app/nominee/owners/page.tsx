export default function NomineeOwnersPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">My Owners</h1>
      <p className="text-slate-500">Owners who have invited you as a trusted nominee.</p>
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <p className="text-slate-400 text-sm">Owner list — loading from API</p>
      </div>
    </div>
  );
}
