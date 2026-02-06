// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './screens/Home';
import DeviceValidation from './screens/DeviceValidation';
import HealthCheck from './screens/HealthCheck';
import UploadRC from './screens/UploadRC';
import UploadPhotos from './screens/UploadPhotos';
import ChatAssistant from './components/ChatAssisstant';

export default function App() {
  return (
    <Router>
      <div className="relative w-full h-full overflow-hidden bg-[#C1B59F]">
        <ChatAssistant />
        <Routes>
          {/* All these components can now use useNavigate() */}
          <Route path="/" element={<Home />} />
          <Route path="/validate" element={<DeviceValidation />} />
          <Route path="/health" element={<HealthCheck />} />
          <Route path="/upload-rc" element={<UploadRC />} />
          <Route path='/upload-photos' element={<UploadPhotos />} />
        </Routes>
      </div>
    </Router>
  );
}