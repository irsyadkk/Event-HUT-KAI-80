import{BrowserRouter, Routes, Route} from 'react-router-dom';
import AddMemberPage from './components/addMemberPage';
import InputNipp from './components/InputNipp';
import QRResultPage from './components/qrResutPage';
import AdminDesktopPage from './components/adminDesktoPage';

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<InputNipp/>}/>
        <Route path="/addmembers" element={<AddMemberPage />} />
        <Route path="/qrresult" element={<QRResultPage />} />
        <Route path="/admindesk" element={<AdminDesktopPage />} />

      </Routes> 
    </BrowserRouter>
  );
}

export default App;