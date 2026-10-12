// import { useState } from "react";
// import LoginLeftSide from "../../components/auth/LoginLeftSide";
// import { Link, useNavigate } from "react-router-dom";
// import {
//   ArrowLeftIcon,
//   EyeIcon,
//   EyeOffIcon,
//   Loader2Icon,
// } from "lucide-react";

// import useAuthStore from "../../store/auth.store";

// function Login({ role, title, subtitle }) {
//   const navigate = useNavigate();

//   const {
//     login,
//     loading,
//     error,
//     clearError,
//   } = useAuthStore();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] =
//     useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     clearError();

//     try {
//       const response = await login({
//         email: email.trim().toLowerCase(),
//         password,
//       });

//       const loggedInRole =
//         response.user?.role || role;

//       navigate(
//         `/${loggedInRole.toLowerCase()}/dashboard`,
//         {
//           replace: true,
//         }
//       );
//     } catch (error) {
//       console.error("Login error:", error);
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col md:flex-row">
//       <LoginLeftSide />

//       <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
//         <div className="w-full max-w-md animate-fade-in">

//           <Link
//             to="/login"
//             className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-700 text-sm mb-10 transition-colors"
//           >
//             <ArrowLeftIcon size={16} />
//             Back to portals
//           </Link>

//           <div className="mb-8">
//             <h1 className="text-2xl sm:text-3xl font-medium text-zinc-800">
//               {title}
//             </h1>

//             <p className="text-slate-600 text-sm sm:text-base mt-2">
//               {subtitle}
//             </p>
//           </div>

//           {/* Error */}
//           {error && (
//             <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
//               {error}
//             </div>
//           )}

//           <form
//             onSubmit={handleSubmit}
//             className="space-y-5"
//           >
//             {/* Email */}
//             <div>
//               <label
//                 htmlFor="email"
//                 className="block text-sm font-medium text-slate-700 mb-2"
//               >
//                 Email Address
//               </label>

//               <input
//                 id="email"
//                 type="email"
//                 value={email}
//                 onChange={(e) =>
//                   setEmail(e.target.value)
//                 }
//                 required
//                 placeholder="Enter the Email"
//                 className="w-full px-4 py-3 border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-indigo-500"
//               />
//             </div>

//             {/* Password */}
//             <div>
//               <label
//                 htmlFor="password"
//                 className="block text-sm font-medium text-slate-700 mb-2"
//               >
//                 Password
//               </label>

//               <div className="relative">
//                 <input
//                   id="password"
//                   type={
//                     showPassword
//                       ? "text"
//                       : "password"
//                   }
//                   value={password}
//                   onChange={(e) =>
//                     setPassword(e.target.value)
//                   }
//                   required
//                   placeholder="********"
//                   className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-indigo-500"
//                 />

//                 <button
//                   type="button"
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
//                   onClick={() =>
//                     setShowPassword(!showPassword)
//                   }
//                 >
//                   {showPassword ? (
//                     <EyeOffIcon size={18} />
//                   ) : (
//                     <EyeIcon size={18} />
//                   )}
//                 </button>
//               </div>
//             </div>

//             {/* Submit */}
//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full py-3 bg-linear-to-r from-indigo-600 to-indigo-500 text-white rounded-md text-sm font-semibold hover:from-indigo-700 hover:to-indigo-600 disabled:opacity-50 transition-all duration-200 shadow-lg shadow-indigo-500/25 active:scale-[0.98] flex items-center justify-center"
//             >
//               {loading && (
//                 <Loader2Icon
//                   className="animate-spin h-4 w-4 mr-2"
//                 />
//               )}

//               {loading ? "Signing In..." : "Sign In"}
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Login;





import { useState } from "react";
import LoginLeftSide from "../../components/auth/LoginLeftSide";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
} from "lucide-react";
import useAuthStore from "../../store/auth.store";

function Login({ role, title, subtitle }) {
  const navigate = useNavigate();

  const {
    login,
    loading,
    error,
    clearError,
  } = useAuthStore();

  const [phoneNo, setPhoneNo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    try {
      const response = await login({
        phoneNo: phoneNo.trim(),
        password,
      });

      const loggedInRole =
        response?.user?.role || role;

      navigate(`/${loggedInRole.toLowerCase()}/dashboard`, {
        replace: true,
      });
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <LoginLeftSide />

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md animate-fade-in">

          {/* Back */}
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-700 text-sm mb-10 transition-colors"
          >
            <ArrowLeftIcon size={16} />
            Back to portals
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-medium text-zinc-800">
              {title}
            </h1>

            <p className="text-slate-600 text-sm sm:text-base mt-2">
              {subtitle}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Phone Number */}
            <div>
              <label
                htmlFor="phoneNo"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Phone Number
              </label>

              <input
                id="phoneNo"
                type="tel"
                value={phoneNo}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");

                  if (value.length <= 10) {
                    setPhoneNo(value);
                  }
                }}
                required
                maxLength={10}
                inputMode="numeric"
                autoComplete="tel"
                placeholder="Enter your phone number"
                className="w-full px-4 py-3 border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="********"
                  className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOffIcon size={18} />
                  ) : (
                    <EyeIcon size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-linear-to-r from-indigo-600 to-indigo-500 text-white rounded-md text-sm font-semibold hover:from-indigo-700 hover:to-indigo-600 disabled:opacity-50 transition-all duration-200 shadow-lg shadow-indigo-500/25 active:scale-[0.98] flex items-center justify-center"
            >
              {loading && (
                <Loader2Icon
                  className="animate-spin h-4 w-4 mr-2"
                />
              )}

              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;