import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

function Layout() {
  return (
    <div className='flex h-screen bg-linear-to-br from-slate-50 via-white to-indigo-50/30'>
      <Sidebar />
      <main  className="flex-1 overflow-y-auto ">
        <div className='max-w-400 mx-auto'>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout