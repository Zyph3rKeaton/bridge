'use client';

import React from 'react';

export default function BackButton() {
  const onBack = () => {
    try {
      if (typeof window !== 'undefined') {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = '/';
        }
      }
    } catch (_) {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  return (
    <button
      type="button"
      aria-label="Go back"
      onClick={onBack}
      className="rounded-lg px-4 py-2 text-base font-semibold bg-white text-black focus:outline-none focus:ring-2 focus:ring-white mr-auto"
    >
      ← Back
    </button>
  );
} 