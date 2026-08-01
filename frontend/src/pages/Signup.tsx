import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, UserRound, AlertTriangle, MailCheck } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { Input } from "@/components/Input";
import Button from "@/components/Button";
import { useAuth, ApiError } from "@/context/AuthContext";

export default function Signup() {
  const { signup, continueAsGuest } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(username, email, password);
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
      <h2 className="font-accent font-bold text-xl text-gv-fg1 mb-5">Create account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="jane_doe" required minLength={3} />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" required />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required minLength={6} />

        <div className="brutal-border border-gv-blue bg-gv-bg1 px-3 py-2 flex items-start gap-2 text-gv-fg2 text-xs font-mono">
          <MailCheck size={16} className="shrink-0 mt-0.5 text-gv-blue" />
          We'll email your username and password to you for safekeeping. No verification step needed.
        </div>

        {error && (
          <div className="brutal-border border-gv-red bg-gv-bg1 px-3 py-2 flex items-center gap-2 text-gv-red text-sm font-mono">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <Button type="submit" fullWidth disabled={loading} icon={<UserPlus size={17} />}>
          {loading ? "Creating account…" : "Create account"}
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

      <p className="text-sm text-gv-fg2 mt-6 text-center font-sans">
        Already have an account?{" "}
        <Link to="/login" className="text-gv-blue font-semibold underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
