"use client";

import { useState } from "react";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ConfirmOptions>({
    title: "",
    message: "",
    confirmText: "Confirmar",
    cancelText: "Cancelar",
    variant: "warning"
  });
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    setConfig(options);
    setIsOpen(true);

    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  };

  const handleConfirm = () => {
    if (resolver) {
      resolver(true);
      setResolver(null);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (resolver) {
      resolver(false);
      setResolver(null);
    }
    setIsOpen(false);
  };

  return {
    isOpen,
    config,
    confirm,
    handleConfirm,
    handleCancel
  };
}
