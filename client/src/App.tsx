import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<div>Login Page (Placeholder)</div>} />
        <Route path="/meetings" element={<div>Meetings List (Placeholder)</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
