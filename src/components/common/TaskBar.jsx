import React from 'react';
import { NavLink } from 'react-router-dom';

const TaskBar = () => {

  return (
    <>
      <style>{`

        .main-nav {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(10px);
          padding: 0.5rem 1.5rem;
          border-radius: 9999px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          display: flex;
          gap: 1.5rem;
          z-index: 50;
          border: 1px solid rgba(226, 232, 240, 0.8);
        }

        .nav-link {
          padding: 0.5rem 0;
          color: #4b5563;
          font-weight: 600;
          text-decoration: none;
          position: relative;
          transition: color 0.3s ease;
        }

        .nav-link:hover {
          color: #ef4444;
        }

        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: #ef4444;
          transform: scaleX(0);
          transform-origin: bottom right;
          transition: transform 0.3s ease-out;
        }

        .nav-link.active {
          color: #ef4444;
        }
        
        .nav-link.active::after {
          transform: scaleX(1);
          transform-origin: bottom left;
        }
      `}</style>
      <div className="z-40 flex h-full flex-col items-center justify-around bg-gray-200/90 px-4 align-middle">
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? 'nav-link active' : 'nav-link'
          }
        >
          <img src="../assets/chaticon.png" className="h-10 w-10" />
        </NavLink>

        <NavLink
          to="/stock"
          className={({ isActive }) =>
            isActive ? 'nav-link active' : 'nav-link'
          }
        >
          <img src="../assets/lupa.png" className="h-10 w-10" />
        </NavLink>

        <NavLink
          to="/management"
          className={({ isActive }) =>
            isActive ? 'nav-link active' : 'nav-link'
          }
        >
          <img src="../assets/accounticon.png" className="h-10 w-10" />
        </NavLink>

        <NavLink
          to="/guide"
          className={({ isActive }) =>
            isActive ? 'nav-link active' : 'nav-link'
          }
        >
          <img src="../assets/baricon.png" className="h-10 w-10" />
        </NavLink>

        <NavLink
          to="/radio"
          className={({ isActive }) =>
            isActive ? 'nav-link active' : 'nav-link'
          }
        >
          <img src="../assets/radio.png" className="h-10 w-10" />
        </NavLink>
      </div>
    </>
  );
};

export default TaskBar;
