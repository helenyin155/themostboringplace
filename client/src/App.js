// src/App.js
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Correctly import only once
import './App.css';
import BoringMapPage from './pages/boringmap'; // Import the new page

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Routes for the app */}
        <Routes>
          {/* Define a route for the boringmap page */}
          <Route path="/boringmap" element={<BoringMapPage />} />

          {/* You can add more routes here for other pages */}
          
          {/* Default route (HEAT MAP!!!) */}
          <Route path="/boringface" element={
            <>
              <h1 className="text-3xl text-center mt-10">boring face</h1>
            </>
          } />

          <Route path="/" element={
            <>
              <h1 className="text-3xl text-center mt-10">root</h1>
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
