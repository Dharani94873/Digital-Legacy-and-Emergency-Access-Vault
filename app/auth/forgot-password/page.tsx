import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Forgot Password</h1>
        <p className="text-slate-500 mb-6 text-sm">Enter your email to receive a reset link.</p>
        <p className="text-slate-400 text-xs mb-6">(Password reset flow to be implemented)</p>
        <Link href="/login" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
          Return to sign in
        </Link>
      </div>
    </div>
  );
}
