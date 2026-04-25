import LegalPageLayout from '../layout/LegalPageLayout';

export default function ContactUs() {
  return (
    <LegalPageLayout title="Contact Us">
      <p>If you need help, reach out to our support team.</p>
      <p>
        Email: <a href="mailto:support@arena.com" className="text-blue-400">support@arena.com</a>
      </p>

      <h2>Or send a message</h2>
      <form className="mt-4 space-y-3">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Your email</label>
          <input className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Message</label>
          <textarea className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" rows={5} placeholder="Describe your issue"></textarea>
        </div>
        <div>
          <button type="button" className="px-4 py-2 bg-blue-600 rounded text-white">Send</button>
        </div>
      </form>
    </LegalPageLayout>
  );
}
