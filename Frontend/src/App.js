import { BrowserRouter, Routes, Route } from "react-router-dom";
import AddMemberPage from "./components/addMemberPage";
import InputNipp from "./components/InputNipp";
import QRResultPage from "./components/qrResutPage";
import AdminDesktopPage from "./components/adminDesktoPage";
import DetailRegisterPage from "./components/detailRegisterPage";
import LandingPage from "./components/landingPage";

function App() {
  return (
    <BrowserRouter basename="hutkai.daop6.id/">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/inputnipp" element={<InputNipp />} />
        <Route path="/addmembers" element={<AddMemberPage />} />
        <Route path="/qrresult" element={<QRResultPage />} />
        <Route path="/admindesk" element={<AdminDesktopPage />} />
        <Route path="/detailregister" element={<DetailRegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
