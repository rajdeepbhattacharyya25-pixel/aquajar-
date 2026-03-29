import { Outlet, NavLink } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-surface overflow-hidden relative shadow-xl font-body text-on-surface antialiased pb-32">
      {/* TopAppBar Shell */}
      <header className="bg-[#f9f9ff] dark:bg-slate-950 flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#0058bc] dark:text-[#0070eb]">cloud_done</span>
          <h1 className="text-xl font-bold font-headline text-[#0058bc] dark:text-[#0070eb]">AquaJar</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center overflow-hidden">
            <img 
              alt="User profile avatar" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDl2eo34-cdpWDvnycoZ2FACfK5ERbeUYa98l9Bbnu9E3FroTFPCnaL5jVL-U97BFWttOh1YOMLSlXayyw6VXxs6wAbdoqcm-DcOu0IqnhifkwOjNd0mAtM98iNau6kZMgbMR11W4UWCefNU1OezGje3UyZqW_k0NepmWkoSgnrgpjAzWjkaCtpyGV3nbctOfvmmFHt2JICfbqLP1FS_LHocSZLoAdoEHiP42WXcmAZR-tJzNy4XeSQGkBMmSE76uIxW5GLXeZ4DZE"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 bg-white dark:bg-slate-900 rounded-t-3xl shadow-[0_-8px_24px_rgba(0,88,188,0.08)] border-t border-[#c1c6d7]/15 max-w-md mx-auto right-0">
        <NavItem to="/" icon="home" label="Home" />
        <NavItem to="/customers" icon="group" label="Customers" />
        <NavItem to="/scan" icon="qr_code_scanner" label="Scan" />
        <NavItem to="/jars" icon="water_drop" label="Jars" />
        <NavItem to="/reports" icon="assessment" label="Reports" />
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        isActive
          ? "flex flex-col items-center justify-center bg-[#d8e2ff] dark:bg-[#0058bc]/20 text-[#0058bc] dark:text-[#d8e2ff] rounded-2xl px-4 py-2 scale-90 duration-150"
          : "flex flex-col items-center justify-center text-[#181c23] dark:text-slate-400 px-4 py-2 hover:text-[#0058bc] transition-colors"
      }
    >
      {({ isActive }) => (
        <>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
          <span className="text-[0.75rem] font-medium font-inter tracking-[0.05em] mt-1">{label}</span>
        </>
      )}
    </NavLink>
  );
}
