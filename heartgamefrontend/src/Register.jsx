import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "./firebase";

export default function Register() {
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const [e, setE] = useState("");

  const submit = async (ev) => {
    ev.preventDefault();
    if (f.password !== f.confirm) return setE("Passwords do not match");
    try {
      await register({ name: f.name, email: f.email, password: f.password });
      nav("/");
    } catch (err) {
      setE(err.message);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* LEFT – same gradient panel */}
      <div className="hidden md:flex items-center justify-center bg-linear-to-br from-pink-50 to-indigo-100">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-indigo-700">❤️ Heart Game</h1>
          <p className="mt-2 text-gray-600">Create a new account.</p>
        </div>
      </div>

      {/* RIGHT – glass card */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6 rounded-2xl bg-white/70 backdrop-blur-xl shadow-lg p-8 ring-1 ring-black/5">
          <h2 className="text-3xl font-bold text-gray-800">Create account</h2>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                onChange={(x) => setF({ ...f, name: x.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                onChange={(x) => setF({ ...f, email: x.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                onChange={(x) => setF({ ...f, password: x.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                type="password"
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                onChange={(x) => setF({ ...f, confirm: x.target.value })}
              />
            </div>

            {e && <p className="text-sm text-red-600">{e}</p>}

            <button
              type="submit"
              className="w-full bg-pink-600 text-white py-2.5 rounded-lg hover:bg-pink-700 transition shadow-md"
            >
              Register
            </button>
          </form>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <span
              onClick={() => nav("/login")}
              className="text-pink-600 font-semibold cursor-pointer hover:underline"
            >
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}