const fs = require('fs');
const path = require('path');

const filePath = 'e:/Quiznih/src/components/Navbar.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add X icon
content = content.replace(
  'import { Menu, Globe2, Sun, Moon, LogOut, User, LogIn } from "lucide-react";',
  'import { Menu, Globe2, Sun, Moon, LogOut, User, LogIn, X } from "lucide-react";'
);

// 2. Add state
content = content.replace(
  'const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);',
  'const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);\n  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);'
);

// 3. Replace mobile controls and add dropdown
const targetControls = `          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-4">
            <button className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white">
              <Menu className="w-6 h-6" />
            </button>
          </div>

        </div>
      </div>
    </nav>`;

const newControls = `          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-4">
            <button 
              className="text-white hover:text-gray-200 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white dark:bg-[#1A1A2E] shadow-xl border-t border-gray-100 dark:border-gray-800 flex flex-col p-4 gap-4 z-40">
          <a
            href="#how-it-works"
            className="font-bold text-gray-800 dark:text-gray-200 px-2 py-1"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            How it Works
          </a>
          <a
            href="#quizzes"
            className="font-bold text-gray-800 dark:text-gray-200 px-2 py-1"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Join a Quiz
          </a>
          <a
            href="#leaderboard"
            className="font-bold text-gray-800 dark:text-gray-200 px-2 py-1"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Leaderboard
          </a>
          
          <hr className="border-gray-200 dark:border-gray-700 my-2" />
          
          <div className="flex flex-col gap-3 px-2">
            {!user && !isConnected && (
              <button
                onClick={() => { setIsAuthOpen(true); setIsMobileMenuOpen(false); }}
                className="flex items-center justify-center gap-2 transition-all text-base w-full"
                style={{ background: "#FCFF52", color: "#0a1a0f", fontWeight: 900, border: "none", borderRadius: 50, padding: "12px 20px" }}
              >
                <LogIn className="w-4 h-4" />
                <span>{t("auto.1", lang)}</span>
              </button>
            )}
            {user && (
               <button
                 onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                 className="flex items-center justify-center gap-2 w-full px-4 py-3 text-base text-red-500 bg-red-500/10 rounded-xl transition-colors font-semibold"
               >
                 <LogOut className="w-4 h-4" />
                 {t("auto.3", lang)}
               </button>
            )}
            <div className="flex justify-center w-full mt-2">
              <WalletDropdown hideIfDisconnected={!user} />
            </div>
          </div>
        </div>
      )}
    </nav>`;

content = content.replace(targetControls, newControls);

fs.writeFileSync(filePath, content);
console.log('Mobile menu added successfully.');
