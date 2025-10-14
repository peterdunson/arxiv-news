export default function Rightbar() {
  return (
    <div className="hidden lg:block sticky top-20 h-screen overflow-y-auto">
      <ul className="menu menu-lg bg-base-200 w-full rounded-box p-4">
        
        <h3 className="menu-title text-lg font-bold mb-3">📊 Trending Topics</h3>
        <li><a className="text-sm">#MachineLearning</a></li>
        <li><a className="text-sm">#QuantumComputing</a></li>
        <li><a className="text-sm">#AI</a></li>
        <li><a className="text-sm">#NeuralNetworks</a></li>

        <div className="divider"></div>

        <h3 className="menu-title text-lg font-bold mb-3">🔥 Hot Papers Today</h3>
        <li className="text-xs">
          <a>
            <div className="avatar placeholder">
              <div className="bg-neutral text-neutral-content rounded-full w-8">
                <span className="text-xs">📄</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold truncate">Attention Is All You Need</p>
              <p className="text-xs opacity-70">1.2k votes</p>
            </div>
          </a>
        </li>
        <li className="text-xs">
          <a>
            <div className="avatar placeholder">
              <div className="bg-neutral text-neutral-content rounded-full w-8">
                <span className="text-xs">📄</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold truncate">BERT: Pre-training...</p>
              <p className="text-xs opacity-70">980 votes</p>
            </div>
          </a>
        </li>

        <div className="divider"></div>

        <h3 className="menu-title text-lg font-bold mb-3">👥 Suggested Researchers</h3>
        <li className="text-xs">
          <a>
            <div className="avatar">
              <div className="w-8 rounded-full">
                <img src="https://ui-avatars.com/api/?name=John+Doe&background=random" />
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold">Dr. John Doe</p>
              <p className="text-xs opacity-70">AI Researcher</p>
            </div>
          </a>
        </li>
        <li className="text-xs">
          <a>
            <div className="avatar">
              <div className="w-8 rounded-full">
                <img src="https://ui-avatars.com/api/?name=Jane+Smith&background=random" />
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold">Dr. Jane Smith</p>
              <p className="text-xs opacity-70">ML Expert</p>
            </div>
          </a>
        </li>

        <div className="divider"></div>

        <h3 className="menu-title text-sm">🔗 Links</h3>
        <li className="text-xs"><a>About</a></li>
        <li className="text-xs"><a>Help</a></li>
        <li className="text-xs"><a>Terms</a></li>
        <li className="text-xs"><a>Privacy</a></li>
      </ul>
    </div>
  );
}
