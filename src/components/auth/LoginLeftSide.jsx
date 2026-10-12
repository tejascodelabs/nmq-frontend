import React from 'react'

function LoginLeftSide() {
    return (
        <div className='hidden md:flex w-1/2 bg-indigo-950 relative overflow-hidden border-r border-slate-200'>
            <div className="absolute -top-30 -left-30 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" >
            </div>

            <div className="relative z-10 flex flex-col items-start justify-center p-12 lg:p-20 w-full h-full">
                <h1 className="text-4xl lg:text-5xl font-medium text-white mb-6 leading-tight tracking-tight">
                    Nashik <br /> Misal Quese
                </h1>
                <p className="text-slate-400 text-lg max-w-md leading-relaxed">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Non vel rem illo obcaecati voluptatum dolor facilis nemo numquam ab? Quidem.
                </p>
            </div>
        </div>
    )
}

export default LoginLeftSide