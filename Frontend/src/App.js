import { BrowserRouter, Routes, Route } from "react-router-dom";
import AddMemberPage from "./components/addMemberPage";
import InputNipp from "./components/InputNipp";
import QRResultPage from "./components/qrResutPage";
import AdminDesktopPage from "./components/adminDesktoPage";
import DetailRegisterPage from "./components/detailRegisterPage";
import LandingPage from "./components/landingPage";
import QRPickupApp from "./components/qrScan";

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
