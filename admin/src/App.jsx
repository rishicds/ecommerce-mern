import { Route, Routes } from "react-router";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Add from "./pages/Add";
import List from "./pages/List";
import Orders from "./pages/Orders";
import Categories from "./pages/Categories";
import Settings from "./pages/Settings";
import DiscountCodes from "./pages/DiscountCodes";
import { ToastContainer } from 'react-toastify';
import { useSync } from './context/SyncContext';
import Login from "./components/Login";

const App = () => {
  const { loading, user } = useAuth();
  const { syncStatus } = useSync();
  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <ToastContainer />
      {
        !user ?
          (<Login />)
          :
          (
            <>
              {/* Show global sync banner while a Clover sync is in progress */}
              {syncStatus === 'working' && (
                <div className="w-full bg-blue-50 border-b border-blue-100 text-center py-2 text-sm text-blue-700">Syncing with Clover in progress…</div>
              )}
              <Navbar />
              <hr className="border border-gray-300" />
              <div className="flex w-full">
                <Sidebar />
                <main className="flex-1 my-8 px-6">
                  <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm p-6 text-gray-600 text-base">
                    <Routes>
                      <Route path="/add" element={<Add />} />
                      <Route path="/add/:id" element={<Add />} />
                      <Route path="/list" element={<List />} />
                      <Route path="/orders" element={<Orders />} />
                      <Route path="/categories" element={<Categories />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/discount-codes" element={<DiscountCodes />} />
                    </Routes>
                  </div>
                </main>
              </div>
            </>
          )
      }
    </div>
  );
};

export default App;
