"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

const Navbar = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [modalType, setModalType] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openModal = (type) => setModalType(type);
  const closeModal = () => setModalType(null);

  return (
    <>
      {/* ================= NAVBAR ================= */}
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled ? "bg-black/70 backdrop-blur-md shadow-md" : "bg-transparent"
        }`}
      >
        <div className="flex items-center justify-between w-full px-4 sm:px-6 md:px-10 lg:px-16 py-3 md:py-4">
          
          {/* Logo */}
          <Link
            href="/"
            className="text-white text-xl sm:text-2xl md:text-3xl font-extrabold tracking-wide"
          >
            BlueCollorHub
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex flex-1 justify-center">
            <div className="flex gap-6 lg:gap-8 text-white font-medium text-base lg:text-lg">
              <Link href="#Home" className="hover:text-blue-400 transition">
                Home
              </Link>
              <Link href="#About" className="hover:text-blue-400 transition">
                About
              </Link>
              <Link href="#Projects" className="hover:text-blue-400 transition">
                Projects
              </Link>
              <Link href="#Testimonials" className="hover:text-blue-400 transition">
                Testimonials
              </Link>
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            <button
              onClick={() => openModal("signup")}
              className="px-4 lg:px-6 py-2 rounded-full bg-white text-black text-sm lg:text-base font-semibold hover:bg-transparent hover:border hover:border-white hover:text-white transition"
            >
              Sign Up
            </button>
            <button
              onClick={() => openModal("login")}
              className="px-4 lg:px-6 py-2 rounded-full border border-white text-white text-sm lg:text-base font-semibold hover:bg-white hover:text-black transition"
            >
              Sign In
            </button>
          </div>

          {/* Mobile Menu Icon */}
          <button
            onClick={() => setShowMobileMenu(true)}
            className="md:hidden"
          >
            <span className="text-white text-3xl">☰</span>
          </button>
        </div>
      </nav>

      {/* ================= MOBILE MENU (FIXED HERE) ================= */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex flex-col">
          
          {/* Close Button */}
          <div className="flex justify-end p-6">
            <button onClick={() => setShowMobileMenu(false)}>
              <span className="text-white text-4xl leading-none hover:rotate-90 transition duration-300">
                ✕
              </span>
            </button>
          </div>

          {/* Menu Links */}
          <div className="flex flex-col items-center justify-center flex-1 gap-6 text-white text-xl font-medium">
            {["Home", "About", "Projects", "Testimonials"].map((link) => (
              <Link
                key={link}
                href={`#${link}`}
                onClick={() => setShowMobileMenu(false)}
                className="hover:text-blue-400 transition"
              >
                {link}
              </Link>
            ))}

            {/* Buttons */}
            <div className="w-full max-w-xs flex flex-col gap-4 mt-6 px-4">
              <button
                onClick={() => {
                  openModal("signup");
                  setShowMobileMenu(false);
                }}
                className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold"
              >
                Sign Up
              </button>

              <button
                onClick={() => {
                  openModal("login");
                  setShowMobileMenu(false);
                }}
                className="w-full px-6 py-3 rounded-full border border-white text-white font-semibold hover:bg-white hover:text-black transition"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL ================= */}
      {modalType && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center px-4">
          <div
            className={`relative w-full ${
              modalType === "login" ? "max-w-lg" : "max-w-md"
            }`}
          >
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl"
            >
              ✕
            </button>

            {modalType === "login" && (
              <LoginForm switchToSignup={() => setModalType("signup")} />
            )}
            {modalType === "signup" && (
              <SignupForm switchToLogin={() => setModalType("login")} />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;