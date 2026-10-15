// import {
//   BrowserRouter,
//   Navigate,
//   Route,
//   Routes,
// } from "react-router-dom";

// import ScanQRCode from "./pages/ScanQRCode";
// import ConfirmDetails from "./pages/ConfirmDetails";
// import HomeScreen from "./pages/HomeScreen";
// import TokenConfirmed from "./pages/TokenConfirmed";
// import FinalCall from "./pages/FinalCall";
// import CustomerArrived from "./pages/CustomerArrived";

// export default function App() {

//   return (
//     <BrowserRouter>
//       <Routes>
//        {/* ===== CUSTOMER ROUTES ===== */}
//         <Route path="/" element={<HomeScreen />} />
//         <Route path="/scan-qr" element={<ScanQRCode />} />
//         <Route path="/details/:id" element={<ConfirmDetails />} />
//         <Route path="/token-confirmed" element={<TokenConfirmed />} />
//         <Route path="/final-call" element={<FinalCall />} />
//         <Route path="/arrived" element={<CustomerArrived />} />

//         {/* Default */}
//         <Route path="*" element={<Navigate to="/" replace />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import HomeScreen from "./pages/HomeScreen";
import ScanQRCode from "./pages/ScanQRCode";
import CheckToken from "./pages/CheckToken";
import ConfirmDetails from "./pages/ConfirmDetails";
import QueueStatus from "./pages/QueueStatus";
import FinalCall from "./pages/FinalCall";
import CustomerArrived from "./pages/CustomerArrived";

import Login from "./pages/auth/Login";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LoginLanding from "./pages/auth/LoginLanding";
import Layout from "./components/layout/Layout";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import StaffManagement from "./pages/owner/StaffManagement";
import Profile from "./pages/owner/Profile";
import MenuManagement from "./pages/owner/MenuManagement";
import StaffDashboard from "./pages/staff/StaffDashboard";
import AnalyticsAndReports from "./pages/owner/AnalyticsAndReports";

export default function App() {

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}

        {/* ===== CUSTOMER ROUTES ===== */}
        <Route path="/" element={<HomeScreen />} />
        <Route path="/scan-qr" element={<ScanQRCode />} />
        <Route path="/check-token" element={<CheckToken />} />
        <Route path="/details/:id" element={<ConfirmDetails />} />
        <Route path="/queue-status" element={<QueueStatus />} />
        <Route path="/final-call" element={<FinalCall />} />
        <Route path="/arrived" element={<CustomerArrived />} />

        <Route path="/login" element={<LoginLanding />} />
        <Route path="/login/owner" element={<Login role="owner" title="Owner Portal" subtitle="Sign In to Access Your Account" />} />
        <Route path="/login/staff" element={<Login role="staff" title="Staff Portal" subtitle="Sign In to Access Your Account" />} />


        <Route element={<ProtectedRoute allowedRoles={["ADMIN", "OWNER", "STAFF"]} />}>
          <Route element={<Layout />}>
            <Route element={<ProtectedRoute allowedRoles={["OWNER"]} />}>
              <Route path="/owner/dashboard" element={<OwnerDashboard />} />
              <Route path="/owner/staff" element={<StaffManagement />} />
              <Route path="/owner/menu" element={<MenuManagement />} />
              <Route path="/owner/analytics" element={<AnalyticsAndReports />} />
              <Route path="/owner/profile" element={<Profile />} />
            </Route>

          </Route>
          <Route element={<ProtectedRoute allowedRoles={["STAFF"]} />}>
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
          </Route>
        </Route>

        {/* Default */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}