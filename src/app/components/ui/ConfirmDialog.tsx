"use client";

import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "warning"
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const variantConfig = {
    danger: {
      icon: <AlertTriangle className="text-red-600" size={48} />,
      buttonVariant: "danger" as const
    },
    warning: {
      icon: <AlertTriangle className="text-yellow-600" size={48} />,
      buttonVariant: "primary" as const
    },
    info: {
      icon: <AlertTriangle className="text-blue-600" size={48} />,
      buttonVariant: "primary" as const
    }
  };

  const config = variantConfig[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            {cancelText}
          </Button>
          <Button variant={config.buttonVariant} onClick={handleConfirm} className="flex-1">
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center py-4">
        <div className="mb-4">{config.icon}</div>
        <p className="text-gray-700 dark:text-gray-300 text-base">
          {message}
        </p>
      </div>
    </Modal>
  );
}
