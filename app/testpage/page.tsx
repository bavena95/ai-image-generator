// app/testpage/page.tsx
"use client"; // Pode ser um client component simples

import React from 'react';

export default function TestPage() {
  console.log("--- [TestPage] RENDER ---");
  return (
    <div style={{ padding: "20px", color: "cyan" }}>
      <h1>Página de Teste Simples</h1>
      <p>Esta página não usa o AuthContext.</p>
    </div>
  );
}