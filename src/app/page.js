"use client";

import React from "react";
import Navbar from "./components/Navbar";   // ✅ ADD THIS
import Header from "./components/Header";
import About from "./components/About";
import Projects from "./components/Projects";
import Testimonials from "./components/Testimonials";
import Footer from "./components/Footer";

export default function HomePage() {
  return (
    <div className="w-full">

      {/* ✅ Navbar moved here */}
      <Navbar />

      {/* Landing Page Sections */}
      <Header />
      <About />
      <Projects />
      <Testimonials />
      <Footer />
    </div>
  );
}