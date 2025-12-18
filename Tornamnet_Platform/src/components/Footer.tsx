import { Twitter, Twitch, Youtube, ExternalLink, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-12 bg-slate-900 text-slate-200 border-t border-blue-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <button className="flex items-center gap-3 mb-3" aria-label="Arena">
              <span className="text-2xl font-bold text-white">Arena</span>
            </button>
            <p className="text-sm text-slate-400 max-w-xs">The ultimate platform for competitive gaming — discover, organize and compete in tournaments worldwide.</p>

            <div className="mt-4 flex items-center gap-3">
              <a href="#" aria-label="Discord" className="p-2 bg-slate-800 rounded hover:bg-blue-600 transition-colors" dangerouslySetInnerHTML={{__html: `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 3.8a18.1 18.1 0 0 0-4.9-1.5 13.9 13.9 0 0 0-.3 1 12.7 12.7 0 0 0-3.8 0 18.1 18.1 0 0 0-.3-1A18.1 18.1 0 0 0 4 3.8C1.7 8.5.7 13.1 1.2 17.6a19.7 19.7 0 0 0 6 3.1c.4-.5.7-1 1-1.5-2-.6-3.9-1.6-5-3.1 0 0 .9.6 2.1 1.1 3.9 1.7 8.2 1.1 11.1-1.1 0 0 1.2-.8 2.1-1.3-1.1 1.5-2.9 2.5-5 3.1.3.5.6 1 1 1.5a19.7 19.7 0 0 0 6-3.1c.6-4.4-.6-9.1-3.9-13.8z"/></svg>
              `}} />
              <a href="#" aria-label="Twitter" className="p-2 bg-slate-800 rounded hover:bg-blue-500 transition-colors">
                <Twitter size={18} />
              </a>
              <a href="#" aria-label="Twitch" className="p-2 bg-slate-800 rounded hover:bg-purple-600 transition-colors">
                <Twitch size={18} />
              </a>
              <a href="#" aria-label="YouTube" className="p-2 bg-slate-800 rounded hover:bg-red-600 transition-colors">
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-white font-semibold mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link className="text-slate-300 hover:text-white" to="/tournaments">Browse Tournaments</Link></li>
              <li><Link className="text-slate-300 hover:text-white" to="/create-tournament">Create Tournament</Link></li>
              <li><Link className="text-slate-300 hover:text-white" to="/teams">Teams</Link></li>
              <li><Link className="text-slate-300 hover:text-white" to="/players">Players</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link className="text-slate-300 hover:text-white" to="/help">Help Center</Link></li>
              <li><Link className="text-slate-300 hover:text-white" to="/rules">Rules &amp; Guidelines</Link></li>
              <li><Link className="text-slate-300 hover:text-white" to="/contact">Contact Us</Link></li>
              <li><a className="text-slate-300 hover:text-white" href="mailto:support@arena.com">Report Issue</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link className="text-slate-300 hover:text-white" to="/privacy">Privacy Policy</Link></li>
              <li><Link className="text-slate-300 hover:text-white" to="/terms">Terms of Service</Link></li>
              <li><Link className="text-slate-300 hover:text-white" to="/cookies">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-blue-500/10 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-slate-400">© 2025 Arena. All rights reserved.</div>
          <div className="text-sm text-slate-300 flex items-center gap-2">Made with <Heart className="text-red-400" size={14} /> for Gamers</div>
          <div>
            <a href="#" className="text-sm text-slate-400 hover:text-white inline-flex items-center gap-1"><ExternalLink size={14} /> <span>Careers</span></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
