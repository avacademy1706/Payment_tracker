import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <FileQuestion className="h-10 w-10 text-muted-foreground" />
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
      <Button asChild className="mt-2">
        <Link to="/">Back to Dashboard</Link>
      </Button>
    </div>
  );
}
