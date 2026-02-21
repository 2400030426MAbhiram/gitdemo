import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import FarmerPortal from "./pages/FarmerPortal";
import ExpertPanel from "./pages/ExpertPanel";
import ResourceLibrary from "./pages/ResourceLibrary";
import Forum from "./pages/Forum";
import UserProfile from "./pages/UserProfile";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component, requiredRole }: { component: any; requiredRole?: string }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!user) {
    return <NotFound />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <NotFound />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/resources"} component={ResourceLibrary} />
      <Route path={"/forum"} component={Forum} />
      <Route path={"/profile"} component={UserProfile} />
      <Route path={"/admin/*"} component={() => <ProtectedRoute component={AdminDashboard} requiredRole="admin" />} />
      <Route path={"/farmer/*"} component={() => <ProtectedRoute component={FarmerPortal} requiredRole="farmer" />} />
      <Route path={"/expert/*"} component={() => <ProtectedRoute component={ExpertPanel} requiredRole="expert" />} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
