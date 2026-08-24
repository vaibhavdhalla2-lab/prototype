import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import FeedbackWidget from "./components/FeedbackWidget";
import { DesignProvider } from "./lib/store";
import { FeedbackProvider } from "./lib/feedback";
import Home from "./pages/Home";
import Create from "./pages/Create";
import Marketplace from "./pages/Marketplace";
import Profile from "./pages/Profile";
import About from "./pages/About";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Layout() {
  const location = useLocation();
  const isStudio = location.pathname === "/create";
  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <Nav />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<Create />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      {!isStudio && <Footer />}
      <FeedbackWidget />
      <div className="h-16 md:hidden" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <DesignProvider>
        <FeedbackProvider>
          <ScrollToTop />
          <Layout />
        </FeedbackProvider>
      </DesignProvider>
    </BrowserRouter>
  );
}
