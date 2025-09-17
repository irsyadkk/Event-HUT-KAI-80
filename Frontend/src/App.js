import { BrowserRouter, Routes, Route } from "react-router-dom";
import AddMemberPage from "./components/addMemberPage";
import InputNipp from "./components/InputNipp";
import QRResultPage from "./components/qrResutPage";
import AdminDesktopPage from "./components/adminDesktoPage";
import DetailRegisterPage from "./components/detailRegisterPage";
import LandingPage from "./components/landingPage";
import QRPickupApp from "./components/qrScan";
import AdminPrizePage from "./components/adminPrizePage";
import PrizeListPage from "./components/prizeListPage";
import VerificationPage from "./components/verificationPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/inputnipp" element={<InputNipp />} />
        <Route path="/addmembers" element={<AddMemberPage />} />
        <Route path="/qrresult" element={<QRResultPage />} />
        <Route path="/admindesk" element={<AdminDesktopPage />} />
        <Route path="/detailregister" element={<DetailRegisterPage />} />
        <Route path="/qrpickup" element={<QRPickupApp />} />
        <Route path="/adminprize" element={<AdminPrizePage />} />
        <Route path="/prizelist" element={<PrizeListPage />} />
        <Route path="/verification" element={<VerificationPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
