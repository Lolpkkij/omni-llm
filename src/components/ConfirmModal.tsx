"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={() => onCancel()}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-gray-400">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="flex gap-4 pt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 bg-gray-700 hover:bg-gray-600"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className="flex-1 bg-[#6366F1] hover:bg-[#4f46e5]"
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}