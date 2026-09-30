/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FolderOpen, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { openGooglePicker, PickedFile } from '@/services/googlePicker';
import { getAccessToken } from '@/services/googleAuth';

interface GooglePickerButtonProps {
  onPicked: (file: PickedFile) => void;
  className?: string;
  label?: string;
  viewId?: string;
  mimeType?: string;
}

export const GooglePickerButton: React.FC<GooglePickerButtonProps> = ({
  onPicked,
  className,
  label = "Google Picker",
  viewId = "DOCS",
  mimeType
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = async () => {
    const token = await getAccessToken();
    if (!token) {
      alert("Please sign in with Google first to browse your Google Drive files.");
      return;
    }
    setIsOpen(true);
    try {
      await openGooglePicker({
        viewId,
        mimeType,
        onPicked: (file) => {
          setIsOpen(false);
          onPicked(file);
        },
        onCancel: () => {
          setIsOpen(false);
        }
      });
    } catch (err) {
      console.error("Picker error:", err);
      setIsOpen(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isOpen}
      type="button"
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer",
        "bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 shadow-xs disabled:opacity-60",
        className
      )}
    >
      {isOpen ? (
        <Loader2 size={13} className="animate-spin text-amber-600" />
      ) : (
        <FolderOpen size={13} className="text-amber-500" />
      )}
      <span>{label}</span>
    </button>
  );
};
