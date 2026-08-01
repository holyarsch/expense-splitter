import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, UserRound, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { Input } from "@/components/Input";
import Button from "@/components/Button";
import { useAuth, ApiError } from "@/context/AuthContext";

export default function Login() {
  const { login, continueAsGuest } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(identifier, password);
      navigate("/groups");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleGuest() {
    continueAsGuest();
    navigate("/groups");
  }

  return (
    <AuthLayout subtitle="Split fair. Settle fast.">
      <h2 className="font-accent font-bold text-xl text-gv-fg1 mb-5">Sign in</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Username or email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="jane_doe" required autoFocus />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />

        {error && (
          <div className="brutal-border border-gv-red bg-gv-bg1 px-3 py-2 flex items-center gap-2 text-gv-red text-sm font-mono">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <Button type="submit" fullWidth disabled={loading} icon={<LogIn size={17} />}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-[3px] bg-gv-bg2" />
        <span className="font-mono text-[11px] text-gv-fg3 uppercase">or</span>
        <div className="flex-1 h-[3px] bg-gv-bg2" />
      </div>

      <Button type="button" variant="secondary" fullWidth onClick={handleGuest} icon={<UserRound size={17} />}>
        Continue as guest
      </Button>
      <p className="text-[11px] text-gv-fg3 font-mono mt-2 text-center">Guest data stays on this device only — no account needed.</p>

      <p className="text-sm text-gv-fg2 mt-6 text-center font-sans">
        No account?{" "}
        <Link to="/signup" className="text-gv-blue font-semibold underline underline-offset-2">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
