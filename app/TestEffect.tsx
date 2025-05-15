// app/TestEffect.tsx
"use client";

import React, { useEffect, useState } from 'react'; // Somente React

export default function TestEffectComponent() {
  const [message, setMessage] = useState("TestEffect: Aguardando useEffect...");

  useEffect(() => {
    // Este log PRECISA aparecer no CONSOLE DO NAVEGADOR
    console.log("--- !!! TEST_EFFECT: useEffect DENTRO DO TestEffectComponent EXECUTADO !!! ---");
    setMessage("TestEffect: useEffect FOI EXECUTADO com SUCESSO!");

    return () => {
      console.log("--- !!! TEST_EFFECT: useEffect DENTRO DO TestEffectComponent CLEANUP !!! ---");
    };
  }, []);

  console.log("--- TEST_EFFECT: Componente TestEffectComponent RENDERIZANDO. Mensagem:", message);

  return (
    <div style={{ padding: '20px', margin: '20px', border: '2px dashed limegreen', color: 'white', background: 'rgba(0,0,0,0.3)' }}>
      <h2>Componente de Teste de Efeito Simples</h2>
      <p>{message}</p>
    </div>
  );
}