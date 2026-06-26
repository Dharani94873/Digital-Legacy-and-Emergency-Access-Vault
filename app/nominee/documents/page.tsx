export default function NomineeDocumentsPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-slate-900">Accessible Documents</h1>
      <p className="text-slate-500">Documents you have been granted access to after emergency approval.</p>
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <p className="text-slate-400 text-sm">Documents will appear here once an emergency request is approved.</p>
      </div>
    </div>
  );
}
