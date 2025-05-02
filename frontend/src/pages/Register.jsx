import React,{ useState } from "react";
import API from "../utils/api";

const Register = () => {
    const [user, setUser] = useState({ Username: "", Email: "", Phone: "", Password: "", Role: "User" });
    const [error, setError] = useState("");

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await API.post("/register-user", user);
            alert("User registered successfully!");
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed!");
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <form className="bg-white p-6 rounded shadow-md w-80" >
                <h2 className="text-2xl font-bold text-center mb-4">Register</h2>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <input type="text" placeholder="Username" className="w-full p-2 border rounded mb-2"
                    onChange={(e) => setUser({ ...user, Username: e.target.value })} required />
                <input type="email" placeholder="Email" className="w-full p-2 border rounded mb-2"
                    onChange={(e) => setUser({ ...user, Email: e.target.value })} required />
                <input type="text" placeholder="Phone" className="w-full p-2 border rounded mb-2"
                    onChange={(e) => setUser({ ...user, Phone: e.target.value })} required />
                <input type="password" placeholder="Password" className="w-full p-2 border rounded mb-2"
                    onChange={(e) => setUser({ ...user, Password: e.target.value })} required />
                <button type="submit" className="bg-green-500 text-white w-full p-2 rounded">Register</button>
            </form>
        </div>
    );
};

export default Register;
