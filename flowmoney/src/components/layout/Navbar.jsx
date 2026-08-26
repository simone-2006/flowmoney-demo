import { useState } from "react";
import { NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X, House, BanknoteArrowDown, LogOut, Settings } from "lucide-react";

const ease = [0.26, 0.02, 0.23, 0.94];

const menuItems = [
  {
    title: "Home",
    icon: House,
    to: "/",
  },
  {
    title: "Spese & Grafici",
    icon: BanknoteArrowDown,
    to: "/spese",
  },
  {
    title: "Impostazioni",
    icon: Settings,
    to: "/settings"
  }
];

export default function Navbar({ onLogout }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full flex items-center px-2 py-1 cursor-pointer justify-between">
      <AnimatePresence>
          <motion.button
            key="menu-btn"
            type="button"
            className="p-3"
            onClick={() => setOpen(true)}
            aria-label="Apri sidebar"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2, ease }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu size={25} />
          </motion.button>
      </AnimatePresence>

      {/* <h1 className="font-bold text-3xl">Flowmoney</h1> */}

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setOpen(false)}
              aria-label="Chiudi sidebar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease }}
            />
            <motion.aside
              key="sidebar"
              className="fixed top-0 left-0 z-50 flex h-full w-64 flex-col bg-white p-4 text-black shadow-lg"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.28, ease }}
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Flowmoney</h2>
                  <span className="text-xs text-gray-400">Menu</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Chiudi sidebar"
                  className="text-black"
                >
                  <X size={22} />
                </button>
              </div>

              <nav className="flex-1">
                <ul className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          end={item.to === "/"}
                          onClick={() => setOpen(false)}
                          className={({ isActive }) =>
                            [
                              "flex items-center gap-2 px-3 py-2 transition-colors",
                              isActive
                                ? "bg-green-50 font-semibold text-green-700"
                                : "text-black hover:bg-gray-50 hover:text-green-600",
                            ].join(" ")
                          }
                        >
                          <Icon size={18} />
                          {item.title}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="mt-auto w-full flex">
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-2 px-3 py-2 transition-colors text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut />
                  Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
