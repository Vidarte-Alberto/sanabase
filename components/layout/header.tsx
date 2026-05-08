"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Activity, LogOut, Menu, Shield, UserRound, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AuthSession } from "@/shared/lib/auth-types";

interface HeaderProps {
  onMenuToggle?: () => void
  session: AuthSession
}

export function Header({ onMenuToggle, session }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
              onMenuToggle?.();
            }}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold leading-tight text-foreground">
                Sanabase
              </span>
              <span className="text-xs text-muted-foreground hidden sm:block">
                Sistema de Pacientes
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            Sistema activo
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border/50 px-3 py-1.5 text-sm">
            {session.role === "admin" ? (
              <Shield className="h-4 w-4 text-primary" />
            ) : (
              <UserRound className="h-4 w-4 text-primary" />
            )}
            <span className="font-medium text-foreground">{session.displayName}</span>
            <span className="text-muted-foreground">
              {session.role === "admin" ? "Administrador" : "Usuario"}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Salir
          </Button>
        </div>
      </div>
    </header>
  );
}
