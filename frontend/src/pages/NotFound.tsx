import { Link } from "react-router-dom";
import { CircleOff } from "lucide-react";
import Button from "@/components/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      <CircleOff size={48} className="text-gv-fg3" />
      <h1 className="font-display text-3xl text-gv-fg1">404</h1>
      <p className="text-gv-fg2 font-mono text-sm">This page doesn't exist.</p>
      <Link to="/groups">
        <Button>Back to groups</Button>
      </Link>
    </div>
  );
}
